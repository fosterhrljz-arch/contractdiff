import {unzipSync,strFromU8} from 'fflate';
import * as pdfjs from 'pdfjs-dist';
import {assets,bytes,ocrWorkerURL,pdfWorker,LocalPDFData} from './offline.js';
export async function openPDF(data){const port=await pdfWorker(),worker=new pdfjs.PDFWorker({port});try{const pdf=await pdfjs.getDocument({data:new Uint8Array(data),worker,isEvalSupported:false,useSystemFonts:true,useWorkerFetch:false,BinaryDataFactory:LocalPDFData}).promise;return {pdf,close:async()=>{await pdf.destroy();worker.destroy();port.terminate();}};}catch(e){worker.destroy();port.terminate();throw e;}}
let ocr;
async function recognize(canvas,progress){
 if(!ocr){const {createWorker}=await import('tesseract.js');const url=ocrWorkerURL();try{ocr=await createWorker(Object.entries(assets().languages).map(([code,data])=>({code,data:bytes(data)})),1,{workerPath:url,workerBlobURL:false,cacheMethod:'none',gzip:false,logger:m=>progress?.(`OCR: ${m.status} ${Math.round((m.progress||0)*100)}%`)});}finally{URL.revokeObjectURL(url);}}
 const {data}=await ocr.recognize(canvas,{}, {text:true,blocks:true});return data;
}
const isHeading=t=>/^(?:\d+(?:\.\d+)*[.)、．]?\s+|第[一二三四五六七八九十百\d]+[条章节]|(?:SECTION|ARTICLE)\s+\d+)/i.test(t);
const headingText=t=>t.match(/^((?:\d+(?:\.\d+)*[.)、．]?\s+|第[一二三四五六七八九十百\d]+[条章节]\s*)[^.。]{1,90})[.。]/)?.[1]||t.slice(0,90);
function parseXML(s){const x=new DOMParser().parseFromString(s,'application/xml');if(x.getElementsByTagName('parsererror').length)throw new Error('Invalid XML in DOCX.');return x;}
const all=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
function wordText(node){let text='';const walk=n=>{if(n.nodeType!==1)return;if(['del','moveFrom'].includes(n.localName))return;if(n.localName==='t')text+=n.textContent;else if(n.localName==='tab')text+='\t';else if(['br','cr'].includes(n.localName))text+='\n';else for(const c of n.children)walk(c);};walk(node);return text;}
function extractDOCX(data){
 // Check declared ZIP sizes before inflating; limit decompressed package to 100 MB.
 const view=new DataView(data);let total=0,entries=0;for(let p=0;p+46<=data.byteLength;p++){if(view.getUint32(p,true)===0x02014b50){total+=view.getUint32(p+24,true);entries++;p+=45+view.getUint16(p+28,true)+view.getUint16(p+30,true)+view.getUint16(p+32,true);}}
 if(total>100*1024*1024||entries>10000)throw new Error('DOCX expanded size exceeds the safe limit.');
 const zip=unzipSync(new Uint8Array(data));if(!zip['word/document.xml'])throw new Error('Not a valid Word DOCX document.');
 const blocks=[],warnings=[];let heading='',pnum=0,tnum=0;
 function add(text,kind,location,extra={}){if(text.trim())blocks.push({id:`b${blocks.length}`,text:text.trim(),kind,heading,location,...extra});}
 const parts=['word/document.xml',...Object.keys(zip).filter(k=>/^word\/(?:header\d+|footer\d+|footnotes|endnotes)\.xml$/.test(k)).sort()];
 for(const part of parts){const xml=parseXML(strFromU8(zip[part])),root=all(xml,'body')[0]||xml.documentElement;const prefix=part==='word/document.xml'?'':part.replace('word/','').replace('.xml','')+' · ';
 if(all(xml,'ins').length||all(xml,'del').length||all(xml,'moveFrom').length)warnings.push('Tracked changes found: comparing the final accepted text (insertions included, deletions excluded).');
 if(all(xml,'drawing').length||all(xml,'pict').length)warnings.push('DOCX contains images or drawings. Text inside images is not extracted; inspect the original file.');
 const traverse=node=>{for(const child of node.children){if(child.localName==='p'){pnum++;const t=wordText(child);const style=all(child,'pStyle')[0]?.getAttribute('w:val')||'';if(/heading|title/i.test(style)||isHeading(t))heading=headingText(t);add(t,'paragraph',`${prefix}Paragraph ${pnum}`);}
 else if(child.localName==='tbl'){tnum++;const rows=Array.from(child.children).filter(c=>c.localName==='tr');rows.forEach((tr,r)=>{const cells=Array.from(tr.children).filter(c=>c.localName==='tc').map(tc=>all(tc,'p').map(wordText).join('\n'));add(cells.join(' | '),'table',`${prefix}Table ${tnum}, row ${r+1}`,{cells});});}
 else if(!['del','moveFrom','sectPr'].includes(child.localName))traverse(child);}};traverse(root);
 }
 if(/<w:numPr[\s>]/.test(strFromU8(zip['word/document.xml'])))warnings.push('Automatic Word numbering is not rendered. Use the paragraph and table locators to verify source text.');
 if(!blocks.length)throw new Error('No readable text found in DOCX.');return {blocks,warnings:[...new Set(warnings)],format:'docx'};
}
function pageLines(items,viewport){
 const lines=[];let sourceIndex=-1;for(const item of items){if('str' in item)sourceIndex++;if(!item.str?.trim())continue;const tr=pdfjs.Util.transform(viewport.transform,item.transform),h=Math.max(Math.hypot(tr[2],tr[3]),8);const y=tr[5]-h;let line=lines.find(l=>Math.abs(l.y-y)<h*.35);if(!line){line={y,h,items:[]};lines.push(line);}line.items.push({sourceIndex,text:item.str,x:tr[4],y,w:item.width,h});}
 lines.sort((a,b)=>a.y-b.y);for(const l of lines){l.items.sort((a,b)=>a.x-b.x);l.text='';l.boxes=[];let prev;
 for(const item of l.items){const gap=prev?item.x-prev.x-prev.w:0;const join=prev?(gap>18?' | ':gap>1&&!/[\u3400-\u9fff]$/.test(prev.text)&&! /^[\u3400-\u9fff]/.test(item.text)?' ':''):'';l.text+=join;const start=l.text.length;l.text+=item.text;l.boxes.push({...item,start,end:l.text.length});prev=item;}}
 return lines;
}
export async function extractFile(file,progress=()=>{},forceOCR=false){
 if(file.size>35*1024*1024)throw new Error('File exceeds 35 MB. Split it into smaller files.');const ext=file.name.split('.').pop().toLowerCase();if(!['pdf','docx'].includes(ext))throw new Error('Please choose a PDF or DOCX file.');
 const raw=await file.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',raw))].map(n=>n.toString(16).padStart(2,'0')).join('');
 if(ext==='docx')return {...extractDOCX(raw),name:file.name,hash,raw};
 const handle=await openPDF(raw.slice(0)),blocks=[],warnings=[];let heading='';
 try{if(handle.pdf.numPages>100)throw new Error('Limit: 100 PDF pages. Split the file into smaller contracts.');
 for(let p=1;p<=handle.pdf.numPages;p++){progress(`Reading ${file.name}: page ${p}/${handle.pdf.numPages}`);const page=await handle.pdf.getPage(p),vp=page.getViewport({scale:1}),content=await page.getTextContent();let lines=pageLines(content.items,vp);
 const nativeLength=lines.map(l=>l.text).join('').replace(/\s/g,'').length;
 if(forceOCR||nativeLength<30){const canvas=document.createElement('canvas'),scale=Math.min(3,3200/Math.max(vp.width,vp.height)),v=page.getViewport({scale});canvas.width=Math.ceil(v.width);canvas.height=Math.ceil(v.height);await page.render({canvasContext:canvas.getContext('2d'),viewport:v}).promise;
 const result=await recognize(canvas,progress);warnings.push(`Page ${p}: OCR used (${Math.round(result.confidence)}% engine confidence). Verify all highlighted text against the scan.`);lines=[];
 for(const b of result.blocks||[])for(const par of b.paragraphs||[])for(const l of par.lines||[]){const bb=l.bbox,lineText=l.text.trim(),words=[];let cursor=0;for(const word of l.words||[]){const at=lineText.indexOf(word.text,cursor),wb=word.bbox;if(at<0||!wb)continue;words.push({text:word.text,start:at,end:at+word.text.length,x:wb.x0/scale,y:wb.y0/scale,w:(wb.x1-wb.x0)/scale,h:(wb.y1-wb.y0)/scale});cursor=at+word.text.length;}lines.push({text:lineText,y:bb.y0/scale,h:(bb.y1-bb.y0)/scale,boxes:[{text:lineText,start:0,end:lineText.length,x:bb.x0/scale,y:bb.y0/scale,w:(bb.x1-bb.x0)/scale,h:(bb.y1-bb.y0)/scale,words}]});}
 if(!lines.length&&result.text.trim())lines=result.text.split(/\n/).filter(t=>t.trim()).map((text,i)=>({text:text.trim(),y:i*16,h:12,boxes:[]}));canvas.width=canvas.height=0;}
 else {const ops=await page.getOperatorList();if(ops.fnArray.some(op=>[pdfjs.OPS.paintImageXObject,pdfjs.OPS.paintInlineImageXObject].includes(op)))warnings.push(`Page ${p}: embedded images detected. Native text was read; enable Force OCR if an image contains contract text.`);}
 let current=null,previous=null;const flush=()=>{if(current){blocks.push({...current,id:`b${blocks.length}`,location:`Page ${p}, block ${blocks.filter(b=>b.page===p).length+1}`});current=null;}};
 for(const line of lines){const headingLine=isHeading(line.text),table=line.text.includes(' | '),gap=previous?line.y-previous.y:Infinity;
 if(!current||headingLine||table||current.kind==='table'||gap>Math.max(line.h,previous?.h||0)*1.65){flush();if(headingLine)heading=headingText(line.text);current={text:'',kind:table?'table':'paragraph',heading,page:p,width:vp.width,height:vp.height,boxes:[]};}
 const separator=current.text?(/[\u3400-\u9fff]$/.test(current.text)&&/^[\u3400-\u9fff]/.test(line.text)?'':' '):'';const offset=current.text.length+separator.length;current.text+=separator+line.text;current.boxes.push(...line.boxes.map(b=>({...b,start:b.start+offset,end:b.end+offset,...(b.words?{words:b.words.map(w=>({...w,start:w.start+offset,end:w.end+offset}))}:{})})));previous=line;
 }flush();if(!lines.length)warnings.push(`Page ${p}: no readable text, including after OCR. Inspect this page manually.`);page.cleanup();}
 // PDF table headers are often repeated at page breaks. Ignore only an exact
 // prior table row with header-like (non-numeric) cells at the top of a page.
 const seenHeaders=new Set();for(let i=0;i<blocks.length;i++){const b=blocks[i];if(b.kind!=='table'||/\d/.test(b.text))continue;const key=b.text.replace(/\s+/g,' ').trim();if(seenHeaders.has(key)&&b.boxes[0]?.y<80){warnings.push(`Page ${b.page}: repeated table header omitted from comparison: ${key}`);blocks.splice(i--,1);}else seenHeaders.add(key);}
 if(!blocks.length)throw new Error('No readable text found, even after OCR. Try a clearer scan.');
 return {name:file.name,hash,format:'pdf',blocks,warnings:[...new Set(warnings)],pageCount:handle.pdf.numPages,raw};
 }finally{await handle.close();}
}

