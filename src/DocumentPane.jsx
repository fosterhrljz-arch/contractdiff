import React,{useEffect,useRef,useState,useMemo,useLayoutEffect} from 'react';
import {openPDF} from './extract.js';
import {renderPDFPage,renderDOCX,docxHighlights} from './rendering.js';
import {targetFor} from './navigation.js';
import {anchorAt} from './workspaceLayout.js';
import {download} from './report.js';
import {t} from './i18n.js';
import Icon from './icons.jsx';

function PdfPage({pdf,meta,blocks,rows,side,scale,activePage,onReady,onFailure}){
 const wrap=useRef(),host=useRef(),queue=useRef(Promise.resolve()),[visible,setVisible]=useState(meta.page===1),[ready,setReady]=useState(false);
 useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{root:wrap.current.closest('.document-scroll'),rootMargin:'500px'});observer.observe(wrap.current);return()=>observer.disconnect();},[]);
 const active=visible||activePage===meta.page;
 useEffect(()=>{let gone=false;setReady(false);queue.current=queue.current.catch(()=>{}).then(async()=>{if(gone)return;if(!active){host.current?.replaceChildren();return;}try{await renderPDFPage(pdf,meta.page,host.current,scale,blocks,rows,side);if(!gone){setReady(true);onReady();}}catch(e){if(!gone)onFailure(e.message);}});return()=>{gone=true;};},[pdf,meta.page,scale,active]);
 return <div ref={wrap} className="pdf-shell" data-page={meta.page} style={{width:meta.width*scale,height:meta.height*scale}}><div className="pdf-paper" ref={host}/>{!ready&&<div className="page-placeholder"><span>PDF · {meta.page}</span>{blocks.map(b=>{if(!b.boxes?.length)return null;const y=Math.min(...b.boxes.map(v=>v.y)),bottom=Math.max(...b.boxes.map(v=>v.y+v.h));return <span key={b.id} data-block={b.id} className="source-anchor" style={{top:y*scale,left:20,width:'calc(100% - 40px)',height:(bottom-y)*scale}}/>;})}</div>}<span className="page-number">{meta.page}</span></div>;
}

function FormattedDOCX({doc,side,rows,available,zoom,onReady,onFailure,onMapping}){
 const host=useRef(),rendered=useRef(false),[version,setVersion]=useState(0),[naturalWidth,setNaturalWidth]=useState(816);
 const scale=available/naturalWidth*zoom;
 useEffect(()=>{let gone=false;rendered.current=false;renderDOCX(doc,host.current,side).then(info=>{if(gone)return;rendered.current=true;setNaturalWidth(info.width);onMapping(info.missing.length);setVersion(v=>v+1);}).catch(e=>!gone&&onFailure(e.message));return()=>{gone=true;};},[doc]);
 useEffect(()=>{if(!rendered.current)return;const timer=requestAnimationFrame(()=>{docxHighlights(host.current,doc,rows,side);onReady();});return()=>cancelAnimationFrame(timer);},[scale,version]);
 return <div className="docx-scale" style={{zoom:scale,width:naturalWidth}}><div className="formatted-docx" style={{width:naturalWidth}} ref={host} data-docx-ready={version>0?'true':'false'}/></div>;
}

// One anchor per extracted source block. Prefer native geometry over temporary placeholders.
function sourceAnchors(el){
 const seen=new Set(),all=[];
 for(const node of el.querySelectorAll('[data-block]')){if(seen.has(node.dataset.block))continue;const r=node.getBoundingClientRect();if(!r.height)continue;seen.add(node.dataset.block);all.push({id:node.dataset.block,node,top:r.top,bottom:r.bottom,left:r.left});}
 return all.sort((a,b)=>a.top-b.top||a.left-b.left);
}

