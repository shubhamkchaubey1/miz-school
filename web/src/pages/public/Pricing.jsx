import { PublicNav, Footer } from './PublicChrome.jsx';
import Icon from '../../components/Icon.jsx';
import { PLANS } from '../../data/api.js';

/** Public "Plans" page — features only; no amounts are shown anywhere. */
export default function Pricing() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <PublicNav />
      <div className="pw" style={{ padding: '40px 20px 64px' }}>
        <div style={{ maxWidth: 680, marginBottom: 28 }}>
          <div className="upper" style={{ color: 'var(--brand)' }}>Plans</div>
          <h1 style={{ fontSize: 34, marginTop: 8 }}>Pick the modules your school needs</h1>
          <p className="muted" style={{ fontSize: 16, marginTop: 8 }}>Every plan includes the branded web portal, the parent and staff apps, and data kept in India. Start with what you use today and add modules any time.</p>
        </div>
        <div className="grid g-3" style={{ marginBottom: 32 }}>
          {PLANS.map((p) => (
            <div key={p.id} className="card" style={{ padding: 20, borderColor: p.id === 'standard' ? 'var(--brand)' : undefined }}>
              <div className="row between"><h2>{p.name}</h2>{p.id === 'standard' && <span className="badge blue">Most schools</span>}</div>
              <div className="stack-sm" style={{ marginTop: 14 }}>
                {p.features.map((f) => <div key={f} className="row small" style={{ gap: 8 }}><Icon name="tick" size={15} style={{ color: 'var(--success)' }} />{f}</div>)}
              </div>
            </div>
          ))}
        </div>
        <div className="card card-b row between wrap" style={{ gap: 16 }}>
          <div style={{ maxWidth: 560 }}>
            <h2>Talk to us for a plan that fits your school</h2>
            <p className="muted" style={{ marginTop: 6 }}>From a single campus of 50 students to a group of 50,000 — we set up the school, import your data and train your staff.</p>
          </div>
          <a className="btn btn-primary btn-lg" href="#/demo">Explore the live demo <Icon name="arrow" size={17} /></a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
