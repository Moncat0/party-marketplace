function Browse({onSelectVendor}){
const {Card,Tag,Badge,Input}=window.FestlyDesignSystem_65deb2;
const [filter,setFilter]=React.useState('All');
const cats=['All','Catering','Photography','Music','Venues'];
const vendors=[
{name:'Sunset Loft',cat:'Venues',tag:"Chef's pick",price:'$1,200/night',img:'venue1'},
{name:'Maple & Thyme Catering',cat:'Catering',tag:'Available',price:'from $45/guest',img:'catering1'},
{name:'Golden Hour Photo',cat:'Photography',tag:'3 spots left',price:'from $800',img:'photo1'},
{name:'The Brass Collective',cat:'Music',tag:'Available',price:'from $600',img:'music1'},
{name:'Ivy Garden Venue',cat:'Venues',tag:'Available',price:'$950/night',img:'venue2'},
{name:'Sweet Layer Cakes',cat:'Catering',tag:"Chef's pick",price:'from $120',img:'catering2'}
];
const shown=filter==='All'?vendors:vendors.filter(v=>v.cat===filter);
return (
<div style={{display:'flex',flexDirection:'column',gap:24}}>
<div>
<div style={{fontFamily:'var(--font-display)',fontSize:44,textTransform:'uppercase',lineHeight:'var(--lh-tight)',color:'var(--ink-900)'}}>Made for<br/>good company.</div>
<div style={{fontFamily:'var(--font-body)',color:'var(--ink-500)',fontSize:16,marginTop:10}}>We bring the right people together.</div>
</div>
<Input placeholder="Search vendors and venues" icon={<img src="https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/search.svg" alt="" style={{width:18,height:18,color:'var(--ink-500)'}}/>}/>
<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
{cats.map(c=><Tag key={c} selected={filter===c} onClick={()=>setFilter(c)}>{c}</Tag>)}
</div>
<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
{shown.map(v=>(
<Card key={v.name} hover style={{padding:0,overflow:'hidden',cursor:'pointer'}}>
<div onClick={()=>onSelectVendor(v)}>
<image-slot id={'vendor-'+v.img} placeholder={v.name} style={{width:'100%',height:120,display:'block'}}></image-slot>
<div style={{padding:14}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
<div style={{fontFamily:'var(--font-body)',fontWeight:700,fontSize:16}}>{v.name}</div>
<img src="https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/heart.svg" alt="" style={{width:18,height:18,color:'var(--ink-500)',flexShrink:0}}/>
</div>
<div style={{fontFamily:'var(--font-body)',color:'var(--ink-500)',fontSize:13,marginTop:2}}>{v.cat} · {v.price}</div>
<Badge tone={v.tag==="Chef's pick"?'primary':'outline'}>{v.tag}</Badge>
</div>
</div>
</Card>
))}
</div>
</div>);
}

window.Browse=Browse;