export default function DocumentPane({doc,side,result,selection,zoom,lang,register,onScroll,onSelect,onReady:parentReady}){
 const scroller=useRef(),apiRef=useRef(),restore=useRef(),view=useRef(),programmatic=useRef(null),layoutGuard=useRef(0),selectionRef=useRef(selection);
 const [available,setAvailable]=useState(500),[pdfState,setPdfState]=useState(null),[error,setError]=useState(''),[mapping,setMapping]=useState(0),[version,setVersion]=useState(0);
 selectionRef.current=selection;
 const target=selection?targetFor(selection,side,result.rows):null;
 const applyActive=()=>{const root=scroller.current;if(!root)return;const active=selectionRef.current,at=active?targetFor(active,side,result.rows):null;root.querySelectorAll('[data-block]').forEach(e=>{e.classList.toggle('active-block',e.dataset.block===at?.block?.id);e.classList.toggle('gap-context',!!at?.missing&&e.dataset.block===at?.block?.id);});root.querySelectorAll('.change-hit').forEach(e=>e.classList.toggle('active',e.dataset.changeId===active?.id));};
 const ready=()=>{applyActive();setVersion(v=>v+1);if(restore.current)apiRef.current?.goTo(restore.current.blockId,restore.current.ratio,.22,true);parentReady?.(side);};
 useEffect(()=>{let timer;const observer=new ResizeObserver(()=>{const el=scroller.current;if(!el.clientWidth)return;restore.current??=view.current||apiRef.current?.anchor();const style=getComputedStyle(el),width=el.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);clearTimeout(timer);timer=setTimeout(()=>setAvailable(Math.max(160,width)),80);});observer.observe(scroller.current);return()=>{clearTimeout(timer);observer.disconnect();};},[]);
 useEffect(()=>{let cancelled=false,handle;setPdfState(null);setError('');if(doc.format==='pdf')(async()=>{try{handle=await openPDF(doc.raw.slice(0));const pages=[];for(let n=1;n<=handle.pdf.numPages;n++){const p=await handle.pdf.getPage(n),v=p.getViewport({scale:1});pages.push({page:n,width:v.width,height:v.height});}if(!cancelled)setPdfState({...handle,pages});else await handle.close();}catch(e){if(!cancelled)setError(e.message);}})();return()=>{cancelled=true;handle?.close().catch(()=>{});};},[doc]);
 useEffect(()=>applyActive(),[selection,version]);
 useLayoutEffect(()=>{layoutGuard.current=performance.now()+400;restore.current??=view.current;},[available,zoom]);
 useLayoutEffect(()=>{
  const el=scroller.current;
  const api={element:el,
   remember(){restore.current=api.anchor();layoutGuard.current=performance.now()+400;},
   goTo(blockId,ratio=0,align=.22,preserve=false,reveal=false){
    if(!preserve)restore.current=null;
    if(!el.clientHeight||!el.clientWidth)return false;
    const anchors=sourceAnchors(el),index=anchors.findIndex(a=>a.id===blockId);if(index<0)return false;
    const a=anchors[index],span=Math.max(1,(anchors[index+1]?.top??a.bottom)-a.top),base=el.getBoundingClientRect();
    el.scrollTop=Math.max(0,el.scrollTop+a.top-base.top+ratio*span-el.clientHeight*align);
    if(reveal){
     const hit=el.querySelector(`.change-hit[data-change-id="${selectionRef.current?.id}"]`),rect=hit?.getBoundingClientRect()||a.node.getBoundingClientRect();
     if(rect.left<base.left+12||rect.right>base.right-12){const inset=rect.width>el.clientWidth-40?20:Math.max(20,(el.clientWidth-rect.width)/2);el.scrollLeft=Math.max(0,el.scrollLeft+rect.left-base.left-inset);}
    }
    programmatic.current=el.scrollTop;
    view.current=api.anchor();return true;
   },
   anchor(){return anchorAt(sourceAnchors(el),el.getBoundingClientRect().top+el.clientHeight*.22);}
  };apiRef.current=api;register(side,api);return()=>register(side,null);
 },[doc]);
 const blockByPage=useMemo(()=>{const groups=new Map();doc.blocks.forEach(b=>{if(!groups.has(b.page))groups.set(b.page,[]);groups.get(b.page).push(b);});return groups;},[doc]);
 const handleHit=e=>{const hit=e.target.closest('[data-change-id]');if(hit){e.preventDefault();const row=result.rows.find(r=>r.id===hit.dataset.changeId);if(row)onSelect(row);}};
 const handleScroll=()=>{const el=scroller.current;if(performance.now()<layoutGuard.current)return;view.current=apiRef.current?.anchor();if(programmatic.current!==null&&Math.abs(el.scrollTop-programmatic.current)<1){programmatic.current=null;return;}programmatic.current=null;restore.current=null;onScroll(side);};
 const userIntent=()=>{layoutGuard.current=0;restore.current=null;programmatic.current=null;};
 return <section className={`document-pane ${side}`} aria-label={t(lang,side==='old'?'original':'revised')} data-side={side}><header className="pane-header"><Icon name="file"/><strong>{t(lang,side==='old'?'original':'revised')}</strong><span title={doc.name}>{doc.name}</span><button className="icon-button" aria-label={`${t(lang,'download')} · ${side}`} title={t(lang,'download')} onClick={()=>download(doc.raw,doc.name,doc.format==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}><Icon name="export"/></button></header>
 {target?.missing&&<div className="gap-banner" role="note" data-gap="true"><span>⊖</span><div><strong>{t(lang,'missing')} · {t(lang,side==='new'?'removed':'added')}</strong><small>{t(lang,'context')}: {target.block?.location||'—'} · {t(lang,'gapHelp')}</small></div></div>}
 <div ref={scroller} className="document-scroll" tabIndex={0} aria-label={`${t(lang,'document')} ${side}`} onScroll={handleScroll} onWheel={userIntent} onPointerDown={userIntent} onTouchStart={userIntent} onClick={handleHit} onKeyDown={e=>{userIntent();if(e.key==='Enter'||e.key===' ')handleHit(e);}} data-target-block={target?.block?.id||''}>
 {error&&<div className="render-error" role="alert">{error}</div>}{mapping>0&&<div className="render-warning">{t(lang,'mapping')}</div>}
 {doc.format==='pdf'?(pdfState?<div className="pdf-pages">{pdfState.pages.map(meta=><PdfPage key={meta.page} pdf={pdfState.pdf} meta={meta} blocks={blockByPage.get(meta.page)||[]} rows={result.rows} side={side} scale={available/meta.width*zoom} activePage={target?.block?.page} onReady={ready} onFailure={setError}/>)}</div>:<div className="pane-loading">{t(lang,'loading')}</div>):<FormattedDOCX doc={doc} side={side} rows={result.rows} available={available} zoom={zoom} onReady={ready} onFailure={setError} onMapping={setMapping}/>}
 </div><div className="pane-footer"><span>{t(lang,doc.format==='pdf'?(doc.warnings.some(w=>w.includes('OCR used'))?'approx':'pdfQuality'):'docxQuality')}</span><span>{target?.block?.location||`${doc.blocks.length} blocks`}</span></div></section>;
}
