import { Fragment, useEffect, useMemo, useState } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { PageHead, Card, Stat, StatusBadge, Avatar, Badge, Search, Seg, Tabs, Modal, Progress, Empty, Bars, inr, pct, fmtDate, IconTile, TONES } from '../../components/ui.jsx';
import { applySubs } from '../../lib/substitution.js';
import { attendanceStats, attendanceOn, attendanceTrend, studentAttendance, reportCard, sectionResults, grade, daySchedule, todayDow, currentPeriod, pendingHomework, todayISO } from '../../lib/derive.js';
import { DAYS, PERIODS } from '../../data/generate.js';
import { Crest } from '../../components/Brand.jsx';
import { STAGES, STREAMS, PRACTICAL, subjectCodesFor } from '../../data/classes.js';
import { ChildSwitcher } from '../dashboards/Dashboards.jsx';
import { subjectStyle } from '../dashboards/shared.jsx';

const isStaff = (role) => ['school_admin', 'principal', 'teacher', 'scanner'].includes(role);

function SectionSelect({ value, onChange, all }) {
  const { data } = useSchool();
  return (
    <select className="select" style={{ width: 'auto', minWidth: 130 }} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Class">
      {all && <option value="">All classes</option>}
      {data.sections.map((s) => <option key={s.id} value={s.id}>Class {s.name}</option>)}
    </select>
  );
}

