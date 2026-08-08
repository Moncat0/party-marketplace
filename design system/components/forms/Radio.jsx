import React from 'react';
export function Radio({checked,onChange,label}){
return React.createElement('label',{style:{display:'inline-flex',alignItems:'center',gap:10,fontFamily:'var(--font-body)',fontSize:15,cursor:'pointer'}},
React.createElement('span',{onClick:()=>onChange&&onChange(),style:{width:20,height:20,borderRadius:'50%',border:`1.5px solid ${checked?'var(--ink-900)':'var(--color-border-subtle)'}`,background:'var(--white)',display:'inline-flex',alignItems:'center',justifyContent:'center'}},
checked&&React.createElement('span',{style:{width:10,height:10,borderRadius:'50%',background:'var(--ink-900)'}})),
label);
}
