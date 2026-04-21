// widgets.jsx — live, animated widget components for the landing

const WidgetShell = ({ title, children, hideClose = false, style = {} }) => (
  <div className="lp-widget" style={style}>
    <div className="lp-widget__head">
      <span className="lp-widget__grip">⋮⋮</span>
      <span className="lp-widget__title">{title}</span>
      {!hideClose && <span className="lp-widget__close">×</span>}
    </div>
    <div className="lp-widget__body">{children}</div>
  </div>
);

// --- Animated number that eases up to a target ---
const useCountUp = (target, { duration = 1200, active = true } = {}) => {
  const [v, setV] = React.useState(active ? 0 : target);
  React.useEffect(() => {
    if (!active) { setV(target); return; }
    const start = performance.now();
    const from = 0, to = target;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return v;
};

// IntersectionObserver hook — lets a widget start its animation only when visible
const useInView = (ref, { threshold = 0.3, once = true } = {}) => {
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        if (once) io.disconnect();
      } else if (!once) {
        setInView(false);
      }
    }, { threshold });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return inView;
};

// --- KPI cell (small) ---
const KpiCell = ({ label, target, format, delta, trend, active }) => {
  const v = useCountUp(target, { duration: 1400, active });
  const formatted = format ? format(v) : Math.round(v).toString();
  return (
    <div style={{padding: "14px 16px", borderRight: "1px solid var(--mdf-line-1)", flex: 1, minWidth: 0}}>
      <div className="lp-kpi-label">{label}</div>
      <div className="lp-kpi-value tabnum">{formatted}</div>
      <div className="lp-kpi-delta"><span className={trend}>{delta}</span> vs previous 7d</div>
    </div>
  );
};

// --- Overview KPI strip widget (6-up) ---
const KpiStrip = ({ compact = false }) => {
  const ref = React.useRef(null);
  const active = useInView(ref);
  return (
    <div ref={ref}>
      <WidgetShell title="Overview KPIs" hideClose>
        <div style={{display: "flex", margin: "-12px -14px"}}>
          <KpiCell label="VISITORS" target={165} delta="↑ new" trend="up" active={active} />
          <KpiCell label="SESSIONS" target={198} delta="↑ 12%" trend="up" active={active} />
          <KpiCell label="REVENUE" target={9.99} format={v => "€ " + v.toFixed(2)} delta="-0%" trend="flat" active={active} />
          {!compact && <KpiCell label="CONV. RATE" target={0.6} format={v => v.toFixed(1) + "%"} delta="-0%" trend="flat" active={active} />}
          {!compact && <KpiCell label="BOUNCE" target={51.5} format={v => v.toFixed(1) + "%"} delta="↑ new" trend="up" active={active} />}
          <div style={{padding: "14px 16px", flex: 1, minWidth: 0}}>
            <div className="lp-kpi-label">AVG DURATION</div>
            <div className="lp-kpi-value tabnum">18m 1s</div>
            <div className="lp-kpi-delta"><span className="up">↑ new</span> vs previous 7d</div>
          </div>
        </div>
      </WidgetShell>
    </div>
  );
};

// --- Area chart with draw-in animation ---
const AreaChartAnimated = ({ data = [30,42,35,55,48,62,50,44,58,52,42,66,58,72,68,80], height = 140 }) => {
  const ref = React.useRef(null);
  const active = useInView(ref);
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1200);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const W = 520, H = height - 20, pad = 4;
  const max = Math.max(...data), min = Math.min(...data);
  const step = W / (data.length - 1);
  const y = v => pad + (H - pad*2) * ((max - v) / (max - min || 1));
  const pts = data.map((v,i) => `${(i*step).toFixed(2)},${y(v).toFixed(2)}`).join(" L");
  const visibleW = W * progress;

  return (
    <div ref={ref} style={{width:"100%", flex:1, minHeight: 100, position: "relative"}}>
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{width:"100%", height:"100%", display: "block"}}>
        <defs>
          <linearGradient id="areaG2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--lp-accent, #4C82F7)" stopOpacity=".5"/>
            <stop offset="100%" stopColor="var(--lp-accent, #4C82F7)" stopOpacity="0"/>
          </linearGradient>
          <clipPath id="chartClip">
            <rect x="0" y="0" width={visibleW} height={height} />
          </clipPath>
        </defs>
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1="0" x2={W} y1={pad + (H-pad*2)*f} y2={pad + (H-pad*2)*f} stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
        ))}
        <g clipPath="url(#chartClip)">
          <path d={`M0,${H} L${pts} L${W},${H} Z`} fill="url(#areaG2)"/>
          <path d={`M${pts}`} fill="none" stroke="var(--lp-accent, #4C82F7)" strokeWidth="1.5"/>
        </g>
        {/* crosshair at current point */}
        <line x1={visibleW} x2={visibleW} y1="0" y2={H} stroke="rgba(255,255,255,.08)" strokeWidth="1" strokeDasharray="2 3"/>
        {["15 Apr","17 Apr","19 Apr","21 Apr","23 Apr"].map((l,i,a) => (
          <text key={l} x={(W/(a.length-1))*i} y={height-2} fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#5C6270">{l}</text>
        ))}
      </svg>
    </div>
  );
};

