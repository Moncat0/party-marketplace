function HostDashboard(){
const {Card,Badge,Button,Switch,Tabs}=window.FestlyDesignSystem_65deb2;
const [instant,setInstant]=React.useState(true);
const requests=[
{name:'Diego R.',event:"Diego's 30th",date:'Aug 20',status:'Pending'},
{name:'Amara O.',event:'Team offsite',date:'Sep 2',status:'Confirmed'},
{name:'Lena K.',event:'Baby shower',date:'Sep 14',status:'Pending'}
];
return (
<div style={{display:'flex',flexDirection:'column',gap:20}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
<div style={{fontFamily:'var(--font-display)',fontSize:34,textTransform:'uppercase'}}>Your requests</div>
<Switch checked={instant} onChange={setInstant} label="Instant book"/>
</div>
<div style={{display:'flex',flexDirection:'column',gap:10}}>
{requests.map(r=>(
<Card key={r.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
<div>
<div style={{fontFamily:'var(--font-body)',fontWeight:700,fontSize:15}}>{r.event}</div>
<div style={{fontFamily:'var(--font-body)',color:'var(--ink-500)',fontSize:13,marginTop:2}}>{r.name} · {r.date}</div>
</div>
<Badge tone={r.status==='Confirmed'?'success':'outline'}>{r.status}</Badge>
</Card>
))}
</div>
</div>);
}

window.HostDashboard=HostDashboard;