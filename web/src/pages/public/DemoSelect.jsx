import { useState } from 'react';
import { PublicNav } from './PublicChrome.jsx';
import { Crest } from '../../components/Brand.jsx';
import Icon from '../../components/Icon.jsx';
import { DEMO_SCHOOLS } from '../../data/schools.js';
import { ROLES } from '../../config/roles.js';
import { navigate } from '../../lib/router.js';

export default function DemoSelect() {
  const q = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const [slug, setSlug] = useState(q.get('school') || DEMO_SCHOOLS[0].slug);
  const school = DEMO_SCHOOLS.find((s) => s.slug === slug);
  const schoolRoles = ROLES.filter((r) => !r.platform);
  const platform = ROLES.find((r) => r.platform);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PublicNav />
      <div className="pw" style={{ padding: '32px 20px 60px' }}>
        <div className="stack" style={{ gap: 6, marginBottom: 24 }}>
          <div className="upper" style={{ color: 'var(--brand)' }}>Live demo</div>
          <h1>Choose a school and a profile</h1>
          <p className="muted">All schools below are demonstration tenants filled with sample records. Nothing you change is saved.</p>
        </div>

        <h2 style={{ marginBottom: 12 }}><span className="muted">1.</span> School</h2>
        <div className="grid g-3" style={{ marginBottom: 32 }}>
          {DEMO_SCHOOLS.map((s) => (
            <button key={s.slug} className={`school-pick ${slug === s.slug ? 'on' : ''}`} style={slug === s.slug ? { borderColor: s.primary_color, boxShadow: `0 0 0 3px ${s.primary_color}22` } : undefined} onClick={() => setSlug(s.slug)} aria-pressed={slug === s.slug}>
              <Crest school={s} size={40} />
              <span className="grow">
                <span className="strong serif" style={{ display: 'block', color: s.secondary_color, fontSize: 16 }}>{s.name}</span>
                <span className="xs muted">{s.city} · {s.board} · {s.website}</span>
              </span>
              {slug === s.slug && <Icon name="check" size={20} style={{ color: s.primary_color }} />}
            </button>
          ))}
        </div>

        <div className="row between wrap" style={{ marginBottom: 12 }}>
          <h2><span className="muted">2.</span> Profile at {school.short_name}</h2>
          <a className="btn btn-sm" href={`#/s/${slug}/login`}><Icon name="lock" size={14} /> View branded login page</a>
        </div>
        <div className="grid g-3">
          {schoolRoles.map((r) => (
            <button key={r.key} className="role-card" onClick={() => navigate(`/s/${slug}/${r.key}/dashboard`)}>
              <span className="ico" style={{ color: school.primary_color }}><Icon name={r.icon} size={19} /></span>
              <span className="grow"><span className="strong" style={{ display: 'block' }}>{r.label}</span><span className="small muted">{r.blurb}</span></span>
              <Icon name="right" size={18} style={{ color: 'var(--muted)', marginTop: 10 }} />
            </button>
          ))}
        </div>

        <h2 style={{ margin: '32px 0 12px' }}>Miz School platform</h2>
        <button className="role-card" style={{ maxWidth: 420 }} onClick={() => navigate(`/s/${slug}/super_admin/dashboard`)}>
          <span className="ico" style={{ background: '#0B2345', color: '#fff' }}><Icon name="building" size={19} /></span>
          <span className="grow"><span className="strong" style={{ display: 'block' }}>{platform.label}</span><span className="small muted">{platform.blurb}</span></span>
        </button>
      </div>
    </div>
  );
}
