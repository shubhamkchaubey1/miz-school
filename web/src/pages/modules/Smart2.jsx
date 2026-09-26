import { useMemo, useState } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { PageHead, Card, Stat, StatusBadge, Badge, Tabs, Modal, Avatar, Empty, Search, Bars, Progress, IconTile, TONES, inr, num, pct, fmtDate, ago } from '../../components/ui.jsx';
import { Crest } from '../../components/Brand.jsx';
import { todayISO } from '../../lib/derive.js';
import { subjectStyle } from '../dashboards/shared.jsx';
import { ChildSwitcher } from '../dashboards/Dashboards.jsx';

/* ───────────── Lesson plans & syllabus ───────────── */
export function Lessons() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const [sec, setSec] = useState(persona.section?.id || data.sections[4].id);
  const plans = data.lesson_plans.filter((l) => l.section_id === sec);
  const bySub = data.subjects.map((s) => ({ s, rows: plans.filter((l) => l.subject_id === s.id) })).filter((x) => x.rows.length);
  const [open, setOpen] = useState(persona.teacher?.subject_id || bySub[0]?.s.id);
  const cur = bySub.find((x) => x.s.id === open) || bySub[0];
  const setStatus = (id, status) => { actions.update('lesson_plans', (rows) => rows.map((l) => (l.id === id ? { ...l, status } : l))); notify(`Marked ${status.replace('_', ' ')}`); };
  const overall = plans.length ? (plans.filter((l) => l.status === 'completed').length / plans.length) * 100 : 0;
  return (
    <div>
      <PageHead title="Lesson plans & syllabus" sub={`Class ${idx.sections[sec].name} · ${Math.round(overall)}% of the term syllabus completed`} actions={<><select className="select" style={{ width: 'auto' }} value={sec} onChange={(e) => setSec(e.target.value)}>{data.sections.map((s) => <option key={s.id} value={s.id}>Class {s.name}</option>)}</select>{role === 'teacher' && <button className="btn btn-primary" onClick={() => notify('Lesson plan sent to coordinator for approval')}><Icon name="plus" size={16} /> New lesson plan</button>}</>} />
      <div className="grid g-3" style={{ marginBottom: 16 }}>
        {bySub.map(({ s, rows }) => {
          const done = rows.filter((l) => l.status === 'completed').length;
          const st = subjectStyle(s);
          return (
            <button key={s.id} className="card card-b" style={{ textAlign: 'left', cursor: 'pointer', borderColor: open === s.id ? 'var(--brand)' : undefined }} onClick={() => setOpen(s.id)}>
              <div className="row"><IconTile icon={st.icon} tone={st.tone} size={38} /><div className="grow"><div className="strong">{s.name}</div><div className="xs muted">{done} of {rows.length} topics done</div></div><strong>{Math.round((done / rows.length) * 100)}%</strong></div>
              <div style={{ marginTop: 10 }}><Progress value={(done / rows.length) * 100} color={TONES[st.tone][1]} /></div>
            </button>
          );
        })}
      </div>
      {cur && (
        <Card title={`${cur.s.name} — unit plan`} icon={subjectStyle(cur.s).icon} tone={subjectStyle(cur.s).tone} pad={false}>
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Unit</th><th>Topic</th><th>Week of</th><th className="num">Periods</th><th>Method</th><th>Approval</th><th>Status</th>{role === 'teacher' && <th />}</tr></thead>
            <tbody>{cur.rows.map((l) => (
              <tr key={l.id}><td className="num strong">{l.unit}</td><td className="strong small">{l.topic}</td><td className="small">{fmtDate(l.planned_week)}</td><td className="num">{l.periods}</td><td className="small">{l.method}</td><td>{l.approved ? <Badge tone="green">Approved</Badge> : <Badge tone="amber">Pending</Badge>}</td>
                <td><Badge tone={l.status === 'completed' ? 'green' : l.status === 'in_progress' ? 'blue' : ''}>{l.status.replace('_', ' ')}</Badge></td>
                {role === 'teacher' && <td>{l.status !== 'completed' && <button className="btn btn-sm" onClick={() => setStatus(l.id, 'completed')}>Mark done</button>}</td>}</tr>
            ))}</tbody>
          </table></div>
        </Card>
      )}
    </div>
  );
}

