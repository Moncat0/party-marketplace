function VendorProfile({vendor,onBook,onBack}){
const {Tabs,Badge,Button,IconButton}=window.FestlyDesignSystem_65deb2;
const [tab,setTab]=React.useState('Overview');
return (
<div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'flex-start'}}>
<div onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:600,color:'var(--ink-500)',fontSize:14}}>
<img src="https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/arrow-left.svg" alt="" style={{width:16,height:16}}/> Back to browse
</div>
<image-slot id="vendor-hero" placeholder={vendor.name+' hero photo'} style={{width:'100%',height:220,borderRadius:'var(--radius-lg)',display:'block',border:'var(--border-width) solid var(--ink-900)'}}></image-slot>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
<div>
<div style={{fontFamily:'var(--font-display)',fontSize:34,textTransform:'uppercase',color:'var(--ink-900)'}}>{vendor.name}</div>
<div style={{fontFamily:'var(--font-body)',color:'var(--ink-500)',fontSize:14,marginTop:4}}>{vendor.cat} · {vendor.price}</div>
</div>
<IconButton icon={<img src="https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/heart.svg" alt="" style={{width:18,height:18}}/>} label="Save" variant="outline"/>
</div>
<Badge tone="primary">{vendor.tag}</Badge>
<Tabs tabs={['Overview','Packages','Reviews']} active={tab} onChange={setTab}/>
{tab==='Overview'&&<p style={{fontFamily:'var(--font-body)',fontSize:15,color:'var(--ink-700)',lineHeight:'var(--lh-relaxed)'}}>Festly connects you with the best vendors and venues. So you can focus on what matters. {vendor.name} has hosted over 120 events booked through Festly.</p>}
{tab==='Packages'&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
{['Essentials','Signature','Full Service'].map((p,i)=>(
<div key={p} style={{display:'flex',justifyContent:'space-between',padding:'14px 16px',border:'var(--border-width) solid var(--ink-900)',borderRadius:'var(--radius-md)',fontFamily:'var(--font-body)'}}>
<span style={{fontWeight:700}}>{p}</span><span style={{color:'var(--ink-500)'}}>{['$800','$1,400','$2,200'][i]}</span>
</div>))}
</div>}
{tab==='Reviews'&&<div style={{fontFamily:'var(--font-hand)',fontSize:26,color:'var(--ink-900)',lineHeight:1.4}}>"Trust us. Always a vibe."<div style={{fontFamily:'var(--font-body)',fontSize:13,color:'var(--ink-500)',marginTop:6}}>— Priya, booked June 2026</div></div>}
<div style={{marginTop:8}}><Button variant="primary" size="lg" icon={<img src="https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/arrow-right.svg" alt="" style={{width:18,height:18}}/>} onClick={onBook}>Book now</Button></div>
</div>);
}

window.VendorProfile=VendorProfile;