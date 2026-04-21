// Topbar.jsx — app chrome: brand, workspace picker, site picker, date picker, settings, account
const Topbar = ({ workspace = "Alexis VIVIER's wor…", site = "Bet Ninja — betninja.win", dateRange = "Last 7 days", dateText = "2026-04-15 → 2026-04-21", user = "Alexis VIVIER", onOpenSettings }) => {
  return (
    <>
      <div className="mdf-trial">
        <span>Free trial: 14 days left</span>
        <a href="#">Upgrade now →</a>
      </div>
      <div className="mdf-topbar">
        <div className="mdf-topbar__brand">
          <img src="../../assets/logo-mark.svg" alt="" />
          <div className="mdf-topbar__meta">
            <span className="name">Bet Ninja</span>
            <span className="sub">betninja.win · editing layout</span>
          </div>
        </div>
        <div style={{flex:1}} />
        <button className="mdf-picker"><span className="mdf-avatar">A</span>{workspace}<span className="chev">▾</span></button>
        <button className="mdf-picker"><span className="dot" />{site}<span className="chev">▾</span></button>
        <button className="mdf-picker" title={dateText}>{dateRange}<span className="chev">▾</span></button>
        <button className="mdf-btn mdf-btn--ghost" onClick={onOpenSettings}>⚙ Settings</button>
        <button className="mdf-picker"><span className="mdf-avatar">A</span>{user}<span className="chev">▾</span></button>
      </div>
    </>
  );
};

window.Topbar = Topbar;
