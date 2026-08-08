import React from 'react';
export function Toast({tone='neutral',children,onClose}){
const tones={neutral:{background:'var(--white)',color:'var(--ink-900)',border:'1px solid var(--color-border-subtle)'},success:{background:'var(--white)',color:'var(--color-success)',border:'1px solid var(--color-border-subtle)'},danger:{background:'var(--white)',color:'var(--color-danger)',border:'1px solid var(--color-border-subtle)'}};
return React.createElement('div',{style:{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',borderRadius:'var(--radius-md)',fontFamily:'var(--font-body)',fontWeight:600,fontSize:14,boxShadow:'var(--shadow-soft-md)',...tones[tone]}},
React.createElement('span',{style:{flex:1}},children),
onClose&&React.createElement('span',{onClick:onClose,style:{cursor:'pointer',opacity:0.5}},'✕'));
}
