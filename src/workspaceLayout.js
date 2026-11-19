export const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function sanitizeLayout(value={}){
 return {sidebar:clamp(Number(value.sidebar)||280,220,400),split:clamp(Number(value.split)||.5,.25,.75),collapsed:value.collapsed===true};
}
export function splitLimits(available){
 const minimum=Math.min(.5,Math.max(.25,220/Math.max(1,available)));
 return [minimum,1-minimum];
}
export function zoomValue(value,current=1){
 const n=Number(String(value).replace('%','').trim());
 return Number.isFinite(n)&&n>0?clamp(n/100,.5,3):current;
}
// Interpolate between source blocks, including paragraph spacing and page gaps.
// This avoids the snapping caused by choosing the nearest paragraph independently.
export function anchorAt(anchors,line){
 if(!anchors.length)return null;
 let i=0;for(let n=0;n<anchors.length;n++){if(anchors[n].top<=line)i=n;else break;}
 const a=anchors[i],next=anchors[i+1];
 const span=Math.max(1,(next?.top??a.bottom)-a.top);
 return {blockId:a.id,ratio:clamp((line-a.top)/span,-1,1)};
}
