import React,{useEffect,useRef,useState} from 'react';
import {clamp,sanitizeLayout,splitLimits,zoomValue} from './workspaceLayout.js';
import {t} from './i18n.js';

export function useWorkspaceLayout(beforeChange){
 const [layout,setLayout]=useState(()=>{try{return sanitizeLayout(JSON.parse(localStorage.getItem('contractdiff-layout-v1'))||{});}catch{return sanitizeLayout();}});
 const [reading,setReading]=useState(false),[dragging,setDragging]=useState(false),root=useRef(),drag=useRef(),frame=useRef();
 useEffect(()=>{try{localStorage.setItem('contractdiff-layout-v1',JSON.stringify(layout));}catch{}},[layout]);
 useEffect(()=>{const escape=e=>{if(e.key==='Escape'&&!document.querySelector('[role=dialog]')){beforeChange();setReading(false);}};window.addEventListener('keydown',escape);return()=>{window.removeEventListener('keydown',escape);cancelAnimationFrame(frame.current);};},[beforeChange]);
 const hidden=layout.collapsed||reading;
 const change=patch=>{beforeChange();setLayout(v=>({...v,...patch}));};
 const limits=()=>{const width=root.current?.clientWidth||1200;const sidebar=hidden?0:Math.min(layout.sidebar,Math.max(220,width-460));return {width,sidebar,available:width-sidebar-(hidden?8:16)};};
 const resize=(kind,x)=>{const {width,sidebar,available}=limits(),left=root.current.getBoundingClientRect().left;if(kind==='sidebar')setLayout(v=>({...v,sidebar:clamp(drag.current?drag.current.startValue+x-drag.current.startX:x-left,220,Math.min(400,width-460))}));else{const [min,max]=splitLimits(available);setLayout(v=>({...v,split:clamp(drag.current?drag.current.startValue+(x-drag.current.startX)/available:(x-left-sidebar-(hidden?0:8))/available,min,max)}));}};
 const separatorProps=kind=>({
  onPointerDown(e){if(e.button!==0)return;e.preventDefault();beforeChange();drag.current={kind,id:e.pointerId,startX:e.clientX,startValue:kind==='sidebar'?layout.sidebar:layout.split};e.currentTarget.setPointerCapture(e.pointerId);setDragging(true);},
  onPointerMove(e){if(drag.current?.id!==e.pointerId)return;const x=e.clientX;cancelAnimationFrame(frame.current);frame.current=requestAnimationFrame(()=>resize(kind,x));},
  onPointerUp(e){if(drag.current?.id!==e.pointerId)return;cancelAnimationFrame(frame.current);resize(kind,e.clientX);drag.current=null;setDragging(false);e.currentTarget.releasePointerCapture(e.pointerId);},
  onLostPointerCapture(){cancelAnimationFrame(frame.current);drag.current=null;setDragging(false);},
  onDoubleClick(){change(kind==='sidebar'?{sidebar:280}:{split:.5});},
  onKeyDown(e){if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const {width,available}=limits(),dir=e.key==='ArrowRight'?1:-1;if(kind==='sidebar')change({sidebar:e.key==='Home'?220:e.key==='End'?Math.min(400,width-460):clamp(layout.sidebar+dir*20,220,Math.min(400,width-460))});else{const [min,max]=splitLimits(available);change({split:e.key==='Home'?min:e.key==='End'?max:clamp(layout.split+dir*.025,min,max)});}}
 });
 return {root,layout,reading,hidden,dragging,separatorProps,toggleSidebar:()=>{beforeChange();if(reading)setReading(false);setLayout(v=>({...v,collapsed:reading?false:!v.collapsed}));},toggleReading:()=>{beforeChange();setReading(v=>!v);}};
}

export function Splitter({kind,workspace,lang}){
 return <div className={`panel-splitter ${kind}-splitter`} role="separator" tabIndex={0} aria-orientation="vertical" aria-label={t(lang,kind==='sidebar'?'resizeSidebar':'resizeDocs')} aria-valuemin={kind==='sidebar'?220:25} aria-valuemax={kind==='sidebar'?400:75} aria-valuenow={Math.round(kind==='sidebar'?workspace.layout.sidebar:workspace.layout.split*100)} aria-valuetext={kind==='sidebar'?`${Math.round(workspace.layout.sidebar)} px`:`${Math.round(workspace.layout.split*100)}%`} title={t(lang,'resizeHint')} {...workspace.separatorProps(kind)}><span/></div>;
}

export function ZoomInput({zoom,onChange,disabled,lang}){
 const [draft,setDraft]=useState(String(Math.round(zoom*100))),cancel=useRef(false);
 useEffect(()=>setDraft(String(Math.round(zoom*100))),[zoom]);
 const commit=()=>{if(cancel.current){cancel.current=false;return;}const next=zoomValue(draft,zoom);setDraft(String(Math.round(next*100)));onChange(next);};
 return <label className="zoom-field" title={t(lang,'fitTip')}><input type="text" inputMode="decimal" aria-label={t(lang,'zoomPercent')} value={draft} disabled={disabled} onChange={e=>setDraft(e.target.value)} onFocus={e=>e.target.select()} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();if(e.key==='Escape'){cancel.current=true;setDraft(String(Math.round(zoom*100)));e.currentTarget.blur();}}}/><span>%</span></label>;
}