// --- Visitors-over-time widget (headline number + chart) ---
const VisitorsWidget = () => {
  const ref = React.useRef(null);
  const active = useInView(ref);
  const v = useCountUp(165, { duration: 1600, active });
  return (
    <div ref={ref} style={{height: "100%"}}>
      <WidgetShell title="Visitors over time">
        <div style={{display:"flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4}}>
          <span className="lp-kpi-label">VISITORS OVER TIME</span>
          <span className="lp-kpi-label" style={{color: "var(--mdf-fg-2)"}}>DAY</span>
        </div>
        <div className="lp-kpi-value tabnum" style={{fontSize: 32, margin: "4px 0 8px"}}>{Math.round(v)}</div>
        <AreaChartAnimated />
      </WidgetShell>
    </div>
  );
};

// --- Devices donut ---
const DevicesDonut = () => {
  const ref = React.useRef(null);
  const active = useInView(ref);
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1000);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const segments = [
    {label:"desktop", value:60, color:"var(--lp-accent, #4C82F7)"},
    {label:"mobile", value:30, color:"#33C08A"},
    {label:"tablet", value:10, color:"var(--mdf-brand)"},
  ];
  const sum = 100, r = 38, c = 2*Math.PI*r;
  let acc = 0;

  return (
    <div ref={ref}>
      <WidgetShell title="Devices">
        <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap: 10, paddingTop: 6}}>
          <div style={{textAlign:"center"}}>
            <div className="lp-kpi-label">VISITORS</div>
            <div style={{fontSize:11,color:"var(--mdf-fg-2)", marginTop: 2}}>165 visitors</div>
          </div>
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="9"/>
            {segments.map((s,i) => {
              const len = (s.value/sum) * c * progress;
              const dash = `${len} ${c-len}`;
              const offset = -acc;
              acc += len;
              return <circle key={i} cx="48" cy="48" r={r} fill="none" stroke={s.color} strokeWidth="9" strokeDasharray={dash} strokeDashoffset={offset} transform="rotate(-90 48 48)"/>;
            })}
          </svg>
          <div style={{display:"flex", gap: 12, fontSize: 10, color: "var(--mdf-fg-2)", flexWrap:"wrap", justifyContent:"center"}}>
            {segments.map(s => (
              <span key={s.label} style={{display:"inline-flex", alignItems:"center", gap: 5}}>
                <span style={{width: 7, height: 7, borderRadius: 999, background: s.color, display: "inline-block"}}/>
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </WidgetShell>
    </div>
  );
};

// --- Cities top-10 ---
const CitiesWidget = () => {
  const rows = [
    ["🇫🇷","Marseille", 12],
    ["🇫🇷","Paris", 9],
    ["🇬🇵","Pointe-à-Pitre", 7],
    ["🇨🇦","Montréal", 6],
    ["🇫🇷","Lyon", 4],
    ["🇧🇪","Bruxelles", 3],
  ];
  const max = Math.max(...rows.map(r => r[2]));
  return (
    <WidgetShell title="Cities">
      <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
        <span className="lp-kpi-label">CITIES</span>
        <span className="lp-kpi-label" style={{color: "var(--mdf-fg-2)"}}>top 10</span>
      </div>
      <div style={{display: "flex", flexDirection: "column"}}>
        {rows.map((r, i) => (
          <div key={i} style={{display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 12, borderTop: i === 0 ? 0 : "1px solid var(--mdf-line-1)", position: "relative"}}>
            <span style={{fontSize: 14}}>{r[0]}</span>
            <span style={{flex: 1, color: "var(--mdf-fg-1)", position: "relative", zIndex: 1}}>{r[1]}</span>
            <span style={{fontFamily: "var(--mdf-font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--mdf-fg-1)", fontSize: 11, position: "relative", zIndex: 1}}>{r[2]}</span>
            <div style={{position:"absolute", left: 24, top: 6, bottom: 6, width: `${(r[2]/max)*40}%`, background: "rgba(76,130,247,.08)", borderRadius: 2}}/>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
};

// --- Live events feed with ticking ---
const makeEvent = (i) => {
  const pool = [
    ["🇫🇷","info","PAGEVIEW","/predictions"],
    ["🇫🇷","success","SIGNUP","/auth/signup"],
    ["🇬🇵","info","PAGEVIEW","/pricing"],
    ["🇨🇦","success","CHECKOUT","/checkout"],
    ["🇫🇷","brand","CUSTOM","upgrade_clicked"],
    ["🇧🇪","info","PAGEVIEW","/predictions"],
    ["🇫🇷","info","PAGEVIEW","/features"],
    ["🇪🇸","warn","BOUNCE","/pricing"],
  ];
  const p = pool[i % pool.length];
  return { id: Date.now() + i, flag: p[0], badge: p[1], event: p[2], path: p[3], ago: "just now" };
};

const LiveEventsWidget = () => {
  const [events, setEvents] = React.useState(() => {
    return [makeEvent(0), makeEvent(1), makeEvent(2), makeEvent(3), makeEvent(4)]
      .map((e, i) => ({...e, ago: i === 0 ? "just now" : `${i}m ago`}));
  });
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: false });
  const counter = React.useRef(5);

  React.useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      counter.current += 1;
      const newEv = makeEvent(counter.current);
      setEvents(prev => [newEv, ...prev.slice(0, 4)].map((e, i) => ({
        ...e,
        ago: i === 0 ? "just now" : `${i * 2 + 1}m ago`,
      })));
    }, 3200);
    return () => clearInterval(interval);
  }, [inView]);

  const badgeClass = { info: "mdf-badge--info", success: "mdf-badge--success", warn: "mdf-badge--warn", brand: "mdf-badge--brand" };

  return (
    <div ref={ref}>
      <WidgetShell title="Live events feed">
        <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
          <span className="lp-kpi-label" style={{display: "inline-flex", alignItems: "center", gap: 6}}>
            <span style={{width: 5, height: 5, borderRadius: 999, background: "var(--mdf-success)", boxShadow: "0 0 0 3px rgba(51,192,138,0.2)", animation: "lpPulse 2s ease-in-out infinite"}}/>
            LIVE EVENTS
          </span>
          <span className="lp-kpi-label" style={{color: "var(--mdf-fg-2)"}}>last 10 min</span>
        </div>
        <div style={{display: "flex", flexDirection: "column", overflow: "hidden"}}>
          {events.map((e, i) => (
            <div key={e.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
              fontSize: 12, borderTop: i === 0 ? 0 : "1px solid var(--mdf-line-1)",
              animation: i === 0 ? "lpSlideIn 400ms var(--mdf-ease-out)" : "none",
              opacity: 1 - i*0.1,
            }}>
              <span style={{fontSize: 13}}>{e.flag}</span>
              <span className={`mdf-badge ${badgeClass[e.badge] || "mdf-badge--info"}`} style={{fontSize: 9}}>{e.event}</span>
              <span style={{flex: 1, fontFamily: "var(--mdf-font-mono)", fontSize: 11, color: "var(--mdf-fg-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{e.path}</span>
              <span style={{fontSize: 10, color: "var(--mdf-fg-3)"}}>{e.ago}</span>
            </div>
          ))}
        </div>
      </WidgetShell>
    </div>
  );
};

// --- Live payments feed ---
const makePayment = (i) => {
  const pool = [
    ["🇫🇷","€ 29.00","Pro monthly"],
    ["🇨🇦","$ 39.00","Pro monthly"],
    ["🇫🇷","€ 290.00","Pro yearly"],
    ["🇧🇪","€ 29.00","Pro monthly"],
    ["🇪🇸","€ 29.00","Pro monthly"],
  ];
  const p = pool[i % pool.length];
  return { id: Date.now() + i, flag: p[0], amount: p[1], plan: p[2] };
};

const LivePaymentsWidget = () => {
  const [rows, setRows] = React.useState(() => [makePayment(0), makePayment(1), makePayment(2), makePayment(3)]);
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: false });
  const counter = React.useRef(4);

  React.useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      counter.current += 1;
      setRows(prev => [makePayment(counter.current), ...prev.slice(0, 3)]);
    }, 4800);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <div ref={ref}>
      <WidgetShell title="Live payments feed">
        <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
          <span className="lp-kpi-label" style={{display: "inline-flex", alignItems: "center", gap: 6}}>
            <span style={{width: 5, height: 5, borderRadius: 999, background: "var(--mdf-brand)", boxShadow: "0 0 0 3px rgba(245,155,60,0.2)", animation: "lpPulse 2s ease-in-out infinite"}}/>
            LIVE PAYMENTS
          </span>
          <span className="lp-kpi-label" style={{color: "var(--mdf-fg-2)"}}>last 10 min</span>
        </div>
        <div style={{display:"flex", flexDirection:"column"}}>
          {rows.map((r,i) => (
            <div key={r.id} style={{
              display:"flex", alignItems:"center", gap:10, padding:"7px 0",
              fontSize: 12, borderTop: i === 0 ? 0 : "1px solid var(--mdf-line-1)",
              animation: i === 0 ? "lpSlideIn 400ms var(--mdf-ease-out)" : "none",
            }}>
              <span style={{fontSize: 13}}>{r.flag}</span>
              <span className="mdf-badge mdf-badge--success" style={{fontSize: 9}}>PAID</span>
              <span style={{flex:1, fontSize: 11, color:"var(--mdf-fg-2)"}}>{r.plan}</span>
              <span style={{fontFamily:"var(--mdf-font-mono)", fontVariantNumeric:"tabular-nums", color:"var(--mdf-fg-1)", fontSize: 12}}>{r.amount}</span>
            </div>
          ))}
        </div>
      </WidgetShell>
    </div>
  );
};

