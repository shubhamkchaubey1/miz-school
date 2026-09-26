import { useMemo, useState } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { PageHead, Card, Stat, StatusBadge, Badge, Tabs, Modal, Avatar, Empty, Search, Bars, Progress, IconTile, TONES, inr, num, pct, fmtDate, fmtTime, ago } from '../../components/ui.jsx';
import { attendanceStats, studentAttendance, reportCard, feeSummary, todayISO } from '../../lib/derive.js';
import { ChildSwitcher } from '../dashboards/Dashboards.jsx';

const CHANNEL = {
  whatsapp: { label: 'WhatsApp', icon: 'chat', tone: 'green' },
  sms: { label: 'SMS', icon: 'phone2', tone: 'blue' },
  email: { label: 'Email', icon: 'mail', tone: 'violet' },
  push: { label: 'App push', icon: 'bell-ring', tone: 'amber' },
};
const ChannelBadge = ({ c }) => { const x = CHANNEL[c]; const [bg, fg] = TONES[x.tone]; return <span className="badge" style={{ background: bg, color: fg }}><Icon name={x.icon} size={12} /> {x.label}</span>; };

/* ───────────── Smart Insights (early-warning) ───────────── */
export function Insights() {
  const { data, idx, actions, notify } = useSchool();
  const exam = data.exams.find((e) => e.name.startsWith('Half'));
  const rows = useMemo(() => {
    const feeBy = {};
    data.fee_invoices.forEach((f) => { if (f.status === 'overdue') feeBy[f.student_id] = (feeBy[f.student_id] || 0) + Number(f.amount); });
    return data.students.filter((s) => idx.sections[s.section_id].stage !== 'pre').map((s) => {
      const att = studentAttendance(data, s.id);
      const rc = reportCard(data, idx, s.id, exam.id);
      const reasons = [];
      if (att.pct < 85) reasons.push(['check', `Attendance ${Math.round(att.pct)}%`]);
      if (rc.pct < 55) reasons.push(['award', `Scored ${rc.pct.toFixed(0)}% in ${exam.name.split(' ')[0]}`]);
      if (feeBy[s.id]) reasons.push(['wallet', `${inr(feeBy[s.id])} overdue`]);
      const risk = (att.pct < 85 ? 40 : 0) + (rc.pct < 55 ? 40 : 0) + (feeBy[s.id] ? 20 : 0) + Math.max(0, 90 - att.pct);
      return { s, att, rc, reasons, risk };
    }).filter((r) => r.reasons.length).sort((a, b) => b.risk - a.risk);
  }, [data, idx, exam]);
  const toppers = useMemo(() => data.students.filter((s) => idx.sections[s.section_id].stage !== 'pre').map((s) => ({ s, rc: reportCard(data, idx, s.id, exam.id) })).sort((a, b) => b.rc.pct - a.rc.pct).slice(0, 5), [data, idx, exam]);
  const lowAtt = rows.filter((r) => r.att.pct < 85).length;
  const lowMarks = rows.filter((r) => r.rc.pct < 55).length;
  const fee = feeSummary(data.fee_invoices);
  const subjAvg = data.subjects.filter((s) => data.marks.some((m) => m.subject_id === s.id)).map((sub) => {
    const ms = data.marks.filter((m) => m.subject_id === sub.id && m.exam_id === exam.id);
    return { label: sub.code, value: Math.round(ms.reduce((a, m) => a + (m.marks_obtained / m.max_marks) * 100, 0) / (ms.length || 1)) };
  });
  return (
    <div>
      <PageHead title="Smart Insights" sub="Early-warning signals the school should act on this week" />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Students needing attention" value={rows.length} icon="alert" tone="red" foot="Attendance, marks or fees" />
        <Stat label="Attendance below 85%" value={lowAtt} icon="user-x" tone="amber" foot="Last 24 school days" />
        <Stat label="Below 55% in exams" value={lowMarks} icon="award" tone="violet" foot={exam.name} />
        <Stat label="Fee collection" value={pct(fee.rate, 0)} icon="coins" tone="green" foot={`${inr(fee.overdue, true)} overdue`} />
      </div>
      <div className="grid g-main">
        <Card title="Students at risk" icon="alert" tone="red" pad={false} action={<button className="btn btn-sm btn-primary" onClick={() => notify(`WhatsApp sent to ${Math.min(rows.length, 20)} parents`)}><Icon name="chat" size={14} /> Message parents</button>}>
          <div className="table-wrap" style={{ maxHeight: 460 }}><table className="table">
            <thead><tr><th>Student</th><th>Class</th><th>Signals</th><th>Risk</th></tr></thead>
            <tbody>{rows.slice(0, 40).map((r) => (
              <tr key={r.s.id}>
                <td><div className="row" style={{ gap: 8 }}><Avatar name={r.s.full_name} size="sm" /><span className="strong small">{r.s.full_name}</span></div></td>
                <td>{idx.sections[r.s.section_id].name}</td>
                <td><div className="row wrap" style={{ gap: 4 }}>{r.reasons.map(([ic, t]) => <span key={t} className="badge amber"><Icon name={ic} size={12} /> {t}</span>)}</div></td>
                <td style={{ width: 110 }}><Progress value={Math.min(100, r.risk)} color={r.risk > 60 ? 'var(--danger)' : '#d98a00'} /></td>
              </tr>
            ))}</tbody>
          </table></div>
        </Card>
        <div className="stack">
          <Card title="Subject-wise average" icon="chart" tone="blue"><Bars data={subjAvg} highlightLast={false} format={(v) => `${v}%`} /></Card>
          <Card title="Top performers" icon="trophy" tone="amber" pad={false}>
            <div className="list">{toppers.map((t, i) => <div key={t.s.id} className="row"><span className="avatar sm" style={{ background: i === 0 ? '#f5c451' : undefined }}>{i + 1}</span><span className="grow strong small">{t.s.full_name} <span className="muted">· {idx.sections[t.s.section_id].name}</span></span><strong>{t.rc.pct.toFixed(1)}%</strong></div>)}</div>
          </Card>
          <Card title="Suggested actions" icon="clip-list" tone="navy" pad={false}>
            <div className="list small">
              {[['calendar', `Schedule remedial classes for ${lowMarks} students`], ['phone2', `Call parents of ${lowAtt} low-attendance students`], ['wallet', `Send fee reminder to ${fee.overdueCount} overdue accounts`], ['medal', 'Publish the merit list and appreciate top 5']].map(([ic, t]) => <div key={t} className="row"><IconTile icon={ic} size={30} /><span>{t}</span></div>)}
            </div>
          </Card>
        </div>
      </div>
      {actions && null}
    </div>
  );
}

