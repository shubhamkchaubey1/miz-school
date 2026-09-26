import { useState } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { PageHead, Card, Stat, StatusBadge, Badge, Tabs, Modal, IconTile, inr, num } from '../../components/ui.jsx';
import { Crest, CampusArt } from '../../components/Brand.jsx';
import { ROLES, MODULES, PERMISSION_MATRIX, ROLE_PERMISSIONS, LOCKED_EDIT } from '../../config/roles.js';
import { defaultAccess } from '../../lib/store.jsx';
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

/* ───────────── Users, roles & access ───────────── */
const GRANT_RULES = [
  ['shield', 'School Admin', 'Creates any user, assigns any role, and switches modules on or off for every role.'],
  ['award', 'Principal', 'Can invite Teachers, Class Teachers and Coordinators, and approve their class/subject scope.'],
  ['id', 'Class Teacher', 'Can only see students of their own section and subjects they teach — no fees, payroll or settings.'],
  ['users', 'Parent / Student', 'Created automatically from the admission record; a parent sees only their own children.'],
  ['building', 'Miz Super Admin', 'Creates the school and its first School Admin — never sees private student data by default.'],
];

export function Permissions() {
  const { data, access, setAccess, notify, actions } = useSchool();
  const [tab, setTab] = useState('users');
  const [roleView, setRoleView] = useState('teacher');
  const [invite, setInvite] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', role: 'teacher', scope: '8A' });
  const roles = ROLES.filter((r) => !r.platform);
  const [users, setUsers] = useState(() => [
    { name: 'Rohit Bhatnagar', role: 'school_admin', scope: 'Whole school', phone: '+91 98290 11223', status: 'active', last: '2 min ago' },
    { name: data.school.principal_name, role: 'principal', scope: 'Whole school', phone: '+91 98290 33445', status: 'active', last: '1 hr ago' },
    ...data.teachers.slice(0, 6).map((t, i) => ({ name: t.full_name, role: 'teacher', scope: data.sections.find((s) => s.class_teacher_id === t.id)?.name ? `Class ${data.sections.find((s) => s.class_teacher_id === t.id).name}` : 'Subject teacher', phone: t.phone, status: 'active', last: `${i + 2} hr ago` })),
    { name: 'Vinod Khandelwal', role: 'accountant', scope: 'Fees & payroll', phone: '+91 94140 55667', status: 'active', last: 'Yesterday' },
    { name: 'Sunita Mathur', role: 'librarian', scope: 'Library', phone: '+91 94140 77889', status: 'active', last: 'Yesterday' },
    { name: 'Kiran Sethi', role: 'reception', scope: 'Front office', phone: '+91 94140 99001', status: 'active', last: '10 min ago' },
    { name: data.routes[0].driver_name, role: 'driver', scope: `Route ${data.routes[0].code}`, phone: data.routes[0].driver_phone, status: 'active', last: 'Today 7:05 AM' },
    { name: 'Neha Kulkarni', role: 'teacher', scope: 'Class 7B', phone: '+91 99280 12121', status: 'invited', last: '—' },
  ]);
  const allMods = Object.keys(MODULES).filter((k) => !['schools', 'subscriptions', 'plans', 'onboarding', 'dashboard', 'trip'].includes(k));
  const LV = [null, 'view', 'edit'];
  const LV_LABEL = { null: 'None', view: 'View', edit: 'Edit' };
  const cycle = (role, mod) => {
    const cur = access[role]?.[mod] || null;
    const next = LV[(LV.indexOf(cur) + 1) % 3];
    const map = { ...(access[role] || {}) };
    if (next) map[mod] = next; else delete map[mod];
    setAccess({ ...access, [role]: map });
    actions.logAudit({ module: 'permissions', action: `Access changed · ${roleLabel(role)} · ${MODULES[mod].label}: ${LV_LABEL[cur]} → ${LV_LABEL[next]}`, kind: 'security' });
    notify(`${roleLabel(role)} · ${MODULES[mod].label}: ${LV_LABEL[next]}`);
  };
  const roleLabel = (k) => ROLES.find((r) => r.key === k)?.label || k;
  return (
    <div>
      <PageHead title="Users, roles & access" sub="Who can log in, what each role sees, and who is allowed to grant access" actions={<button className="btn btn-primary" onClick={() => setInvite(true)}><Icon name="user-plus" size={16} /> Invite user</button>} />
      <Tabs tabs={[['users', 'Users'], ['modules', 'View / edit access'], ['role', 'By role'], ['matrix', 'Permission matrix'], ['rules', 'Who grants access']]} value={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === 'users' && (
          <Card pad={false}><div className="table-wrap"><table className="table">
            <thead><tr><th>User</th><th>Role</th><th>Scope</th><th>Login</th><th>Last active</th><th>Status</th><th /></tr></thead>
            <tbody>{users.map((u, i) => (
              <tr key={i}><td><div className="row" style={{ gap: 8 }}><span className="avatar sm">{u.name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s/, '').split(' ').map((w) => w[0]).slice(0, 2).join('')}</span><span className="strong small">{u.name}</span></div></td>
                <td><Badge tone="blue">{roleLabel(u.role)}</Badge></td><td className="small">{u.scope}</td><td className="small tnum">{u.phone} <span className="muted">· OTP</span></td><td className="small">{u.last}</td>
                <td><Badge tone={u.status === 'active' ? 'green' : u.status === 'invited' ? 'amber' : 'red'}>{u.status}</Badge></td>
                <td>{u.role !== 'school_admin' && <button className="btn btn-sm" onClick={() => { setUsers(users.map((x, j) => (j === i ? { ...x, status: x.status === 'disabled' ? 'active' : 'disabled' } : x))); notify(u.status === 'disabled' ? 'Access restored' : 'Access revoked — user logged out on all devices'); }}>{u.status === 'disabled' ? 'Enable' : 'Revoke'}</button>}</td></tr>
            ))}</tbody>
          </table></div></Card>
        )}
        {tab === 'modules' && (
          <>
          <div className="row wrap small" style={{ gap: 14, marginBottom: 12 }}>
            <span className="row" style={{ gap: 6 }}><span className="acc-cell">None</span> hidden from menu, page blocked</span>
            <span className="row" style={{ gap: 6 }}><span className="acc-cell view">View</span> can open and read, every change button is blocked</span>
            <span className="row" style={{ gap: 6 }}><span className="acc-cell edit">Edit</span> can add, change and approve</span>
          </div>
          <Card pad={false} footer={<div className="row between wrap"><span className="xs muted">Click a cell to switch None → View → Edit. Applies instantly and is written to the Audit Log.</span><button className="btn btn-sm" onClick={() => { setAccess(defaultAccess()); actions.logAudit({ module: 'permissions', action: 'Access reset to Miz defaults', kind: 'security' }); notify('Reset to Miz defaults'); }}>Reset to defaults</button></div>}>
            <div className="table-wrap"><table className="table" style={{ minWidth: 1100 }}>
              <thead><tr><th>Module</th>{roles.map((r) => <th key={r.key} style={{ textAlign: 'center' }}>{r.label.replace('School ', '').replace('Gate ', '')}<div className="xs muted" style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>{Object.values(access[r.key] || {}).filter((x) => x === 'edit').length}E · {Object.values(access[r.key] || {}).filter((x) => x === 'view').length}V</div></th>)}</tr></thead>
              <tbody>{allMods.map((m) => (
                <tr key={m}><td className="small strong nowrap"><span className="row" style={{ gap: 8 }}><Icon name={MODULES[m].icon} size={15} />{MODULES[m].label}</span></td>
                  {roles.map((r) => { const locked = (LOCKED_EDIT[r.key] || []).includes(m); const lv = access[r.key]?.[m] || null; return (
                    <td key={r.key} style={{ textAlign: 'center', padding: '6px 4px' }}><button className={`acc-cell ${lv || ''}`} disabled={locked} title={locked ? 'Always on for School Admin' : `${MODULES[m].label} for ${r.label}`} onClick={() => cycle(r.key, m)}>{LV_LABEL[lv]}</button></td>
                  ); })}</tr>
              ))}</tbody>
            </table></div>
          </Card>
          </>
        )}
        {tab === 'role' && (
          <div className="stack">
            <select className="select" style={{ width: 'auto', alignSelf: 'flex-start' }} value={roleView} onChange={(e) => setRoleView(e.target.value)}>{roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</select>
            <div className="grid g-2">
              {['edit', 'view'].map((lv) => (
                <Card key={lv} title={lv === 'edit' ? `Can change (${Object.values(access[roleView] || {}).filter((x) => x === lv).length})` : `Can only see (${Object.values(access[roleView] || {}).filter((x) => x === lv).length})`} icon={lv === 'edit' ? 'edit' : 'eye'} tone={lv === 'edit' ? 'green' : 'blue'}>
                  <div className="row wrap" style={{ gap: 6 }}>{Object.entries(access[roleView] || {}).filter(([, x]) => x === lv).map(([m]) => <Badge key={m} tone={lv === 'edit' ? 'green' : 'blue'}>{MODULES[m]?.label}</Badge>)}</div>
                </Card>
              ))}
            </div>
            <div className="xs muted">Scope still applies on top of access: a teacher with Edit on Homework can post only for the classes and subjects allotted to them; a parent sees only their own children.</div>
          </div>
        )}
        {tab === 'matrix' && (
          <Card pad={false}><div className="table-wrap"><table className="table" style={{ minWidth: 980 }}>
            <thead><tr><th>Permission</th>{roles.map((r) => <th key={r.key} style={{ textAlign: 'center' }}>{r.label.replace('School ', '')}</th>)}</tr></thead>
            <tbody>{PERMISSION_MATRIX.map(([group, perms]) => [
              <tr key={group}><td colSpan={roles.length + 1} className="upper" style={{ background: 'var(--surface-2)' }}>{group}</td></tr>,
              ...perms.map((p) => <tr key={p}><td className="small tnum">{p}</td>{roles.map((r) => <td key={r.key} style={{ textAlign: 'center' }}>{ROLE_PERMISSIONS[r.key]?.includes(p) ? <Icon name="tick" size={16} style={{ color: 'var(--success)' }} /> : <span style={{ color: '#c9d3e0' }}>—</span>}</td>)}</tr>),
            ])}</tbody>
          </table></div></Card>
        )}
        {tab === 'rules' && (
          <div className="grid g-2">
            <Card title="Who can grant access" icon="shield" tone="navy" pad={false}><div className="list">{GRANT_RULES.map(([ic, who, what]) => <div key={who} className="row top"><IconTile icon={ic} size={34} /><div><div className="strong small">{who}</div><div className="small muted">{what}</div></div></div>)}</div></Card>
            <Card title="How access works" icon="lock" tone="teal" pad={false}><div className="list small">{[
              ['user-plus', 'Invite by mobile number → user logs in with OTP (no shared passwords).'],
              ['layers', 'Role decides the menu; scope (branch, class, subject, route) decides the rows.'],
              ['shield', 'Every table is locked per school in the database (row-level security).'],
              ['clip-list', 'Every grant, revoke, marks change and fee refund is written to the audit log.'],
              ['door', 'Revoking access logs the user out of web and app immediately.'],
              ['building', 'Branch staff only see their branch; group management sees all branches.'],
            ].map(([ic, t]) => <div key={t} className="row"><IconTile icon={ic} size={30} /><span>{t}</span></div>)}</div></Card>
          </div>
        )}
      </div>
      {invite && (
        <Modal title="Invite a user" onClose={() => setInvite(false)} footer={<><button className="btn" onClick={() => setInvite(false)}>Cancel</button><button className="btn btn-primary" disabled={!f.name || !f.phone} onClick={() => { setUsers([...users, { ...f, scope: f.role === 'teacher' ? `Class ${f.scope}` : f.scope, status: 'invited', last: '—' }]); setInvite(false); setTab('users'); notify(`Invite sent to ${f.phone} on WhatsApp & SMS`); }}>Send invite</button></>}>
          <div className="stack">
            <div className="grid g-2"><div className="field"><label>Full name</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div><div className="field"><label>Mobile (login by OTP)</label><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div></div>
            <div className="grid g-2">
              <div className="field"><label>Role</label><select className="select" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</select></div>
              <div className="field"><label>Scope</label><select className="select" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}>{['Whole school', ...data.sections.map((s) => s.name), ...data.routes.map((r) => `Route ${r.code}`)].map((x) => <option key={x}>{x}</option>)}</select></div>
            </div>
            <div className="card card-b" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}><div className="xs muted strong" style={{ marginBottom: 6 }}>This user will see</div><div className="row wrap" style={{ gap: 4 }}>{Object.entries(access[f.role] || {}).map(([m, lv]) => <Badge key={m} tone={lv === 'edit' ? 'green' : 'blue'}>{MODULES[m]?.label}{lv === 'view' ? ' (view)' : ''}</Badge>)}</div></div>
          </div>
        </Modal>
      )}
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
      <PageHead title="Subscriptions" sub="Plan, seat limit and renewal for every school" />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Active users" value={num(rows.reduce((a, t) => a + t.billable_users, 0))} foot="All schools, this month" icon="users" />
        <Stat label="Paid & active" value={rows.filter((t) => t.status === 'ACTIVE').length} foot="Schools" icon="check" tone="green" />
        <Stat label="Past due" value={rows.filter((t) => t.status === 'PAST_DUE').length} foot="In grace period" icon="alert" tone="red" />
        <Stat label="Trials ending < 30 days" value={rows.filter((t) => t.status === 'TRIAL').length} icon="clock" tone="amber" />
      </div>
      <Card pad={false}>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>School</th><th>Plan</th><th className="num">Active users</th><th className="num">Seat limit</th><th style={{ width: 140 }}>Seats used</th><th>Renews</th><th>Status</th><th /></tr></thead>
          <tbody>{rows.map((t) => { const limit = Math.max(t.plan.minimum_users, Math.ceil(t.billable_users / 500) * 500); const sub = limit; return (
            <tr key={t.name}><td className="strong">{t.name}</td><td>{t.plan.name}</td><td className="num">{num(t.billable_users)}</td><td className="num">{num(limit)}</td><td><div className="progress"><span style={{ width: `${Math.min(100, (t.billable_users / limit) * 100)}%` }} /></div></td><td className="small">{t.renews_in < 0 ? <span style={{ color: 'var(--danger)' }}>{-t.renews_in} days overdue</span> : `in ${t.renews_in} days`}</td><td><StatusBadge status={t.status} /></td><td><button className="btn btn-sm" onClick={() => setInv({ t, sub })}>Details</button></td></tr>
          ); })}</tbody>
        </table></div>
      </Card>
      {inv && (
        <Modal title="Subscription details" onClose={() => setInv(null)}>
          <div className="stack-sm small">
            {[['School', inv.t.name], ['Plan', inv.t.plan.name], ['Active users', num(inv.t.billable_users)], ['Seat limit', num(inv.sub)], ['Renews', inv.t.renews_in < 0 ? `${-inv.t.renews_in} days overdue` : `in ${inv.t.renews_in} days`], ['Status', inv.t.status]].map(([k, v]) => <div key={k} className="row between"><span className="muted">{k}</span><strong>{v}</strong></div>)}
            <div className="divider" />
            <p className="xs muted">Admissions and invites beyond the seat limit are blocked with “Seat limit reached — contact Miz to upgrade”. User count is frozen from the month-end snapshot.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Plans() {
  return (
    <div>
      <PageHead title="Plans" sub="Modules and seat minimums per plan — configurable, nothing hard-coded" actions={<button className="btn btn-primary"><Icon name="plus" size={16} /> New plan</button>} />
      <div className="grid g-3">
        {PLANS.map((p) => (
          <Card key={p.id} title={p.name} action={<Badge tone="blue">{p.id}</Badge>}>
            <div className="stack-sm small">
              <div className="row between"><span className="muted">Minimum seats</span><strong>{num(p.minimum_users)}</strong></div>
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
            <div className="field"><label>Plan</label><select className="select">{PLANS.map((p) => <option key={p.id}>{p.name}</option>)}</select></div>
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
