export default function Footer({ onSubmit }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>
          A project of <a href="https://paunplugged.org">PA Unplugged</a>. Data is community-sourced
          and verified against official policies and reporting. Know a school we’re missing?{' '}
          <button className="link-btn" onClick={onSubmit}>Submit it</button>.
        </p>
        <p className="footer-fine">
          Bell-to-bell means phones are away from the first bell to the last — the policy approach
          research most consistently links to better focus, mental health, and engagement.
        </p>
      </div>
    </footer>
  );
}
