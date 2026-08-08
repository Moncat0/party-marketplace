import React from 'react';
export function IconButton({icon,size='md',variant='ghost',disabled=false,onClick,label}){
const dims={sm:32,md:40,lg:48};
const d=dims[size];
const [hover,setHover]=React.useState(false);
const variants={outline:{background:'#fff',border:'1.5px solid var(--color-border-subtle)'},solid:{background:'var(--ink-900)',border:'none',color:'#fff'},ghost:{background:hover?'var(--cream-100)':'transparent',border:'none'}};
return React.createElement('button',{type:'button',disabled,'aria-label':label,onClick,onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),style:{width:d,height:d,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.45:1,transition:'background var(--duration-base) var(--ease-standard)',...variants[variant]}},icon);
}
