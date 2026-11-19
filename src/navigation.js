// Presentation-only mapping. The comparison engine remains unchanged.
export function targetFor(row,side,rows){
 const key=side==='old'?'old':'new';if(row[key])return {block:row[key],missing:false};
 const other=key==='old'?'new':'old',indexKey=other==='old'?'oldIndex':'newIndex',at=row[indexKey];
 const ordered=rows.filter(r=>r[other]&&r[key]).sort((a,b)=>a[indexKey]-b[indexKey]);
 const next=ordered.find(r=>r[indexKey]>at),prev=[...ordered].reverse().find(r=>r[indexKey]<at);
 return {block:(next||prev)?.[key]||null,missing:true,edge:next?'before':'after'};
}
export function compactMap(text){let compact='',offsets=[];for(let i=0;i<text.length;i++){if(!/[\s|\u200b\u00ad]/u.test(text[i])){compact+=text[i];offsets.push(i);}}return {compact,offsets};}
export function mappedRange(sourceText,renderedText,start,end){const s=compactMap(sourceText),d=compactMap(renderedText);if(s.compact!==d.compact)return null;const indexes=[];for(let i=0;i<s.offsets.length;i++)if(s.offsets[i]>=start&&s.offsets[i]<end)indexes.push(i);if(!indexes.length)return null;return {start:d.offsets[indexes[0]],end:d.offsets[indexes.at(-1)]+1};}
export function changedRanges(parts){const out=[];for(const p of parts){if(!p.changed)continue;const prev=out.at(-1);if(prev&&prev.end===p.start){prev.end=p.end;prev.text+=p.text;}else out.push({start:p.start,end:p.end,text:p.text});}return out;}
export function domRange(root,start,end){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let n,total=0;while((n=walker.nextNode())){nodes.push({node:n,start:total,end:total+n.textContent.length});total+=n.textContent.length;}const a=nodes.find(n=>n.end>start),b=nodes.find(n=>n.end>=end&&n.start<end);if(!a||!b)return null;const r=document.createRange();r.setStart(a.node,start-a.start);r.setEnd(b.node,end-b.start);return r;}
export function localRects(range,container){const base=container.getBoundingClientRect(),scale=container.offsetWidth/base.width||1;return [...range.getClientRects()].filter(r=>r.width>.1&&r.height>.1).map(r=>({x:(r.left-base.left)*scale,y:(r.top-base.top)*scale,w:r.width*scale,h:r.height*scale}));}
