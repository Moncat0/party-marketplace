import React from 'react';
export function Switch({checked,onChange,label}){
return React.createElement('label',{style:{display:'inline-flex',alignItems:'center',gap:10,fontFamily:'var(--font-body)',fontSize:15,cursor:'pointer'}},
React.createElement('span',{onClick:()=>onChange&&onChange(!checked),style:{width:42,height:24,borderRadius:'var(--radius-pill)',border:'none',background:checked?'var(--color-primary)':'var(--cream-200)',position:'relative',transition:'background var(--duration-base) var(--ease-standard)'}},
React.createElement('span',{style:{position:'absolute',top:2,left:checked?20:2,width:20,height:20,borderRadius:'50%',background:'#fff',boxShadow:'var(--shadow-soft-sm)',transition:'left var(--duration-base) var(--ease-standard)'}})),
label);
}
