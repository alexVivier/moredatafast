// WidgetGallery.jsx — standalone showcase of every widget type
const W = window.Widget;

function BigNumber({label, value, delta, trend}) {
  return (
    <div>
      <div className="mdf-kpi__label">{label}</div>
      <div className="mdf-kpi__value" style={{fontSize:56}}>{value}</div>
      <div className="mdf-kpi__delta"><span className={trend}>{delta}</span> vs previous 7d</div>
    </div>
  );
}

function BarChart({data=[18,24,31,22,28,38,45,32,48,52,41,56], labels=["M","T","W","T","F","S","S","M","T","W","T","F"]}) {
  const max = Math.max(...data);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:140,padding:"6px 0"}}>
      {data.map((v,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:"100%",background:"#4C82F7",height:`${(v/max)*100}%`,borderRadius:"2px 2px 0 0",opacity:i===data.length-1?1:.75}}/>
          <span style={{fontSize:9,fontFamily:"JetBrains Mono, monospace",color:"#5C6270"}}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function Scatter() {
  const pts = [[20,70],[35,45],[50,60],[65,30],[80,50],[120,40],[160,25],[200,55],[240,20],[300,35],[360,50],[420,15]];
  return (
    <svg viewBox="0 0 480 160" style={{width:"100%",height:"100%"}}>
      <line x1="0" y1="155" x2="480" y2="155" stroke="rgba(255,255,255,.06)"/>
      {pts.map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r={5} fill={i%3===0?"#33C08A":i%3===1?"#4C82F7":"#F59B3C"} fillOpacity=".8"/>))}
    </svg>
  );
}

function Heatmap() {
  const cells = Array(7*12).fill(0).map(()=>Math.random());
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:2,padding:"6px 0"}}>
      {cells.map((v,i)=>{
        const stops=["#0F1218","#1A2B4D","#2E5AA8","#4C82F7","#9DB8F2"];
        const bg = stops[Math.floor(v*stops.length)];
        return <div key={i} style={{aspectRatio:"1/1",background:bg,borderRadius:2}}/>;
      })}
    </div>
  );
}

function Sankey() {
  return (
    <svg viewBox="0 0 480 160" style={{width:"100%",height:"100%"}}>
      <path d="M0,30 C120,30 120,20 240,20 L240,50 C120,50 120,60 0,60 Z" fill="#4C82F7" fillOpacity=".45"/>
      <path d="M0,80 C120,80 120,70 240,70 L240,100 C120,100 120,110 0,110 Z" fill="#33C08A" fillOpacity=".45"/>
      <path d="M0,130 C120,130 120,125 240,125 L240,145 C120,145 120,150 0,150 Z" fill="#F59B3C" fillOpacity=".45"/>
      <path d="M240,20 C360,20 360,35 480,35 L480,60 C360,60 360,55 240,55 Z" fill="#4C82F7" fillOpacity=".35"/>
      <path d="M240,70 C360,70 360,80 480,80 L480,105 C360,105 360,100 240,100 Z" fill="#33C08A" fillOpacity=".35"/>
      <path d="M240,125 C360,125 360,125 480,125 L480,150 C360,150 360,150 240,150 Z" fill="#F59B3C" fillOpacity=".35"/>
      <rect x="0" y="20" width="4" height="130" fill="#E7E9EE" fillOpacity=".3"/>
      <rect x="240" y="20" width="4" height="130" fill="#E7E9EE" fillOpacity=".3"/>
      <rect x="476" y="35" width="4" height="115" fill="#E7E9EE" fillOpacity=".3"/>
    </svg>
  );
}

function Candle() {
  const data = [[20,30,15,25],[25,35,22,30],[30,42,28,38],[38,45,32,36],[36,48,34,44],[44,52,40,50],[50,58,46,48],[48,55,42,52]];
  const max=60, min=10, W=440, barW=40;
  const y = v => 150 - ((v-min)/(max-min))*130;
  return (
    <svg viewBox={`0 0 ${W} 160`} style={{width:"100%",height:"100%"}}>
      {data.map(([o,h,l,c],i)=>{
        const x = 20 + i*(barW+10);
        const up = c >= o;
        const col = up ? "#33C08A" : "#E5484D";
        return (<g key={i}>
          <line x1={x+barW/2} x2={x+barW/2} y1={y(h)} y2={y(l)} stroke={col} strokeWidth="1"/>
          <rect x={x} y={y(Math.max(o,c))} width={barW} height={Math.abs(y(o)-y(c))||1} fill={col} fillOpacity={up?.7:.85}/>
        </g>);
      })}
    </svg>
  );
}

function MiniMap() {
  // stylised choropleth-ish
  return (
    <svg viewBox="0 0 480 160" style={{width:"100%",height:"100%"}}>
      <rect x="0" y="0" width="480" height="160" fill="#0B1220"/>
      {Array(60).fill(0).map((_,i)=>{
        const x = 20 + (i%12)*38, y = 20 + Math.floor(i/12)*26;
        const v = Math.random();
        const stops=["#14213B","#1A2B4D","#2E5AA8","#4C82F7"];
        return <rect key={i} x={x} y={y} width={34} height={22} rx={3} fill={stops[Math.floor(v*stops.length)]} fillOpacity={.6 + v*.4}/>;
      })}
      <circle cx="180" cy="60" r="5" fill="#F59B3C"/>
      <circle cx="260" cy="90" r="4" fill="#F59B3C"/>
      <circle cx="340" cy="50" r="6" fill="#F59B3C"/>
    </svg>
  );
}

function WidgetGallery() {
  return (
    <div className="mdf-grid" style={{gridTemplateColumns:"repeat(6,1fr)"}}>
      <W title="Big number" span={2}><BigNumber label="VISITORS" value="1,247" delta="↑ 12%" trend="up"/></W>
      <W title="Bar chart" span={2}><div className="mdf-kpi__label">SESSIONS PER DAY</div><div style={{flex:1,minHeight:140}}><BarChart/></div></W>
      <W title="Area chart" span={2}><div className="mdf-kpi__label">VISITORS OVER TIME</div><div style={{flex:1,minHeight:140}}><AreaChart data={[40,35,55,48,62,50,44,58,52,42,48,60]}/></div></W>

      <W title="Donut" span={2}><DonutChart/></W>
      <W title="Scatter / bubble" span={2}><div className="mdf-kpi__label">LATENCY × ERRORS</div><div style={{flex:1,minHeight:140}}><Scatter/></div></W>
      <W title="Heatmap" span={2}><div className="mdf-kpi__label">ACTIVITY · 7 × 12</div><Heatmap/></W>

      <W title="Sankey" span={3}><div className="mdf-kpi__label">FUNNEL</div><div style={{flex:1,minHeight:150}}><Sankey/></div></W>
      <W title="Candlestick" span={3}><div className="mdf-kpi__label">PRICE · 1H</div><div style={{flex:1,minHeight:150}}><Candle/></div></W>

      <W title="Cities" span={2}><CitiesList/></W>
      <W title="Live events" span={2}><LiveEvents/></W>
      <W title="Choropleth" span={2}><div className="mdf-kpi__label">VISITORS BY REGION</div><div style={{flex:1,minHeight:140}}><MiniMap/></div></W>
    </div>
  );
}
window.WidgetGallery = WidgetGallery;
