import React from 'react';
export function Tooltip({label,children}){
const [show,setShow]=React.useState(false);
return React.createElement('span',{style:{position:'relative',display:'inline-block'},onMouseEnter:()=>setShow(true),onMouseLeave:()=>setShow(false)},
children,
show&&React.createElement('span',{style:{position:'absolute',bottom:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',background:'var(--ink-900)',color:'#fff',fontFamily:'var(--font-body)',fontSize:12,fontWeight:500,padding:'6px 10px',borderRadius:'var(--radius-sm)',whiteSpace:'nowrap',zIndex:10,boxShadow:'var(--shadow-soft-sm)'}},label));
}
