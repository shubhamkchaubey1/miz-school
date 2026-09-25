import { useState } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { PageHead, Card, Stat, StatusBadge, Badge, Tabs, Modal, inr, num } from '../../components/ui.jsx';
import { Crest, CampusArt } from '../../components/Brand.jsx';
import { ROLES, PERMISSION_MATRIX, ROLE_PERMISSIONS } from '../../config/roles.js';
import { PLANS, PLATFORM_TENANTS } from '../../data/api.js';
import { DEMO_SCHOOLS } from '../../data/schools.js';

/* ───────────── School settings / branding ───────────── */
export function Settings() {
  const { data, actions, notify } = useSchool();
  const s = data.school;
  const [tab, setTab] = useState('brand');
  const [flags, setFlags] = useState({ transport: true, hostel: true, canteen: true, reception: true, library: false, payroll: false, online_tests: false });
  const color = (k, l) => (
    <div className="field">
      <label htmlFor={k}>{l}</label>
      <div className="row" style={{ gap: 8 }}>
        <input id={k} type="color" value={s[k]} onChange={(e) => actions.setBranding({ [k]: e.target.value })} style={{ width: 42, height: 36, border: '1px solid var(--line-strong)', borderRadius: 6, padding: 2, background: '#fff' }} />
        <input className="input tnum" value={s[k]} onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && actions.setBranding({ [k]: e.target.value })} style={{ width: 110 }} aria-label={`${l} hex`} />
      </div>
    </div>
  );
  return (
    <div>
      <PageHead title="School settings" sub="Identity, branding and modules" />
      <Tabs tabs={[['brand', 'Branding'], ['profile', 'School profile'], ['modules', 'Modules']]} value={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === 'brand' && (
          <div className="grid g-2" style={{ alignItems: 'start' }}>
            <Card title="Brand identity" footer={<div className="row between"><span className="xs muted">Changes apply across web, app, receipts and notices.</span><button className="btn btn-primary" onClick={() => notify('Branding saved (demo session)')}>Save branding</button></div>}>
              <div className="stack">
                <div className="row" style={{ gap: 14 }}><Crest school={s} size={56} /><div className="stack-sm"><button className="btn btn-sm"><Icon name="upload" size={14} /> Upload logo</button><span className="xs muted">PNG or SVG, square, at least 256 px</span></div></div>
                <div className="grid g-3">{color('primary_color', 'Primary')}{color('secondary_color', 'Secondary')}{color('accent_color', 'Accent')}</div>
                <div className="grid g-2">
                  <div className="field"><label>Short name</label><input className="input" value={s.short_name} onChange={(e) => actions.setBranding({ short_name: e.target.value })} /></div>
                  <div className="field"><label>Crest initials</label><input className="input" maxLength={3} value={s.crest_initials} onChange={(e) => actions.setBranding({ crest_initials: e.target.value.toUpperCase() })} /></div>
                </div>
                <div className="field"><label>Motto</label><input className="input" value={s.motto} onChange={(e) => actions.setBranding({ motto: e.target.value })} /></div>
                <div className="field"><label>Login background</label><button className="btn" style={{ alignSelf: 'flex-start' }}><Icon name="upload" size={16} /> Upload approved campus photo</button></div>
              </div>
            </Card>
            <Card title="Preview — login page" pad={false}>
              <div style={{ background: s.secondary_color, color: '#fff', padding: 20, position: 'relative', overflow: 'hidden', minHeight: 220 }}>
                <div className="row" style={{ gap: 12, position: 'relative', zIndex: 1 }}><Crest school={s} size={44} /><div><div className="serif" style={{ fontWeight: 700, fontSize: 18 }}>{s.name}</div><div className="xs" style={{ opacity: .75 }}>{s.motto}</div></div></div>
                <CampusArt color="rgba(255,255,255,.25)" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 }} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: s.accent_color }} />
              </div>
              <div className="card-b stack-sm">
                <strong>Welcome back</strong>
                <div className="input" style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)' }}>Email or mobile</div>
                <button className="btn btn-primary">Sign in</button>
              </div>
            </Card>
          </div>
        )}
        {tab === 'profile' && (
          <Card title="School profile" footer={<button className="btn btn-primary" onClick={() => notify('Profile saved (demo)')}>Save</button>}>
            <div className="grid g-2">
              {[['name', 'School name'], ['board', 'Board'], ['affiliation_no', 'Affiliation no.'], ['established', 'Established'], ['phone', 'Phone'], ['email', 'Email'], ['website', 'Portal address'], ['academic_year', 'Academic year'], ['principal_name', 'Principal']].map(([k, l]) => <div className="field" key={k}><label>{l}</label><input className="input" defaultValue={s[k]} /></div>)}
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Address</label><input className="input" defaultValue={s.address} /></div>
            </div>
          </Card>
        )}
        {tab === 'modules' && (
          <Card title="Enabled modules" pad={false}>
            <div className="list">
              {Object.entries({ transport: 'Transport & driver app', hostel: 'Hostel', canteen: 'Canteen & wallet', reception: 'Front office / visitor management', library: 'Library', payroll: 'Payroll', online_tests: 'Online tests' }).map(([k, l]) => (
                <label key={k} className="row between" style={{ cursor: 'pointer' }}>
                  <span><span className="strong small" style={{ display: 'block' }}>{l}</span><span className="xs muted">{flags[k] ? 'Visible to permitted roles' : 'Hidden from every menu'}</span></span>
                  <input type="checkbox" checked={flags[k]} onChange={(e) => { setFlags({ ...flags, [k]: e.target.checked }); notify(`${l} ${e.target.checked ? 'enabled' : 'disabled'}`); }} style={{ width: 18, height: 18 }} />
                </label>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ───────────── Roles & permissions ───────────── */
export function Permissions() {
  const roles = ROLES.filter((r) => !r.platform);
  return (
    <div>
      <PageHead title="Roles & permissions" sub="What each role can see and do at this school" actions={<button className="btn btn-primary"><Icon name="plus" size={16} /> Custom role</button>} />
      <Card pad={false}>
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 980 }}>
            <thead><tr><th>Permission</th>{roles.map((r) => <th key={r.key} style={{ textAlign: 'center' }}>{r.label.replace('School ', '')}</th>)}</tr></thead>
            <tbody>
              {PERMISSION_MATRIX.map(([group, perms]) => [
                <tr key={group}><td colSpan={roles.length + 1} className="upper" style={{ background: 'var(--surface-2)' }}>{group}</td></tr>,
                ...perms.map((p) => (
                  <tr key={p}><td className="small tnum">{p}</td>{roles.map((r) => <td key={r.key} style={{ textAlign: 'center' }}>{ROLE_PERMISSIONS[r.key]?.includes(p) ? <Icon name="tick" size={16} style={{ color: 'var(--success)' }} /> : <span style={{ color: '#c9d3e0' }}>—</span>}</td>)}</tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ───────────── Platform (Miz Super Admin) ───────────── */
const tenantRows = () => PLATFORM_TENANTS.map((t) => ({ ...t, ...(t.slug ? DEMO_SCHOOLS.find((s) => s.slug === t.slug) : {}), plan: PLANS.find((p) => p.id === t.plan_id) }));

export function Schools() {
  const rows = tenantRows();
  return (
    <div>
      <PageHead title="Schools" sub={`${rows.length} tenants on the platform`} actions={<a className="btn btn-primary" href={`#${window.location.hash.slice(1).replace(/[^/]+$/, 'onboarding')}`}><Icon name="plus" size={16} /> Onboard school</a>} />
      <Card pad={false}>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>School</th><th>Portal</th><th>Plan</th><th className="num">Active users</th><th>Status</th><th /></tr></thead>
          <tbody>{rows.map((t) => (
            <tr key={t.name}>
              <td><div className="row" style={{ gap: 10 }}>{t.slug ? <Crest school={t} size={26} /> : <span className="avatar sm">{t.name[0]}</span>}<div><div className="strong">{t.name}</div><div className="xs muted">{t.city}{t.board ? ` · ${t.board}` : ''}</div></div></div></td>
              <td className="small">{t.website || `${t.name.toLowerCase().split(' ')[0]}.mizschool.app`}</td>
              <td><Badge tone="blue">{t.plan.name}</Badge></td>
              <td className="num">{num(t.billable_users)}</td>
              <td><StatusBadge status={t.status} /></td>
              <td>{t.slug ? <a className="btn btn-sm" href={`#/s/${t.slug}/school_admin/dashboard`}>Open</a> : <button className="btn btn-sm">Manage</button>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>
    </div>
  );
}

export function Subscriptions() {
  const rows = tenantRows();
  const [inv, setInv] = useState(null);
  return (
    <div>
      <PageHead title="Subscriptions & billing" sub="Per-user monthly billing with GST" />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Billed this month" value={inr(rows.filter((t) => t.status !== 'TRIAL').reduce((a, t) => a + t.billable_users * t.plan.price_per_user * 1.18, 0), true)} foot="Incl. GST" icon="receipt" />
        <Stat label="Collected" value={inr(rows.filter((t) => t.status === 'ACTIVE').reduce((a, t) => a + t.billable_users * t.plan.price_per_user * 1.18, 0), true)} icon="check" tone="green" />
        <Stat label="Past due" value={rows.filter((t) => t.status === 'PAST_DUE').length} foot="In grace period" icon="alert" tone="red" />
        <Stat label="Trials ending < 30 days" value={rows.filter((t) => t.status === 'TRIAL').length} icon="clock" tone="amber" />
      </div>
      <Card pad={false}>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>School</th><th>Plan</th><th className="num">Users</th><th className="num">Rate</th><th className="num">Subtotal</th><th className="num">GST 18%</th><th className="num">Total</th><th>Renews</th><th>Status</th><th /></tr></thead>
          <tbody>{rows.map((t) => { const sub = Math.max(t.billable_users, t.plan.minimum_users) * t.plan.price_per_user; return (
            <tr key={t.name}><td className="strong">{t.name}</td><td>{t.plan.name}</td><td className="num">{num(t.billable_users)}</td><td className="num">₹{t.plan.price_per_user}</td><td className="num">{inr(sub)}</td><td className="num">{inr(sub * 0.18)}</td><td className="num strong">{inr(sub * 1.18)}</td><td className="small">{t.renews_in < 0 ? <span style={{ color: 'var(--danger)' }}>{-t.renews_in} days overdue</span> : `in ${t.renews_in} days`}</td><td><StatusBadge status={t.status} /></td><td><button className="btn btn-sm" onClick={() => setInv({ t, sub })}>Invoice</button></td></tr>
          ); })}</tbody>
        </table></div>
      </Card>
      {inv && (
        <Modal title="Subscription invoice" onClose={() => setInv(null)}>
          <div className="stack-sm small">
            {[['School', inv.t.name], ['Plan', `${inv.t.plan.name} · ₹${inv.t.plan.price_per_user}/user`], ['Active billable users', num(inv.t.billable_users)], ['Subtotal', inr(inv.sub)], ['GST (18%)', inr(inv.sub * 0.18)]].map(([k, v]) => <div key={k} className="row between"><span className="muted">{k}</span><strong>{v}</strong></div>)}
            <div className="divider" />
            <div className="row between"><strong>Total payable</strong><strong style={{ fontSize: 18 }}>{inr(inv.sub * 1.18)}</strong></div>
            <p className="xs muted">User count is frozen from the month-end snapshot; line items stored per role type.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Plans() {
  return (
    <div>
      <PageHead title="Plans & pricing" sub="Configurable pricing engine — no hard-coded rates" actions={<button className="btn btn-primary"><Icon name="plus" size={16} /> New plan</button>} />
      <div className="grid g-3">
        {PLANS.map((p) => (
          <Card key={p.id} title={p.name} action={<Badge tone="blue">{p.id}</Badge>}>
            <div className="stack-sm small">
              <div className="row between"><span className="muted">Price per user</span><strong>₹{p.price_per_user} / month</strong></div>
              <div className="row between"><span className="muted">GST</span><strong>{p.gst_rate}%</strong></div>
              <div className="row between"><span className="muted">Minimum users</span><strong>{num(p.minimum_users)}</strong></div>
              <div className="divider" />
              {p.features.map((f) => <div key={f} className="row" style={{ gap: 6 }}><Icon name="tick" size={14} style={{ color: 'var(--success)' }} />{f}</div>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState('https://www.greenvalley-example.edu.in');
  const [busy, setBusy] = useState(false);
  const detected = { name: 'Green Valley Academy', short_name: 'Green Valley', crest_initials: 'GV', primary_color: '#1F5FA8', secondary_color: '#12294D', accent_color: '#2E8B57', motto: 'Grow · Learn · Lead', city: 'Udaipur', board: 'CBSE', address: 'Fatehpura, Udaipur 313004', phone: '+91 294 245 1200', website: 'greenvalley.mizschool.app' };
  const run = () => { setBusy(true); setTimeout(() => { setBusy(false); setStep(1); }, 1400); };
  const steps = ['Website', 'Review brand', 'Admin & session', 'Go live'];
  return (
    <div style={{ maxWidth: 900 }}>
      <PageHead title="Onboard a school" sub="Auto-detect → preview → school approves → publish" />
      <div className="row wrap" style={{ gap: 6, marginBottom: 16 }}>
        {steps.map((s, i) => <span key={s} className={`badge ${i === step ? 'navy' : i < step ? 'green' : ''}`} style={{ height: 28, padding: '0 12px' }}>{i < step ? '✓' : i + 1}. {s}</span>)}
      </div>
      {step === 0 && (
        <Card title="School website">
          <div className="stack">
            <div className="field"><label htmlFor="url">Website URL</label><input id="url" className="input" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
            <p className="small muted">We read only publicly available details — name, logo, colours, address and contact — and the school approves everything before it is published.</p>
            <button className="btn btn-primary" onClick={run} disabled={busy} style={{ alignSelf: 'flex-start' }}>{busy ? <><Icon name="refresh" size={16} className="spin" /> Reading website…</> : <><Icon name="globe" size={16} /> Import brand</>}</button>
          </div>
        </Card>
      )}
      {step === 1 && (
        <div className="grid g-2">
          <Card title="Detected details" footer={<div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={() => setStep(0)}>Back</button><button className="btn btn-primary" onClick={() => setStep(2)}>Approve</button></div>}>
            <div className="stack-sm small">
              {[['Name', detected.name], ['Board', detected.board], ['City', detected.city], ['Address', detected.address], ['Phone', detected.phone], ['Motto', detected.motto]].map(([k, v]) => <div key={k} className="row between"><span className="muted">{k}</span><strong>{v}</strong></div>)}
              <div className="row between"><span className="muted">Colours</span><span className="row" style={{ gap: 4 }}>{[detected.primary_color, detected.secondary_color, detected.accent_color].map((c) => <span key={c} style={{ width: 22, height: 22, borderRadius: 4, background: c, border: '1px solid var(--line)' }} title={c} />)}</span></div>
            </div>
          </Card>
          <Card title="Portal preview" pad={false}>
            <div style={{ background: detected.secondary_color, padding: 18, color: '#fff' }} className="row"><Crest school={detected} size={44} /><div><div className="serif strong" style={{ fontSize: 17 }}>{detected.name}</div><div className="xs" style={{ opacity: .75 }}>{detected.website}</div></div></div>
            <div style={{ height: 4, background: detected.accent_color }} />
            <div className="card-b small muted">Logo placeholder generated from initials — replace with the school’s approved logo file.</div>
          </Card>
        </div>
      )}
      {step === 2 && (
        <Card title="Administrator & academic session" footer={<div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={() => setStep(1)}>Back</button><button className="btn btn-primary" onClick={() => setStep(3)}>Create school</button></div>}>
          <div className="grid g-2">
            {['Admin name', 'Admin mobile', 'Admin email', 'Academic session (e.g. 2026–27)'].map((l) => <div className="field" key={l}><label>{l}</label><input className="input" /></div>)}
            <div className="field"><label>Plan</label><select className="select">{PLANS.map((p) => <option key={p.id}>{p.name} — ₹{p.price_per_user}/user</option>)}</select></div>
            <div className="field"><label>Start with</label><select className="select"><option>30-day trial</option><option>Active subscription</option></select></div>
          </div>
        </Card>
      )}
      {step === 3 && (
        <Card>
          <div className="stack" style={{ alignItems: 'center', textAlign: 'center', padding: 20 }}>
            <Icon name="check" size={48} style={{ color: 'var(--success)' }} />
            <div><div className="strong" style={{ fontSize: 20 }}>{detected.name} is ready</div><div className="muted">{detected.website} · trial started · invite sent to the school admin</div></div>
            <div className="row"><button className="btn" onClick={() => setStep(0)}>Onboard another</button></div>
          </div>
        </Card>
      )}
    </div>
  );
}
