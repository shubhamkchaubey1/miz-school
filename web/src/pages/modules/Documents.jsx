import { useState } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { PageHead, Card, Badge, Tabs, Modal, Empty, Search, inr, fmtDate, fmtTime } from '../../components/ui.jsx';
import { Crest } from '../../components/Brand.jsx';
import { studentAttendance, todayISO } from '../../lib/derive.js';
import { gradeLabel, subjectCodesFor, STREAMS } from '../../data/classes.js';

/* ── helpers ── */
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const two = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const three = (n) => `${n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' : ''}` : ''}${n % 100 ? two(n % 100) : ''}`;
/** Indian numbering: 1,25,400 → "One Lakh Twenty Five Thousand Four Hundred" */
export function inWords(num) {
  let n = Math.round(Number(num) || 0);
  if (!n) return 'Zero';
  const parts = [];
  const cr = Math.floor(n / 1e7); n %= 1e7;
  const lk = Math.floor(n / 1e5); n %= 1e5;
  const th = Math.floor(n / 1e3); n %= 1e3;
  if (cr) parts.push(`${two(cr)} Crore`);
  if (lk) parts.push(`${two(lk)} Lakh`);
  if (th) parts.push(`${two(th)} Thousand`);
  if (n) parts.push(three(n));
  return parts.join(' ');
}
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 7); };
export const verifyCode = (s) => `${hash(s).slice(0, 4)}-${hash(`${s}x`).slice(0, 4)}`;
const words = (d) => { const x = new Date(d); return `${two(x.getDate())} ${x.toLocaleDateString('en-IN', { month: 'long' })} ${inWords(x.getFullYear())}`; };

/** Tuition invoices are shown with the school's fee-head breakup. */
function feeLines(f) {
  if (!/Tuition/.test(f.title)) return [[f.title, f.amount]];
  const a = Number(f.amount);
  const dev = Math.round(a * 0.08); const lab = Math.round(a * 0.06); const act = Math.round(a * 0.04);
  const period = (f.title.match(/\((.*)\)/) || [])[1];
  return [[`Tuition fee${period ? ` (${period})` : ''}`, a - dev - lab - act], ['Development fee', dev], ['Smart class & computer lab', lab], ['Activity & sports', act]];
}

/* ───────────── Fee receipt (school-branded) ───────────── */
export function FeeReceipt({ f, onClose }) {
  const { data, idx, actions, notify, role } = useSchool();
  const s = idx.students[f.student_id];
  const sec = idx.sections[s.section_id];
  const school = data.school;
  const prints = (data.audit_log || []).filter((e) => e.action === `Printed receipt ${f.receipt_no}`).length;
  const lines = feeLines(f);
  const pending = data.fee_invoices.filter((x) => x.student_id === s.id && ['due', 'overdue'].includes(x.status)).reduce((a, x) => a + Number(x.amount), 0);
  const ref = `${f.method === 'Cash' ? 'Counter' : f.method === 'Cheque' ? 'Chq no.' : 'Txn'} ${hash(f.receipt_no)}${hash(f.id).slice(0, 5)}`;
  const code = verifyCode(f.receipt_no);
  const print = () => { actions.logAudit({ module: 'fees', action: `Printed receipt ${f.receipt_no}`, kind: 'change' }); setTimeout(() => window.print(), 50); };
  return (
    <Modal title="Fee receipt" onClose={onClose} width={720} footer={<>
      <button className="btn" onClick={() => { actions.logAudit({ module: 'fees', action: `Receipt ${f.receipt_no} sent on WhatsApp`, kind: 'change' }); notify(`Receipt sent to ${s.guardian_phone} on WhatsApp and to ${s.guardian_email}`); }}><Icon name="chat" size={16} /> Send on WhatsApp & email</button>
      <button className="btn btn-primary" onClick={print}><Icon name="print" size={16} /> Print / Save PDF</button>
    </>}>
      <div className="doc-sheet receipt print-area">
        {prints > 0 && <div className="doc-dup">DUPLICATE</div>}
        <div className="doc-head">
          <Crest school={school} size={58} />
          <div className="grow">
            <div className="doc-school">{school.name}</div>
            <div className="xs">{school.address}</div>
            <div className="xs">Ph {school.phone} · {school.email} · Affiliation No. {school.affiliation_no}</div>
          </div>
          <div className="doc-kind"><div>FEE RECEIPT</div><div className="xs">{prints ? 'Duplicate copy' : 'Original'}</div></div>
        </div>
        <div className="doc-grid">
          <div><span>Receipt no.</span><strong>{f.receipt_no}</strong></div>
          <div><span>Date</span><strong>{fmtDate(f.paid_on, { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
          <div><span>Session</span><strong>{school.academic_year}</strong></div>
          <div><span>Invoice</span><strong>{f.invoice_no}</strong></div>
          <div><span>Student</span><strong>{s.full_name}</strong></div>
          <div><span>Class / Roll</span><strong>{sec.name} / {s.roll_no}</strong></div>
          <div><span>Admission no.</span><strong>{s.admission_no}</strong></div>
          <div><span>Parent / Guardian</span><strong>{s.guardian_name}</strong></div>
        </div>
        <table className="doc-table">
          <thead><tr><th style={{ width: 40 }}>#</th><th>Particulars</th><th className="num">Amount (₹)</th></tr></thead>
          <tbody>
            {lines.map(([t, a], i) => <tr key={t}><td>{i + 1}</td><td>{t}</td><td className="num">{Number(a).toLocaleString('en-IN')}.00</td></tr>)}
            <tr><td /><td>Late fee</td><td className="num">0.00</td></tr>
          </tbody>
          <tfoot><tr><td /><td><strong>Total received</strong></td><td className="num"><strong>{Number(f.amount).toLocaleString('en-IN')}.00</strong></td></tr></tfoot>
        </table>
        <div className="doc-words"><strong>Rupees {inWords(f.amount)} Only</strong></div>
        <div className="doc-grid" style={{ marginTop: 10 }}>
          <div><span>Payment mode</span><strong>{f.method}</strong></div>
          <div><span>Reference</span><strong>{ref}</strong></div>
          <div><span>Balance due this session</span><strong>{pending ? inr(pending) : 'Nil'}</strong></div>
          <div><span>Received by</span><strong>{['UPI', 'Card', 'Net Banking'].includes(f.method) ? 'Online — payment gateway' : 'Accounts Office'}</strong></div>
        </div>
        <div className="doc-foot">
          <div className="row" style={{ gap: 10 }}><div className="doc-qr"><Icon name="qr" size={54} /></div><div className="xs"><div>Verify: <strong>{code}</strong></div><div>mizschool.app/verify</div><div style={{ marginTop: 4 }}>Computer-generated receipt; no signature needed.</div></div></div>
          <div className="doc-sign"><div className="serif" style={{ fontStyle: 'italic' }}>Accounts Officer</div><div className="line" />Authorised signatory</div>
        </div>
        <div className="doc-terms">Fees once paid are not refundable except caution money. Keep this receipt for income-tax (Sec 80C, tuition fee part). Cheques are subject to realisation.</div>
      </div>
      {role === 'parent' && <div className="xs muted" style={{ marginTop: 8 }}>A copy was also sent to your WhatsApp and email when you paid.</div>}
    </Modal>
  );
}

/* ───────────── Certificates ───────────── */
const TYPES = {
  'Transfer Certificate': { code: 'TC', noDues: true },
  Bonafide: { code: 'BON' },
  Character: { code: 'CHR' },
  'Fee Paid (80C)': { code: 'FEE' },
  'Study / Attendance': { code: 'STU' },
};
const REASONS = ['Parent’s request', 'Shifting to another city', 'Passed Class 12', 'Admission in another school', 'Financial reasons', 'Other'];

function noDuesFor(data, s) {
  const dues = data.fee_invoices.filter((f) => f.student_id === s.id && ['due', 'overdue'].includes(f.status)).reduce((a, f) => a + Number(f.amount), 0);
  const books = (data.book_loans || []).filter((l) => l.student_id === s.id && !l.returned_on).length;
  return [
    ['Accounts', dues ? `₹${dues.toLocaleString('en-IN')} pending` : 'Clear', !dues],
    ['Library', books ? `${books} book${books > 1 ? 's' : ''} not returned` : 'Clear', !books],
    ['Transport', s.route_id ? 'Pass returned' : 'Not using', true],
    ['Hostel', s.hostel_room_id ? 'Room vacated' : 'Not a hosteller', true],
    ['Lab / sports', 'Clear', true],
  ];
}

export function Certificates() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const parent = role === 'parent';
  const staff = !parent;
  const [tab, setTab] = useState(parent ? 'mine' : 'requests');
  const [sid, setSid] = useState(parent ? persona.child.id : data.meta.demoStudentId);
  const [type, setType] = useState('Bonafide');
  const [reason, setReason] = useState(REASONS[0]);
  const [override, setOverride] = useState('');
  const [q, setQ] = useState('');
  const [verify, setVerify] = useState('');
  const [reqType, setReqType] = useState('Bonafide');
  const [purpose, setPurpose] = useState('');
  const s = idx.students[sid];
  const sec = idx.sections[s.section_id];
  const school = data.school;
  const att = studentAttendance(data, s.id);
  const nd = noDuesFor(data, s);
  const blocked = TYPES[type].noDues && nd.some(([, , ok]) => !ok);
  const certs = data.certificates || [];
  const nextSerial = (t) => `${school.slug.slice(0, 3).toUpperCase()}/${TYPES[t].code}/${new Date().getFullYear()}/${String(certs.filter((c) => c.type === t || (TYPES[c.type]?.code === TYPES[t].code)).length + 101).padStart(4, '0')}`;
  const serial = nextSerial(type);
  const paidFY = data.fee_invoices.filter((f) => f.student_id === s.id && f.status === 'paid' && /Tuition/.test(f.title)).reduce((a, f) => a + Math.round(Number(f.amount) * 0.82), 0);
  const he = s.gender === 'F' ? 'she' : 'he'; const his = s.gender === 'F' ? 'her' : 'his'; const son = s.gender === 'F' ? 'daughter' : 'son';
  const parentName = s.guardian_name.replace(/^(Mr\.|Mrs\.|Ms\.)\s/, '');
  const subjects = subjectCodesFor(sec).map((c) => data.subjects.find((x) => x.code === c)?.name).join(', ');
  const issue = () => {
    const row = { id: `ct-${Date.now()}`, type, student_id: s.id, requested_on: todayISO(), issued_on: todayISO(), status: 'issued', serial, verify: verifyCode(serial), issued_by: persona.name, reason: type === 'Transfer Certificate' ? reason : null, override: blocked ? override : null };
    actions.update('certificates', (rows) => [row, ...(rows || []).filter((c) => !(c.student_id === s.id && c.type === type && c.status === 'pending'))]);
    actions.push(['parent'], `${type} issued`, `${s.full_name} · No. ${serial}. PDF sent on WhatsApp and email.`, 'notice', ['push', 'whatsapp', 'email']);
    notify(`Issued ${serial} — PDF sent to parent`);
  };
  const body = {
    Bonafide: <p>This is to certify that <b>{s.full_name}</b>, {son} of <b>{parentName}</b>, is a bonafide student of this school, studying in <b>Class {sec.name}</b> in the academic session {school.academic_year}. {his[0].toUpperCase() + his.slice(1)} admission number is {s.admission_no} and date of birth as per school records is {fmtDate(s.dob, { day: 'numeric', month: 'long', year: 'numeric' })}.</p>,
    Character: <p>This is to certify that <b>{s.full_name}</b> (Adm. No. {s.admission_no}), {son} of {parentName}, has been a student of this school and is at present in Class {sec.name}. To the best of our knowledge {he} bears a good moral character, has been regular and disciplined, and has not been involved in any act of indiscipline.</p>,
    'Fee Paid (80C)': <p>Certified that a sum of <b>₹{paidFY.toLocaleString('en-IN')}</b> (Rupees {inWords(paidFY)} only) has been received as <b>tuition fee</b> for <b>{s.full_name}</b>, Class {sec.name}, during the financial year {new Date().getFullYear() - (new Date().getMonth() < 3 ? 1 : 0)}–{String(new Date().getFullYear() + (new Date().getMonth() < 3 ? 0 : 1)).slice(2)}. This amount excludes development, transport and other charges and is issued for claiming deduction under Section 80C of the Income-tax Act.</p>,
    'Study / Attendance': <p>This is to certify that <b>{s.full_name}</b>, {son} of {parentName}, is studying in Class {sec.name} in this school. Out of {att.total} working days so far in this session {he} has attended {att.present + att.late} days ({Math.round(att.pct)}%).</p>,
  };
  const tcRows = [
    ['Name of pupil', s.full_name], ['Father’s / guardian’s name', parentName], ['Nationality', 'Indian'], ['Whether SC/ST/OBC', 'General'],
    ['Date of birth (figures)', fmtDate(s.dob, { day: '2-digit', month: '2-digit', year: 'numeric' })], ['Date of birth (words)', words(s.dob)],
    ['Date of first admission & class', `${s.admission_no.split('/')[1] || '—'} · Class ${sec.grade <= 0 ? 'LKG' : '1'}`], ['Class in which the pupil last studied', `${sec.stage === 'senior' ? `${sec.grade} (${STREAMS[sec.section]})` : gradeLabel(sec.grade)} — ${two(Math.max(0, sec.grade)) || 'Pre-primary'}`],
    ['School / board examination last taken', data.exams[1] ? `${data.exams[1].name} — Passed` : '—'], ['Whether failed, if so once/twice in the same class', 'No'],
    ['Subjects studied', subjects], ['Whether qualified for promotion to the higher class', sec.grade >= 12 ? 'Completed Class 12' : `Yes, to Class ${gradeLabel(sec.grade + 1)}`],
    ['Month up to which dues are paid', nd[0][2] ? `${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}` : 'Dues pending'], ['Fee concession, if any', 'None'],
    ['Total working days / days present', `${att.total} / ${att.present + att.late}`], ['NCC / Scout / Guide', 'No'], ['Games & extra-curricular', 'Participated in house events'],
    ['General conduct', 'Good'], ['Date of application for certificate', fmtDate(todayISO(), { day: '2-digit', month: '2-digit', year: 'numeric' })], ['Date of issue', fmtDate(todayISO(), { day: '2-digit', month: '2-digit', year: 'numeric' })],
    ['Reason for leaving the school', reason], ['Any other remarks', '—'],
  ];
  const mine = certs.filter((c) => parent && persona.children.some((ch) => ch.id === c.student_id));
  const found = verify.length >= 9 ? certs.find((c) => (c.verify || verifyCode(c.serial)) === verify.trim().toUpperCase()) : null;
  const list = certs.filter((c) => !q || `${c.serial} ${idx.students[c.student_id]?.full_name} ${c.type}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHead title={parent ? 'Certificates & documents' : 'Certificates & ID cards'} sub={parent ? 'Request a certificate — it is issued with a serial number and a verify code' : 'Auto-filled from school records · serial register · no-dues check · verify code on every document'} />
      <Tabs value={tab} onChange={setTab} tabs={parent ? [['mine', 'My requests'], ['verify', 'Verify a document']] : [['requests', 'Requests & register'], ['make', 'Issue certificate'], ['id', 'ID cards'], ['verify', 'Verify']]} />
      <div style={{ marginTop: 16 }}>
        {tab === 'mine' && (
          <div className="grid alloc-side" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
            <Card pad={false} title="Requests" icon="file">
              {mine.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Certificate</th><th>Child</th><th>Requested</th><th>Status</th><th>Serial</th></tr></thead>
                <tbody>{mine.map((c) => <tr key={c.id}><td className="strong small">{c.type}</td><td className="small">{idx.students[c.student_id]?.full_name}</td><td className="small">{fmtDate(c.requested_on)}</td><td><Badge tone={c.status === 'issued' ? 'green' : 'amber'}>{c.status === 'issued' ? 'Issued' : 'With school office'}</Badge></td><td className="small tnum">{c.status === 'issued' ? c.serial : '—'}</td></tr>)}</tbody></table></div> : <Empty>No requests yet.</Empty>}
            </Card>
            <Card title="Request a certificate" icon="plus">
              <div className="stack-sm">
                <div className="field"><label>Child</label><select className="select" value={sid} onChange={(e) => setSid(e.target.value)}>{persona.children.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select></div>
                <div className="field"><label>Certificate</label><select className="select" value={reqType} onChange={(e) => setReqType(e.target.value)}>{Object.keys(TYPES).map((t) => <option key={t}>{t}</option>)}</select></div>
                <div className="field"><label>Purpose</label><input className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. passport, bank account, income tax" /></div>
                <button className="btn btn-primary" onClick={() => { actions.update('certificates', (rows) => [{ id: `ct-${Date.now()}`, type: reqType, student_id: sid, requested_on: todayISO(), status: 'pending', serial: '—', purpose }, ...(rows || [])]); actions.push(['school_admin', 'reception'], 'Certificate request', `${reqType} for ${idx.students[sid].full_name}`, 'notice', ['push']); notify('Request sent to the school office'); setPurpose(''); }}>Send request</button>
                <div className="xs muted">{reqType === 'Transfer Certificate' ? 'TC needs all dues cleared and library books returned.' : 'Usually issued within 1 working day.'}</div>
              </div>
            </Card>
          </div>
        )}
        {tab === 'requests' && (
          <Card pad={false}>
            <div className="card-h"><Search value={q} onChange={setQ} placeholder="Search serial, student or type" style={{ flex: 1, maxWidth: 320 }} /></div>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Serial</th><th>Type</th><th>Student</th><th>Requested</th><th>Status</th><th>Verify code</th><th /></tr></thead>
              <tbody>{list.map((c) => <tr key={c.id}><td className="small tnum">{c.serial}</td><td><Badge tone="violet">{c.type}</Badge></td><td className="strong small">{idx.students[c.student_id]?.full_name}<div className="xs muted">{c.purpose || ''}</div></td><td className="small">{fmtDate(c.requested_on)}</td><td><Badge tone={c.status === 'issued' ? 'green' : 'amber'}>{c.status}</Badge></td><td className="small tnum">{c.status === 'issued' ? (c.verify || verifyCode(c.serial)) : '—'}</td>
                <td><button className={`btn btn-sm ${c.status === 'pending' ? 'btn-primary' : ''}`} onClick={() => { setSid(c.student_id); setType(TYPES[c.type] ? c.type : c.type === 'Fee Paid' ? 'Fee Paid (80C)' : 'Bonafide'); setTab('make'); }}>{c.status === 'pending' ? 'Prepare & issue' : 'View'}</button></td></tr>)}</tbody>
            </table></div>
          </Card>
        )}
        {tab === 'make' && (
          <div className="grid g-main" style={{ alignItems: 'start' }}>
            <div className="doc-sheet cert-sheet print-area">
              <div className="doc-head" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', gap: 6 }}>
                <Crest school={school} size={62} />
                <div className="doc-school">{school.name}</div>
                <div className="xs">{school.address} · Affiliation No. {school.affiliation_no} · School code {school.slug.toUpperCase().slice(0, 3)}{String(school.seed || 1).padStart(4, '0')}</div>
              </div>
              <div className="row between xs" style={{ marginTop: 12 }}><span>No. <strong>{serial}</strong></span><span>Adm. No. {s.admission_no}</span><span>Date: {fmtDate(todayISO(), { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div className="doc-title">{type === 'Transfer Certificate' ? 'Transfer Certificate' : type === 'Fee Paid (80C)' ? 'Fee Certificate' : type === 'Study / Attendance' ? 'Study Certificate' : `${type} Certificate`}</div>
              {type === 'Transfer Certificate'
                ? <table className="doc-table tc">{/* statutory format */}<tbody>{tcRows.map(([k, v], i) => <tr key={k}><td style={{ width: 28 }}>{i + 1}.</td><td>{k}</td><td><strong>{v}</strong></td></tr>)}</tbody></table>
                : <div className="doc-body">{body[type]}</div>}
              <div className="doc-foot" style={{ marginTop: 34 }}>
                <div className="row" style={{ gap: 10 }}><div className="doc-qr"><Icon name="qr" size={50} /></div><div className="xs"><div>Verify: <strong>{verifyCode(serial)}</strong></div><div>mizschool.app/verify</div></div></div>
                <div className="doc-sign"><div className="line" />Prepared by</div>
                <div className="doc-sign"><div className="serif" style={{ fontStyle: 'italic' }}>{school.principal_name}</div><div className="line" />Principal (seal)</div>
              </div>
            </div>
            <div className="stack">
              <Card title="Certificate details" icon="badge" footer={<div className="row" style={{ gap: 8 }}><button className="btn" onClick={() => window.print()}><Icon name="print" size={16} /> Print</button><button className="btn btn-primary" disabled={blocked && !override} onClick={issue}><Icon name="send" size={16} /> Sign, issue & send</button></div>}>
                <div className="stack">
                  <div className="field"><label>Type</label><select className="select" value={type} onChange={(e) => setType(e.target.value)}>{Object.keys(TYPES).map((k) => <option key={k}>{k}</option>)}</select></div>
                  <div className="field"><label>Student</label><select className="select" value={sid} onChange={(e) => setSid(e.target.value)}>{data.students.slice().sort((a, b) => idx.sections[a.section_id].grade - idx.sections[b.section_id].grade || a.roll_no - b.roll_no).slice(0, 300).map((x) => <option key={x.id} value={x.id}>{idx.sections[x.section_id].name} · {x.full_name}</option>)}</select></div>
                  {type === 'Transfer Certificate' && <div className="field"><label>Reason for leaving</label><select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></div>}
                  <div className="xs muted">All fields come from school records (admission, attendance, fees, exams) — nothing is typed by hand. Serial number is taken from the register when you issue.</div>
                </div>
              </Card>
              {TYPES[type].noDues && (
                <Card title="No-dues check" icon="clip-check">
                  <div className="stack-sm small">{nd.map(([dept, txt, ok]) => <div key={dept} className="row between"><span>{dept}</span><Badge tone={ok ? 'green' : 'red'}>{txt}</Badge></div>)}</div>
                  {blocked && <div className="field" style={{ marginTop: 10 }}><label>Issue anyway — reason (admin override, logged)</label><input className="input" value={override} onChange={(e) => setOverride(e.target.value)} placeholder="e.g. Dues waived by management" /></div>}
                </Card>
              )}
            </div>
          </div>
        )}
        {tab === 'id' && (
          <div>
            <div className="row between wrap" style={{ marginBottom: 12 }}><span className="small muted">Class {sec.name} · QR works with the gate scanner, library and canteen</span><button className="btn btn-primary" onClick={() => window.print()}><Icon name="print" size={16} /> Print class sheet ({(idx.studentsBySection[s.section_id] || []).length})</button></div>
            <div className="idgrid print-area">{(idx.studentsBySection[s.section_id] || []).slice(0, 8).map((x) => (
              <div key={x.id} className="idcard">
                <div className="id-top"><Crest school={school} size={26} /><div><div className="strong" style={{ fontSize: 12 }}>{school.short_name}</div><div style={{ fontSize: 9.5, opacity: .8 }}>{school.city} · {school.academic_year}</div></div></div>
                <div className="id-mid"><span className="avatar lg">{x.full_name.split(' ').map((w) => w[0]).join('')}</span><div className="strong small" style={{ marginTop: 6 }}>{x.full_name}</div><div className="xs muted">Class {sec.name} · Roll {x.roll_no}</div></div>
                <div className="id-bot"><div className="xs"><div><strong>Adm:</strong> {x.admission_no}</div><div><strong>Blood:</strong> {x.blood_group}</div><div><strong>Ph:</strong> {x.guardian_phone}</div></div><Icon name="qr" size={38} /></div>
              </div>
            ))}</div>
          </div>
        )}
        {tab === 'verify' && (
          <Card title="Verify a certificate or receipt" icon="shield" style={{ maxWidth: 560 }}>
            <div className="stack">
              <div className="field"><label>Verify code (printed on the document)</label><input className="input tnum" value={verify} onChange={(e) => setVerify(e.target.value.toUpperCase())} placeholder="e.g. 1K9Q-7ZTA" /></div>
              {verify.length >= 9 && (found
                ? <div className="card card-b" style={{ background: 'var(--success-bg)' }}><strong style={{ color: 'var(--success)' }}>Genuine document</strong><div className="small">{found.type} · No. {found.serial} · {idx.students[found.student_id]?.full_name} · issued {fmtDate(found.issued_on || found.requested_on)}</div></div>
                : <div className="card card-b" style={{ background: 'var(--danger-bg)' }}><strong style={{ color: 'var(--danger)' }}>Not found</strong><div className="small">No document with this code was issued by {school.short_name}.</div></div>)}
              <div className="xs muted">Receipts and certificates carry this code; anyone (another school, a bank, an embassy) can check it here without logging in.</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
