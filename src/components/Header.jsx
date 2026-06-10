export default function Header({ updatedAt, onSubmit }) {
  return (
    <header className="site-header">
      <a className="home-link" href="https://paunplugged.org" aria-label="PA Unplugged home">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
        </svg>
      </a>
      <div className="header-inner">
        <div className="header-main">
          <h1 className="header-title">
            <span className="header-title-line1">PA Bell-to-Bell Tracker</span>
            <span className="header-title-line2">Pennsylvania schools going phone-free</span>
          </h1>
          <p className="header-subtitle">
            A living map of PA schools and districts with bell-to-bell phone policies — how each
            one does it, and the policy language to copy.
            {updatedAt && <> Updated {formatDate(updatedAt)}.</>}
          </p>
        </div>
        <div className="header-right">
          <button className="header-cta" onClick={onSubmit}>+ Submit a school</button>
        </div>
      </div>
    </header>
  );
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
