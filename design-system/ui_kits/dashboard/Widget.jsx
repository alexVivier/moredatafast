// Widget.jsx — generic widget chrome wrapping any body content
const Widget = ({ title, span = 4, rowSpan = 1, onClose, children }) => {
  const style = { gridColumn: `span ${span}`, gridRow: `span ${rowSpan}`, minHeight: rowSpan === 1 ? 200 : rowSpan * 180 };
  return (
    <div className="mdf-widget" style={style}>
      <div className="mdf-widget__head">
        <span className="mdf-widget__grip">⋮⋮</span>
        <span className="mdf-widget__title">{title}</span>
        <button className="mdf-widget__close" onClick={onClose} aria-label="Close widget">×</button>
      </div>
      <div className="mdf-widget__body">{children}</div>
    </div>
  );
};

// KpiStripWidget — full-width 6-up KPI strip like "Overview KPIs"
const Kpi = ({ label, value, delta, trend = "up" }) => (
  <div className="mdf-kpistrip__cell">
    <div className="mdf-kpi__label">{label}</div>
    <div className="mdf-kpi__value">{value}</div>
    <div className="mdf-kpi__delta"><span className={trend}>{delta}</span> vs previous 7d</div>
  </div>
);

const KpiStripWidget = ({ onClose }) => (
  <Widget title="Overview KPIs" span={12} onClose={onClose}>
    <div className="mdf-kpistrip" style={{margin:"-14px -16px"}}>
      <Kpi label="VISITORS" value="165" delta="↑ new" trend="up" />
      <Kpi label="SESSIONS" value="198" delta="↑ new" trend="up" />
      <Kpi label="REVENUE" value="€ 9.99" delta="-0%" trend="flat" />
      <Kpi label="CONVERSION RATE" value="0.6%" delta="-0%" trend="flat" />
      <Kpi label="BOUNCE RATE" value="51.5%" delta="↑ new" trend="up" />
      <Kpi label="AVG SESSION DURATI…" value="18m 1s" delta="↑ new" trend="up" />
    </div>
  </Widget>
);

window.Widget = Widget;
window.KpiStripWidget = KpiStripWidget;
window.Kpi = Kpi;
