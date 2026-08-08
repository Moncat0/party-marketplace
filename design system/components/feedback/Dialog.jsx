import React from 'react';
export function Dialog({open,onClose,title,children,footer}){
if(!open)return null;
return React.createElement('div',{style:{position:'fixed',inset:0,background:'rgba(17,17,17,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000},onClick:onClose},
React.createElement('div',{onClick:e=>e.stopPropagation(),style:{background:'var(--white)',borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-soft-md)',padding:'28px',width:360,fontFamily:'var(--font-body)'}},
React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}},
React.createElement('h3',{style:{margin:0,fontFamily:'var(--font-display)',fontSize:22}},title),
React.createElement('span',{onClick:onClose,style:{cursor:'pointer',fontSize:18,color:'var(--ink-500)'}},'✕')),
children,
footer&&React.createElement('div',{style:{marginTop:20,display:'flex',gap:10,justifyContent:'flex-end'}},footer)));
}
