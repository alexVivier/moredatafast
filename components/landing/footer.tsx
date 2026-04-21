export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer__inner">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.svg" alt="MDF" style={{ height: 16 }} />
          <span>© 2026 More Data Fast</span>
        </div>
        <div className="lp-footer__links">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/status">Status</a>
          <a href="/changelog">Changelog</a>
          <a href="mailto:hi@moredatafast.com">Contact</a>
        </div>
      </div>
    </footer>
  );
}
