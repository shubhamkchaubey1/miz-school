import { MizMark } from '../../components/Brand.jsx';

export function PublicNav() {
  return (
    <header className="pub-nav">
      <a href="#/" aria-label="Miz School home" style={{ textDecoration: 'none' }}><MizMark size={32} /></a>
      <nav className="links grow">
        <a href="#/features">Why Miz School</a>
        <a href="#/features">Features</a>
        <a href="#/demo">Live demo</a>
        <a href="#/pricing">Pricing</a>
      </nav>
      <div className="row" style={{ marginLeft: 'auto' }}>
        <a className="btn btn-ghost" href="#/demo">Sign in</a>
        <a className="btn btn-primary" href="#/demo">Explore demo</a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="pw row between wrap" style={{ gap: 24, alignItems: 'flex-start' }}>
        <div style={{ maxWidth: 360 }}>
          <MizMark size={30} light />
          <p style={{ marginTop: 12 }}>One platform for attendance, academics, fees, transport and parent communication — branded for every school.</p>
        </div>
        <div className="row" style={{ gap: 48, alignItems: 'flex-start' }}>
          <div className="stack-sm"><strong style={{ color: '#fff' }}>Product</strong><a href="#/demo">Live demo</a><a href="#/pricing">Pricing</a></div>
          <div className="stack-sm"><strong style={{ color: '#fff' }}>Contact</strong><span>hello@mizschool.app</span><span>New Delhi, India</span></div>
        </div>
      </div>
      <div className="pw xs" style={{ marginTop: 28, color: '#8ea1bd' }}>© {new Date().getFullYear()} Miz School. Demo schools and records shown on this site are sample data.</div>
    </footer>
  );
}
