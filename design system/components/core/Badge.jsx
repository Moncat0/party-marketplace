import React from 'react';
export function Badge({tone='neutral',children}){
const tones={
neutral:{background:'var(--cream-100)',color:'var(--ink-900)'},
primary:{background:'var(--orange-50)',color:'var(--orange-700)'},
secondary:{background:'var(--pink-50)',color:'var(--pink-700)'},
success:{background:'#e6f4ec',color:'var(--color-success)'},
outline:{background:'transparent',color:'var(--ink-500)',border:'1px solid var(--color-border-subtle)'}
};
return React.createElement('span',{style:{display:'inline-flex',alignItems:'center',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'12px',padding:'4px 10px',borderRadius:'var(--radius-pill)',...tones[tone]}},children);
}
