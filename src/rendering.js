import {TextLayer} from 'pdfjs-dist';
import {renderAsync} from 'docx-preview';
import {changedRanges,domRange,mappedRange,compactMap,localRects} from './navigation.js';

function addHit(parent,rect,row,side,text,approx=false){const hit=document.createElement('span');hit.className=`change-hit ${side} ${row.kind}`;hit.dataset.changeId=row.id;hit.dataset.text=text;hit.dataset.approx=String(approx);hit.setAttribute('role','button');hit.tabIndex=0;hit.setAttribute('aria-label',`${row.title}: ${text}`);Object.assign(hit.style,{left:rect.x+'px',top:rect.y+'px',width:rect.w+'px',height:rect.h+'px'});parent.append(hit);return hit;}
export function pdfAnchors(container,blocks,scale){for(const b of blocks){if(!b.boxes?.length)continue;const x=Math.min(...b.boxes.map(v=>v.x)),y=Math.min(...b.boxes.map(v=>v.y)),right=Math.max(...b.boxes.map(v=>v.x+v.w)),bottom=Math.max(...b.boxes.map(v=>v.y+v.h));const a=document.createElement('span');a.className='source-anchor';a.dataset.block=b.id;a.setAttribute('aria-label',b.location);Object.assign(a.style,{left:x*scale+'px',top:y*scale+'px',width:(right-x)*scale+'px',height:(bottom-y)*scale+'px'});container.append(a);}}
export async function renderPDFPage(pdf,pageNumber,host,scale,blocks,rows,side){
 const page=await pdf.getPage(pageNumber),viewport=page.getViewport({scale});host.dataset.rendered='false';host.replaceChildren();host.style.width=viewport.width+'px';host.style.height=viewport.height+'px';host.style.setProperty('--total-scale-factor',scale);host.style.setProperty('--scale-factor',scale);
 const canvas=document.createElement('canvas');const pixelRatio=Math.max(1,Math.min(Math.max(window.devicePixelRatio||1,2),2.5,Math.sqrt(12000000/(viewport.width*viewport.height))));canvas.width=Math.ceil(viewport.width*pixelRatio);canvas.height=Math.ceil(viewport.height*pixelRatio);canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';host.append(canvas);
 await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:pixelRatio!==1?[pixelRatio,0,0,pixelRatio,0,0]:null}).promise;
 const layer=document.createElement('div');layer.className='textLayer';host.append(layer);const content=await page.getTextContent();const textLayer=new TextLayer({textContentSource:content,container:layer,viewport});await textLayer.render();
 pdfAnchors(host,blocks,scale);
 // Native glyph geometry also locates whole paragraphs accurately on rotated PDFs.
 const base=host.getBoundingClientRect();
 for(const block of blocks){const rects=(block.boxes||[]).map(b=>textLayer.textDivs[b.sourceIndex]).filter(Boolean).map(s=>s.getBoundingClientRect()).filter(r=>r.width&&r.height);const anchor=host.querySelector(`[data-block="${block.id}"]`);if(!rects.length||!anchor)continue;const left=Math.min(...rects.map(r=>r.left)),top=Math.min(...rects.map(r=>r.top));Object.assign(anchor.style,{left:left-base.left+'px',top:top-base.top+'px',width:Math.max(...rects.map(r=>r.right))-left+'px',height:Math.max(...rects.map(r=>r.bottom))-top+'px'});}

 const byBlock=new Map(rows.map(r=>[r[side==='old'?'old':'new']?.id,r]));
 for(const block of blocks){const row=byBlock.get(block.id);if(!row||row.kind==='unchanged')continue;const parts=side==='old'?row.diff.old:row.diff.neo;const ranges=row.kind==='moved'?[{start:0,end:block.text.length,text:block.text}]:changedRanges(parts);
 for(const box of block.boxes||[])for(const range of ranges){const start=Math.max(range.start,box.start),end=Math.min(range.end,box.end);if(start>=end||!block.text.slice(start,end).trim())continue;const text=block.text.slice(start,end);let span=textLayer.textDivs[box.sourceIndex];
 if(!span&&content.items.some(i=>i.str?.trim())){const base=host.getBoundingClientRect();span=textLayer.textDivs.filter(s=>s.textContent===box.text).sort((a,b)=>Math.abs(a.getBoundingClientRect().top-base.top-box.y*scale)-Math.abs(b.getBoundingClientRect().top-base.top-box.y*scale))[0];}
 if(span&&box.text===span.textContent){const r=domRange(span,start-box.start,end-box.start);if(r){for(const rect of localRects(r,host))addHit(host,rect,row,side,text);continue;}}
 // Scans use OCR word bounding boxes when available. Without them, mark the
 // containing run and disclose approximate positioning instead of guessing.
 if(box.words?.length){for(const w of box.words)if(w.start<end&&w.end>start)addHit(host,{x:w.x*scale,y:w.y*scale,w:w.w*scale,h:w.h*scale},row,side,text,true);}
 else addHit(host,{x:box.x*scale,y:box.y*scale,w:box.w*scale,h:box.h*scale},row,side,text,true);
 }}
 host.dataset.rendered='true';return {canvas,textLayer,page};
}

