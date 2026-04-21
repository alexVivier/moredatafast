// Charts.jsx — lightweight SVG-based charts used inside widgets

const AreaChart = ({ data = [90,75,40,55,20,45,30,60,35,55,50], labels = ["15 Apr","17 Apr","19 Apr","21 Apr"], height = 160 }) => {
  const W = 520, H = height - 20, pad = 4;
  const max = Math.max(...data), min = Math.min(...data);
  const step = W / (data.length - 1);
  const y = v => pad + (H - pad*2) * ( (max - v) / (max - min || 1) );
  const pts = data.map((v,i) => `${i*step},${y(v)}`).join(" L");
  const area = `M0,${H} L${pts} L${W},${H} Z`;
  const line = `M${pts}`;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{width:"100%", height:"100%"}}>
      <defs>
        <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C82F7" stopOpacity=".55"/>
          <stop offset="100%" stopColor="#4C82F7" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={pad + (H-pad*2)*f} y2={pad + (H-pad*2)*f} stroke="rgba(255,255,255,.04)" strokeWidth="1"/>)}
      <path d={area} fill="url(#areaG)"/>
      <path d={line} fill="none" stroke="#4C82F7" strokeWidth="1.5"/>
      {labels.map((l,i) => <text key={l} x={(W/(labels.length-1))*i} y={height-2} fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#5C6270">{l}</text>)}
    </svg>
  );
};

const DonutChart = ({ segments = [{label:"desktop",value:60,color:"#4C82F7"},{label:"mobile",value:30,color:"#33C08A"},{label:"tablet",value:10,color:"#F59B3C"}], total = 165, totalLabel = "VISITORS" }) => {
  const sum = segments.reduce((s,x)=>s+x.value,0);
  const r = 42, c = 2*Math.PI*r;
  let acc = 0;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:14}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{fontSize:10,letterSpacing:".08em",textTransform:"uppercase",color:"#5C6270",fontWeight:500}}>{totalLabel}</div>
        <div style={{fontSize:11,color:"#9097A3"}}>{total} visitors</div>
      </div>
      <svg width="108" height="108" viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="10"/>
        {segments.map((s,i) => {
          const len = (s.value/sum) * c;
          const dash = `${len} ${c-len}`;
          const offset = -acc;
          acc += len;
          return <circle key={i} cx="54" cy="54" r={r} fill="none" stroke={s.color} strokeWidth="10" strokeDasharray={dash} strokeDashoffset={offset} transform="rotate(-90 54 54)" strokeLinecap="butt"/>;
        })}
      </svg>
      <div style={{display:"flex",gap:14,fontSize:11,color:"#9097A3"}}>
        {segments.map(s => <span key={s.label} style={{display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:999,background:s.color,display:"inline-block"}}/>{s.label}</span>)}
      </div>
    </div>
  );
};

window.AreaChart = AreaChart;
window.DonutChart = DonutChart;
