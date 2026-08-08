import React from 'react';
export function Input({label,placeholder,type='text',value,onChange,error,icon}){
const [focus,setFocus]=React.useState(false);
return React.createElement('label',{style:{display:'flex',flexDirection:'column',gap:6,fontFamily:'var(--font-body)'}},
label&&React.createElement('span',{style:{fontSize:13,fontWeight:600,color:'var(--ink-900)'}},label),
React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,border:`1.5px solid ${error?'var(--color-danger)':(focus?'var(--ink-900)':'var(--color-border-subtle)')}`,borderRadius:'var(--radius-md)',padding:'10px 14px',background:'var(--white)',transition:'border-color var(--duration-base) var(--ease-standard)'}},
icon,
React.createElement('input',{type,placeholder,value,onChange,onFocus:()=>setFocus(true),onBlur:()=>setFocus(false),style:{border:'none',outline:'none',fontFamily:'inherit',fontSize:15,flex:1,background:'transparent',color:'var(--ink-900)'}})),
error&&React.createElement('span',{style:{fontSize:12,color:'var(--color-danger)'}},error));
}
