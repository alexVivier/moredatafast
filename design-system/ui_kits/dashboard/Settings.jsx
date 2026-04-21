// Settings.jsx — sites management page
const Settings = ({ onBack }) => (
  <div className="mdf-page">
    <div className="mdf-page__header">
      <div>
        <h1>Sites</h1>
        <p className="mdf-page__lead">Manage the DataFast-tracked websites connected to this dashboard.</p>
      </div>
      <div className="mdf-page__actions">
        <button className="mdf-btn">Organization</button>
        <button className="mdf-btn mdf-btn--primary">+ Add site</button>
      </div>
    </div>

    <div className="mdf-site">
      <div className="mdf-site__logo"><img src="../../assets/logo-mark.svg" style={{width:20,height:20}}/></div>
      <div className="mdf-site__meta">
        <span className="mdf-site__name">Bet Ninja <span style={{color:"var(--mdf-fg-3)",fontWeight:400}}>betninja.win</span></span>
        <span className="mdf-site__sub">Europe/Paris · EUR · added 4/20/2026</span>
      </div>
      <button className="mdf-btn" onClick={onBack}>Open</button>
      <button className="mdf-btn mdf-btn--danger">Remove</button>
    </div>

    <div className="mdf-note">
      API keys are encrypted at rest using AES-256-GCM. Back up <code>data/master.key</code> if you're using the auto-generated key.
    </div>
  </div>
);

window.Settings = Settings;
