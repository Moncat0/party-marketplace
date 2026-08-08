import React from 'react';
export function Button({variant='primary',size='md',disabled=false,icon=null,iconPosition='right',children,onClick,type='button'}){
const sizes={sm:{padding:'8px 16px',fontSize:'14px'},md:{padding:'12px 22px',fontSize:'16px'},lg:{padding:'15px 28px',fontSize:'17px'}};
const base={fontFamily:'var(--font-body)',fontWeight:600,borderRadius:'var(--radius-pill)',border:'none',cursor:disabled?'not-allowed':'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'background var(--duration-base) var(--ease-standard), opacity var(--duration-base) var(--ease-standard)',opacity:disabled?0.45:1,...sizes[size]};
const variants={
primary:{background:'var(--color-primary)',color:'#fff'},
secondary:{background:'var(--color-secondary)',color:'#fff'},
outline:{background:'transparent',color:'var(--ink-900)',border:'1.5px solid var(--color-border-subtle)'},
ghost:{background:'transparent',color:'var(--ink-900)'}
};
const [hover,setHover]=React.useState(false);
const style={...base,...variants[variant],filter:hover&&!disabled?'brightness(0.95)':'none'};
return React.createElement('button',{type,disabled,style,onClick,onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false)},
iconPosition==='left'&&icon,children,iconPosition==='right'&&icon);
}
