import React from 'react';
export function Checkbox({checked,onChange,label}){
return React.createElement('label',{style:{display:'inline-flex',alignItems:'center',gap:10,fontFamily:'var(--font-body)',fontSize:15,cursor:'pointer'}},
React.createElement('span',{onClick:()=>onChange&&onChange(!checked),style:{width:20,height:20,borderRadius:'6px',border:`1.5px solid ${checked?'var(--ink-900)':'var(--color-border-subtle)'}`,background:checked?'var(--ink-900)':'var(--white)',display:'inline-flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:700,transition:'background var(--duration-fast) var(--ease-standard)'}},checked?'✓':''),
label);
}
