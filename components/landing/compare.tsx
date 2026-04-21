type Status = "yes" | "no" | "partial" | "reuses";

const ROWS: { label: string; df: Status; mdf: Status }[] = [
  { label: "Live payments feed (Stripe)", df: "no", mdf: "yes" },
  { label: "Drag-and-drop widget grid", df: "no", mdf: "yes" },
  { label: "Per-widget date ranges", df: "no", mdf: "yes" },
  { label: "Multi-site unified view", df: "partial", mdf: "yes" },
  { label: "Per-widget close / pin", df: "no", mdf: "yes" },
  { label: "Shareable read-only views", df: "no", mdf: "yes" },
  { label: "Organizations / team access", df: "partial", mdf: "yes" },
  { label: "Self-hostable", df: "no", mdf: "yes" },
  { label: "Event ingestion & tag", df: "yes", mdf: "reuses" },
  { label: "Session replay", df: "no", mdf: "no" },
];

function Glyph({ status }: { status: Status }) {
  switch (status) {
    case "yes":
      return (
        <>
          <span className="yes">●</span>
          <span>Yes</span>
        </>
      );
    case "no":
      return (
        <>
          <span className="no">—</span>
          <span style={{ color: "var(--mdf-fg-3)" }}>No</span>
        </>
      );
    case "partial":
      return (
        <>
          <span className="partial">◐</span>
          <span>Partial</span>
        </>
      );
    case "reuses":
      return (
        <>
          <span className="yes">↻</span>
          <span>Reuses DataFast</span>
        </>
      );
  }
}

export function Compare() {
  return (
    <section className="lp-section" id="compare">
      <div className="lp-container">
        <span className="lp-section__label">vs DataFast alone</span>
        <h2 className="lp-section__title">
          What you get on top of the analytics you already have.
        </h2>
        <p className="lp-section__lead">
          MDF sits beside DataFast, not instead of it. Events still ingest into DataFast; we add
          the dashboarding layer.
        </p>
        <div className="lp-compare">
          <div className="lp-compare__row lp-compare__row--head">
            <div className="lp-compare__cell">CAPABILITY</div>
            <div className="lp-compare__cell">DATAFAST ALONE</div>
            <div className="lp-compare__cell lp-compare__cell--mdf">MORE DATA FAST</div>
          </div>
          {ROWS.map((r, i) => (
            <div key={i} className="lp-compare__row">
              <div className="lp-compare__cell">{r.label}</div>
              <div className="lp-compare__cell">
                <Glyph status={r.df} />
              </div>
              <div className="lp-compare__cell lp-compare__cell--mdf">
                <Glyph status={r.mdf} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