/* ───────────── Students ───────────── */
export function Students() {
  const { data, idx, role, notify } = useSchool();
  const [q, setQ] = useState('');
  const [sec, setSec] = useState('');
  const [stage, setStage] = useState('');
  const [view, setView] = useState(null);
  const [adding, setAdding] = useState(false);
  const hostelOnly = role === 'warden';
  const rows = data.students.filter((s) => (!sec || s.section_id === sec) && (!stage || idx.sections[s.section_id].stage === stage) && (!hostelOnly || s.hostel_room_id) &&
    (!q || `${s.full_name} ${s.admission_no} ${s.guardian_name} ${s.guardian_phone}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <PageHead title={hostelOnly ? 'Hostellers' : 'Students'} sub={`${rows.length} of ${hostelOnly ? data.students.filter((s) => s.hostel_room_id).length : data.students.length} students`}
        actions={role === 'school_admin' && <><button className="btn"><Icon name="upload" size={16} /> Import from Excel</button><button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Add student</button></>} />
      <Card pad={false}>
        <div className="card-h row wrap" style={{ justifyContent: 'flex-start' }}>
          <Search value={q} onChange={setQ} placeholder="Search name, admission no., parent or phone" style={{ flex: 1, minWidth: 220 }} />
          <select className="select" style={{ width: 'auto' }} value={stage} onChange={(e) => { setStage(e.target.value); setSec(''); }} aria-label="Stage"><option value="">All stages (LKG–12)</option>{Object.values(STAGES).map((st) => <option key={st.key} value={st.key}>{st.label} · {st.range}</option>)}</select>
          <SectionSelect value={sec} onChange={setSec} all />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Student</th><th>Adm. no.</th><th>Class</th><th className="num">Roll</th><th>Guardian</th><th>Phone</th><th>{hostelOnly ? 'Room' : 'Transport'}</th><th>Today</th></tr></thead>
            <tbody>
              {rows.slice(0, 120).map((s) => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setView(s)}>
                  <td><div className="row" style={{ gap: 10 }}><Avatar name={s.full_name} size="sm" /><span className="strong">{s.full_name}</span></div></td>
                  <td className="small tnum">{s.admission_no}</td>
                  <td>{idx.sections[s.section_id]?.name}</td>
                  <td className="num">{s.roll_no}</td>
                  <td className="small">{s.guardian_name}</td>
                  <td className="small tnum nowrap">{s.guardian_phone}</td>
                  <td className="small">{hostelOnly ? idx.rooms[s.hostel_room_id]?.room_no : s.route_id ? idx.routes[s.route_id]?.code : <span className="muted">Own</span>}</td>
                  <td><StatusBadge status={idx.attToday[s.id] || 'present'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 120 && <div className="card-f small muted">Showing first 120 — refine your search to see more.</div>}
          {!rows.length && <Empty>No students match your search.</Empty>}
        </div>
      </Card>
      {view && <StudentProfile student={view} onClose={() => setView(null)} />}
      {adding && (
        <Modal title="Add student" onClose={() => setAdding(false)} footer={<><button className="btn" onClick={() => setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={() => { setAdding(false); notify('Student saved (demo)'); }}>Save student</button></>}>
          <div className="grid g-2">
            {['Full name', 'Date of birth', 'Guardian name', 'Guardian mobile', 'Admission no.', 'Blood group'].map((l) => <div className="field" key={l}><label>{l}</label><input className="input" /></div>)}
            <div className="field"><label>Class</label><SectionSelect value={data.sections[0].id} onChange={() => {}} /></div>
            <div className="field"><label>Transport</label><select className="select"><option>Own transport</option>{data.routes.map((r) => <option key={r.id}>{r.code} · {r.name}</option>)}</select></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StudentProfile({ student: s, onClose }) {
  const { data, idx } = useSchool();
  const att = studentAttendance(data, s.id);
  const fees = data.fee_invoices.filter((f) => f.student_id === s.id);
  const due = fees.filter((f) => f.status !== 'paid' && f.status !== 'upcoming').reduce((a, f) => a + Number(f.amount), 0);
  const exam = data.exams.find((e) => e.name.startsWith('Half'));
  const rc = reportCard(data, idx, s.id, exam.id);
  const Row = ({ k, v }) => <div className="row between small" style={{ padding: '6px 0', borderBottom: '1px solid #edf1f6' }}><span className="muted">{k}</span><strong style={{ textAlign: 'right' }}>{v || '—'}</strong></div>;
  return (
    <Modal title="Student profile" onClose={onClose} width={640}>
      <div className="row" style={{ gap: 14, marginBottom: 16 }}>
        <Avatar name={s.full_name} size="lg" />
        <div className="grow"><div className="strong" style={{ fontSize: 18 }}>{s.full_name}</div><div className="small muted">Class {idx.sections[s.section_id].name} · Roll {s.roll_no} · {s.admission_no}</div></div>
        <StatusBadge status={s.status} />
      </div>
      <div className="grid g-3" style={{ marginBottom: 16, gap: 8 }}>
        <div className="card stat"><span className="label">Attendance</span><span className="value" style={{ fontSize: 20 }}>{pct(att.pct, 0)}</span></div>
        <div className="card stat"><span className="label">{exam.name.split(' ')[0]} result</span><span className="value" style={{ fontSize: 20 }}>{rc.grade}</span></div>
        <div className="card stat"><span className="label">Fees due</span><span className="value" style={{ fontSize: 20, color: due ? 'var(--danger)' : undefined }}>{due ? inr(due) : 'Nil'}</span></div>
      </div>
      <div className="grid g-2" style={{ gap: 20 }}>
        <div><div className="upper" style={{ marginBottom: 4 }}>Personal</div><Row k="Gender" v={s.gender === 'F' ? 'Female' : 'Male'} /><Row k="Date of birth" v={fmtDate(s.dob, { day: 'numeric', month: 'short', year: 'numeric' })} /><Row k="Blood group" v={s.blood_group} /><Row k="Address" v={s.address} /></div>
        <div><div className="upper" style={{ marginBottom: 4 }}>Guardian</div><Row k="Name" v={s.guardian_name} /><Row k="Mobile" v={s.guardian_phone} /><Row k="Email" v={s.guardian_email} /><Row k="Transport" v={s.route_id ? `${idx.routes[s.route_id]?.code} · ${idx.stops[s.stop_id]?.name || ''}` : 'Own'} /></div>
      </div>
    </Modal>
  );
}

/* ───────────── Teachers ───────────── */
export function Teachers() {
  const { data, idx } = useSchool();
  const [q, setQ] = useState('');
  const classTeacherOf = Object.fromEntries(data.sections.map((s) => [s.class_teacher_id, s.name]));
  const rows = data.teachers.filter((t) => !q || `${t.full_name} ${t.employee_code}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHead title="Teachers & staff" sub={`${data.teachers.length} teaching staff`} actions={<button className="btn btn-primary"><Icon name="plus" size={16} /> Add staff</button>} />
      <Card pad={false}>
        <div className="card-h"><Search value={q} onChange={setQ} placeholder="Search staff" style={{ flex: 1, maxWidth: 360 }} /></div>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Name</th><th>Emp. code</th><th>Subject</th><th>Designation</th><th>Class teacher</th><th className="num">Load / wk</th><th>Phone</th><th>Joined</th></tr></thead>
          <tbody>{rows.map((t) => (
            <tr key={t.id}>
              <td><div className="row" style={{ gap: 10 }}><Avatar name={t.full_name} size="sm" /><div><div className="strong">{t.full_name}</div><div className="xs muted">{t.email}</div></div></div></td>
              <td className="small">{t.employee_code}</td><td>{idx.subjects[t.subject_id]?.name}{t.subject_codes?.length > 1 && <div className="xs muted">also {t.subject_codes.slice(1).join(', ')}</div>}</td><td><Badge>{t.designation}</Badge>{t.part_time && <div className="xs muted">Part-time</div>}</td>
              <td>{classTeacherOf[t.id] ? <Badge tone="blue">{classTeacherOf[t.id]}</Badge> : <span className="muted">—</span>}</td>
              <td className="num tnum">{(idx.allocByTeacher[t.id] || []).reduce((a, r) => a + r.periods, 0)}/{t.max_load}</td>
              <td className="small tnum nowrap">{t.phone}</td><td className="small">{fmtDate(t.joined_on, { month: 'short', year: 'numeric' })}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>
    </div>
  );
}

/* ───────────── Classes ───────────── */
export function Classes() {
  const { data, idx } = useSchool();
  const [stage, setStage] = useState('all');
  const shown = Object.values(STAGES).filter((st) => stage === 'all' || st.key === stage);
  return (
    <div>
      <PageHead title="Classes & sections" sub={`LKG to Class 12 · ${data.sections.length} sections · ${data.students.length} students`} actions={<button className="btn btn-primary"><Icon name="plus" size={16} /> Add section</button>} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: 16 }}>
        {Object.values(STAGES).map((st) => {
          const secs = data.sections.filter((x) => x.stage === st.key);
          const n = secs.reduce((a, x) => a + (idx.studentsBySection[x.id] || []).length, 0);
          return (
            <button key={st.key} className="card card-b" style={{ textAlign: 'left', cursor: 'pointer', borderColor: stage === st.key ? 'var(--brand)' : undefined }} onClick={() => setStage(stage === st.key ? 'all' : st.key)}>
              <div className="row"><IconTile icon={st.icon} tone={st.tone} size={38} /><div><div className="strong">{st.label}</div><div className="xs muted">{st.range}</div></div></div>
              <div className="row between small" style={{ marginTop: 10 }}><span className="muted">{secs.length} sections</span><strong>{n} students</strong></div>
            </button>
          );
        })}
      </div>
      {shown.map((st) => (
        <div key={st.key} style={{ marginBottom: 20 }}>
          <div className="row between wrap" style={{ marginBottom: 10 }}>
            <h2 className="row" style={{ gap: 8 }}><IconTile icon={st.icon} tone={st.tone} size={28} />{st.label} <span className="muted small">· {st.range}</span></h2>
            <div className="row wrap" style={{ gap: 6 }}><Badge>{st.assessment}</Badge><Badge tone="blue">School day {st.day}</Badge></div>
          </div>
          <div className="grid g-4">
            {data.sections.filter((x) => x.stage === st.key).map((s) => {
              const list = idx.studentsBySection[s.id] || [];
              const a = attendanceStats(attendanceOn(data, idx.today, s.id));
              return (
                <Card key={s.id} title={<span className="serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-ink)' }}>{s.name}</span>} action={s.stage === 'senior' ? <Badge tone="navy">{STREAMS[s.section]}</Badge> : <Badge>{s.room}</Badge>}>
                  <div className="stack-sm small">
                    <div className="row between"><span className="muted">Class teacher</span><strong style={{ textAlign: 'right' }}>{idx.teachers[s.class_teacher_id]?.full_name}</strong></div>
                    <div className="row between"><span className="muted">Strength</span><strong>{list.length} ({list.filter((x) => x.gender === 'F').length}G / {list.filter((x) => x.gender === 'M').length}B)</strong></div>
                    <div className="row between"><span className="muted">Present today</span><strong>{Math.round(a.pct)}%</strong></div>
                    <Progress value={a.pct} />
                    {(data.student_roles || []).filter((r) => r.section_id === s.id && r.role === 'Class Representative').length > 0 && <div className="row between"><span className="muted">CR</span><strong style={{ textAlign: 'right' }}>{data.student_roles.filter((r) => r.section_id === s.id && r.role === 'Class Representative').map((r) => idx.students[r.student_id]?.full_name.split(' ')[0]).join(' & ')}</strong></div>}
                    <div className="xs muted">{subjectCodesFor(s).join(' · ')}</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────── Attendance ───────────── */
export function Attendance() {
  const { role } = useSchool();
  return isStaff(role) ? <AttendanceStaff /> : <AttendanceFamily />;
}

function AttendanceStaff() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const [tab, setTab] = useState(role === 'teacher' || role === 'scanner' ? 'mark' : 'overview');
  const [sec, setSec] = useState(persona.section?.id || data.sections[0].id);
  const date = idx.today;
  const students = idx.studentsBySection[sec] || [];
  const saved = useMemo(() => Object.fromEntries(attendanceOn(data, date, sec).map((a) => [a.student_id, a.status])), [data, date, sec]);
  const [marks, setMarks] = useState(saved);
  useEffect(() => setMarks(saved), [saved]);
  const set = (id, st) => setMarks((m) => ({ ...m, [id]: st }));
  const counts = attendanceStats(Object.values(marks).map((status) => ({ status })));
  const trend = attendanceTrend(data, idx, 12);
  const bySection = data.sections.map((s) => ({ s, ...attendanceStats(attendanceOn(data, date, s.id)) }));
  const absentees = attendanceOn(data, date).filter((a) => a.status === 'absent').map((a) => idx.students[a.student_id]).filter(Boolean);
  const B = [['P', 'present'], ['A', 'absent'], ['L', 'late'], ['V', 'leave']];

  return (
    <div>
      <PageHead title="Attendance" sub={`${fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}`} />
      <Tabs tabs={[['overview', 'Overview'], ['mark', 'Mark attendance'], ['absent', `Absentees (${absentees.length})`]]} value={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === 'overview' && (
          <div className="stack">
            <div className="grid g-4">
              {(() => { const t = attendanceStats(attendanceOn(data, date)); return (<>
                <Stat label="School attendance" value={pct(t.pct)} icon="check" tone="green" foot={`${t.present + t.late} of ${t.total}`} />
                <Stat label="Absent" value={t.absent} icon="user-x" tone="red" foot="Parents notified by SMS" />
                <Stat label="Late" value={t.late} icon="clock" tone="amber" foot="Arrived after 07:55" />
                <Stat label="On leave" value={t.leave} icon="plane" foot="Approved leave" />
              </>); })()}
            </div>
            <Card title="Last 12 school days"><Bars min={80} data={trend} format={(v) => Math.round(v)} /></Card>
            <Card title="Section summary" pad={false}>
              <div className="table-wrap"><table className="table"><thead><tr><th>Class</th><th className="num">Present</th><th className="num">Late</th><th className="num">Absent</th><th className="num">Leave</th><th style={{ width: 180 }}>Rate</th></tr></thead>
                <tbody>{bySection.map((r) => <tr key={r.s.id} style={{ cursor: 'pointer' }} onClick={() => { setSec(r.s.id); setTab('mark'); }}><td className="strong">{r.s.name}</td><td className="num">{r.present}</td><td className="num">{r.late}</td><td className="num">{r.absent}</td><td className="num">{r.leave}</td><td><div className="row" style={{ gap: 8 }}><div className="grow"><Progress value={r.pct} /></div><span className="xs strong tnum">{Math.round(r.pct)}%</span></div></td></tr>)}</tbody></table></div>
            </Card>
          </div>
        )}
        {tab === 'mark' && (
          <Card pad={false}>
            <div className="card-h row wrap">
              <div className="row wrap"><SectionSelect value={sec} onChange={setSec} /><span className="small muted">{students.length} students · Class teacher {idx.teachers[idx.sections[sec].class_teacher_id]?.full_name}</span></div>
              <div className="row wrap" style={{ gap: 6 }}>
                <Badge tone="green">P {counts.present}</Badge><Badge tone="red">A {counts.absent}</Badge><Badge tone="amber">L {counts.late}</Badge><Badge tone="blue">Lv {counts.leave}</Badge>
              </div>
            </div>
            <div className="card-h" style={{ background: 'var(--surface-2)' }}>
              <span className="xs muted">P = Present · A = Absent · L = Late · V = Leave</span>
              <button className="btn btn-sm" onClick={() => setMarks(Object.fromEntries(students.map((s) => [s.id, 'present'])))}>Mark all present</button>
            </div>
            <div>
              {students.map((s) => (
                <div key={s.id} className="att-row">
                  <span className="xs muted tnum" style={{ width: 22 }}>{s.roll_no}</span>
                  <Avatar name={s.full_name} size="sm" />
                  <span className="grow strong small">{s.full_name}</span>
                  <div className="att-btns" role="group" aria-label={`Attendance for ${s.full_name}`}>
                    {B.map(([k, st]) => <button key={k} className={`${k} ${marks[s.id] === st ? 'on' : ''}`} onClick={() => set(s.id, st)} aria-pressed={marks[s.id] === st}>{k}</button>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="card-f row between wrap">
              <span className="small muted">Absent students’ parents receive an SMS and app notification on save.</span>
              <button className="btn btn-primary" onClick={() => { actions.saveAttendance(sec, date, marks); notify(`Attendance saved for ${idx.sections[sec].name} · ${counts.absent} absent`); }}>Save attendance</button>
            </div>
          </Card>
        )}
        {tab === 'absent' && (
          <Card pad={false}>
            <div className="table-wrap"><table className="table"><thead><tr><th>Student</th><th>Class</th><th>Guardian</th><th>Phone</th><th>Alert</th></tr></thead>
              <tbody>{absentees.map((s) => <tr key={s.id}><td className="strong">{s.full_name}</td><td>{idx.sections[s.section_id].name}</td><td className="small">{s.guardian_name}</td><td className="small tnum">{s.guardian_phone}</td><td><Badge tone="green"><Icon name="tick" size={12} /> SMS sent</Badge></td></tr>)}</tbody></table></div>
          </Card>
        )}
      </div>
      {role === 'scanner' && <p className="small muted" style={{ marginTop: 12 }}>Gate scans are recorded automatically; manual corrections are logged in the audit trail.</p>}
    </div>
  );
}

function AttendanceFamily() {
  const { data, persona, role } = useSchool();
  const s = persona.child;
  const att = studentAttendance(data, s.id);
  const byDate = Object.fromEntries(att.rows.map((r) => [r.date, r.status]));
  const now = new Date();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const first = new Date(month);
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const key = (d) => `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return (
    <div>
      <PageHead title="Attendance" sub={`${s.full_name} · last 24 school days`} actions={role === 'parent' && <ChildSwitcher />} />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Attendance" value={pct(att.pct, 1)} icon="check" tone={att.pct < 85 ? 'amber' : 'green'} foot="Minimum required: 75%" />
        <Stat label="Present" value={att.present} icon="user-check" foot="days" />
        <Stat label="Absent" value={att.absent} icon="user-x" tone="red" foot="days" />
        <Stat label="Late / leave" value={`${att.late} / ${att.leave}`} icon="clock" tone="amber" foot="days" />
      </div>
      <div className="grid g-main">
        <Card title={month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} action={<div className="row" style={{ gap: 4 }}><button className="btn btn-sm" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><button className="btn btn-sm" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div>}>
          <div className="cal">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="h">{d}</div>)}
            {Array.from({ length: lead }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysIn }, (_, i) => <div key={i} className={`d ${byDate[key(i + 1)] || ''}`} title={byDate[key(i + 1)] || ''}>{i + 1}</div>)}
          </div>
          <div className="row wrap small" style={{ gap: 14, marginTop: 14 }}>
            <span className="row" style={{ gap: 6 }}><span className="dot" style={{ color: 'var(--success)' }} />Present</span>
            <span className="row" style={{ gap: 6 }}><span className="dot" style={{ color: 'var(--danger)' }} />Absent</span>
            <span className="row" style={{ gap: 6 }}><span className="dot" style={{ color: 'var(--warn)' }} />Late / leave</span>
          </div>
        </Card>
        <Card title="Recent days" pad={false}>
          <div className="list">{[...att.rows].reverse().slice(0, 8).map((r) => <div key={r.date} className="row between"><span className="small">{fmtDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span><StatusBadge status={r.status} /></div>)}</div>
        </Card>
      </div>
    </div>
  );
}

/* ───────────── Timetable ───────────── */
export function Timetable() {
  const { data, idx, role, persona } = useSchool();
  const teacherMode = role === 'teacher';
  const family = role === 'parent' || role === 'student';
  const [sec, setSec] = useState(family ? persona.child.section_id : data.sections[4].id);
  const [mine, setMine] = useState(teacherMode);
  const effSec = family ? persona.child.section_id : sec;
  const dow = todayDow();
  const all = useMemo(() => [...data.timetable_slots.filter((t) => t.day !== dow), ...applySubs(data, data.timetable_slots.filter((t) => t.day === dow), dow, todayISO())], [data, dow]);
  const slots = all.filter((t) => (mine && teacherMode ? t.teacher_id === persona.teacher.id : t.section_id === effSec));
  const cell = (day, period) => slots.find((t) => t.day === day && t.period === period);
  const cur = currentPeriod();
  return (
    <div>
      <PageHead title="Timetable" sub={mine && teacherMode ? `${persona.name} · weekly schedule` : `Class ${idx.sections[effSec].name} · ${idx.sections[effSec].room}`}
        actions={<>
          {role === 'parent' && <ChildSwitcher />}
          {teacherMode && <Seg options={[['mine', 'My timetable'], ['class', 'Class timetable']]} value={mine ? 'mine' : 'class'} onChange={(v) => setMine(v === 'mine')} />}
          {!family && !(mine && teacherMode) && <SectionSelect value={sec} onChange={setSec} />}
          <button className="btn no-print" onClick={() => window.print()}><Icon name="print" size={16} /> Print</button>
        </>} />
      <Card pad={false}>
        <div className="table-wrap" style={{ padding: 8 }}>
          <table className="tt">
            <thead><tr><th style={{ width: 90 }}>Period</th>{DAYS.map((d, i) => <th key={d} style={i + 1 === dow ? { color: 'var(--brand)' } : undefined}>{d}{i + 1 === dow ? ' · Today' : ''}</th>)}</tr></thead>
            <tbody>
              {PERIODS.map((p) => (
                <Fragment key={p.period}>
                  {p.period === 4 && <tr key="b1"><td className="break xs muted strong">10:15</td><td className="break xs muted" colSpan={6} style={{ textAlign: 'center' }}>Short break</td></tr>}
                  {p.period === 6 && <tr key="b2"><td className="break xs muted strong">12:05</td><td className="break xs muted" colSpan={6} style={{ textAlign: 'center' }}>Lunch break</td></tr>}
                  <tr>
                    <td className="break"><div className="strong small">P{p.period}</div><div className="xs muted tnum">{p.start}–{p.end}</div></td>
                    {DAYS.map((d, i) => {
                      const c = cell(i + 1, p.period);
                      if (!c) return <td key={d} className="empty-slot"><span className="xs muted">{i === 5 && p.period > 4 ? '—' : mine ? 'Free' : ''}</span></td>;
                      const now = i + 1 === dow && p.period === cur;
                      const [tbg, tfg] = TONES[subjectStyle(idx.subjects[c.subject_id]).tone];
                      return (
                        <td key={d} className={now ? 'now' : ''} style={now ? undefined : { background: tbg, borderLeftColor: tfg }}>
                          <div className="strong row" style={{ gap: 5, color: now ? '#fff' : tfg }}><Icon name={subjectStyle(idx.subjects[c.subject_id]).icon} size={13} />{idx.subjects[c.subject_id]?.name}</div>
                          <div className="xs muted">{mine && teacherMode ? `Class ${idx.sections[c.section_id].name}` : c.sub && !c.teacher_id ? (c.sub.status === 'open' ? 'Teacher to be assigned' : 'Library self-study') : idx.teachers[c.teacher_id]?.full_name.replace(/^(Mr\.|Ms\.|Mrs\.)\s/, '')}</div>
                          {c.sub && <div className="sub-tag">Substitute · for {idx.teachers[c.original_teacher_id]?.full_name.replace(/^(Mr\.|Ms\.|Mrs\.)\s/, '')}</div>}
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ───────────── Homework ───────────── */
export function Homework() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const family = role === 'parent' || role === 'student';
  const [sec, setSec] = useState(family ? persona.child.section_id : persona.section?.id || data.sections[0].id);
  const effSec = family ? persona.child.section_id : sec;
  const [adding, setAdding] = useState(false);
  const myAlloc = role === 'teacher' ? (idx.allocByTeacher[persona.teacher.id] || []) : null;
  const allowedSubs = (sid) => (myAlloc ? myAlloc.filter((a) => a.section_id === sid).map((a) => idx.subjects[a.subject_id]) : subjectCodesFor(idx.sections[sid]).map((c) => data.subjects.find((x) => x.code === c)));
  const [form, setForm] = useState({ subject_id: persona.teacher?.subject_id || data.subjects[0].id, title: '', details: '', due_on: '' });
  const canAssign = role === 'school_admin' || (role === 'teacher' && allowedSubs(sec).length > 0);
  const [done, setDone] = useState({});
  const list = pendingHomework(data, effSec);
  const today = todayISO();
  return (
    <div>
      <PageHead title="Homework" sub={`Class ${idx.sections[effSec].name} · ${list.length} assignments`} actions={<>
        {role === 'parent' && <ChildSwitcher />}
        {!family && (myAlloc ? <select className="select" style={{ width: 'auto' }} value={sec} onChange={(e) => setSec(e.target.value)}>{[...new Set([persona.section.id, ...myAlloc.map((a) => a.section_id)])].map((id) => <option key={id} value={id}>Class {idx.sections[id].name}</option>)}</select> : <SectionSelect value={sec} onChange={setSec} />)}
        {(role === 'teacher' || role === 'school_admin') && <button className="btn btn-primary" disabled={!canAssign} title={canAssign ? '' : 'You don’t teach this class — see My Classes'} onClick={() => { setForm({ ...form, subject_id: allowedSubs(sec)[0]?.id }); setAdding(true); }}><Icon name="plus" size={16} /> Assign homework</button>}
      </>} />
      <div className="stack">
        {list.map((h) => {
          const status = done[h.id] ? 'Submitted' : h.due_on < today ? 'Past due' : h.due_on === today ? 'Due today' : `Due ${fmtDate(h.due_on, { weekday: 'short', day: 'numeric', month: 'short' })}`;
          return (
            <div key={h.id} className="card card-b row top wrap" style={{ gap: 14 }}>
              <IconTile icon={subjectStyle(idx.subjects[h.subject_id]).icon} tone={subjectStyle(idx.subjects[h.subject_id]).tone} size={40} />
              <div className="grow" style={{ minWidth: 220 }}>
                <div className="row wrap" style={{ gap: 8 }}><Badge tone="blue">{idx.subjects[h.subject_id]?.name}</Badge><span className="xs muted">Assigned {fmtDate(h.assigned_on)} by {idx.teachers[h.teacher_id]?.full_name}</span></div>
                <div className="strong" style={{ marginTop: 6 }}>{h.title}</div>
                <div className="small muted" style={{ marginTop: 2 }}>{h.details}</div>
              </div>
              <div className="stack-sm" style={{ alignItems: 'flex-end' }}>
                <Badge tone={done[h.id] ? 'green' : h.due_on <= today ? 'red' : 'amber'}>{status}</Badge>
                {role === 'student' && !done[h.id] && <button className="btn btn-sm" onClick={() => { setDone({ ...done, [h.id]: true }); notify('Marked as submitted'); }}><Icon name="upload" size={14} /> Submit</button>}
                {role === 'teacher' && <span className="xs muted">{Math.floor((idx.studentsBySection[h.section_id]?.length || 0) * 0.7)} / {idx.studentsBySection[h.section_id]?.length} submitted</span>}
              </div>
            </div>
          );
        })}
        {!list.length && <Card><Empty>No homework for this class.</Empty></Card>}
      </div>
      {adding && (
        <Modal title={`Assign homework — Class ${idx.sections[sec].name}`} onClose={() => setAdding(false)} footer={<><button className="btn" onClick={() => setAdding(false)}>Cancel</button><button className="btn btn-primary" disabled={!form.title || !form.due_on} onClick={() => { actions.addHomework({ ...form, section_id: sec, teacher_id: persona.teacher?.id || data.teachers[0].id }); setAdding(false); notify('Homework published — parents notified'); setForm({ ...form, title: '', details: '' }); }}>Publish</button></>}>
          <div className="stack">
            <div className="grid g-2">
              <div className="field"><label>Subject</label><select className="select" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>{allowedSubs(sec).filter(Boolean).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>{myAlloc && <div className="xs muted" style={{ marginTop: 4 }}>Only subjects allotted to you in this class</div>}</div>
              <div className="field"><label>Due date</label><input type="date" className="input" value={form.due_on} onChange={(e) => setForm({ ...form, due_on: e.target.value })} /></div>
            </div>
            <div className="field"><label>Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Exercise 8.1 — Q1 to Q10" /></div>
            <div className="field"><label>Instructions</label><textarea className="input" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }}><Icon name="upload" size={16} /> Attach PDF / image</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────────── Results ───────────── */
export function Results() {
  const { role } = useSchool();
  if (role === 'parent' || role === 'student') return <ReportCardView />;
  if (role === 'teacher') return <MarksEntry />;
  return <ResultsOverview />;
}

function ExamSelect({ value, onChange }) {
  const { data } = useSchool();
  return <select className="select" style={{ width: 'auto' }} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Exam">{data.exams.filter((e) => e.status === 'published').map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>;
}

function ResultsOverview() {
  const { data, idx, actions, notify } = useSchool();
  const [tab, setTab] = useState('merit');
  const [exam, setExam] = useState(data.exams[1].id);
  const graded = data.sections.filter((s) => s.stage !== 'pre');
  const [sec, setSec] = useState((graded.find((s) => s.name === '8A') || graded[0]).id);
  const rows = sectionResults(data, idx, sec, exam);
  const summary = useMemo(() => graded.map((s) => { const r = sectionResults(data, idx, s.id, exam); return { s, avg: r.reduce((a, x) => a + x.pct, 0) / (r.length || 1) }; }), [data, idx, exam]);
  const subjects = rows[0]?.rows.map((r) => r.subject) || [];
  const sec10 = graded.filter((s) => s.grade === 10);
  const sec12 = graded.filter((s) => s.grade === 12);
  const boardRows = [...sec10, ...sec12].flatMap((s) => (idx.studentsBySection[s.id] || []).map((st) => ({ st, s })));
  const tenth = sec10.flatMap((s) => sectionResults(data, idx, s.id, exam).map((r) => ({ ...r, s })));
  const streamOf = (r) => { const m = Object.fromEntries(r.rows.map((x) => [x.subject?.code, x.pct])); return (m.MAT || 0) >= 70 && (m.SCI || 0) >= 70 ? 'Science (PCM/PCB)' : r.pct >= 60 ? 'Commerce' : 'Humanities'; };
  return (
    <div>
      <PageHead title="Exams & report cards" sub="Class 1–12 marks and grades · LKG–UKG use the skill checklist" actions={<><ExamSelect value={exam} onChange={setExam} /><button className="btn btn-primary" onClick={() => { actions.push(['parent', 'student'], 'Report card published', `${data.exams.find((e) => e.id === exam)?.name} results are now available`, 'notice', ['push', 'whatsapp', 'email']); notify('Published — parents notified on app, WhatsApp & email'); }}><Icon name="send" size={16} /> Publish to parents</button></>} />
      <Tabs tabs={[['merit', 'Merit list'], ['averages', 'Class averages'], ['board', 'Board exams (10 & 12)'], ['stream', 'Stream selection (10 → 11)'], ['schedule', 'Exam schedule']]} value={tab} onChange={setTab} />
      <div className="stack" style={{ marginTop: 16 }}>
        {tab === 'averages' && <Card title="Class averages" icon="chart" tone="blue"><Bars data={summary.map((x) => ({ label: x.s.name.replace(' ', ''), value: Math.round(x.avg) }))} format={(v) => `${v}`} highlightLast={false} /></Card>}
        {tab === 'merit' && (
          <Card title={`Merit list — Class ${idx.sections[sec].name}`} icon="medal" tone="violet" action={<select className="select" style={{ width: 'auto' }} value={sec} onChange={(e) => setSec(e.target.value)}>{graded.map((s) => <option key={s.id} value={s.id}>Class {s.name}</option>)}</select>} pad={false}>
            <div className="table-wrap"><table className="table">
              <thead><tr><th className="num">Rank</th><th>Student</th>{subjects.map((s) => <th key={s.id} className="num">{s.code}</th>)}<th className="num">Total</th><th className="num">%</th><th>Grade</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.student.id}><td className="num strong">{r.rank}</td><td className="strong">{r.student.full_name}</td>{r.rows.map((m) => <td key={m.id} className="num" style={{ color: m.pct < 33 ? 'var(--danger)' : undefined }}>{m.marks_obtained}</td>)}<td className="num">{r.total}/{r.max}</td><td className="num strong">{r.pct.toFixed(1)}</td><td><Badge tone={r.pct >= 75 ? 'green' : r.pct >= 50 ? 'blue' : 'amber'}>{r.grade}</Badge></td></tr>
              ))}</tbody>
            </table></div>
          </Card>
        )}
        {tab === 'board' && (
          <>
            <div className="grid g-4">
              <Stat label="Class 10 candidates" value={sec10.reduce((a, s) => a + (idx.studentsBySection[s.id] || []).length, 0)} icon="users" />
              <Stat label="Class 12 candidates" value={sec12.reduce((a, s) => a + (idx.studentsBySection[s.id] || []).length, 0)} icon="cap" tone="navy" />
              <Stat label="Registration (LOC)" value="Submitted" icon="badge" tone="green" foot="Board portal export ready" />
              <Stat label="Pre-board" value={fmtDate(data.exams[2]?.starts_on)} icon="calendar" tone="amber" />
            </div>
            <Card title="List of candidates — board registration" icon="clip-list" tone="navy" pad={false} action={<button className="btn btn-sm" onClick={() => notify('LOC file exported in board format')}><Icon name="download" size={14} /> Export LOC</button>}>
              <div className="table-wrap" style={{ maxHeight: 420 }}><table className="table">
                <thead><tr><th>Student</th><th>Class</th><th>Adm. no.</th><th>DOB</th><th>Subjects</th><th>Documents</th></tr></thead>
                <tbody>{boardRows.map(({ st, s }, i) => <tr key={st.id}><td className="strong small">{st.full_name}</td><td>{s.name}</td><td className="small tnum">{st.admission_no}</td><td className="small">{fmtDate(st.dob, { day: 'numeric', month: 'short', year: 'numeric' })}</td><td className="xs">{(sectionResults(data, idx, s.id, exam)[0]?.rows || []).map((x) => x.subject?.code).join(', ')}</td><td><Badge tone={i % 9 === 4 ? 'amber' : 'green'}>{i % 9 === 4 ? 'Photo pending' : 'Complete'}</Badge></td></tr>)}</tbody>
              </table></div>
            </Card>
          </>
        )}
        {tab === 'stream' && (
          <Card title="Suggested streams for Class 11 (based on Class 10 performance)" icon="route" tone="teal" pad={false} action={<button className="btn btn-sm btn-primary" onClick={() => { actions.push(['parent'], 'Stream counselling', 'Suggested stream for Class 11 is ready — book a counselling slot.', 'notice', ['push', 'whatsapp']); notify('Stream suggestions shared with parents'); }}>Share with parents</button>}>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Student</th><th>Class</th><th className="num">Overall %</th><th className="num">Maths</th><th className="num">Science</th><th>Suggested stream</th></tr></thead>
              <tbody>{tenth.sort((a, b) => b.pct - a.pct).map((r) => { const m = Object.fromEntries(r.rows.map((x) => [x.subject?.code, x.pct])); const st = streamOf(r); return <tr key={r.student.id}><td className="strong small">{r.student.full_name}</td><td>{r.s.name}</td><td className="num strong">{r.pct.toFixed(1)}</td><td className="num">{Math.round(m.MAT || 0)}</td><td className="num">{Math.round(m.SCI || 0)}</td><td><Badge tone={st.startsWith('Science') ? 'violet' : st === 'Commerce' ? 'blue' : 'teal'}>{st}</Badge></td></tr>; })}</tbody>
            </table></div>
          </Card>
        )}
        {tab === 'schedule' && (
          <Card title="Exam schedule by stage" icon="calendar" tone="teal" pad={false}>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Stage</th><th>Classes</th><th>Assessment</th><th>Next</th></tr></thead>
              <tbody>{Object.values(STAGES).map((st) => <tr key={st.key}><td className="strong"><span className="row" style={{ gap: 8 }}><IconTile icon={st.icon} tone={st.tone} size={28} />{st.label}</span></td><td>{st.range}</td><td className="small">{st.assessment}</td><td className="small">{st.key === 'pre' ? 'Skill review — end of term' : st.key === 'secondary' || st.key === 'senior' ? `Pre-board · ${fmtDate(data.exams[2]?.starts_on)}` : `${data.exams[2]?.name} · ${fmtDate(data.exams[2]?.starts_on)}`}</td></tr>)}</tbody>
            </table></div>
          </Card>
        )}
      </div>
    </div>
  );
}

function MarksEntry() {
  const { data, idx, persona, actions, notify } = useSchool();
  const [exam, setExam] = useState(data.exams[1].id);
  const pairs = (idx.allocByTeacher[persona.teacher.id] || []).filter((a) => !['PE', 'ART', 'MUS'].includes(a.subject_code) && idx.sections[a.section_id].stage !== 'pre')
    .sort((a, b) => idx.sections[a.section_id].grade - idx.sections[b.section_id].grade);
  const [pairId, setPairId] = useState(() => (pairs.find((p) => p.section_id === persona.section.id) || pairs[0])?.id);
  const pair = pairs.find((p) => p.id === pairId) || pairs[0];
  const sec = pair?.section_id || persona.section.id;
  const subject = pair?.subject_id || persona.teacher.subject_id;
  const students = idx.studentsBySection[sec];
  const existing = Object.fromEntries(data.marks.filter((m) => m.exam_id === exam && m.subject_id === subject).map((m) => [m.student_id, m]));
  const max = Object.values(existing)[0]?.max_marks || 80;
  const [vals, setVals] = useState({});
  useEffect(() => setVals({}), [exam, sec, subject]);
  const v = (id) => (vals[id] ?? existing[id]?.marks_obtained ?? '');
  return (
    <div>
      <PageHead title="Marks entry" sub={`${idx.subjects[subject]?.name} · max marks ${max}`} actions={<><ExamSelect value={exam} onChange={setExam} /><select className="select" style={{ width: 'auto' }} value={pair?.id} onChange={(e) => setPairId(e.target.value)} aria-label="Class and subject">{pairs.map((p) => <option key={p.id} value={p.id}>Class {idx.sections[p.section_id].name} · {idx.subjects[p.subject_id]?.name}</option>)}</select></>} />
      <Card pad={false}>
        <div className="table-wrap"><table className="table">
          <thead><tr><th className="num">Roll</th><th>Student</th><th style={{ width: 140 }}>Marks / {max}</th><th className="num">%</th><th>Grade</th></tr></thead>
          <tbody>{students.map((s) => { const val = v(s.id); const p = val === '' ? null : (Number(val) / max) * 100; return (
            <tr key={s.id}><td className="num">{s.roll_no}</td><td className="strong">{s.full_name}</td>
              <td><input className="input tnum" style={{ height: 32, width: 100 }} type="number" min="0" max={max} value={val} onChange={(e) => setVals({ ...vals, [s.id]: e.target.value === '' ? '' : Math.min(max, Math.max(0, Number(e.target.value))) })} aria-label={`Marks for ${s.full_name}`} /></td>
              <td className="num">{p == null ? '—' : p.toFixed(0)}</td><td>{p == null ? '—' : <Badge tone={p < 33 ? 'red' : 'blue'}>{grade(p)}</Badge>}</td></tr>
          ); })}</tbody>
        </table></div>
        <div className="card-f row between wrap"><span className="small muted">You can enter marks only for the classes and subjects allotted to you. Marks are locked once the principal publishes results.</span><button className="btn btn-primary" onClick={() => { actions.saveMarks(exam, subject, vals); notify('Marks saved'); }}>Save marks</button></div>
      </Card>
    </div>
  );
}

function ReportCardView() {
  const { data, idx, persona, role } = useSchool();
  const s = persona.child;
  const [exam, setExam] = useState(data.exams[1].id);
  const rc = reportCard(data, idx, s.id, exam);
  const rank = sectionResults(data, idx, s.section_id, exam).find((r) => r.student.id === s.id)?.rank;
  const attPct = studentAttendance(data, s.id).pct;
  const sorted = [...rc.rows].sort((a, b) => b.pct - a.pct);
  const best = sorted[0]; const weak = sorted[sorted.length - 1];
  const sec = idx.sections[s.section_id];
  const ex = data.exams.find((e) => e.id === exam);
  const school = data.school;
  if (sec.stage === 'pre') return <SkillReport s={s} sec={sec} role={role} />;
  return (
    <div>
      <PageHead title="Results" sub={`${s.full_name} · Class ${sec.name}`} actions={<>{role === 'parent' && <ChildSwitcher />}<ExamSelect value={exam} onChange={setExam} /><button className="btn no-print" onClick={() => window.print()}><Icon name="download" size={16} /> Download</button></>} />
      <div className="report" style={{ maxWidth: 860 }}>
        <div className="report-head">
          <Crest school={school} size={54} />
          <div className="grow">
            <div className="serif" style={{ fontSize: 21, fontWeight: 700, color: 'var(--brand-ink)' }}>{school.name}</div>
            <div className="xs muted">{school.address} · Affiliated to {school.board} ({school.affiliation_no})</div>
            <div className="strong small" style={{ marginTop: 4, color: 'var(--brand)' }}>Report Card — {ex.name} · AY {school.academic_year}</div>
          </div>
        </div>
        <div className="card-b grid g-4" style={{ gap: 10, borderBottom: '1px solid var(--line)' }}>
          {[['Student', s.full_name], ['Class / Roll', `${sec.name} / ${s.roll_no}`], ['Admission no.', s.admission_no], ['Guardian', s.guardian_name]].map(([k, v]) => <div key={k}><div className="xs muted strong">{k}</div><div className="small strong">{v}</div></div>)}
        </div>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Subject</th><th className="num">Max</th><th className="num">Obtained</th><th className="num">%</th><th>Grade</th></tr></thead>
          <tbody>{rc.rows.map((r) => <tr key={r.id}><td className="strong">{r.subject?.name}{sec.stage === 'senior' && PRACTICAL.includes(r.subject?.code) && <span className="xs muted"> · theory (practical 30 separately)</span>}</td><td className="num">{r.max_marks}</td><td className="num">{r.marks_obtained}</td><td className="num">{r.pct.toFixed(0)}</td><td><Badge tone={r.pct >= 75 ? 'green' : r.pct >= 50 ? 'blue' : 'amber'}>{grade(r.pct)}</Badge></td></tr>)}
            <tr><td className="strong">Total</td><td className="num strong">{rc.max}</td><td className="num strong">{rc.total}</td><td className="num strong">{rc.pct.toFixed(1)}</td><td><Badge tone="navy">{rc.grade}</Badge></td></tr>
          </tbody>
        </table></div>
        <div className="grid g-2" style={{ gap: 0, borderTop: '1px solid var(--line)' }}>
          <div style={{ borderRight: '1px solid var(--line)' }}>
            <div className="card-b" style={{ paddingBottom: 6 }}><div className="upper">Co-scholastic areas (NEP holistic progress)</div></div>
            <table className="table"><tbody>{(data.co_scholastic?.[s.id] || []).map((c) => <tr key={c.area}><td className="small">{c.area}</td><td style={{ width: 60 }}><Badge tone={c.grade === 'A' ? 'green' : c.grade === 'B' ? 'blue' : 'amber'}>{c.grade}</Badge></td></tr>)}</tbody></table>
          </div>
          <div className="card-b">
            <div className="upper" style={{ marginBottom: 8 }}>Class teacher’s remarks</div>
            <p className="small" style={{ lineHeight: 1.7 }}>{smartRemark(s, rc, attPct)}</p>
            <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
              <span className="badge blue"><Icon name="check" size={12} /> Attendance {Math.round(attPct)}%</span>
              <span className="badge violet" style={{ background: '#efeafc', color: '#6a3fc2' }}><Icon name="trophy" size={12} /> Strongest: {best?.subject?.name}</span>
              <span className="badge amber"><Icon name="trend" size={12} /> Focus: {weak?.subject?.name}</span>
            </div>
          </div>
        </div>
        <div className="card-b row wrap between" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="small"><span className="muted">Class rank:</span> <strong>{rank} of {idx.studentsBySection[s.section_id].length}</strong> · <span className="muted">Result:</span> <strong style={{ color: 'var(--success)' }}>{rc.pct >= 33 ? 'Pass' : 'Needs improvement'}</strong></div>
          <div className="row" style={{ gap: 32 }}>
            <div className="xs muted" style={{ textAlign: 'center' }}><div style={{ borderTop: '1px solid var(--line-strong)', width: 120, marginBottom: 4 }} />Class Teacher</div>
            <div className="xs muted" style={{ textAlign: 'center' }}><div style={{ borderTop: '1px solid var(--line-strong)', width: 120, marginBottom: 4 }} />Principal</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Auto-drafted remark from marks + attendance — the teacher can edit before publishing. */
export function smartRemark(s, rc, attPct) {
  const first = s.full_name.split(' ')[0];
  const he = s.gender === 'F' ? 'She' : 'He';
  const his = s.gender === 'F' ? 'her' : 'his';
  const sorted = [...rc.rows].sort((a, b) => b.pct - a.pct);
  const best = sorted[0]?.subject?.name; const weak = sorted[sorted.length - 1]?.subject?.name;
  const tone = rc.pct >= 85 ? `${first} has delivered an excellent performance this term` : rc.pct >= 70 ? `${first} has shown consistent effort and good understanding this term` : rc.pct >= 55 ? `${first} is progressing steadily` : `${first} needs regular support and practice to reach ${his} potential`;
  const att = attPct >= 95 ? 'Attendance has been exemplary.' : attPct >= 85 ? 'Attendance is regular.' : 'Irregular attendance is affecting learning; please ensure daily attendance.';
  return `${tone}. ${he} shows particular strength in ${best}${weak && weak !== best ? `, while ${weak} needs more practice at home` : ''}. ${att} Keep it up!`;
}

/** Pre-primary progress report — skills and observations, no marks. */
function SkillReport({ s, sec, role }) {
  const { data, idx } = useSchool();
  const skills = data.skills?.[s.id] || [];
  const diary = data.diary?.[s.id] || [];
  const LV = { Emerging: 1, Developing: 2, Proficient: 3, Mastered: 4 };
  const school = data.school;
  return (
    <div>
      <PageHead title="Progress report" sub={`${s.full_name} · ${sec.name} · skill-based (no exams in pre-primary)`} actions={<>{role === 'parent' && <ChildSwitcher />}<button className="btn no-print" onClick={() => window.print()}><Icon name="download" size={16} /> Download</button></>} />
      <div className="grid g-main" style={{ alignItems: 'start' }}>
        <div className="report">
          <div className="report-head"><Crest school={school} size={50} /><div><div className="serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-ink)' }}>{school.name}</div><div className="strong small" style={{ color: 'var(--brand)' }}>Pre-primary Progress Report · Term 1 · AY {school.academic_year}</div></div></div>
          <div className="card-b row wrap" style={{ gap: 24, borderBottom: '1px solid var(--line)' }}>{[['Child', s.full_name], ['Class', sec.name], ['Class teacher', idx.teachers[sec.class_teacher_id]?.full_name]].map(([k, v]) => <div key={k}><div className="xs muted strong">{k}</div><div className="small strong">{v}</div></div>)}</div>
          <table className="table"><thead><tr><th>Development area</th><th style={{ width: 220 }}>Level</th><th>Teacher’s observation</th></tr></thead>
            <tbody>{skills.map((k) => <tr key={k.area}><td className="strong small">{k.area}</td><td><div className="row" style={{ gap: 3 }}>{[1, 2, 3, 4].map((n) => <span key={n} style={{ width: 22, height: 8, borderRadius: 3, background: n <= LV[k.level] ? 'var(--brand)' : '#e3e9f1' }} />)}<span className="xs strong" style={{ marginLeft: 6 }}>{k.level}</span></div></td><td className="small">{k.note}</td></tr>)}</tbody>
          </table>
          <div className="card-b small" style={{ borderTop: '1px solid var(--line)' }}><strong>Teacher’s note:</strong> {s.full_name.split(' ')[0]} is settling in happily, enjoys group activities and is building confidence with letters and numbers. Please read a picture book together every evening.</div>
        </div>
        <Card title="Daily diary — this week" icon="sun" tone="amber" pad={false}>
          <div className="list">{diary.map((d) => <div key={d.date}><div className="row between"><strong className="small">{fmtDate(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</strong><Badge tone="amber">{d.mood}</Badge></div><div className="xs muted">{d.activity} · {d.meal} · {d.photos} photos</div></div>)}</div>
        </Card>
      </div>
    </div>
  );
}
