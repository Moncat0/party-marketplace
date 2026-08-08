import React from 'react';
export function Tag({selected=false,children,onClick}){
const [hover,setHover]=React.useState(false);
return React.createElement('button',{type:'button',onClick,onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),style:{fontFamily:'var(--font-body)',fontWeight:500,fontSize:'14px',padding:'8px 16px',borderRadius:'var(--radius-pill)',border:'1.5px solid '+(selected?'var(--ink-900)':'var(--color-border-subtle)'),background:selected?'var(--ink-900)':(hover?'var(--cream-100)':'#fff'),color:selected?'#fff':'var(--ink-900)',cursor:'pointer',transition:'all var(--duration-fast) var(--ease-standard)'}},children);
}
