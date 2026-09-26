import { useMemo, useRef, useState } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { PageHead, Card, Stat, Badge, Avatar, Search, Seg, Modal, Empty, fmtDate, fmtTime, ago } from '../../components/ui.jsx';
import { MODULES, ROLES } from '../../config/roles.js';
import { localSchoolData } from '../../data/api.js';

const KIND = { change: ['Change', 'blue'], security: ['Security', 'red'], export: ['Export', 'violet'] };
const roleLabel = (k) => ROLES.find((r) => r.key === k)?.label || k;
const modLabel = (m) => (m === 'auth' ? 'Login' : MODULES[m]?.label || m);

function download(name, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const csvCell = (v) => { const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const toCSV = (rows) => { if (!rows.length) return ''; const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))]; return [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n'); };

/* ───────────── Audit log ───────────── */
export function Audit() {
  const { data, actions, notify } = useSchool();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');
  const [mod, setMod] = useState('');
  const [role, setRole] = useState('');
  const [range, setRange] = useState('7');
  const log = data.audit_log || [];
  const since = Date.now() - Number(range) * 86400e3;
  const rows = log.filter((e) => new Date(e.at).getTime() >= since && (kind === 'all' || e.kind === kind) && (!mod || e.module === mod) && (!role || e.role === role)
    && (!q || `${e.user} ${e.action} ${e.ip}`.toLowerCase().includes(q.toLowerCase())));
  const today = new Date().toDateString();
  const mods = [...new Set(log.map((e) => e.module))];
  return (
    <div>
      <PageHead title="Audit log" sub="Every change, login, export and access change — who, what, when, from which device. Entries can’t be edited or deleted."
        actions={<button className="btn" onClick={() => { download(`audit-log-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows.map(({ id, ...r }) => r)), 'text/csv'); actions.logAudit({ module: 'audit', action: `Exported audit log (${rows.length} rows, CSV)`, kind: 'export' }); notify('Audit log downloaded'); }}><Icon name="download" size={16} /> Export CSV</button>} />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Events today" value={log.filter((e) => new Date(e.at).toDateString() === today).length} foot={`${log.length} in the last 10 days`} icon="history" />
        <Stat label="Security events" value={log.filter((e) => e.kind === 'security').length} foot="Logins, access changes, blocked actions" icon="shield" tone="red" />
        <Stat label="Exports" value={log.filter((e) => e.kind === 'export').length} foot="Data leaving the system" icon="download" tone="violet" />
        <Stat label="People active" value={new Set(log.filter((e) => Date.now() - new Date(e.at).getTime() < 86400e3).map((e) => e.user)).size} foot="Last 24 hours" icon="users" tone="green" />
      </div>
      <Card pad={false}>
        <div className="card-h row wrap" style={{ gap: 8 }}>
          <Search value={q} onChange={setQ} placeholder="Search user, action or IP" style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
          <Seg options={[['all', 'All'], ['change', 'Changes'], ['security', 'Security'], ['export', 'Exports']]} value={kind} onChange={setKind} />
          <select className="select" style={{ width: 'auto' }} value={mod} onChange={(e) => setMod(e.target.value)}><option value="">All modules</option>{mods.map((m) => <option key={m} value={m}>{modLabel(m)}</option>)}</select>
          <select className="select" style={{ width: 'auto' }} value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option>{ROLES.filter((r) => !r.platform).map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</select>
          <select className="select" style={{ width: 'auto' }} value={range} onChange={(e) => setRange(e.target.value)}><option value="1">Last 24 hours</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select>
        </div>
        {rows.length ? <div className="table-wrap"><table className="table">
          <thead><tr><th>When</th><th>Who</th><th>Module</th><th>What happened</th><th>Device · IP</th></tr></thead>
          <tbody>{rows.slice(0, 200).map((e) => (
            <tr key={e.id}>
              <td className="small nowrap"><div className="strong">{fmtTime(e.at)}</div><div className="xs muted">{fmtDate(e.at)} · {ago(e.at)}</div></td>
              <td><div className="row" style={{ gap: 8 }}><Avatar name={e.user} size="sm" /><div><div className="strong small">{e.user}</div><div className="xs muted">{roleLabel(e.role)}</div></div></div></td>
              <td className="small">{modLabel(e.module)}</td>
              <td className="small"><Badge tone={KIND[e.kind]?.[1]}>{KIND[e.kind]?.[0] || e.kind}</Badge> {e.action}</td>
              <td className="xs muted nowrap">{e.device}<div className="tnum">{e.ip}</div></td>
            </tr>
          ))}</tbody>
        </table></div> : <Empty>No events match these filters.</Empty>}
      </Card>
      <div className="xs muted" style={{ marginTop: 10 }}>Stored in the school’s own database partition, append-only (no update or delete permission for any role), kept for 3 years. Marks, fees and access changes also keep the old and new value.</div>
    </div>
  );
}

/* ───────────── Data backup ───────────── */
const TABLES = ['students', 'teachers', 'sections', 'attendance', 'marks', 'fee_invoices', 'homework', 'allocations', 'timetable_slots', 'staff_attendance', 'substitutions', 'certificates', 'student_roles', 'notices', 'audit_log'];

export function Backup() {
  const { data, slug, role, actions, notify } = useSchool();
  const [table, setTable] = useState('students');
  const [restoring, setRestoring] = useState(null);
  const [confirm, setConfirm] = useState('');
  const fileRef = useRef();
  const backups = data.backups || [];
  const rowCount = useMemo(() => TABLES.reduce((a, t) => a + (data[t]?.length || 0), 0), [data]);
  const canEdit = role === 'school_admin';
  const full = () => {
    const { meta, ...rest } = data;
    download(`${slug}-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ format: 'miz-school-backup', version: 1, school: data.school.slug, created_at: new Date().toISOString(), data: rest }));
    actions.logAudit({ module: 'backup', action: `Downloaded full backup (${rowCount.toLocaleString('en-IN')} rows, JSON)`, kind: 'export' });
    notify('Full backup downloaded');
  };
  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    f.text().then((txt) => {
      try {
        const j = JSON.parse(txt);
        if (j.format !== 'miz-school-backup' || !j.data?.students) throw new Error('Not a Miz School backup file');
        if (j.school !== data.school.slug) throw new Error(`This backup belongs to “${j.school}”, not ${data.school.short_name}`);
        setRestoring({ source: `File · ${f.name}`, at: j.created_at, payload: j.data });
      } catch (err) { notify(`Can’t restore: ${err.message}`); }
    });
    e.target.value = '';
  };
  return (
    <div>
      <PageHead title="Data backup & restore" sub="Automatic encrypted backups every night · download your data any time · restore needs typed confirmation"
        actions={canEdit && <>
          <button className="btn" onClick={() => { actions.update('backups', (b) => [{ id: `bk-m-${Date.now()}`, at: new Date().toISOString(), kind: 'Manual', size_mb: 37.2, status: 'verified', location: 'Mumbai (ap-south-1) + Hyderabad copy', by: 'Rohit Bhatnagar' }, ...(b || [])]); notify('Backup taken and verified'); }}><Icon name="refresh" size={16} /> Back up now</button>
          <button className="btn btn-primary" onClick={full}><Icon name="download" size={16} /> Download full backup</button>
        </>} />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Last backup" value={backups[0] ? ago(backups[0].at) : '—'} foot={backups[0] ? `${backups[0].kind} · verified` : ''} icon="check" tone="green" />
        <Stat label="Records protected" value={rowCount.toLocaleString('en-IN')} foot={`${TABLES.length} tables`} icon="layers" />
        <Stat label="Point-in-time restore" value="7 days" foot="Any minute in the last week" icon="history" tone="violet" />
        <Stat label="Kept for" value="30 + 12" foot="30 daily · 12 monthly copies" icon="calendar" tone="teal" />
      </div>
      <div className="grid alloc-side" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>
        <Card pad={false} title="Backup history" icon="history">
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Taken</th><th>Type</th><th className="num">Size</th><th>Stored in</th><th>Status</th>{canEdit && <th />}</tr></thead>
            <tbody>{backups.map((b) => (
              <tr key={b.id}><td className="small nowrap"><strong>{fmtDate(b.at, { day: 'numeric', month: 'short' })}</strong> {fmtTime(b.at)}</td><td><Badge tone={b.kind === 'Manual' ? 'violet' : b.kind.startsWith('Weekly') ? 'blue' : ''}>{b.kind}</Badge></td><td className="num small">{b.size_mb} MB</td><td className="xs muted">{b.location}</td><td><Badge tone="green">Verified</Badge></td>
                {canEdit && <td><button className="btn btn-sm" onClick={() => setRestoring({ source: `${b.kind} backup`, at: b.at, payload: null })}>Restore</button></td>}</tr>
            ))}</tbody>
          </table></div>
        </Card>
        <div className="stack">
          <Card title="Export one table" icon="download">
            <div className="stack-sm">
              <select className="select" value={table} onChange={(e) => setTable(e.target.value)}>{TABLES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')} ({(data[t] || []).length.toLocaleString('en-IN')})</option>)}</select>
              <button className="btn" disabled={!canEdit} onClick={() => { download(`${slug}-${table}.csv`, toCSV(data[table] || []), 'text/csv'); actions.logAudit({ module: 'backup', action: `Exported ${table.replace(/_/g, ' ')} (${(data[table] || []).length} rows, CSV)`, kind: 'export' }); notify('CSV downloaded — opens in Excel'); }}><Icon name="download" size={16} /> Download CSV</button>
            </div>
          </Card>
          {canEdit && (
            <Card title="Restore from a file" icon="upload">
              <div className="stack-sm small">
                <span className="muted">Upload a backup downloaded from this page. It is checked before anything changes.</span>
                <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onFile} />
                <button className="btn" onClick={() => fileRef.current?.click()}><Icon name="upload" size={16} /> Choose backup file</button>
              </div>
            </Card>
          )}
          <Card title="How your data is protected" icon="shield">
            <div className="stack-sm small">
              {['Encrypted at rest (AES-256) and in transit (TLS 1.3)', 'Stored in India — Mumbai, with a copy in Hyderabad', 'Each school’s data is separated in the database', 'Backups are test-restored every week', 'Only School Admin can download or restore; every download is in the Audit Log', 'Parents can ask for their child’s data or its deletion (DPDP Act 2023)'].map((t) => <div key={t} className="row top" style={{ gap: 8 }}><Icon name="tick" size={15} style={{ color: 'var(--success)', flex: 'none', marginTop: 2 }} />{t}</div>)}
            </div>
          </Card>
        </div>
      </div>
      {restoring && (
        <Modal title="Restore school data" onClose={() => { setRestoring(null); setConfirm(''); }} footer={<><button className="btn" onClick={() => { setRestoring(null); setConfirm(''); }}>Cancel</button><button className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={confirm !== 'RESTORE'} onClick={() => {
          const payload = restoring.payload || (() => { const { meta, ...rest } = localSchoolData(slug); return rest; })();
          actions.restoreData(payload, restoring.source);
          notify('Data restored — everyone sees the restored version now');
          setRestoring(null); setConfirm('');
        }}>Restore now</button></>}>
          <div className="stack small">
            <div>Source: <strong>{restoring.source}</strong> · taken {fmtDate(restoring.at, { day: 'numeric', month: 'short', year: 'numeric' })} {fmtTime(restoring.at)}</div>
            <div className="card card-b" style={{ background: 'var(--danger-bg)' }}>Everything entered after this backup (attendance, fees, marks) will be replaced. A safety backup of the current data is taken first, so this can be undone.</div>
            <div className="field"><label>Type RESTORE to confirm</label><input className="input" value={confirm} onChange={(e) => setConfirm(e.target.value.toUpperCase())} placeholder="RESTORE" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