// --- Top campaigns ---
const TopCampaignsWidget = () => {
  const rows = [
    {id: "t20243697790430546", kind: "fb", rev: "€ 290", v: 19},
    {id: "t20243697790430547", kind: "fb", rev: "€ 145", v: 18},
    {id: "t20243697790430548", kind: "ig", rev: "€ 58", v: 12},
    {id: "t20243697790430549", kind: "ig", rev: "—", v: 7},
  ];
  return (
    <WidgetShell title="Top campaigns">
      <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
        <span className="lp-kpi-label">TOP CAMPAIGNS</span>
        <span className="lp-kpi-label" style={{color: "var(--mdf-fg-2)"}}>top 10</span>
      </div>
      <div style={{display:"flex", flexDirection:"column"}}>
        <div style={{display: "grid", gridTemplateColumns: "1fr 60px 40px", gap: 10, fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--mdf-fg-3)", padding: "4px 0"}}>
          <span>CAMPAIGN</span>
          <span style={{textAlign: "right"}}>REVENUE</span>
          <span style={{textAlign: "right"}}>VISITS</span>
        </div>
        {rows.map((r,i)=>(
          <div key={i} style={{display:"grid", gridTemplateColumns: "1fr 60px 40px", gap: 10, alignItems:"center", padding:"6px 0", borderTop: "1px solid var(--mdf-line-1)", fontSize: 11}}>
            <span style={{display:"flex", alignItems:"center", gap: 6, minWidth: 0}}>
              <span style={{background: "rgba(76,130,247,.14)", color: "#8BB0F9", padding: "1px 5px", borderRadius: 2, fontFamily: "var(--mdf-font-mono)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120}}>{r.id}</span>
              <span style={{color: "var(--mdf-fg-3)", fontSize: 10}}>({r.kind})</span>
            </span>
            <span style={{fontFamily: "var(--mdf-font-mono)", textAlign: "right", color: r.rev === "—" ? "var(--mdf-fg-4)" : "var(--mdf-fg-1)"}}>{r.rev}</span>
            <span style={{fontFamily: "var(--mdf-font-mono)", textAlign: "right", fontVariantNumeric: "tabular-nums"}}>{r.v}</span>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
};

Object.assign(window, {
  WidgetShell, KpiStrip, KpiCell, VisitorsWidget, AreaChartAnimated,
  DevicesDonut, CitiesWidget, LiveEventsWidget, LivePaymentsWidget, TopCampaignsWidget,
  useInView, useCountUp,
});
