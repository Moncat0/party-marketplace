import React from 'react';
export function Select({label,options=[],value,onChange}){
return React.createElement('label',{style:{display:'flex',flexDirection:'column',gap:6,fontFamily:'var(--font-body)'}},
label&&React.createElement('span',{style:{fontSize:13,fontWeight:600}},label),
React.createElement('select',{value,onChange,style:{border:'1.5px solid var(--color-border-subtle)',borderRadius:'var(--radius-md)',padding:'10px 14px',fontFamily:'inherit',fontSize:15,background:'var(--white)',color:'var(--ink-900)'}},
options.map(o=>React.createElement('option',{key:o.value||o,value:o.value||o},o.label||o))));
}
