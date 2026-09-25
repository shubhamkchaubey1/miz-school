import { useState } from 'react';
import { PublicNav, Footer } from './PublicChrome.jsx';
import Icon from '../../components/Icon.jsx';
import { inr, num } from '../../components/ui.jsx';
import { PLANS } from '../../data/api.js';

export default function Pricing() {
  const [counts, setCounts] = useState({ students: 500, parents: 500, teachers: 150, staff: 450 });
  const [planId, setPlanId] = useState('standard');
  const plan = PLANS.find((p) => p.id === planId);
  const users = Object.values(counts).reduce((a, b) => a + Number(b || 0), 0);
  const billable = Math.max(users, plan.minimum_users);
  const sub = billable * plan.price_per_user;
  const gst = (sub * plan.gst_rate) / 100;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <PublicNav />
      <div className="pw" style={{ padding: '40px 20px 64px' }}>
        <div style={{ maxWidth: 680, marginBottom: 28 }}>
          <div className="upper" style={{ color: 'var(--brand)' }}>Pricing</div>
          <h1 style={{ fontSize: 34, marginTop: 8 }}>Pay only for active users</h1>
          <p className="muted" style={{ fontSize: 16, marginTop: 8 }}>An active user is an enabled account — student, parent or staff — that can sign in during the billing month. GST is added on the invoice.</p>
        </div>
        <div className="grid g-3" style={{ marginBottom: 32 }}>
          {PLANS.map((p) => (
            <button key={p.id} className={`card ${planId === p.id ? '' : ''}`} onClick={() => setPlanId(p.id)} style={{ textAlign: 'left', cursor: 'pointer', padding: 20, borderColor: planId === p.id ? 'var(--brand)' : undefined, boxShadow: planId === p.id ? '0 0 0 3px var(--brand-100)' : undefined }}>
              <div className="row between"><h2>{p.name}</h2>{p.id === 'standard' && <span className="badge blue">Most schools</span>}</div>
              <div style={{ margin: '12px 0' }}><span className="serif" style={{ fontSize: 32, fontWeight: 700 }}>₹{p.price_per_user}</span><span className="muted"> / user / month + GST</span></div>
              <div className="stack-sm">
                {p.features.map((f) => <div key={f} className="row small" style={{ gap: 8 }}><Icon name="tick" size={15} style={{ color: 'var(--success)' }} />{f}</div>)}
                <div className="xs muted">Minimum {num(p.minimum_users)} users</div>
              </div>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card-h"><h2>Estimate your monthly bill</h2><span className="badge">{plan.name} plan</span></div>
          <div className="card-b grid g-2" style={{ gap: 24 }}>
            <div className="grid g-2">
              {[['students', 'Students'], ['parents', 'Parents / guardians'], ['teachers', 'Teachers'], ['staff', 'Other staff (admin, drivers, wardens…)']].map(([k, l]) => (
                <div className="field" key={k}>
                  <label htmlFor={k}>{l}</label>
                  <input id={k} className="input tnum" type="number" min="0" value={counts[k]} onChange={(e) => setCounts({ ...counts, [k]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="card" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}>
              <table className="table">
                <tbody>
                  <tr><td>Active users</td><td className="num">{num(users)}</td></tr>
                  {billable > users && <tr><td className="muted">Plan minimum applied</td><td className="num">{num(billable)}</td></tr>}
                  <tr><td>Rate</td><td className="num">₹{plan.price_per_user} / user</td></tr>
                  <tr><td>Subtotal</td><td className="num">{inr(sub)}</td></tr>
                  <tr><td>GST ({plan.gst_rate}%)</td><td className="num">{inr(gst)}</td></tr>
                  <tr><td className="strong">Monthly total</td><td className="num strong" style={{ fontSize: 18 }}>{inr(sub + gst)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
