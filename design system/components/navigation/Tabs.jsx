import React from 'react';
export function Tabs({tabs=[],active,onChange}){
return React.createElement('div',{style:{display:'flex',gap:4,borderBottom:'1px solid var(--color-border-subtle)',fontFamily:'var(--font-body)'}},
tabs.map(t=>React.createElement('button',{key:t,onClick:()=>onChange&&onChange(t),style:{border:'none',background:'none',cursor:'pointer',padding:'10px 18px',fontFamily:'inherit',fontWeight:600,fontSize:15,color:t===active?'var(--ink-900)':'var(--ink-500)',borderBottom:t===active?'2px solid var(--ink-900)':'2px solid transparent',marginBottom:-1,transition:'color var(--duration-fast) var(--ease-standard)'}},t)));
}