/* ───────────── Online tests & question bank ───────────── */
export function Tests() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const [tab, setTab] = useState('tests');
  const [taking, setTaking] = useState(null);
  const student = persona.student;
  const secName = student ? idx.sections[student.section_id].name : null;
  const tests = student ? data.online_tests.filter((t) => t.section_names.includes(secName)) : data.online_tests;
  const attempt = (t) => data.test_attempts.find((a) => a.test_id === t.id && a.student_id === student?.id);
  if (taking) return <TakeTest test={taking} onDone={(score) => { actions.update('test_attempts', (rows) => [...rows, { id: `at-${Date.now()}`, test_id: taking.id, student_id: student.id, score, total: taking.question_ids.length, submitted_at: new Date().toISOString() }]); notify(`Submitted — you scored ${score}/${taking.question_ids.length}`); setTaking(null); }} onCancel={() => setTaking(null)} />;
  return (
    <div>
      <PageHead title="Online tests" sub={student ? `Tests assigned to Class ${secName}` : 'Auto-marked quizzes and unit tests from the question bank'} actions={role !== 'student' && <button className="btn btn-primary" onClick={() => notify('Test builder: pick questions from the bank by topic & difficulty')}><Icon name="plus" size={16} /> Create test</button>} />
      {role !== 'student' && <Tabs tabs={[['tests', 'Tests'], ['bank', `Question bank (${data.question_bank.length})`]]} value={tab} onChange={setTab} />}
      <div style={{ marginTop: 16 }}>
        {tab === 'tests' && (
          <div className="grid g-3">
            {tests.map((t) => {
              const sub = idx.subjects[t.subject_id]; const st = subjectStyle(sub); const a = attempt(t);
              const all = data.test_attempts.filter((x) => x.test_id === t.id);
              const avg = all.length ? (all.reduce((s, x) => s + x.score / x.total, 0) / all.length) * 100 : 0;
              return (
                <Card key={t.id} title={sub?.name} icon={st.icon} tone={st.tone} action={<Badge tone={t.status === 'live' ? 'green' : ''}>{t.status === 'live' ? 'Live' : 'Closed'}</Badge>}>
                  <div className="strong">{t.title}</div>
                  <div className="xs muted" style={{ margin: '4px 0 12px' }}>{t.question_ids.length} questions · {t.duration_min} min · due {fmtDate(t.due)}</div>
                  {student ? (a ? <div className="row between"><Badge tone="green">Submitted</Badge><strong>{a.score}/{a.total}</strong></div>
                    : t.status === 'live' ? <button className="btn btn-primary btn-block" onClick={() => setTaking(t)}><Icon name="play" size={14} /> Start test</button> : <Badge>Missed</Badge>)
                    : <div className="stack-sm small"><div className="row between"><span className="muted">Classes</span><strong>{t.section_names.join(', ')}</strong></div><div className="row between"><span className="muted">Submissions</span><strong>{all.length}</strong></div><div className="row between"><span className="muted">Average</span><strong>{avg.toFixed(0)}%</strong></div><Progress value={avg} /></div>}
                </Card>
              );
            })}
          </div>
        )}
        {tab === 'bank' && (
          <Card pad={false}><div className="table-wrap"><table className="table">
            <thead><tr><th>Subject</th><th>Question</th><th>Difficulty</th><th>Bloom level</th><th className="num">Marks</th></tr></thead>
            <tbody>{data.question_bank.map((q) => <tr key={q.id}><td><Badge tone={subjectStyle(idx.subjects[q.subject_id]).tone}>{idx.subjects[q.subject_id]?.code}</Badge></td><td className="small strong">{q.question}</td><td><Badge tone={q.difficulty === 'Hard' ? 'red' : q.difficulty === 'Medium' ? 'amber' : 'green'}>{q.difficulty}</Badge></td><td className="small">{q.bloom}</td><td className="num">{q.marks}</td></tr>)}</tbody>
          </table></div></Card>
        )}
      </div>
    </div>
  );
}

function TakeTest({ test, onDone, onCancel }) {
  const { data } = useSchool();
  const qs = test.question_ids.map((id) => data.question_bank.find((q) => q.id === id));
  const [ans, setAns] = useState({});
  const [i, setI] = useState(0);
  const q = qs[i];
  const score = qs.filter((x) => ans[x.id] === x.answer).length;
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <PageHead title={test.title} sub={`Question ${i + 1} of ${qs.length} · ${test.duration_min} min`} actions={<button className="btn" onClick={onCancel}>Exit</button>} />
      <Progress value={((i + 1) / qs.length) * 100} />
      <Card style={{ marginTop: 16 }}>
        <div className="strong" style={{ fontSize: 18, marginBottom: 14 }}>{q.question}</div>
        <div className="stack-sm">{q.options.map((o, k) => <button key={k} className={`opt ${ans[q.id] === k ? 'on' : ''}`} onClick={() => setAns({ ...ans, [q.id]: k })}><span className="opt-k">{String.fromCharCode(65 + k)}</span>{o}</button>)}</div>
        <div className="row between" style={{ marginTop: 18 }}>
          <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
          {i < qs.length - 1 ? <button className="btn btn-primary" onClick={() => setI(i + 1)}>Next</button> : <button className="btn btn-success" onClick={() => onDone(score)}>Submit test</button>}
        </div>
      </Card>
      <div className="row wrap" style={{ gap: 6, marginTop: 12 }}>{qs.map((x, k) => <button key={x.id} className={`qdot ${k === i ? 'cur' : ans[x.id] != null ? 'done' : ''}`} onClick={() => setI(k)}>{k + 1}</button>)}</div>
    </div>
  );
}

