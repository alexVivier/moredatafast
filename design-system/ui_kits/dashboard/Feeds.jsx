// Feeds.jsx — list-style widgets: cities top-N, live events feed, top campaigns, live payments
const CitiesList = () => {
  const rows = [
    ["🇫🇷","Marseille",5],["🇫🇷","Lyon",4],["🇬🇵","Pointe-à-Pitre",4],
    ["🇫🇷","Tourcoing",3],["🇫🇷","Rouen",3],["🇫🇷","Charleville-Mézières",2],
  ];
  return (
    <div className="mdf-list">
      <div className="mdf-list__hint"><span>CITIES</span><span>top 10</span></div>
      {rows.map((r,i) => (
        <div className="mdf-list__row" key={i}>
          <span style={{fontSize:14}}>{r[0]}</span>
          <span className="mdf-list__name" style={i===1?{background:"rgba(76,130,247,.22)",padding:"1px 4px",borderRadius:2}:null}>{r[1]}</span>
          <span className="mdf-list__muted">—</span>
          <span className="mdf-list__value">{r[2]}</span>
        </div>
      ))}
    </div>
  );
};

const LiveEvents = () => {
  const ev = [
    ["🇫🇷","info","PAGEVIEW","/predictions","4m ago"],
    ["🇫🇷","info","PAGEVIEW","/predictions","5m ago"],
  ];
  return (
    <div className="mdf-list">
      <div className="mdf-list__hint"><span>LIVE EVENTS</span><span>last 10 min</span></div>
      {ev.map((e,i) => (
        <div className="mdf-list__row" key={i}>
          <span style={{fontSize:14}}>{e[0]}</span>
          <span className={`mdf-badge mdf-badge--${e[1]}`}>{e[2]}</span>
          <span className="mdf-list__name" style={{fontFamily:"var(--mdf-font-mono)",fontSize:12}}>{e[3]}</span>
          <span className="mdf-list__muted" style={{fontSize:11}}>{e[4]}</span>
        </div>
      ))}
    </div>
  );
};

const TopCampaigns = () => {
  const rows = Array(5).fill(0).map((_,i)=>({id:"t20243697790430546", kind: i<3?"fb":"ig", rev:"—", v: [19,18,12,7,6][i]}));
  return (
    <div className="mdf-list">
      <div className="mdf-list__hint"><span>TOP CAMPAIGNS</span><span>top 10</span></div>
      <div className="mdf-list__row" style={{color:"#5C6270",fontSize:10,letterSpacing:".08em",textTransform:"uppercase"}}>
        <span className="mdf-list__name">CAMPAIGN</span>
        <span style={{minWidth:60,textAlign:"right"}}>REVENUE</span>
        <span style={{minWidth:48,textAlign:"right"}}>VISITORS</span>
      </div>
      {rows.map((r,i) => (
        <div className="mdf-list__row" key={i}>
          <span className="mdf-list__chip">{r.id}</span>
          <span className="mdf-list__muted" style={{fontSize:11}}>- paid ({r.kind})</span>
          <span className="mdf-list__muted" style={{marginLeft:"auto",minWidth:60,textAlign:"right"}}>—</span>
          <span className="mdf-list__value" style={{minWidth:48,textAlign:"right"}}>{r.v}</span>
        </div>
      ))}
    </div>
  );
};

const LivePaymentsEmpty = () => (
  <>
    <div className="mdf-list__hint"><span>LIVE PAYMENTS</span><span>last 10 min</span></div>
    <div className="mdf-empty">No payments yet. <span style={{opacity:.6}}>📈</span></div>
  </>
);

window.CitiesList = CitiesList;
window.LiveEvents = LiveEvents;
window.TopCampaigns = TopCampaigns;
window.LivePaymentsEmpty = LivePaymentsEmpty;
