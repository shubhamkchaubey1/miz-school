import { useEffect, useRef, useState } from 'react';
import { useSchool } from '../lib/store.jsx';
import { navigate } from '../lib/router.js';
import { MODULES, ROLES } from '../config/roles.js';
import { DEMO_SCHOOLS } from '../data/schools.js';
import { Crest, MizMark } from '../components/Brand.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, ago } from '../components/ui.jsx';

function useOutside(ref, fn) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) fn(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, fn]);
}

export default function AppShell({ module, children }) {
  const { slug, role, data, persona, toast } = useSchool();
  const [open, setOpen] = useState(false);
  const school = data.school;
  const r = persona.role;
  const go = (m) => { setOpen(false); navigate(`/s/${slug}/${role}/${m}`); };

  return (
    <div>
      <DemoBar />
      <div className="shell">
        <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
        <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
          <div className="sb-school">
            {r.platform ? <MizMark size={30} /> : (
              <>
                <Crest school={school} size={38} />
                <div className="grow">
                  <div className="name">{school.short_name}</div>
                  <div className="xs muted">{school.city} · {school.board}</div>
                </div>
              </>
            )}
          </div>
          <nav className="sb-nav">
            {r.nav.map(([group, items]) => (
              <div className="sb-group" key={group}>
                <div className="upper">{group}</div>
                {items.map((k) => (
                  <button key={k} className={`sb-link ${module === k ? 'active' : ''}`} onClick={() => go(k)} aria-current={module === k ? 'page' : undefined}>
                    <Icon name={MODULES[k].icon} size={17} />
                    <span>{k === 'dashboard' && r.key === 'parent' ? 'Home' : MODULES[k].label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="sb-foot">
            <div className="row" style={{ gap: 8 }}><Icon name="lock" size={13} /> {r.label} access</div>
            <div style={{ marginTop: 6 }}>Powered by <strong style={{ color: 'var(--brand-ink)' }}>Miz School</strong></div>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <button className="icon-btn only-m" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" size={20} /></button>
            <div className="school-title row grow" style={{ gap: 8 }}>
              {r.platform ? <MizMark size={24} /> : <><Crest school={school} size={26} /><strong className="serif" style={{ fontSize: 15, color: 'var(--brand-ink)' }}>{school.short_name}</strong></>}
            </div>
            <div className="hide-m grow row" style={{ gap: 12 }}>
              {!r.platform && <strong className="serif" style={{ fontSize: 16, color: 'var(--brand-ink)' }}>{school.name}</strong>}
              {!r.platform && <span className="ay-chip"><Icon name="calendar" size={14} /> AY {school.academic_year}</span>}
            </div>
            <Notifications go={go} />
            <ProfileMenu go={go} />
          </header>
          <main className="content">{children}</main>
        </div>
      </div>

      <nav className="bottom-nav" aria-label="Quick navigation">
        {r.bottom.map((k) => (
          <button key={k} className={module === k ? 'active' : ''} onClick={() => go(k)}>
            <Icon name={MODULES[k].icon} size={20} />
            <span>{k === 'dashboard' ? 'Home' : MODULES[k].label.split(' ')[0].replace('&', '')}</span>
          </button>
        ))}
        <button onClick={() => setOpen(true)}><Icon name="menu" size={20} /><span>More</span></button>
      </nav>
      {toast && <div className="toast" role="status"><Icon name="tick" size={16} /> {toast}</div>}
    </div>
  );
}

function DemoBar() {
  const { slug, role } = useSchool();
  return (
    <div className="demo-bar">
      <span className="row" style={{ gap: 10 }}>
        <span className="badge" style={{ background: 'var(--accent)', color: '#1b1300', height: 20 }}>DEMO</span>
        <span className="hide-m">Sample data only — changes are not saved.</span>
      </span>
      <span className="row" style={{ gap: 10 }}>
        <label className="hide-m" htmlFor="demo-school">School</label>
        <select id="demo-school" value={slug} onChange={(e) => navigate(`/s/${e.target.value}/${role}/dashboard`)} aria-label="Demo school">
          {DEMO_SCHOOLS.map((s) => <option key={s.slug} value={s.slug}>{s.short_name}</option>)}
        </select>
        <label className="hide-m" htmlFor="demo-role">Viewing as</label>
        <select id="demo-role" value={role} onChange={(e) => navigate(`/s/${slug}/${e.target.value}/dashboard`)} aria-label="Demo profile">
          {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <a href="#/demo" className="hide-m">Exit demo</a>
      </span>
    </div>
  );
}

function Notifications({ go }) {
  const { data, role } = useSchool();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  const items = data.notifications.filter((n) => n.audience === 'all' || n.audience === role || (role === 'principal' && n.audience === 'school_admin'));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="icon-btn" aria-label={`Notifications (${items.length})`} onClick={() => setOpen((o) => !o)}>
        <Icon name="bell" size={19} />{items.length > 0 && <span className="notif-dot" />}
      </button>
      {open && (
        <div className="menu">
          <div className="card-h"><h3>Notifications</h3><span className="badge blue">{items.length} new</span></div>
          <div className="list" style={{ maxHeight: 340, overflow: 'auto' }}>
            {items.map((n) => (
              <div key={n.id} className="row top">
                <span className="dot" style={{ color: 'var(--brand)', marginTop: 7 }} />
                <div className="grow"><div className="strong small">{n.title}</div><div className="xs muted">{n.body}</div><div className="xs muted" style={{ marginTop: 2 }}>{ago(n.created_at)}</div></div>
              </div>
            ))}
          </div>
          <div className="card-f"><button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); go('notifications'); }}>View all</button></div>
        </div>
      )}
    </div>
  );
}

function ProfileMenu({ go }) {
  const { persona, slug } = useSchool();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="row btn btn-ghost" style={{ height: 42, padding: '0 6px', gap: 8 }} onClick={() => setOpen((o) => !o)} aria-label="Profile menu">
        <Avatar name={persona.name} size="sm" />
        <span className="hide-m" style={{ textAlign: 'left', lineHeight: 1.15 }}>
          <span className="small strong" style={{ display: 'block' }}>{persona.name}</span>
          <span className="xs muted">{persona.title}</span>
        </span>
        <Icon name="down" size={15} className="hide-m" />
      </button>
      {open && (
        <div className="menu" style={{ minWidth: 240 }}>
          <div className="card-b row"><Avatar name={persona.name} /><div><div className="strong">{persona.name}</div><div className="xs muted">{persona.title}</div></div></div>
          <div className="divider" />
          <div style={{ padding: 6 }}>
            {persona.role.key === 'school_admin' && <button className="sb-link" onClick={() => { setOpen(false); go('settings'); }}><Icon name="settings" size={16} /> School settings</button>}
            <button className="sb-link" onClick={() => navigate(`/demo?school=${slug}`)}><Icon name="users" size={16} /> Switch profile</button>
            <button className="sb-link" onClick={() => navigate(`/s/${slug}/login`)}><Icon name="logout" size={16} /> Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}