export async function renderDOCX(doc,host,side){
 host.replaceChildren();const styles=document.createElement('div'),body=document.createElement('div');host.append(styles,body);body.className='docx-body';
 await renderAsync(doc.raw.slice(0),body,styles,{className:`contract-${side}`,inWrapper:true,breakPages:true,ignoreLastRenderedPageBreak:false,ignoreWidth:false,ignoreHeight:false,ignoreFonts:false,useBase64URL:true,renderChanges:false,renderAltChunks:false,renderHeaders:true,renderFooters:true,renderFootnotes:true,renderEndnotes:true,renderComments:false});
 host.querySelectorAll('a').forEach(a=>{a.removeAttribute('href');a.removeAttribute('target');});host.querySelectorAll('script,iframe,object,embed').forEach(e=>e.remove());
 const pages=[...body.querySelectorAll(`section.contract-${side}`)];pages.forEach(p=>{p.dataset.docxpage='true';p.style.boxShadow='none';});
 const candidates=[...body.querySelectorAll('p,tr')].filter(el=>el.tagName==='TR'?!el.parentElement.closest('tr'):!el.closest('table'));
 const byKey=new Map();for(const el of candidates){const key=compactMap(el.textContent).compact;if(!key)continue;if(!byKey.has(key))byKey.set(key,[]);byKey.get(key).push(el);}
 const mapped=new Map(),missing=[];for(const block of doc.blocks){const key=compactMap(block.text).compact,list=byKey.get(key),el=list?.shift();if(el){el.dataset.block=block.id;el.classList.add('docx-block');mapped.set(block.id,el);}else missing.push(block);}
 if(missing.length){const fallback=document.createElement('section');fallback.className='mapping-fallback';fallback.dataset.fallback='true';for(const b of missing){const p=document.createElement('p');p.dataset.block=b.id;p.className='docx-block';p.textContent=b.text;fallback.append(p);mapped.set(b.id,p);}body.append(fallback);}
 await document.fonts.ready;
 await Promise.all([...body.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
 const width=Math.max(320,...pages.map(p=>p.offsetWidth));host.style.width=width+'px';
 return {mapped,pages,missing,styles,body,width};
}
export function docxHighlights(host,doc,rows,side){host.querySelectorAll('.docx-overlay').forEach(n=>n.remove());const overlay=document.createElement('div');overlay.className='docx-overlay';host.append(overlay);const byBlock=new Map(doc.blocks.map(b=>[b.id,b]));
 for(const row of rows){if(row.kind==='unchanged')continue;const block=row[side==='old'?'old':'new'];if(!block)continue;const el=host.querySelector(`[data-block="${block.id}"]`);if(!el)continue;const ranges=row.kind==='moved'?[{start:0,end:block.text.length,text:block.text}]:changedRanges(side==='old'?row.diff.old:row.diff.neo);for(const p of ranges){const mapped=mappedRange(byBlock.get(block.id).text,el.textContent,p.start,p.end);if(!mapped)continue;const r=domRange(el,mapped.start,mapped.end);if(r)for(const rect of localRects(r,host))addHit(overlay,rect,row,side,p.text);}}
 return overlay;
}
// For static exports wrap text nodes, preserving every paragraph/run/table style.
export function markDOCXForExport(host,rows,side){for(const row of rows){if(row.kind==='unchanged')continue;const b=row[side==='old'?'old':'new'];if(!b)continue;const el=host.querySelector(`[data-block="${b.id}"]`);if(!el)continue;const full=el.textContent;const ranges=(row.kind==='moved'?[{start:0,end:b.text.length}]:changedRanges(side==='old'?row.diff.old:row.diff.neo)).map(r=>mappedRange(b.text,full,r.start,r.end)).filter(Boolean).reverse();for(const r of ranges){const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[];let n,at=0;while((n=walker.nextNode())){nodes.push({n,start:at,end:at+n.length});at+=n.length;}for(const entry of nodes.reverse()){const s=Math.max(r.start,entry.start)-entry.start,e=Math.min(r.end,entry.end)-entry.start;if(s>=e)continue;const target=entry.n.splitText(s);target.splitText(e-s);const mark=document.createElement('mark');mark.className=side==='old'?'del':'add';target.replaceWith(mark);mark.append(target);}}}}
