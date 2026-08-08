import React from 'react';
export function Card({children,padding='20px',hover=false,style={}}){
const [isHover,setIsHover]=React.useState(false);
return React.createElement('div',{onMouseEnter:()=>hover&&setIsHover(true),onMouseLeave:()=>hover&&setIsHover(false),style:{background:'#fff',border:'1px solid var(--color-border-subtle)',borderRadius:'var(--radius-lg)',padding,boxShadow:isHover?'var(--shadow-soft-md)':'var(--shadow-soft-sm)',transition:'box-shadow var(--duration-base) var(--ease-standard)',fontFamily:'var(--font-body)',...style}},children);
}
