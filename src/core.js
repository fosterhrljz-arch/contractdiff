// Deterministic, evidence-only comparison. No remote model or legal inference.
export const normalize = s => s.normalize('NFC').replace(/\s+/gu,' ').trim();
const bodyKey = s => normalize(s).replace(/^(?:(?:section|article|clause)\s+)?\d+(?:\.\d+)*[.)、．]?\s+/i,'').replace(/^第[一二三四五六七八九十百\d]+[条章节]\s*/,'');
const grams = s => {const t=bodyKey(s).toLowerCase();const a=new Set();for(let i=0;i<t.length-1;i++)a.add(t.slice(i,i+2));return a;};
function dice(a,b){let n=0;for(const v of a)if(b.has(v))n++;return a.size+b.size?2*n/(a.size+b.size):0;}
export function tokens(s){return [...s.matchAll(/[\p{Script=Han}]|[\p{L}\p{M}]+|\d+(?:[.,]\d+)*|\s+|[^\s]/gu)].map(m=>({text:m[0],start:m.index,end:m.index+m[0].length,key:/^\s+$/.test(m[0])?' ':m[0]}));}
export function diffText(a='',b=''){
 const x=tokens(a),y=tokens(b);let prefix=0,suffix=0;
 while(prefix<x.length&&prefix<y.length&&x[prefix].key===y[prefix].key)prefix++;
 while(suffix<x.length-prefix&&suffix<y.length-prefix&&x[x.length-1-suffix].key===y[y.length-1-suffix].key)suffix++;
 const n=x.length-prefix-suffix,m=y.length-prefix-suffix,old=[],neo=[];
 const push=(out,t,changed)=>{if(t)out.push({...t,changed});};
 for(let i=0;i<prefix;i++){push(old,x[i],false);push(neo,y[i],false);}
 // Bound memory for unusually long clauses. Conservatively mark the interior.
 if(n*m>4000000){for(let i=prefix;i<x.length-suffix;i++)push(old,x[i],true);for(let j=prefix;j<y.length-suffix;j++)push(neo,y[j],true);}
 else {const dp=Array.from({length:n+1},()=>new Uint32Array(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=x[prefix+i].key===y[prefix+j].key?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 let i=0,j=0;while(i<n||j<m){if(i<n&&j<m&&x[prefix+i].key===y[prefix+j].key){push(old,x[prefix+i++],false);push(neo,y[prefix+j++],false);}else if(i<n&&(j===m||dp[i+1][j]>=dp[i][j+1]))push(old,x[prefix+i++],true);else push(neo,y[prefix+j++],true);}}
 for(let i=suffix;i>0;i--){push(old,x[x.length-i],false);push(neo,y[y.length-i],false);}
 return {old,neo,coarse:n*m>4000000};
}
const categoryRules=[['Payment',/\b(pay(?:ment|able)?|invoice|instalment|installment)\b|付款|支付|结算|账期/i],['Amounts',/[$€£¥￥]|\b(?:USD|CNY|RMB|EUR|GBP)\b|金额|价款|费用|人民币/i],['Dates / deadlines',/\b(?:days?|months?|years?|deadline|due|deliver|date|notice)\b|日期|期限|截止|工作日|天|日内|交付/i],['Penalties',/\b(?:penalt\w*|liquidated damages|late fee)\b|违约金|滞纳金|罚款/i],['Liability',/\b(?:liabilit\w*|breach|indemn\w*|damages)\b|违约|赔偿|责任/i],['Termination',/\b(?:terminat\w*|cancel\w*|expir\w*)\b|终止|解除|到期/i]];
export function classify(row){
 const text=[row.old?.heading,row.new?.heading,row.old?.text,row.new?.text].filter(Boolean).join(' ');
 const categories=categoryRules.filter(([,r])=>r.test(text)).map(([c])=>c);
 let priority=categories.some(c=>['Payment','Amounts','Penalties','Liability','Termination'].includes(c))?'High':categories.length?'Medium':'Low';
 let title=`${row.kind==='deleted'?'Deleted':row.kind==='added'?'Added':'Modified'} ${row.old?.kind==='table'||row.new?.kind==='table'?'table row':'text'}`;
 if(row.kind==='moved'){priority='Info';title='Text relocated; wording unchanged';}
 else if(row.kind==='unchanged'){priority='Info';title='Unchanged text';}
 else if(row.kind==='deleted'&&categories.includes('Liability'))title='Liability text removed';
 else if(row.kind==='modified'&&categories.includes('Payment'))title='Payment terms changed';
 else if(categories.includes('Amounts'))title=`Amount-related text ${row.kind}`;
 else if(categories.includes('Termination'))title=`Termination text ${row.kind}`;
 else if(categories.includes('Dates / deadlines'))title=`Date or deadline text ${row.kind}`;
 const removed=row.diff.old.filter(t=>t.changed).map(t=>t.text).join(''),added=row.diff.neo.filter(t=>t.changed).map(t=>t.text).join('');
 const values={before:removed,after:added};
 return {priority,title,categories:categories.length?categories:['Other'],values,reason:priority==='Info'?'No wording change.':`Review ${categories.length?categories.join(', ').toLowerCase():'changed wording'} against the source. Labels identify topics, not legal effects.`};
}
export function compareDocuments(a,b){
 if(!a.blocks.length||!b.blocks.length)throw new Error('No readable text in one document. Verify extraction before comparing.');
 if(a.blocks.length>2500||b.blocks.length>2500)throw new Error('Limit: 2,500 text blocks per document. Split the contract into smaller files.');
 const left=a.blocks,right=b.blocks,pairs=new Map(),used=new Set(),ak=left.map(t=>normalize(t.text)),bk=right.map(t=>normalize(t.text));
 const buckets=new Map();bk.forEach((k,j)=>{if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(j);});
 ak.forEach((k,i)=>{const choices=buckets.get(k)?.filter(j=>!used.has(j));if(choices?.length){const j=choices.reduce((v,j)=>Math.abs(i-j)<Math.abs(i-v)?j:v,choices[0]);pairs.set(i,{j,score:1,exact:true});used.add(j);}});
 const unmatched=left.map((_,i)=>i).filter(i=>!pairs.has(i)),other=right.map((_,j)=>j).filter(j=>!used.has(j));
 const ga=new Map(unmatched.map(i=>[i,grams(left[i].text)])),gb=new Map(other.map(j=>[j,grams(right[j].text)])),candidates=[];
 for(const i of unmatched)for(const j of other){if(left[i].kind!==right[j].kind)continue;
  const ratio=Math.min(ak[i].length,bk[j].length)/Math.max(ak[i].length,bk[j].length);if(ratio<.3)continue;
  const score=dice(ga.get(i),gb.get(j));if(score>=.57)candidates.push({i,j,score,exact:false});
 }
 candidates.sort((a,b)=>b.score-a.score||Math.abs(a.i-a.j)-Math.abs(b.i-b.j));
 for(const c of candidates)if(!pairs.has(c.i)&&!used.has(c.j)){pairs.set(c.i,c);used.add(c.j);}
 const matched=[...pairs.entries()].sort((a,b)=>a[0]-b[0]);const moved=new Set();
 // Relative-order inversions, not absolute index shifts after insertions/deletions.
 let max=-1;for(const[i,p]of matched){if(p.j<max)moved.add(i);max=Math.max(max,p.j);}
 let min=Infinity;for(const[i,p]of [...matched].reverse()){if(p.j>min)moved.add(i);min=Math.min(min,p.j);}
 const rows=left.map((old,i)=>{const p=pairs.get(i),neo=p?right[p.j]:null;return {old,new:neo,oldIndex:i,newIndex:p?.j??null,kind:!p?'deleted':p.exact?(moved.has(i)?'moved':'unchanged'):'modified',moved:!!p&&moved.has(i),confidence:p?.score??null};});
 // Place insertions beside their nearest following matched source block.
 for(let j=0;j<right.length;j++)if(!used.has(j)){const next=rows.findIndex(r=>r.newIndex!==null&&r.newIndex>j);rows.splice(next<0?rows.length:next,0,{old:null,new:right[j],oldIndex:null,newIndex:j,kind:'added',moved:false,confidence:null});}
 for(let i=0;i<rows.length;i++){const r=rows[i];r.id=`change-${i+1}`;r.diff=diffText(r.old?.text,r.new?.text);Object.assign(r,classify(r));}
 return {rows,changes:rows.filter(r=>r.kind!=='unchanged'),counts:Object.fromEntries(['added','deleted','modified','moved','unchanged'].map(k=>[k,rows.filter(r=>r.kind===k).length])),created:new Date().toISOString()};
}
export function makeDocument(text,name='Contract'){return {name,format:'text',warnings:[],blocks:text.split(/\n\s*\n/).filter(t=>t.trim()).map((text,i)=>({id:`b${i}`,text:text.trim(),kind:'paragraph',heading:text.split('\n')[0].slice(0,100),location:`Paragraph ${i+1}`}))};}
