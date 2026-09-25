import { useState } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { PageHead, Card, Stat, StatusBadge, Badge, Search, Tabs, Modal, Bars, Empty, Progress, Avatar, inr, pct, fmtDate, ago } from '../../components/ui.jsx';
import { feeSummary, collectionByMonth, attendanceStats, attendanceOn, sectionResults } from '../../lib/derive.js';
import { ChildSwitcher } from '../dashboards/Dashboards.jsx';
import { Crest } from '../../components/Brand.jsx';

/* ───────────── Fees ───────────── */
export function Fees() {
  const { role } = useSchool();
  return role === 'parent' ? <FeesParent /> : <FeesOffice />;
}

function FeesOffice() {
  const { data, idx, actions, notify } = useSchool();
  const [tab, setTab] = useState('overdue');
  const [q, setQ] = useState('');
  const [collect, setCollect] = useState(null);
  const [method, setMethod] = useState('Cash');
  const s = feeSummary(data.fee_invoices);
  const rows = data.fee_invoices.filter((f) => (tab === 'all' || f.status === tab) && (!q || `${idx.students[f.student_id]?.full_name} ${f.invoice_no}`.toLowerCase().includes(q.toLowerCase())));
  const byClass = data.sections.map((sec) => {
    const ids = new Set((idx.studentsBySection[sec.id] || []).map((x) => x.id));
    return { sec, ...feeSummary(data.fee_invoices.filter((f) => ids.has(f.student_id))) };
  });
  return (
    <div>
      <PageHead title="Fees" sub="Collection, dues and receipts" actions={<><button className="btn"><Icon name="download" size={16} /> Export</button><button className="btn btn-primary"><Icon name="send" size={16} /> Send reminders ({s.overdueCount})</button></>} />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Collected this session" value={inr(s.collected, true)} foot={`${s.paidCount} receipts`} icon="rupee" tone="green" />
        <Stat label="Overdue" value={inr(s.overdue, true)} foot={`${s.overdueCount} invoices`} icon="alert" tone="red" />
        <Stat label="Due this month" value={inr(s.due, true)} foot={`${s.dueCount} invoices`} icon="calendar" tone="amber" />
        <Stat label="Collection rate" value={pct(s.rate, 1)} foot="Of billed to date" icon="trend" />
      </div>
      <div className="grid g-main" style={{ marginBottom: 16 }}>
        <Card title="Collections by month"><Bars data={collectionByMonth(data.fee_invoices)} format={(v) => inr(v, true)} /></Card>
        <Card title="Class-wise dues" pad={false}>
          <div className="list" style={{ maxHeight: 250, overflow: 'auto' }}>
            {byClass.map((c) => <div key={c.sec.id} className="row"><strong style={{ width: 36 }}>{c.sec.name}</strong><div className="grow"><Progress value={c.rate} /></div><span className="small tnum" style={{ width: 80, textAlign: 'right' }}>{inr(c.pending, true)}</span></div>)}
          </div>
        </Card>
      </div>
      <Card pad={false}>
        <div className="card-h row wrap">
          <Tabs tabs={[['overdue', 'Overdue'], ['due', 'Due'], ['paid', 'Paid'], ['all', 'All invoices']]} value={tab} onChange={setTab} />
          <Search value={q} onChange={setQ} placeholder="Student or invoice no." style={{ width: 260 }} />
        </div>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Invoice</th><th>Student</th><th>Class</th><th>Fee head</th><th>Due</th><th className="num">Amount</th><th>Status</th><th /></tr></thead>
          <tbody>{rows.slice(0, 60).map((f) => { const st = idx.students[f.student_id]; return (
            <tr key={f.id}><td className="small tnum">{f.invoice_no}</td><td className="strong">{st?.full_name}</td><td>{idx.sections[st?.section_id]?.name}</td><td className="small">{f.title}</td><td className="small">{fmtDate(f.due_on)}</td><td className="num strong">{inr(f.amount)}</td><td><StatusBadge status={f.status} /></td>
              <td>{f.status === 'paid' ? <span className="xs muted">{f.receipt_no} · {f.method}</span> : <button className="btn btn-sm btn-primary" onClick={() => setCollect(f)}>Collect</button>}</td></tr>
          ); })}</tbody>
        </table></div>
        {!rows.length && <Empty>No invoices.</Empty>}
      </Card>
      {collect && (
        <Modal title="Collect fee" onClose={() => setCollect(null)} footer={<><button className="btn" onClick={() => setCollect(null)}>Cancel</button><button className="btn btn-primary" onClick={() => { actions.payInvoice(collect.id, method); notify(`Receipt generated · ${inr(collect.amount)}`); setCollect(null); }}>Collect {inr(collect.amount)}</button></>}>
          <div className="stack">
            <div className="card card-b" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}>
              <div className="strong">{idx.students[collect.student_id]?.full_name}</div>
              <div className="small muted">{collect.title} · {collect.invoice_no}</div>
            </div>
            <div className="field"><label>Payment mode</label><div className="row wrap" style={{ gap: 6 }}>{['Cash', 'UPI', 'Card', 'Cheque', 'Net Banking'].map((m) => <button key={m} className="btn btn-sm" style={method === m ? { borderColor: 'var(--brand)', color: 'var(--brand)', background: 'var(--brand-50)' } : undefined} onClick={() => setMethod(m)}>{m}</button>)}</div></div>
            <div className="field"><label>Reference / remarks</label><input className="input" placeholder="Cheque no., UTR, etc." /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FeesParent() {
  const { data, idx, persona, actions, notify } = useSchool();
  const s = persona.child;
  const [pay, setPay] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const fees = data.fee_invoices.filter((f) => f.student_id === s.id).sort((a, b) => a.due_on.localeCompare(b.due_on));
  const sum = feeSummary(fees);
  return (
    <div>
      <PageHead title="Fees" sub={`${s.full_name} · Class ${idx.sections[s.section_id].name}`} actions={<ChildSwitcher />} />
      <div className="grid g-3" style={{ marginBottom: 16 }}>
        <Stat label="Outstanding" value={sum.pending ? inr(sum.pending) : 'Nil'} icon="wallet" tone={sum.overdue ? 'red' : 'green'} foot={sum.overdue ? `${inr(sum.overdue)} overdue` : 'No overdue fees'} />
        <Stat label="Paid this session" value={inr(sum.collected)} icon="check" tone="green" foot={`${sum.paidCount} receipts`} />
        <Stat label="Next due" value={fmtDate(fees.find((f) => f.status !== 'paid')?.due_on)} icon="calendar" foot={fees.find((f) => f.status !== 'paid')?.title || '—'} />
      </div>
      <Card pad={false}>
        <div className="list">
          {fees.map((f) => (
            <div key={f.id} className="row wrap">
              <div className="grow" style={{ minWidth: 200 }}><div className="strong">{f.title}</div><div className="xs muted">{f.invoice_no} · Due {fmtDate(f.due_on, { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>
              <strong className="tnum" style={{ width: 90, textAlign: 'right' }}>{inr(f.amount)}</strong>
              <StatusBadge status={f.status} />
              {f.status === 'paid' ? <button className="btn btn-sm" onClick={() => setReceipt(f)}><Icon name="receipt" size={14} /> Receipt</button>
                : f.status === 'upcoming' ? <button className="btn btn-sm" disabled>Pay</button>
                : <button className="btn btn-sm btn-primary" onClick={() => setPay(f)}>Pay now</button>}
            </div>
          ))}
        </div>
      </Card>
      {pay && (
        <Modal title="Pay school fee" onClose={() => setPay(null)} footer={<><button className="btn" onClick={() => setPay(null)}>Cancel</button><button className="btn btn-primary" onClick={() => { actions.payInvoice(pay.id, 'UPI'); notify('Payment successful — receipt sent to your email'); setPay(null); }}>Pay {inr(pay.amount)}</button></>}>
          <div className="stack">
            <div className="row between"><div><div className="strong">{pay.title}</div><div className="xs muted">{s.full_name} · {pay.invoice_no}</div></div><strong style={{ fontSize: 20 }}>{inr(pay.amount)}</strong></div>
            {pay.status === 'overdue' && <div className="badge red" style={{ height: 'auto', padding: '6px 10px' }}>Late fee of ₹50/day applies after the due date.</div>}
            <div className="field"><label>Pay using</label>
              {['UPI (GPay, PhonePe, Paytm)', 'Debit / credit card', 'Net banking'].map((m, i) => <label key={m} className="row small" style={{ gap: 8, padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 6 }}><input type="radio" name="pm" defaultChecked={i === 0} /> {m}</label>)}
            </div>
            <p className="xs muted">Demo only — no real payment is made. In production this opens the school’s payment gateway.</p>
          </div>
        </Modal>
      )}
      {receipt && <Receipt f={receipt} student={s} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function Receipt({ f, student, onClose }) {
  const { data, idx } = useSchool();
  return (
    <Modal title="Fee receipt" onClose={onClose} width={560} footer={<button className="btn btn-primary" onClick={() => window.print()}><Icon name="print" size={16} /> Print</button>}>
      <div className="report">
        <div className="report-head" style={{ padding: 14 }}>
          <Crest school={data.school} size={40} />
          <div><div className="serif strong" style={{ color: 'var(--brand-ink)' }}>{data.school.name}</div><div className="xs muted">{data.school.address}</div></div>
        </div>
        <div className="card-b stack-sm small">
          {[['Receipt no.', f.receipt_no], ['Date', fmtDate(f.paid_on, { day: 'numeric', month: 'short', year: 'numeric' })], ['Student', `${student.full_name} (${idx.sections[student.section_id].name})`], ['Admission no.', student.admission_no], ['Fee head', f.title], ['Mode', f.method]].map(([k, v]) => <div key={k} className="row between"><span className="muted">{k}</span><strong>{v}</strong></div>)}
          <div className="divider" />
          <div className="row between"><span className="strong">Amount received</span><strong style={{ fontSize: 18 }}>{inr(f.amount)}</strong></div>
        </div>
      </div>
    </Modal>
  );
}

/* ───────────── Notices ───────────── */
export function Notices() {
  const { data, role, persona, actions, notify } = useSchool();
  const canPost = ['school_admin', 'principal', 'teacher'].includes(role);
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'All', category: 'General' });
  const cats = ['all', ...new Set(data.notices.map((n) => n.category))];
  const list = data.notices.filter((n) => cat === 'all' || n.category === cat);
  return (
    <div>
      <PageHead title="Notices & circulars" sub={`${data.notices.length} published`} actions={canPost && <button className="btn btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> New notice</button>} />
      <div className="row wrap" style={{ gap: 6, marginBottom: 14 }}>{cats.map((c) => <button key={c} className="btn btn-sm" style={cat === c ? { background: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' } : undefined} onClick={() => setCat(c)}>{c === 'all' ? 'All' : c}</button>)}</div>
      <div className="stack">
        {list.map((n) => (
          <article key={n.id} className="card card-b">
            <div className="row between top wrap">
              <div className="row wrap" style={{ gap: 8 }}><Badge tone="blue">{n.category}</Badge>{n.priority === 'important' && <StatusBadge status="important" />}<span className="xs muted">For: {n.audience}</span></div>
              <span className="xs muted">{ago(n.published_at)}</span>
            </div>
            <h3 style={{ fontSize: 17, marginTop: 8 }}>{n.title}</h3>
            <p className="small" style={{ marginTop: 4, color: 'var(--ink-2)' }}>{n.body}</p>
            <div className="xs muted" style={{ marginTop: 8 }}>— {n.author}</div>
          </article>
        ))}
      </div>
      {open && (
        <Modal title="New notice" onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={!form.title} onClick={() => { actions.addNotice({ ...form, author: persona.name }); setOpen(false); notify('Notice published — push notification sent'); setForm({ ...form, title: '', body: '' }); }}>Publish</button></>}>
          <div className="stack">
            <div className="field"><label>Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid g-2">
              <div className="field"><label>Audience</label><select className="select" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>{['All', 'Parents', 'Students', 'Staff', 'Parents, Students'].map((a) => <option key={a}>{a}</option>)}</select></div>
              <div className="field"><label>Category</label><select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{['General', 'Academic', 'Holiday', 'Fees', 'Event', 'Sports', 'Staff'].map((a) => <option key={a}>{a}</option>)}</select></div>
            </div>
            <div className="field"><label>Message</label><textarea className="input" rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
            <div className="row small" style={{ gap: 14 }}>{['App push', 'SMS', 'Email'].map((c, i) => <label key={c} className="row" style={{ gap: 6 }}><input type="checkbox" defaultChecked={i !== 1} /> {c}</label>)}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────────── Leave ───────────── */
export function Leave() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const parent = role === 'parent';
  const [form, setForm] = useState({ from_date: '', to_date: '', reason: '' });
  const list = parent ? data.leave_requests.filter((l) => persona.children.some((c) => c.full_name === l.requester)) : data.leave_requests;
  return (
    <div>
      <PageHead title="Leave requests" sub={parent ? 'Apply for your child’s leave' : 'Student and staff leave approvals'} actions={parent && <ChildSwitcher />} />
      <div className={parent ? 'grid g-main' : ''}>
        <Card pad={false}>
          <div className="list">
            {list.map((l) => (
              <div key={l.id} className="row wrap">
                <Avatar name={l.requester} size="sm" />
                <div className="grow" style={{ minWidth: 180 }}><div className="strong small">{l.requester} <span className="muted">· {l.requester_type === 'staff' ? 'Staff' : `Class ${idx.sections[l.section_id]?.name || ''}`}</span></div><div className="xs muted">{fmtDate(l.from_date)} – {fmtDate(l.to_date)} · {l.reason}</div></div>
                {l.status === 'pending' && !parent ? <div className="row" style={{ gap: 6 }}><button className="btn btn-sm" onClick={() => { actions.setLeave(l.id, 'rejected'); notify('Leave rejected'); }}>Reject</button><button className="btn btn-sm btn-success" onClick={() => { actions.setLeave(l.id, 'approved'); notify('Leave approved — attendance updated'); }}>Approve</button></div> : <StatusBadge status={l.status} />}
              </div>
            ))}
            {!list.length && <Empty>No leave requests.</Empty>}
          </div>
        </Card>
        {parent && (
          <Card title={`Apply leave — ${persona.child.full_name.split(' ')[0]}`}>
            <div className="stack">
              <div className="grid g-2"><div className="field"><label>From</label><input type="date" className="input" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} /></div><div className="field"><label>To</label><input type="date" className="input" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} /></div></div>
              <div className="field"><label>Reason</label><textarea className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              <button className="btn btn-primary" disabled={!form.from_date || !form.reason} onClick={() => { actions.addLeave({ requester: persona.child.full_name, requester_type: 'student', section_id: persona.child.section_id, status: 'pending', ...form, to_date: form.to_date || form.from_date }); notify('Leave request sent to class teacher'); setForm({ from_date: '', to_date: '', reason: '' }); }}>Submit request</button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ───────────── Notifications ───────────── */
export function Notifications() {
  const { data, role } = useSchool();
  const list = data.notifications.filter((n) => n.audience === 'all' || n.audience === role || (role === 'principal' && n.audience === 'school_admin'));
  const icon = { attendance: 'check', homework: 'book', fees: 'wallet', notice: 'megaphone', leave: 'plane', transport: 'bus' };
  return (
    <div style={{ maxWidth: 760 }}>
      <PageHead title="Notifications" sub={`${list.length} unread`} />
      <Card pad={false}>
        <div className="list">
          {list.map((n) => <div key={n.id} className="row top"><span className="stat" style={{ padding: 0 }}><span className="ico"><Icon name={icon[n.kind] || 'bell'} size={16} /></span></span><div className="grow"><div className="strong small">{n.title}</div><div className="small muted">{n.body}</div></div><span className="xs muted nowrap">{ago(n.created_at)}</span></div>)}
          {!list.length && <Empty>You are all caught up.</Empty>}
        </div>
      </Card>
      <Card title="Notification preferences" style={{ marginTop: 16 }} pad={false}>
        <div className="table-wrap"><table className="table"><thead><tr><th>Event</th><th>App</th><th>SMS</th><th>Email</th></tr></thead>
          <tbody>{[['Attendance alert', 1, 1, 0, 'Mandatory'], ['Homework', 1, 0, 0], ['Fee receipt', 1, 0, 1], ['School notices', 1, 0, 1], ['Emergency', 1, 1, 1, 'Always on']].map(([e, a, b, c, lock]) => <tr key={e}><td className="strong small">{e} {lock && <Badge>{lock}</Badge>}</td>{[a, b, c].map((v, i) => <td key={i}><input type="checkbox" defaultChecked={!!v} disabled={!!lock} aria-label={`${e} channel ${i}`} /></td>)}</tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}

/* ───────────── Reports ───────────── */
function downloadCSV(name, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = name;
  a.click();
}

export function Reports() {
  const { data, idx, notify } = useSchool();
  const exam = data.exams[1];
  const reports = [
    ['check', 'Attendance register', 'Section-wise attendance for the latest school day', () => [['Class', 'Present', 'Late', 'Absent', 'Leave', 'Rate %'], ...data.sections.map((s) => { const a = attendanceStats(attendanceOn(data, idx.today, s.id)); return [s.name, a.present, a.late, a.absent, a.leave, a.pct.toFixed(1)]; })]],
    ['wallet', 'Fee defaulters', 'Students with overdue invoices and guardian contacts', () => [['Student', 'Class', 'Invoice', 'Amount', 'Guardian', 'Phone'], ...data.fee_invoices.filter((f) => f.status === 'overdue').map((f) => { const s = idx.students[f.student_id]; return [s.full_name, idx.sections[s.section_id].name, f.invoice_no, f.amount, s.guardian_name, s.guardian_phone]; })]],
    ['award', `${exam.name} results`, 'Merit list with percentage and grade for all classes', () => [['Class', 'Rank', 'Student', 'Total', 'Max', '%', 'Grade'], ...data.sections.flatMap((s) => sectionResults(data, idx, s.id, exam.id).map((r) => [s.name, r.rank, r.student.full_name, r.total, r.max, r.pct.toFixed(1), r.grade]))]],
    ['users', 'Student strength', 'Class-wise boys, girls, transport and hostel counts', () => [['Class', 'Total', 'Girls', 'Boys', 'Transport', 'Hostel'], ...data.sections.map((s) => { const st = idx.studentsBySection[s.id]; return [s.name, st.length, st.filter((x) => x.gender === 'F').length, st.filter((x) => x.gender === 'M').length, st.filter((x) => x.route_id).length, st.filter((x) => x.hostel_room_id).length]; })]],
    ['desk', 'Visitor log', 'Front-office visitor book for today', () => [['Badge', 'Name', 'Phone', 'Purpose', 'Host', 'In', 'Out'], ...data.visitors.map((v) => [v.badge_no, v.name, v.phone, v.purpose, v.host, v.check_in, v.check_out])]],
    ['bus', 'Transport manifest', 'Students by route and pickup point', () => [['Route', 'Stop', 'Student', 'Class', 'Guardian phone'], ...data.students.filter((s) => s.route_id).map((s) => [idx.routes[s.route_id]?.code, idx.stops[s.stop_id]?.name, s.full_name, idx.sections[s.section_id].name, s.guardian_phone])]],
  ];
  return (
    <div>
      <PageHead title="Reports" sub="Download as Excel-compatible CSV or print" />
      <div className="grid g-3">
        {reports.map(([icon, title, desc, build]) => (
          <Card key={title}>
            <div className="stack-sm">
              <span className="stat" style={{ padding: 0 }}><span className="ico"><Icon name={icon} size={17} /></span></span>
              <h3>{title}</h3>
              <p className="small muted">{desc}</p>
              <div className="row" style={{ marginTop: 6 }}>
                <button className="btn btn-sm btn-primary" onClick={() => { const rows = build(); downloadCSV(`${title.toLowerCase().replace(/\W+/g, '-')}.csv`, rows); notify(`${rows.length - 1} rows exported`); }}><Icon name="download" size={14} /> CSV</button>
                <button className="btn btn-sm" onClick={() => window.print()}><Icon name="print" size={14} /> Print</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