/* ───────────── Branches (multi-campus) ───────────── */
export function Branches() {
  const { data, notify } = useSchool();
  const [list, setList] = useState(data.branches);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: '', city: '', head: '' });
  const total = list.reduce((a, b) => ({ students: a.students + b.students, teachers: a.teachers + b.teachers }), { students: 0, teachers: 0 });
  return (
    <div>
      <PageHead title="Branches" sub={`${list.length} campuses under ${data.school.short_name} group — one login, consolidated reports`} actions={<button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Add branch</button>} />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Campuses" value={list.length} icon="building" />
        <Stat label="Students (group)" value={num(total.students)} icon="users" />
        <Stat label="Teachers (group)" value={num(total.teachers)} icon="id" />
        <Stat label="Avg attendance" value={pct(list.reduce((a, b) => a + b.attendance, 0) / list.length)} icon="check" tone="green" />
      </div>
      <div className="grid g-2">
        {list.map((b) => (
          <Card key={b.id} title={b.name} icon="building" tone={b.main ? 'navy' : 'blue'} action={b.main ? <Badge tone="navy">Head office</Badge> : <Badge>{b.city}</Badge>}>
            <div className="grid g-4" style={{ gap: 8 }}>
              <div><div className="xs muted strong">Students</div><div className="strong" style={{ fontSize: 18 }}>{num(b.students)}</div></div>
              <div><div className="xs muted strong">Teachers</div><div className="strong" style={{ fontSize: 18 }}>{b.teachers}</div></div>
              <div><div className="xs muted strong">Attendance</div><div className="strong" style={{ fontSize: 18 }}>{b.attendance}%</div></div>
              <div><div className="xs muted strong">Fees</div><div className="strong" style={{ fontSize: 18 }}>{b.fee_collection}%</div></div>
            </div>
            <div style={{ marginTop: 12 }}><Progress value={b.fee_collection} color={b.fee_collection < 85 ? '#d98a00' : undefined} /></div>
            <div className="row between small" style={{ marginTop: 10 }}><span className="muted">Head: <strong style={{ color: 'var(--ink)' }}>{b.head}</strong> · Est. {b.established}</span><button className="btn btn-sm" onClick={() => notify(`Switched to ${b.name}`)}>Open</button></div>
          </Card>
        ))}
      </div>
      {adding && (
        <Modal title="Add a branch" onClose={() => setAdding(false)} footer={<><button className="btn" onClick={() => setAdding(false)}>Cancel</button><button className="btn btn-primary" disabled={!f.name} onClick={() => { setList([...list, { id: `br-${Date.now()}`, name: f.name, city: f.city || data.school.city, head: f.head || '—', students: 0, teachers: 0, attendance: 0, fee_collection: 0, established: new Date().getFullYear() }]); setAdding(false); notify('Branch created — shares branding, fee plans and reports'); }}>Create branch</button></>}>
          <div className="stack">
            <div className="field"><label>Branch name</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={`${data.school.short_name} — East Campus`} /></div>
            <div className="grid g-2"><div className="field"><label>City</label><input className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div><div className="field"><label>Branch head</label><input className="input" value={f.head} onChange={(e) => setF({ ...f, head: e.target.value })} /></div></div>
            <p className="xs muted">Branding, fee structures, report-card templates and roles are copied from the head office and can be changed per branch.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────────── Admissions CRM ───────────── */
const STAGES = [['enquiry', 'Enquiry', 'blue'], ['registered', 'Registered', 'violet'], ['test', 'Test / Interview', 'amber'], ['offered', 'Offer sent', 'teal'], ['admitted', 'Admitted', 'green']];
export function Admissions() {
  const { data, actions, notify } = useSchool();
  const [tab, setTab] = useState('pipeline');
  const [view, setView] = useState(null);
  const list = data.admissions;
  const move = (a, dir) => {
    const i = STAGES.findIndex(([k]) => k === a.stage);
    const next = STAGES[Math.min(4, Math.max(0, i + dir))][0];
    actions.update('admissions', (rows) => rows.map((x) => (x.id === a.id ? { ...x, stage: next, fee_paid: next === 'admitted' } : x)));
    notify(`${a.student_name} → ${STAGES.find(([k]) => k === next)[1]} · WhatsApp sent to parent`);
  };
  const conv = Math.round((list.filter((a) => a.stage === 'admitted').length / list.length) * 100);
  return (
    <div>
      <PageHead title="Admissions CRM" sub="Session 2027–28 · enquiry to admission in one pipeline" actions={<><button className="btn" onClick={() => setTab('form')}><Icon name="globe" size={16} /> Online form</button><button className="btn btn-primary" onClick={() => setTab('form')}><Icon name="plus" size={16} /> New application</button></>} />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Applications" value={list.length} icon="user-plus" foot="This session" />
        <Stat label="Tests scheduled" value={list.filter((a) => a.stage === 'test').length} icon="clip-check" tone="amber" />
        <Stat label="Admitted" value={list.filter((a) => a.stage === 'admitted').length} icon="badge" tone="green" foot="Fee received" />
        <Stat label="Conversion" value={`${conv}%`} icon="trend" tone="violet" foot="Enquiry → admission" />
      </div>
      <Tabs tabs={[['pipeline', 'Pipeline'], ['list', 'All applications'], ['form', 'Online admission form'], ['sources', 'Lead sources']]} value={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === 'pipeline' && (
          <div className="kanban">
            {STAGES.map(([k, label, tone]) => {
              const items = list.filter((a) => a.stage === k);
              const [bg, fg] = TONES[tone];
              return (
                <div key={k} className="kan-col">
                  <div className="kan-head" style={{ borderTopColor: fg }}><span className="strong small">{label}</span><span className="badge" style={{ background: bg, color: fg }}>{items.length}</span></div>
                  {items.map((a) => (
                    <div key={a.id} className="kan-card" onClick={() => setView(a)}>
                      <div className="strong small">{a.student_name}</div>
                      <div className="xs muted">{a.grade} · {a.source}</div>
                      {a.test_score && <div className="xs" style={{ marginTop: 4 }}>Test: <strong>{a.test_score}%</strong></div>}
                      <div className="row between" style={{ marginTop: 8 }}>
                        <span className="xs muted">{ago(a.created_at)}</span>
                        <div className="row" style={{ gap: 4 }}>
                          {k !== 'enquiry' && <button className="icon-btn" style={{ width: 26, height: 26, border: '1px solid var(--line)' }} onClick={(e) => { e.stopPropagation(); move(a, -1); }} aria-label="Move back">‹</button>}
                          {k !== 'admitted' && <button className="icon-btn" style={{ width: 26, height: 26, border: '1px solid var(--line)', color: 'var(--brand)' }} onClick={(e) => { e.stopPropagation(); move(a, 1); }} aria-label="Move forward">›</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        {tab === 'list' && (
          <Card pad={false}><div className="table-wrap"><table className="table">
            <thead><tr><th>App no.</th><th>Student</th><th>Class</th><th>Parent</th><th>Source</th><th>Counsellor</th><th>Stage</th></tr></thead>
            <tbody>{list.map((a) => <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setView(a)}><td className="small tnum">{a.app_no}</td><td className="strong">{a.student_name}</td><td>{a.grade}</td><td className="small">{a.parent_name}<div className="xs muted">{a.phone}</div></td><td className="small">{a.source}</td><td className="small">{a.counsellor}</td><td><Badge tone={STAGES.find(([k]) => k === a.stage)[2]}>{STAGES.find(([k]) => k === a.stage)[1]}</Badge></td></tr>)}</tbody>
          </table></div></Card>
        )}
        {tab === 'form' && <AdmissionForm onDone={() => setTab('pipeline')} />}
        {tab === 'sources' && (
          <div className="grid g-2">
            <Card title="Applications by source" icon="chart" tone="blue"><Bars highlightLast={false} data={['Website', 'Walk-in', 'Referral', 'Google Ads', 'Newspaper', 'Instagram'].map((s) => ({ label: s.split(' ')[0], value: list.filter((a) => a.source === s).length }))} /></Card>
            <Card title="Applications by class" icon="layers" tone="violet"><Bars highlightLast={false} data={['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 3', 'Class 6', 'Class 9', 'Class 11'].map((s) => ({ label: s.replace('Class ', 'C'), value: list.filter((a) => a.grade === s).length }))} /></Card>
          </div>
        )}
      </div>
      {view && (
        <Modal title={view.student_name} onClose={() => setView(null)} footer={<><button className="btn" onClick={() => { notify('Call logged'); }}><Icon name="call" size={14} /> Call</button><button className="btn" onClick={() => notify('WhatsApp sent')}><Icon name="chat" size={14} /> WhatsApp</button>{view.stage !== 'admitted' && <button className="btn btn-primary" onClick={() => { move(view, 1); setView(null); }}>Move to next stage</button>}</>}>
          <div className="stack-sm small">
            {[['Application', view.app_no], ['Class sought', view.grade], ['Parent', view.parent_name], ['Mobile', view.phone], ['Source', view.source], ['Counsellor', view.counsellor], ['Entrance test', view.test_score ? `${view.test_score}%` : 'Not taken'], ['Registration fee', view.stage === 'enquiry' ? 'Pending' : '₹1,500 paid online']].map(([k, v]) => <div key={k} className="row between"><span className="muted">{k}</span><strong>{v}</strong></div>)}
            <div className="divider" />
            <div className="row wrap" style={{ gap: 6 }}>{STAGES.map(([k, l], i) => <span key={k} className={`badge ${STAGES.findIndex(([x]) => x === view.stage) >= i ? 'green' : ''}`}>{i + 1}. {l}</span>)}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdmissionForm({ onDone }) {
  const { data, actions, notify } = useSchool();
  const [f, setF] = useState({ student_name: '', grade: 'Class 1', dob: '', parent_name: '', phone: '', email: '', prev_school: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="grid g-main" style={{ alignItems: 'start' }}>
      <Card title={`Admission application — ${data.school.name}`} icon="file" tone="blue" footer={<div className="row between wrap"><span className="xs muted">Registration fee ₹1,500 · pay by UPI / card after submitting</span><button className="btn btn-primary" disabled={!f.student_name || !f.phone} onClick={() => { actions.update('admissions', (rows) => [{ id: `adm-${Date.now()}`, app_no: `APP/NEW/${rows.length + 101}`, ...f, source: 'Website', stage: 'registered', test_score: null, counsellor: 'Kiran Sethi', created_at: new Date().toISOString() }, ...rows]); notify('Application submitted — confirmation sent on WhatsApp & email'); onDone(); }}>Submit & pay ₹1,500</button></div>}>
        <div className="grid g-2">
          <div className="field"><label>Student’s full name</label><input className="input" value={f.student_name} onChange={set('student_name')} /></div>
          <div className="field"><label>Class applying for</label><select className="select" value={f.grade} onChange={set('grade')}>{['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 6', 'Class 9', 'Class 11'].map((g) => <option key={g}>{g}</option>)}</select></div>
          <div className="field"><label>Date of birth</label><input type="date" className="input" value={f.dob} onChange={set('dob')} /></div>
          <div className="field"><label>Previous school</label><input className="input" value={f.prev_school} onChange={set('prev_school')} /></div>
          <div className="field"><label>Parent / guardian name</label><input className="input" value={f.parent_name} onChange={set('parent_name')} /></div>
          <div className="field"><label>Mobile (WhatsApp)</label><input className="input" value={f.phone} onChange={set('phone')} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Email</label><input className="input" value={f.email} onChange={set('email')} /></div>
        </div>
        <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>{['Birth certificate', 'Aadhaar', 'Previous report card', 'Passport photo'].map((d) => <button key={d} className="btn btn-sm"><Icon name="upload" size={14} /> {d}</button>)}</div>
      </Card>
      <Card title="How parents see it" icon="phone2" tone="teal">
        <div className="stack-sm small">
          {[['globe', 'Link shared on the school website & Instagram'], ['file', 'Form filled on phone in 3 minutes'], ['coins', 'Registration fee paid online'], ['chat', 'Confirmation + test date on WhatsApp'], ['clip-check', 'Result and offer letter by email'], ['badge', 'Admission fee → student record created automatically']].map(([ic, t], i) => <div key={t} className="row"><IconTile icon={ic} size={30} /><span><strong>{i + 1}.</strong> {t}</span></div>)}
        </div>
      </Card>
    </div>
  );
}

/* ───────────── Communication hub: WhatsApp / SMS / Email / Push ───────────── */
export function Communication() {
  const { data, actions, notify } = useSchool();
  const [tab, setTab] = useState('compose');
  const [ch, setCh] = useState({ whatsapp: true, sms: false, email: true, push: true });
  const [aud, setAud] = useState('All parents');
  const [msg, setMsg] = useState('Dear Parents, the school will remain closed on 2 October on account of Gandhi Jayanti. Classes resume on 3 October. — ' + data.school.short_name);
  const counts = { 'All parents': data.students.length, 'Class 8A parents': 22, 'Fee defaulters': data.fee_invoices.filter((f) => f.status === 'overdue').length, 'All staff': data.teachers.length + data.staff_support.length, 'Bus route R-01': data.students.filter((s) => s.route_id === data.routes[0].id).length };
  const st = data.comm_stats;
  const send = () => {
    const chosen = Object.keys(ch).filter((k) => ch[k]);
    actions.update('comm_logs', (rows) => [...chosen.map((c, i) => ({ id: `cl-new-${Date.now()}-${i}`, at: new Date().toISOString(), channel: c, template: 'Broadcast', to: aud, status: 'sent' })), ...rows]);
    notify(`Sent to ${counts[aud]} recipients via ${chosen.map((c) => CHANNEL[c].label).join(', ')}`);
    actions.push(['all'], 'School announcement', msg.slice(0, 90), 'notice', []);
    setTab('log');
  };
  return (
    <div>
      <PageHead title="WhatsApp, SMS & Email" sub="One place for every message the school sends — with delivery and read receipts" />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="WhatsApp this month" value={num(st.whatsapp.sent)} icon="chat" tone="green" foot={`${pct((st.whatsapp.read / st.whatsapp.sent) * 100, 0)} read`} />
        <Stat label="SMS" value={num(st.sms.sent)} icon="phone2" tone="blue" foot={`${pct((st.sms.delivered / st.sms.sent) * 100, 0)} delivered`} />
        <Stat label="Email" value={num(st.email.sent)} icon="mail" tone="violet" foot={`${pct((st.email.opened / st.email.sent) * 100, 0)} opened`} />
        <Stat label="App push" value={num(st.push.sent)} icon="bell-ring" tone="amber" foot="Parent & student apps" />
      </div>
      <Tabs tabs={[['compose', 'Broadcast'], ['auto', 'Automations'], ['templates', 'Templates'], ['log', 'Delivery log']]} value={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === 'compose' && (
          <div className="grid g-main" style={{ alignItems: 'start' }}>
            <Card title="New broadcast" icon="send" tone="blue" footer={<div className="row between wrap"><span className="small muted">{counts[aud]} recipients · est. cost ₹{Math.round(counts[aud] * ((ch.whatsapp ? 0.35 : 0) + (ch.sms ? 0.18 : 0)))}</span><button className="btn btn-primary" onClick={send}><Icon name="send" size={16} /> Send now</button></div>}>
              <div className="stack">
                <div className="field"><label>Send to</label><div className="row wrap" style={{ gap: 6 }}>{Object.keys(counts).map((a) => <button key={a} className="btn btn-sm" style={aud === a ? { background: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' } : undefined} onClick={() => setAud(a)}>{a} ({counts[a]})</button>)}</div></div>
                <div className="field"><label>Channels</label><div className="row wrap" style={{ gap: 8 }}>{Object.entries(CHANNEL).map(([k, x]) => <label key={k} className="chan" data-on={ch[k]}><input type="checkbox" checked={ch[k]} onChange={(e) => setCh({ ...ch, [k]: e.target.checked })} /><Icon name={x.icon} size={16} /> {x.label}</label>)}</div></div>
                <div className="field"><label>Message</label><textarea className="input" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} /><span className="xs muted">{msg.length} characters · variables like {'{student}'} and {'{class}'} are filled per parent</span></div>
                <div className="row wrap" style={{ gap: 8 }}><button className="btn btn-sm"><Icon name="upload" size={14} /> Attach PDF / image</button><button className="btn btn-sm"><Icon name="clock" size={14} /> Schedule</button></div>
              </div>
            </Card>
            <Card title="WhatsApp preview" icon="chat" tone="green">
              <div className="wa">
                <div className="wa-head"><span className="avatar sm" style={{ background: '#fff', color: 'var(--brand-ink)' }}>{data.school.crest_initials}</span><div><div className="strong small">{data.school.short_name}</div><div className="xs" style={{ opacity: .8 }}>Verified business</div></div></div>
                <div className="wa-body"><div className="wa-msg">{msg}<div className="wa-time">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ✓✓</div></div></div>
              </div>
            </Card>
          </div>
        )}
        {tab === 'auto' && (
          <Card pad={false}><div className="list">
            {data.automations.map((a) => {
              const t = data.comm_templates.find((x) => x.id === a.template);
              return (
                <div key={a.id} className="row wrap">
                  <IconTile icon="timer" tone={a.on ? 'green' : 'navy'} size={38} />
                  <div className="grow" style={{ minWidth: 220 }}><div className="strong small">{a.name}</div><div className="xs muted">{a.when} · {num(a.sent_month)} sent this month</div></div>
                  <div className="row wrap" style={{ gap: 4 }}>{t.channel.map((c) => <ChannelBadge key={c} c={c} />)}</div>
                  <label className="switch"><input type="checkbox" checked={a.on} onChange={(e) => { actions.update('automations', (rows) => rows.map((x) => (x.id === a.id ? { ...x, on: e.target.checked } : x))); notify(`${a.name}: ${e.target.checked ? 'ON' : 'OFF'}`); }} /><span /></label>
                </div>
              );
            })}
          </div></Card>
        )}
        {tab === 'templates' && (
          <div className="grid g-2">{data.comm_templates.map((t) => (
            <Card key={t.id} title={t.name} icon="file" tone="violet" action={<span className="xs muted">{t.trigger}</span>}>
              <p className="small" style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, border: '1px solid var(--line)' }}>{t.text}</p>
              <div className="row wrap" style={{ gap: 4, marginTop: 10 }}>{t.channel.map((c) => <ChannelBadge key={c} c={c} />)}{t.channel.includes('whatsapp') && <Badge tone="green">Meta approved</Badge>}</div>
            </Card>
          ))}</div>
        )}
        {tab === 'log' && (
          <Card pad={false}><div className="table-wrap"><table className="table">
            <thead><tr><th>Time</th><th>Channel</th><th>Message</th><th>To</th><th>Status</th></tr></thead>
            <tbody>{data.comm_logs.map((l) => <tr key={l.id}><td className="small tnum nowrap">{fmtTime(l.at)}</td><td><ChannelBadge c={l.channel} /></td><td className="small strong">{l.template}</td><td className="small tnum">{l.to}</td><td><Badge tone={l.status === 'failed' ? 'red' : l.status === 'read' || l.status === 'opened' ? 'green' : 'blue'}>{l.status}</Badge></td></tr>)}</tbody>
          </table></div></Card>
        )}
      </div>
    </div>
  );
}

/* ───────────── Messages (parent ↔ teacher) ───────────── */
export function Messages() {
  const { data, idx, role, persona, actions } = useSchool();
  const threads = role === 'parent' ? data.threads.filter((t) => persona.children.some((c) => c.id === t.student_id))
    : role === 'teacher' ? data.threads.filter((t) => t.teacher_id === persona.teacher.id || idx.students[t.student_id]?.section_id === persona.section.id) : data.threads;
  const [sel, setSel] = useState(threads[0]?.id);
  const [text, setText] = useState('');
  const th = data.threads.find((t) => t.id === sel);
  const me = role === 'parent' ? 'parent' : 'teacher';
  const send = () => {
    if (!text.trim()) return;
    actions.update('threads', (rows) => rows.map((t) => (t.id === sel ? { ...t, messages: [...t.messages, { from: me, text, at: new Date().toISOString() }] } : t)));
    actions.push([me === 'parent' ? 'teacher' : 'parent'], 'New message', text.slice(0, 80), 'notice', ['push']);
    setText('');
  };
  return (
    <div>
      <PageHead title="Messages" sub="Private parent–teacher conversations · school hours 8 AM – 6 PM" />
      <div className="chat card">
        <div className="chat-list">
          {threads.map((t) => {
            const s = idx.students[t.student_id]; const tc = idx.teachers[t.teacher_id]; const last = t.messages[t.messages.length - 1];
            return (
              <button key={t.id} className={`chat-item ${sel === t.id ? 'on' : ''}`} onClick={() => setSel(t.id)}>
                <Avatar name={role === 'parent' ? tc?.full_name : s?.guardian_name} size="sm" />
                <span className="grow" style={{ minWidth: 0 }}><span className="strong small" style={{ display: 'block' }}>{role === 'parent' ? tc?.full_name : `${s?.guardian_name}`}</span><span className="xs muted ellipsis">{t.subject} · {last.text}</span></span>
              </button>
            );
          })}
          {!threads.length && <Empty>No conversations yet.</Empty>}
        </div>
        {th ? (
          <div className="chat-pane">
            <div className="chat-top"><div><div className="strong">{th.subject}</div><div className="xs muted">{idx.students[th.student_id]?.full_name} · Class {idx.sections[idx.students[th.student_id]?.section_id]?.name} · {idx.teachers[th.teacher_id]?.full_name}</div></div></div>
            <div className="chat-body">{th.messages.map((m, i) => <div key={i} className={`bubble ${m.from === me ? 'me' : ''}`}>{m.text}<span>{fmtTime(m.at)}</span></div>)}</div>
            <div className="chat-input"><input className="input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Type a message…" /><button className="btn btn-primary" onClick={send}><Icon name="send" size={16} /></button></div>
          </div>
        ) : <div className="chat-pane"><Empty>Select a conversation</Empty></div>}
      </div>
    </div>
  );
}

/* ───────────── PTM slot booking ───────────── */
export function PTM() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const secId = role === 'parent' ? persona.child.section_id : role === 'teacher' ? persona.section.id : data.sections[4].id;
  const [sec, setSec] = useState(secId);
  const s = role === 'parent' ? persona.child.section_id : sec;
  const slots = data.ptm_slots.filter((p) => p.section_id === s);
  const mine = role === 'parent' ? slots.find((p) => p.student_id === persona.child.id) : null;
  const book = (p) => { actions.update('ptm_slots', (rows) => rows.map((x) => (x.student_id === persona.child.id ? { ...x, student_id: null } : x.id === p.id ? { ...x, student_id: persona.child.id } : x))); notify(`PTM booked at ${p.time} — confirmation on WhatsApp`); actions.push(['teacher', 'parent'], 'PTM slot booked', `${persona.child.full_name} · ${p.time} · ${p.mode}`, 'notice'); };
  return (
    <div>
      <PageHead title="Parent–Teacher Meeting" sub={`${fmtDate(slots[0]?.date, { weekday: 'long', day: 'numeric', month: 'long' })} · Class ${idx.sections[s].name} · ${idx.teachers[idx.sections[s].class_teacher_id]?.full_name}`} actions={role === 'parent' ? <ChildSwitcher /> : role !== 'teacher' && <select className="select" style={{ width: 'auto' }} value={sec} onChange={(e) => setSec(e.target.value)}>{data.sections.map((x) => <option key={x.id} value={x.id}>Class {x.name}</option>)}</select>} />
      {mine && <div className="card card-b row" style={{ marginBottom: 16, background: 'var(--success-bg)', borderColor: '#a6d9bc' }}><Icon name="cal-check" size={22} style={{ color: 'var(--success)' }} /><div className="grow"><strong>Your slot: {mine.time}</strong> · {mine.mode}{mine.mode === 'Video call' && ' — join link will be shared 10 min before'}</div></div>}
      <div className="grid g-4">
        {slots.map((p) => {
          const st = p.student_id ? idx.students[p.student_id] : null;
          const isMine = role === 'parent' && p.student_id === persona.child.id;
          return (
            <div key={p.id} className="card card-b slot" data-state={isMine ? 'mine' : st ? 'booked' : 'free'}>
              <div className="row between"><strong style={{ fontSize: 18 }}>{p.time}</strong><Badge tone={p.mode === 'Video call' ? 'violet' : 'blue'}>{p.mode}</Badge></div>
              <div className="small" style={{ margin: '8px 0', minHeight: 20 }}>{st ? (role === 'parent' && !isMine ? 'Booked' : <><strong>{st.full_name}</strong><span className="muted"> · {st.guardian_name}</span></>) : <span className="muted">Available</span>}</div>
              {role === 'parent' && !st && <button className="btn btn-sm btn-primary btn-block" onClick={() => book(p)}>Book this slot</button>}
              {isMine && <span className="badge green">Booked by you</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── School calendar ───────────── */
export function CalendarPage() {
  const { data } = useSchool();
  const now = new Date();
  const [m, setM] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const lead = (m.getDay() + 6) % 7;
  const key = (d) => `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const ev = (d) => data.calendar.filter((e) => e.date === key(d));
  const TYPE = { holiday: 'red', exam: 'violet', event: 'blue', ptm: 'teal', staff: 'amber' };
  const today = todayISO();
  const upcoming = data.calendar.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div>
      <PageHead title="School calendar" sub="Holidays, exams, events and PTMs — synced to parent & student apps" actions={<div className="row" style={{ gap: 4 }}><button className="btn btn-sm" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))}>‹</button><strong style={{ minWidth: 140, textAlign: 'center' }}>{m.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong><button className="btn btn-sm" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))}>›</button></div>} />
      <div className="grid g-main" style={{ alignItems: 'start' }}>
        <Card pad={false}>
          <div className="bigcal">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="bc-h">{d}</div>)}
            {Array.from({ length: lead }, (_, i) => <div key={`e${i}`} className="bc-d empty" />)}
            {Array.from({ length: days }, (_, i) => (
              <div key={i} className={`bc-d ${key(i + 1) === today ? 'today' : ''}`}>
                <span className="n">{i + 1}</span>
                {ev(i + 1).map((e) => { const [bg, fg] = TONES[TYPE[e.type]]; return <span key={e.id} className="bc-ev" style={{ background: bg, color: fg }}>{e.title}</span>; })}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Coming up" icon="cal-check" tone="teal" pad={false}>
          <div className="list">{upcoming.map((e) => { const [bg, fg] = TONES[TYPE[e.type]]; return <div key={e.id} className="row"><span className="date-box"><span className="m" style={{ background: fg }}>{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' })}</span><span className="d">{new Date(e.date).getDate()}</span></span><div className="grow"><div className="strong small">{e.title}</div><span className="badge" style={{ background: bg, color: fg }}>{e.type}</span></div></div>; })}</div>
        </Card>
      </div>
    </div>
  );
}

/* ───────────── Gate pass with OTP ───────────── */
export function GatePass() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const [otp, setOtp] = useState('');
  const [f, setF] = useState({ pickup_by: 'Father', pickup_name: persona.name || '', reason: 'Doctor appointment' });
  const passes = role === 'parent' ? data.gate_passes.filter((g) => persona.children.some((c) => c.id === g.student_id)) : data.gate_passes;
  const verify = () => {
    const g = data.gate_passes.find((x) => x.otp === otp && x.status === 'pending');
    if (!g) { notify('Invalid or expired OTP'); return; }
    actions.update('gate_passes', (rows) => rows.map((x) => (x.id === g.id ? { ...x, status: 'verified', verified_at: new Date().toISOString() } : x)));
    notify(`Verified — ${idx.students[g.student_id].full_name} released to ${g.pickup_name}`);
    actions.push(['parent', 'teacher'], 'Child released at gate', `${idx.students[g.student_id].full_name} left with ${g.pickup_name} (OTP verified)`, 'attendance', ['push', 'whatsapp', 'sms']);
    setOtp('');
  };
  const request = () => {
    const code = String(1000 + Math.floor(Math.random() * 8999));
    actions.update('gate_passes', (rows) => [{ id: `gp-${Date.now()}`, student_id: persona.child.id, ...f, otp: code, requested_at: new Date().toISOString(), status: 'pending' }, ...rows]);
    notify(`Gate pass created — OTP ${code} sent on WhatsApp`);
    actions.push(['scanner', 'teacher'], 'Early pickup requested', `${persona.child.full_name} · ${f.pickup_name} (${f.pickup_by})`, 'attendance');
  };
  return (
    <div>
      <PageHead title="Gate pass (OTP pickup)" sub="A child leaves early only when the gate verifies the parent’s one-time code" actions={role === 'parent' && <ChildSwitcher />} />
      <div className="grid g-main" style={{ alignItems: 'start' }}>
        <Card title={role === 'parent' ? 'Recent passes' : 'Today’s gate passes'} icon="door" tone="teal" pad={false}>
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Student</th><th>Pickup by</th><th>Reason</th><th>Requested</th>{role === 'parent' && <th>OTP</th>}<th>Status</th></tr></thead>
            <tbody>{passes.map((g) => <tr key={g.id}><td className="strong small">{idx.students[g.student_id]?.full_name}<div className="xs muted">Class {idx.sections[idx.students[g.student_id]?.section_id]?.name}</div></td><td className="small">{g.pickup_name}<div className="xs muted">{g.pickup_by}</div></td><td className="small">{g.reason}</td><td className="small">{ago(g.requested_at)}</td>{role === 'parent' && <td><strong className="tnum" style={{ letterSpacing: 2 }}>{g.status === 'pending' ? g.otp : '••••'}</strong></td>}<td><Badge tone={g.status === 'verified' ? 'green' : g.status === 'pending' ? 'amber' : ''}>{g.status}</Badge></td></tr>)}</tbody>
          </table></div>
          {!passes.length && <Empty>No gate passes.</Empty>}
        </Card>
        {role === 'parent' ? (
          <Card title={`Early pickup — ${persona.child.full_name.split(' ')[0]}`} icon="user-check" tone="green" footer={<button className="btn btn-primary btn-block" onClick={request}>Generate OTP pass</button>}>
            <div className="stack">
              <div className="field"><label>Who will pick up?</label><select className="select" value={f.pickup_by} onChange={(e) => setF({ ...f, pickup_by: e.target.value })}>{['Father', 'Mother', 'Grandparent', 'Relative', 'Driver'].map((x) => <option key={x}>{x}</option>)}</select></div>
              <div className="field"><label>Name</label><input className="input" value={f.pickup_name} onChange={(e) => setF({ ...f, pickup_name: e.target.value })} /></div>
              <div className="field"><label>Reason</label><input className="input" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
              <p className="xs muted">The class teacher is informed instantly. The OTP is valid for 2 hours and works only once.</p>
            </div>
          </Card>
        ) : (
          <Card title="Verify OTP at the gate" icon="lock" tone="navy">
            <div className="stack" style={{ alignItems: 'center' }}>
              <input className="input otp" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="• • • •" />
              <button className="btn btn-primary btn-block btn-lg" onClick={verify} disabled={otp.length !== 4}>Verify & release</button>
              <p className="xs muted">Demo: pending OTPs are {data.gate_passes.filter((g) => g.status === 'pending').map((g) => g.otp).join(', ') || '—'}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
