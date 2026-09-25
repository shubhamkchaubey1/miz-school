import { useEffect, useState } from 'react';
import { Crest, CampusArt } from '../../components/Brand.jsx';
import Icon from '../../components/Icon.jsx';
import { Seg } from '../../components/ui.jsx';
import { findSchool, DEMO_SCHOOLS } from '../../data/schools.js';
import { applyBrand } from '../../lib/store.jsx';
import { navigate } from '../../lib/router.js';
import { ROLES } from '../../config/roles.js';

export default function Login({ slug }) {
  const school = findSchool(slug) || DEMO_SCHOOLS[0];
  const [who, setWho] = useState('staff');
  const [otp, setOtp] = useState(false);
  useEffect(() => { applyBrand(school); }, [school]);

  const submit = (e) => {
    e.preventDefault();
    navigate(`/s/${school.slug}/${who === 'staff' ? 'school_admin' : who}/dashboard`);
  };
  const idLabel = who === 'student' ? 'Admission number' : who === 'parent' ? 'Registered mobile number' : 'Email or mobile';
  const idPh = who === 'student' ? `${school.slug.slice(0, 3).toUpperCase()}/2024/4230` : who === 'parent' ? '+91 98xxxxxx10' : `name@${school.website}`;

  return (
    <div className="login">
      <div className="login-art">
        <div className="row" style={{ gap: 14, position: 'relative', zIndex: 1 }}>
          <Crest school={school} size={52} />
          <div>
            <div className="serif" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{school.name}</div>
            <div style={{ color: 'rgba(255,255,255,.72)', fontSize: 14 }}>{school.motto}</div>
          </div>
        </div>
        <CampusArt className="campus" color="rgba(255,255,255,.28)" style={{ position: 'absolute', left: 0, right: 0, bottom: 64, maxHeight: '58%' }} />
        <div style={{ position: 'relative', zIndex: 1, fontSize: 13.5, color: 'rgba(255,255,255,.75)' }} className="stack-sm">
          <div style={{ height: 3, width: 56, background: 'var(--accent)' }} />
          <div>{school.address}</div>
          <div>{school.phone} · Affiliated to {school.board} ({school.affiliation_no}) · Est. {school.established}</div>
        </div>
      </div>

      <div className="login-form">
        <form className="box stack" onSubmit={submit} style={{ gap: 18 }}>
          <div>
            <h1 style={{ fontSize: 28 }}>Welcome back</h1>
            <p className="muted" style={{ marginTop: 4 }}>Sign in to the {school.short_name} portal</p>
          </div>
          <Seg options={[['staff', 'Staff'], ['parent', 'Parent'], ['student', 'Student']]} value={who} onChange={setWho} />
          <div className="field">
            <label htmlFor="uid">{idLabel}</label>
            <input id="uid" className="input" placeholder={idPh} autoComplete="username" />
          </div>
          {otp ? (
            <div className="field">
              <label htmlFor="otp">One-time password</label>
              <input id="otp" className="input" placeholder="6-digit OTP sent by SMS" inputMode="numeric" />
            </div>
          ) : (
            <div className="field">
              <div className="row between"><label htmlFor="pw">Password</label><a href="#forgot" className="small" onClick={(e) => e.preventDefault()}>Forgot password?</a></div>
              <input id="pw" type="password" className="input" placeholder="••••••••" autoComplete="current-password" />
            </div>
          )}
          <button className="btn btn-primary btn-lg btn-block" type="submit">Sign in</button>
          <div className="row" style={{ gap: 10 }}><div className="divider grow" /><span className="xs muted upper">or</span><div className="divider grow" /></div>
          <button type="button" className="btn btn-block" onClick={() => setOtp((o) => !o)}><Icon name="phone2" size={16} /> {otp ? 'Use password instead' : 'Sign in with OTP'}</button>

          <div className="card" style={{ background: 'var(--brand-50)', borderColor: 'var(--brand-100)', boxShadow: 'none' }}>
            <div className="card-b stack-sm">
              <div className="strong small">Demo access — sign in as</div>
              <div className="row wrap" style={{ gap: 6 }}>
                {ROLES.filter((r) => !r.platform).map((r) => (
                  <button type="button" key={r.key} className="btn btn-sm" onClick={() => navigate(`/s/${school.slug}/${r.key}/dashboard`)}>{r.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="row between xs muted">
            <a href="#/demo">← All demo schools</a>
            <span>Secured by Miz School</span>
          </div>
        </form>
      </div>
    </div>
  );
}