/* ───────────── Library ───────────── */
export function Library() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const [tab, setTab] = useState(role === 'student' ? 'mine' : 'loans');
  const [q, setQ] = useState('');
  const [issue, setIssue] = useState(false);
  const [f, setF] = useState({ book_id: data.books[0].id, adm: '' });
  const today = todayISO();
  const active = data.book_loans.filter((l) => !l.returned_on);
  const overdue = active.filter((l) => l.due_on < today);
  const fine = (l) => (l.due_on < today ? Math.round((new Date(today) - new Date(l.due_on)) / 864e5) * 2 : 0);
  const avail = (b) => b.copies - active.filter((l) => l.book_id === b.id).length;
  const ret = (l) => { actions.update('book_loans', (rows) => rows.map((x) => (x.id === l.id ? { ...x, returned_on: today } : x))); notify(`Returned${fine(l) ? ` · fine ₹${fine(l)} collected` : ''}`); };
  const myLoans = persona.student ? data.book_loans.filter((l) => l.student_id === persona.student.id) : [];
  const books = data.books.filter((b) => !q || `${b.title} ${b.author} ${b.category}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHead title="Library" sub={`${num(data.books.reduce((a, b) => a + b.copies, 0))} copies · ${data.books.length} titles · barcode ready`} actions={role !== 'student' && <button className="btn btn-primary" onClick={() => setIssue(true)}><Icon name="scan" size={16} /> Issue book</button>} />
      {role !== 'student' && (
        <div className="grid g-4" style={{ marginBottom: 16 }}>
          <Stat label="Books issued" value={active.length} icon="book" />
          <Stat label="Overdue" value={overdue.length} icon="alert" tone="red" foot={`₹${overdue.reduce((a, l) => a + fine(l), 0)} fines pending`} />
          <Stat label="Titles" value={data.books.length} icon="library" tone="indigo" />
          <Stat label="Returned this month" value={data.book_loans.filter((l) => l.returned_on).length} icon="check" tone="green" />
        </div>
      )}
      <Tabs tabs={role === 'student' ? [['mine', 'My books'], ['catalogue', 'Catalogue']] : [['loans', 'Issued books'], ['catalogue', 'Catalogue']]} value={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === 'mine' && (
          <div className="grid g-3">{myLoans.map((l) => { const b = data.books.find((x) => x.id === l.book_id); return (
            <Card key={l.id}><div className="row"><IconTile icon="book" tone="indigo" size={44} /><div><div className="strong">{b.title}</div><div className="xs muted">{b.author}</div></div></div><div className="row between small" style={{ marginTop: 12 }}><span className="muted">Due</span><Badge tone={l.due_on < today ? 'red' : 'amber'}>{fmtDate(l.due_on)}</Badge></div></Card>
          ); })}{!myLoans.length && <Card><Empty>No books issued.</Empty></Card>}</div>
        )}
        {tab === 'loans' && (
          <Card pad={false}><div className="table-wrap"><table className="table">
            <thead><tr><th>Book</th><th>Student</th><th>Issued</th><th>Due</th><th className="num">Fine</th><th /></tr></thead>
            <tbody>{active.sort((a, b) => a.due_on.localeCompare(b.due_on)).map((l) => { const b = data.books.find((x) => x.id === l.book_id); const s = idx.students[l.student_id]; return (
              <tr key={l.id}><td className="strong small">{b.title}<div className="xs muted">{b.accession_no}</div></td><td className="small">{s?.full_name}<div className="xs muted">Class {idx.sections[s?.section_id]?.name}</div></td><td className="small">{fmtDate(l.issued_on)}</td><td><Badge tone={l.due_on < today ? 'red' : ''}>{fmtDate(l.due_on)}</Badge></td><td className="num">{fine(l) ? `₹${fine(l)}` : '—'}</td><td><button className="btn btn-sm" onClick={() => ret(l)}>Return</button></td></tr>
            ); })}</tbody>
          </table></div></Card>
        )}
        {tab === 'catalogue' && (
          <Card pad={false}>
            <div className="card-h"><Search value={q} onChange={setQ} placeholder="Search title, author or category" style={{ flex: 1, maxWidth: 380 }} /></div>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Rack</th><th className="num">Available</th></tr></thead>
              <tbody>{books.map((b) => <tr key={b.id}><td className="strong small">{b.title}</td><td className="small">{b.author}</td><td><Badge>{b.category}</Badge></td><td className="small">{b.rack}</td><td className="num"><Badge tone={avail(b) > 0 ? 'green' : 'red'}>{avail(b)} / {b.copies}</Badge></td></tr>)}</tbody>
            </table></div>
          </Card>
        )}
      </div>
      {issue && (
        <Modal title="Issue a book" onClose={() => setIssue(false)} footer={<><button className="btn" onClick={() => setIssue(false)}>Cancel</button><button className="btn btn-primary" onClick={() => { const s = data.students.find((x) => x.admission_no === f.adm) || data.students[Math.floor(Math.random() * 60)]; actions.update('book_loans', (rows) => [{ id: `ln-${Date.now()}`, book_id: f.book_id, student_id: s.id, issued_on: today, due_on: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10), returned_on: null }, ...rows]); setIssue(false); notify(`Issued to ${s.full_name} · due in 14 days`); }}>Issue</button></>}>
          <div className="stack">
            <div className="field"><label>Book (scan barcode or pick)</label><select className="select" value={f.book_id} onChange={(e) => setF({ ...f, book_id: e.target.value })}>{data.books.map((b) => <option key={b.id} value={b.id}>{b.title} ({avail(b)} available)</option>)}</select></div>
            <div className="field"><label>Student admission no. / ID card</label><input className="input" value={f.adm} onChange={(e) => setF({ ...f, adm: e.target.value })} placeholder="Scan ID card" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────────── Payroll & HR ───────────── */
export function Payroll() {
  const { data, idx, notify } = useSchool();
  const [slip, setSlip] = useState(null);
  const total = data.payroll.reduce((a, p) => a + p.net, 0) + data.staff_support.reduce((a, s) => a + s.salary, 0);
  return (
    <div>
      <PageHead title="Payroll & HR" sub={`${data.payroll[0]?.month} · PF, PT and TDS computed automatically`} actions={<><button className="btn"><Icon name="download" size={16} /> Bank transfer file</button><button className="btn btn-primary" onClick={() => notify('Payroll processed — payslips emailed to all staff')}><Icon name="coins" size={16} /> Process payroll</button></>} />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Net payout" value={inr(total, true)} icon="coins" tone="green" foot={`${data.payroll.length + data.staff_support.length} employees`} />
        <Stat label="PF (employer + employee)" value={inr(data.payroll.reduce((a, p) => a + p.pf * 2, 0), true)} icon="shield" tone="navy" />
        <Stat label="TDS deducted" value={inr(data.payroll.reduce((a, p) => a + p.tds, 0))} icon="receipt" tone="violet" />
        <Stat label="Pending approval" value={data.payroll.filter((p) => p.status === 'processing').length} icon="clock" tone="amber" />
      </div>
      <Card title="Teaching staff" icon="id" tone="violet" pad={false}>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Employee</th><th>Designation</th><th className="num">Days</th><th className="num">Gross</th><th className="num">Deductions</th><th className="num">Net pay</th><th>Status</th><th /></tr></thead>
          <tbody>{data.payroll.map((p) => { const t = idx.teachers[p.teacher_id]; return (
            <tr key={p.id}><td><div className="row" style={{ gap: 8 }}><Avatar name={t.full_name} size="sm" /><div><div className="strong small">{t.full_name}</div><div className="xs muted">{t.employee_code}</div></div></div></td><td><Badge>{t.designation}</Badge></td><td className="num">{p.present_days}/{p.working_days}</td><td className="num">{inr(p.gross)}</td><td className="num">{inr(p.gross - p.net)}</td><td className="num strong">{inr(p.net)}</td><td><Badge tone={p.status === 'paid' ? 'green' : 'amber'}>{p.status}</Badge></td><td><button className="btn btn-sm" onClick={() => setSlip(p)}>Payslip</button></td></tr>
          ); })}</tbody>
        </table></div>
      </Card>
      <Card title="Support staff" icon="users" tone="teal" pad={false} style={{ marginTop: 16 }}>
        <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Role</th><th>Department</th><th className="num">Salary</th><th>Status</th></tr></thead>
          <tbody>{data.staff_support.map((s) => <tr key={s.id}><td className="strong small">{s.name}</td><td className="small">{s.role}</td><td className="small">{s.dept}</td><td className="num">{inr(s.salary)}</td><td><Badge tone="green">paid</Badge></td></tr>)}</tbody></table></div>
      </Card>
      {slip && (
        <Modal title="Payslip" onClose={() => setSlip(null)} width={560} footer={<button className="btn btn-primary" onClick={() => window.print()}><Icon name="print" size={16} /> Print</button>}>
          <div className="report">
            <div className="report-head" style={{ padding: 14 }}><Crest school={data.school} size={40} /><div><div className="serif strong" style={{ color: 'var(--brand-ink)' }}>{data.school.name}</div><div className="xs muted">Payslip · {slip.month}</div></div></div>
            <div className="card-b">
              <div className="strong">{idx.teachers[slip.teacher_id].full_name}</div><div className="xs muted" style={{ marginBottom: 10 }}>{idx.teachers[slip.teacher_id].employee_code} · {idx.teachers[slip.teacher_id].designation}</div>
              <div className="grid g-2" style={{ gap: 20 }}>
                <div className="stack-sm small">{[['Basic', slip.basic], ['HRA', slip.hra], ['DA', slip.da], ['Transport', slip.ta]].map(([k, v]) => <div key={k} className="row between"><span className="muted">{k}</span><strong>{inr(v)}</strong></div>)}<div className="divider" /><div className="row between"><span>Gross</span><strong>{inr(slip.gross)}</strong></div></div>
                <div className="stack-sm small">{[['Provident fund', slip.pf], ['Professional tax', slip.pt], ['TDS', slip.tds], ['Loss of pay', slip.gross - slip.net - slip.pf - slip.pt - slip.tds]].map(([k, v]) => <div key={k} className="row between"><span className="muted">{k}</span><strong>{inr(v)}</strong></div>)}</div>
              </div>
              <div className="divider" style={{ margin: '12px 0' }} />
              <div className="row between"><strong>Net pay</strong><strong style={{ fontSize: 20 }}>{inr(slip.net)}</strong></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────────── Inventory & assets ───────────── */
export function Inventory() {
  const { data, notify } = useSchool();
  const [cat, setCat] = useState('All');
  const cats = ['All', ...new Set(data.inventory.map((i) => i.category))];
  const rows = data.inventory.filter((i) => cat === 'All' || i.category === cat);
  return (
    <div>
      <PageHead title="Inventory & assets" sub="Asset register, stock levels and maintenance" actions={<button className="btn btn-primary" onClick={() => notify('Purchase request raised')}><Icon name="plus" size={16} /> Purchase request</button>} />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Asset value" value={inr(data.inventory.reduce((a, i) => a + i.value, 0), true)} icon="package" />
        <Stat label="Items" value={num(data.inventory.reduce((a, i) => a + i.qty, 0))} icon="layers" tone="indigo" />
        <Stat label="Low stock" value={data.inventory.filter((i) => i.condition === 'Low stock').length} icon="alert" tone="red" />
        <Stat label="Service / refill due" value={data.inventory.filter((i) => /service|Refill/i.test(i.condition)).length} icon="settings" tone="amber" />
      </div>
      <div className="row wrap" style={{ gap: 6, marginBottom: 12 }}>{cats.map((c) => <button key={c} className="btn btn-sm" style={cat === c ? { background: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' } : undefined} onClick={() => setCat(c)}>{c}</button>)}</div>
      <Card pad={false}><div className="table-wrap"><table className="table">
        <thead><tr><th>Code</th><th>Item</th><th>Category</th><th>Location</th><th className="num">Qty</th><th className="num">Value</th><th>Condition</th></tr></thead>
        <tbody>{rows.map((i) => <tr key={i.id}><td className="small tnum">{i.code}</td><td className="strong small">{i.name}</td><td><Badge>{i.category}</Badge></td><td className="small">{i.location}</td><td className="num">{num(i.qty)}</td><td className="num">{inr(i.value, true)}</td><td><Badge tone={i.condition === 'Good' ? 'green' : i.condition === 'Low stock' ? 'red' : 'amber'}>{i.condition}</Badge></td></tr>)}</tbody>
      </table></div></Card>
    </div>
  );
}

/* ───────────── Health & infirmary ───────────── */
export function Health() {
  const { data, idx, role, persona, notify } = useSchool();
  const kid = persona.child;
  if (role === 'parent') {
    const hp = data.health_profiles[kid.id];
    const visits = data.health_visits.filter((v) => v.student_id === kid.id);
    return (
      <div>
        <PageHead title="Health record" sub={`${kid.full_name} · Blood group ${kid.blood_group}`} actions={<ChildSwitcher />} />
        <div className="grid g-4" style={{ marginBottom: 16 }}>
          <Stat label="Height" value={`${hp.height_cm} cm`} icon="trend" /><Stat label="Weight" value={`${hp.weight_kg} kg`} icon="health" tone="green" />
          <Stat label="Vision" value={hp.vision} icon="eye" tone="violet" /><Stat label="Allergies" value={hp.allergies} icon="alert" tone={hp.allergies === 'None' ? 'green' : 'red'} />
        </div>
        <div className="grid g-2">
          <Card title="Vaccinations" icon="shield" tone="teal" pad={false}><div className="list">{Object.entries(hp.vaccinations).map(([v, done]) => <div key={v} className="row between"><span className="small strong">{v}</span><Badge tone={done ? 'green' : 'amber'}>{done ? 'Done' : 'Due'}</Badge></div>)}</div></Card>
          <Card title="Infirmary visits" icon="health" tone="red" pad={false}><div className="list">{visits.length ? visits.map((v) => <div key={v.id}><div className="strong small">{v.complaint}</div><div className="xs muted">{v.action} · {ago(v.at)}</div></div>) : <div className="muted small">No visits this term.</div>}</div></Card>
        </div>
      </div>
    );
  }
  return (
    <div>
      <PageHead title="Health & infirmary" sub="Sick-room visits, medical profiles and vaccination tracking" actions={<button className="btn btn-primary" onClick={() => notify('Visit logged — parent notified on WhatsApp')}><Icon name="plus" size={16} /> Log visit</button>} />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Visits this week" value={data.health_visits.length} icon="health" tone="red" />
        <Stat label="Sent home" value={data.health_visits.filter((v) => /home/.test(v.action)).length} icon="door" tone="amber" />
        <Stat label="Students with allergies" value={Object.values(data.health_profiles).filter((h) => h.allergies !== 'None').length} icon="alert" tone="violet" />
        <Stat label="HPV / Td due" value={Object.values(data.health_profiles).filter((h) => !h.vaccinations['Td booster']).length} icon="shield" tone="teal" />
      </div>
      <Card title="Recent infirmary visits" icon="clip-list" tone="red" pad={false}><div className="table-wrap"><table className="table">
        <thead><tr><th>Student</th><th>Class</th><th>Complaint</th><th>Action taken</th><th>When</th><th>Parent</th></tr></thead>
        <tbody>{data.health_visits.map((v) => { const s = idx.students[v.student_id]; return <tr key={v.id}><td className="strong small">{s?.full_name}</td><td>{idx.sections[s?.section_id]?.name}</td><td className="small">{v.complaint}</td><td className="small">{v.action}</td><td className="small">{ago(v.at)}</td><td>{v.parent_notified ? <Badge tone="green">Notified</Badge> : <Badge>—</Badge>}</td></tr>; })}</tbody>
      </table></div></Card>
    </div>
  );
}

/* ───────────── Certificates & ID cards ───────────── */
export function Certificates() {
  const { data, idx, actions, notify } = useSchool();
  const [tab, setTab] = useState('requests');
  const [sid, setSid] = useState(data.meta.demoStudentId);
  const [type, setType] = useState('Bonafide');
  const s = idx.students[sid];
  const sec = idx.sections[s.section_id];
  const school = data.school;
  const body = {
    Bonafide: `This is to certify that ${s.full_name}, ${s.gender === 'F' ? 'daughter' : 'son'} of ${s.guardian_name.replace(/^(Mr\.|Mrs\.)\s/, '')}, is a bonafide student of this school, studying in Class ${sec.name} during the academic year ${school.academic_year}. Admission No. ${s.admission_no}. Date of birth as per school records: ${fmtDate(s.dob, { day: 'numeric', month: 'long', year: 'numeric' })}.`,
    Character: `This is to certify that ${s.full_name} (Adm. No. ${s.admission_no}) has been a student of this school. To the best of our knowledge, ${s.gender === 'F' ? 'she' : 'he'} bears a good moral character and has not been involved in any act of indiscipline.`,
    'Transfer Certificate': `Certified that ${s.full_name}, Adm. No. ${s.admission_no}, studied in Class ${sec.name} and has paid all dues up to date. Conduct: Good. Reason for leaving: Parent’s request.`,
    'Fee Paid': `Certified that the tuition fee for ${s.full_name} (Class ${sec.name}) for the academic year ${school.academic_year} has been received as per school records.`,
  };
  return (
    <div>
      <PageHead title="Certificates & ID cards" sub="Generate, sign and print in the school’s format" />
      <Tabs tabs={[['requests', 'Requests'], ['make', 'Generate certificate'], ['id', 'ID cards']]} value={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === 'requests' && (
          <Card pad={false}><div className="table-wrap"><table className="table">
            <thead><tr><th>Serial</th><th>Type</th><th>Student</th><th>Requested</th><th>Status</th><th /></tr></thead>
            <tbody>{data.certificates.map((c) => <tr key={c.id}><td className="small tnum">{c.serial}</td><td><Badge tone="violet">{c.type}</Badge></td><td className="strong small">{idx.students[c.student_id]?.full_name}</td><td className="small">{fmtDate(c.requested_on)}</td><td><Badge tone={c.status === 'issued' ? 'green' : 'amber'}>{c.status}</Badge></td><td>{c.status === 'pending' ? <button className="btn btn-sm btn-primary" onClick={() => { actions.update('certificates', (rows) => rows.map((x) => (x.id === c.id ? { ...x, status: 'issued' } : x))); notify('Issued — PDF sent to parent by email'); }}>Approve & issue</button> : <button className="btn btn-sm" onClick={() => { setSid(c.student_id); setType(c.type); setTab('make'); }}>View</button>}</td></tr>)}</tbody>
          </table></div></Card>
        )}
        {tab === 'make' && (
          <div className="grid g-main" style={{ alignItems: 'start' }}>
            <div className="report cert">
              <div className="report-head" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', gap: 6 }}><Crest school={school} size={56} /><div className="serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-ink)' }}>{school.name}</div><div className="xs muted">{school.address} · Affiliation {school.affiliation_no}</div></div>
              <div className="card-b" style={{ padding: '28px 32px' }}>
                <div className="row between xs muted"><span>No. {school.slug.slice(0, 3).toUpperCase()}/CERT/2026/0412</span><span>Date: {fmtDate(todayISO(), { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                <div className="serif" style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, margin: '20px 0', textDecoration: 'underline', color: 'var(--brand-ink)' }}>{type === 'Transfer Certificate' ? 'Transfer Certificate' : `${type} Certificate`}</div>
                <p style={{ lineHeight: 1.9, fontSize: 15 }}>{body[type]}</p>
                <div className="row between" style={{ marginTop: 48 }}><div className="xs muted" style={{ textAlign: 'center' }}><div style={{ borderTop: '1px solid var(--line-strong)', width: 140, marginBottom: 4 }} />Class Teacher</div><div className="xs muted" style={{ textAlign: 'center' }}><div className="serif" style={{ color: 'var(--brand-ink)', fontStyle: 'italic', fontSize: 15 }}>{school.principal_name}</div><div style={{ borderTop: '1px solid var(--line-strong)', width: 160, marginBottom: 4 }} />Principal</div></div>
              </div>
            </div>
            <Card title="Certificate details" icon="badge" tone="violet" footer={<div className="row" style={{ gap: 8 }}><button className="btn" onClick={() => window.print()}><Icon name="print" size={16} /> Print</button><button className="btn btn-primary" onClick={() => notify('Digitally signed PDF emailed to parent')}><Icon name="send" size={16} /> Sign & send</button></div>}>
              <div className="stack">
                <div className="field"><label>Type</label><select className="select" value={type} onChange={(e) => setType(e.target.value)}>{Object.keys(body).map((k) => <option key={k}>{k}</option>)}</select></div>
                <div className="field"><label>Student</label><select className="select" value={sid} onChange={(e) => setSid(e.target.value)}>{data.students.slice(0, 120).map((x) => <option key={x.id} value={x.id}>{x.full_name} — {idx.sections[x.section_id].name}</option>)}</select></div>
              </div>
            </Card>
          </div>
        )}
        {tab === 'id' && (
          <div>
            <div className="row between" style={{ marginBottom: 12 }}><span className="small muted">Class {sec.name} · QR on each card works with the gate scanner, library and canteen</span><button className="btn btn-primary" onClick={() => window.print()}><Icon name="print" size={16} /> Print all ({idx.studentsBySection[s.section_id].length})</button></div>
            <div className="idgrid">{idx.studentsBySection[s.section_id].slice(0, 8).map((x) => (
              <div key={x.id} className="idcard">
                <div className="id-top"><Crest school={school} size={26} /><div><div className="strong" style={{ fontSize: 12 }}>{school.short_name}</div><div style={{ fontSize: 9.5, opacity: .8 }}>{school.city} · {school.academic_year}</div></div></div>
                <div className="id-mid"><span className="avatar lg">{x.full_name.split(' ').map((w) => w[0]).join('')}</span><div className="strong small" style={{ marginTop: 6 }}>{x.full_name}</div><div className="xs muted">Class {sec.name} · Roll {x.roll_no}</div></div>
                <div className="id-bot"><div className="xs"><div><strong>Adm:</strong> {x.admission_no}</div><div><strong>Blood:</strong> {x.blood_group}</div><div><strong>Ph:</strong> {x.guardian_phone}</div></div><Icon name="qr" size={38} /></div>
              </div>
            ))}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── Role dashboards: Accountant & Librarian ───────────── */
export function AccountantDash() {
  const { data } = useSchool();
  const paid = data.fee_invoices.filter((f) => f.status === 'paid');
  const today = todayISO();
  const todays = paid.filter((f) => f.paid_on === today);
  const over = data.fee_invoices.filter((f) => f.status === 'overdue');
  const modes = ['UPI', 'Net Banking', 'Card', 'Cash', 'Cheque'].map((m) => ({ label: m.split(' ')[0], value: paid.filter((f) => f.method === m).reduce((a, f) => a + Number(f.amount), 0) }));
  return (
    <div className="stack">
      <div className="grid g-4">
        <Stat label="Collected (session)" value={inr(paid.reduce((a, f) => a + Number(f.amount), 0), true)} icon="coins" tone="green" foot={`${paid.length} receipts`} />
        <Stat label="Collected today" value={inr(todays.reduce((a, f) => a + Number(f.amount), 0))} icon="rupee" foot={`${todays.length} payments`} />
        <Stat label="Overdue" value={inr(over.reduce((a, f) => a + Number(f.amount), 0), true)} icon="alert" tone="red" foot={`${over.length} invoices`} />
        <Stat label="Payroll this month" value={inr(data.payroll.reduce((a, p) => a + p.net, 0), true)} icon="id" tone="violet" />
      </div>
      <div className="grid g-2">
        <Card title="Collection by payment mode" icon="chart" tone="blue"><Bars highlightLast={false} data={modes} format={(v) => inr(v, true)} /></Card>
        <Card title="Tally / accounting export" icon="file" tone="navy">
          <div className="stack-sm small">{[['Fee receipts voucher (XML)', 'Ready'], ['Payroll journal', 'Ready'], ['Bank reconciliation — HDFC', '3 unmatched'], ['GST on transport & hostel', 'Not applicable']].map(([k, v]) => <div key={k} className="row between"><span>{k}</span><Badge tone={/unmatched/.test(v) ? 'amber' : 'green'}>{v}</Badge></div>)}</div>
        </Card>
      </div>
    </div>
  );
}

export function LibrarianDash() {
  const { data, idx } = useSchool();
  const today = todayISO();
  const active = data.book_loans.filter((l) => !l.returned_on);
  const cats = {}; data.books.forEach((b) => { cats[b.category] = (cats[b.category] || 0) + active.filter((l) => l.book_id === b.id).length; });
  return (
    <div className="stack">
      <div className="grid g-4">
        <Stat label="Books out" value={active.length} icon="book" />
        <Stat label="Overdue" value={active.filter((l) => l.due_on < today).length} icon="alert" tone="red" />
        <Stat label="Due today" value={active.filter((l) => l.due_on === today).length} icon="clock" tone="amber" />
        <Stat label="Titles" value={data.books.length} icon="library" tone="indigo" />
      </div>
      <div className="grid g-2">
        <Card title="Most borrowed categories" icon="chart" tone="blue"><Bars highlightLast={false} data={Object.entries(cats).filter(([, v]) => v).map(([label, value]) => ({ label: label.slice(0, 6), value }))} /></Card>
        <Card title="Overdue — follow up" icon="bell-ring" tone="red" pad={false}><div className="list">{active.filter((l) => l.due_on < today).slice(0, 6).map((l) => <div key={l.id} className="row"><div className="grow"><div className="strong small">{idx.students[l.student_id]?.full_name}</div><div className="xs muted">{data.books.find((b) => b.id === l.book_id)?.title}</div></div><Badge tone="red">{fmtDate(l.due_on)}</Badge></div>)}</div></Card>
      </div>
    </div>
  );
}

// keep tree-shaking quiet for helpers some builds strip
export const _unused = { useMemo, StatusBadge, Empty, pct };
