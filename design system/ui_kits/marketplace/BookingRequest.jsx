function BookingRequest({vendor,onConfirm,onBack}){
const {Input,Select,Checkbox,Button,Dialog}=window.FestlyDesignSystem_65deb2;
const [agreed,setAgreed]=React.useState(false);
const [open,setOpen]=React.useState(false);
return (
<div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:420}}>
<div onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:600,color:'var(--ink-500)',fontSize:14}}>
<img src="https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/arrow-left.svg" alt="" style={{width:16,height:16}}/> Back to {vendor.name}
</div>
<div style={{fontFamily:'var(--font-display)',fontSize:32,textTransform:'uppercase'}}>Request to book</div>
<Input label="Event name" placeholder="e.g. Maya's birthday"/>
<Input label="Date" type="date"/>
<Select label="Guest count" options={['1-20','21-50','51-100','100+']}/>
<Checkbox checked={agreed} onChange={setAgreed} label="I agree to the cancellation policy"/>
<Button variant="primary" size="lg" disabled={!agreed} onClick={()=>setOpen(true)}>Send request</Button>
<Dialog open={open} onClose={()=>setOpen(false)} title="Request sent!" footer={<Button onClick={()=>{setOpen(false);onConfirm();}}>Done</Button>}>
<p style={{fontFamily:'var(--font-hand)',fontSize:24,margin:0}}>You're all set. {vendor.name} usually replies within a day.</p>
</Dialog>
</div>);
}

window.BookingRequest=BookingRequest;