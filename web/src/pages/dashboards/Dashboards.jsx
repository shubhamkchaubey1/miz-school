import { useMemo } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { Card, Stat, Bars, Progress, StatusBadge, Avatar, Badge, inr, num, pct, ago, fmtDate, fmtTime, IconTile } from '../../components/ui.jsx';
import { attendanceStats, attendanceOn, attendanceTrend, feeSummary, daySchedule, todayDow, studentAttendance, reportCard, sectionResults, pendingHomework, todayISO } from '../../lib/derive.js';
import { Welcome, QuickActions, TodaySchedule, NoticesCard, PeriodList, useGo } from './shared.jsx';
import { PLATFORM_TENANTS, PLANS } from '../../data/api.js';
import { DEMO_SCHOOLS } from '../../data/schools.js';
import { Crest } from '../../components/Brand.jsx';

export default function Dashboard() {
  const { role } = useSchool();
  const map = { school_admin: AdminDash, principal: PrincipalDash, teacher: TeacherDash, parent: ParentDash, student: StudentDash, driver: DriverDash, reception: ReceptionDash, warden: WardenDash, canteen: CanteenDash, scanner: ScannerDash, super_admin: SuperDash };
  const C = map[role] || AdminDash;
  return <C />;
}

function useSchoolKpis() {
  const { data, idx } = useSchool();
  return useMemo(() => {
    const today = attendanceStats(attendanceOn(data, idx.today));
    const fees = feeSummary(data.fee_invoices);
    const bySection = data.sections.map((s) => ({ section: s, ...attendanceStats(attendanceOn(data, idx.today, s.id)) }));
    return { today, fees, bySection, trend: attendanceTrend(data, idx, 10) };
  }, [data, idx]);
}

function AdminDash() {
  const { data, idx, persona } = useSchool();
  const go = useGo();
  const k = useSchoolKpis();
  const pendingLeave = data.leave_requests.filter((l) => l.status === 'pending').length;
  const openComplaints = data.complaints.filter((c) => c.status !== 'resolved').length;
  const newEnq = data.admission_enquiries.filter((e) => e.status === 'new').length;
  return (
    <div className="stack">
      <Welcome name={persona.name} sub={`${data.school.name} · School overview`} chips={[['users', `${data.students.length} students`], ['id', `${data.teachers.length} teachers`], ['layers', `${data.sections.length} sections`], ['check', `${Math.round(k.today.pct)}% present today`]]} actions={<><button className="btn" onClick={() => go('reports')}><Icon name="chart" size={16} /> Reports</button><button className="btn btn-primary" onClick={() => go('notices')}><Icon name="megaphone" size={16} /> New notice</button></>} />
      <div className="grid g-4">
        <Stat label="Students" value={num(data.students.length)} foot={`${data.sections.length} sections · Classes 6–10`} icon="users" />
        <Stat label="Teachers" value={num(data.teachers.length)} foot={`${data.teachers.filter((t) => t.designation === 'PGT').length} PGT · ${data.teachers.filter((t) => t.designation === 'TGT').length} TGT`} icon="id" />
        <Stat label="Attendance today" value={pct(k.today.pct)} foot={`${k.today.absent} absent · ${k.today.late} late`} icon="check" tone="green" />
        <Stat label="Fees pending" value={inr(k.fees.pending, true)} foot={`${inr(k.fees.overdue, true)} overdue · ${k.fees.overdueCount} invoices`} icon="wallet" tone="amber" />
      </div>
      <div className="grid g-main">
        <Card icon="chart" tone="blue" title="Attendance — last 10 school days" action={<button className="btn btn-ghost btn-sm" onClick={() => go('attendance')}>Open</button>}>
          <Bars min={80} data={k.trend} format={(v) => `${Math.round(v)}`} />
          <div className="xs muted" style={{ marginTop: 8 }}>Percentage of students present or late.</div>
        </Card>
        <TodaySchedule />
      </div>
      <div className="grid g-main">
        <Card icon="users" tone="green" title="Class-wise attendance today" pad={false} action={<span className="xs muted">{fmtDate(idx.today, { weekday: 'short', day: 'numeric', month: 'short' })}</span>}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Class</th><th>Class teacher</th><th className="num">Present</th><th className="num">Absent</th><th style={{ width: 160 }}>Rate</th></tr></thead>
              <tbody>
                {k.bySection.map((r) => (
                  <tr key={r.section.id}>
                    <td className="strong">{r.section.name}</td>
                    <td className="small">{idx.teachers[r.section.class_teacher_id]?.full_name}</td>
                    <td className="num">{r.present + r.late}/{r.total}</td>
                    <td className="num" style={{ color: r.absent ? 'var(--danger)' : undefined }}>{r.absent}</td>
                    <td><div className="row" style={{ gap: 8 }}><div className="grow"><Progress value={r.pct} color={r.pct < 90 ? '#d98a00' : undefined} /></div><span className="xs tnum strong">{Math.round(r.pct)}%</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="stack">
          <Card icon="clip-list" tone="amber" title="Pending actions" pad={false}>
            <div className="list">
              {[['plane', `${pendingLeave} leave requests`, 'leave', 'Awaiting approval'], ['wallet', `${k.fees.overdueCount} overdue fee invoices`, 'fees', inr(k.fees.overdue)], ['message', `${openComplaints} open complaints`, 'reception', 'Front office'], ['desk', `${newEnq} new admission enquiries`, 'reception', 'Follow up today']].map(([ic, t, m, s]) => (
                <button key={t} className="row" style={{ width: '100%', border: 0, background: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => go(m)}>
                  <IconTile icon={ic} size={36} />
                  <span className="grow"><span className="strong small" style={{ display: 'block' }}>{t}</span><span className="xs muted">{s}</span></span>
                  <Icon name="right" size={16} style={{ color: 'var(--muted)' }} />
                </button>
              ))}
            </div>
          </Card>
          <QuickActions items={[['user-plus', 'Add student', 'students', 'blue'], ['clip-check', 'Attendance', 'attendance', 'green'], ['coins', 'Collect fee', 'fees', 'amber'], ['calendar', 'Timetable', 'timetable', 'teal'], ['megaphone', 'Send notice', 'notices', 'rose'], ['chart', 'Reports', 'reports', 'violet']]} />
        </div>
      </div>
      <NoticesCard />
    </div>
  );
}


function PrincipalDash() {
  const { data, idx, persona } = useSchool();
  const go = useGo();
  const k = useSchoolKpis();
  const exam = data.exams.find((e) => e.name.startsWith('Half'));
  const results = useMemo(() => data.sections.map((s) => {
    const list = sectionResults(data, idx, s.id, exam.id);
    const avg = list.reduce((a, r) => a + r.pct, 0) / (list.length || 1);
    const pass = list.filter((r) => r.pct >= 33).length / (list.length || 1) * 100;
    return { section: s, avg, pass, topper: list[0] };
  }), [data, idx, exam]);
  return (
    <div className="stack">
      <Welcome name={persona.name} sub="Principal’s overview" chips={[['check', `${Math.round(k.today.pct)}% present today`], ['plane', `${data.leave_requests.filter((l) => l.status === 'pending').length} approvals pending`]]} actions={<button className="btn btn-primary" onClick={() => go('notices')}><Icon name="megaphone" size={16} /> Circular to parents</button>} />
      <div className="grid g-4">
        <Stat label="Students" value={num(data.students.length)} foot={`${data.students.filter((s) => s.gender === 'F').length} girls · ${data.students.filter((s) => s.gender === 'M').length} boys`} icon="users" />
        <Stat label="Attendance today" value={pct(k.today.pct)} foot={`${k.today.absent} absent`} icon="check" tone="green" />
        <Stat label="Fee collection" value={pct(k.fees.rate, 0)} foot={`${inr(k.fees.collected, true)} collected`} icon="wallet" />
        <Stat label="Leave approvals" value={data.leave_requests.filter((l) => l.status === 'pending').length} foot="Students & staff" icon="plane" tone="amber" />
      </div>
      <div className="grid g-main">
        <Card icon="medal" tone="violet" title={`${exam.name} — class performance`} pad={false} action={<button className="btn btn-ghost btn-sm" onClick={() => go('results')}>Details</button>}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Class</th><th className="num">Average</th><th className="num">Pass %</th><th>Topper</th></tr></thead>
              <tbody>{results.map((r) => (
                <tr key={r.section.id}><td className="strong">{r.section.name}</td><td className="num">{r.avg.toFixed(1)}%</td><td className="num">{Math.round(r.pass)}%</td><td className="small">{r.topper?.student.full_name} <span className="muted">({r.topper?.pct.toFixed(1)}%)</span></td></tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
        <div className="stack">
          <TodaySchedule />
          <Card icon="chart" tone="blue" title="Attendance trend"><Bars min={80} data={k.trend.slice(-6)} height={110} format={(v) => Math.round(v)} /></Card>
        </div>
      </div>
      <NoticesCard />
    </div>
  );
}

function TeacherDash() {
  const { data, idx, persona, actions, notify } = useSchool();
  const go = useGo();
  const sec = persona.section;
  const classes = daySchedule(data, { teacherId: persona.teacher.id, day: todayDow() });
  const myClass = idx.studentsBySection[sec.id];
  const att = attendanceStats(attendanceOn(data, idx.today, sec.id));
  const leaves = data.leave_requests.filter((l) => l.section_id === sec.id || l.requester_type === 'student').slice(0, 3);
  return (
    <div className="stack">
      <Welcome name={persona.name} sub={`${idx.subjects[persona.teacher.subject_id]?.name} · Class teacher of ${sec.name}`} chips={[['calendar', `${classes.length} periods today`], ['users', `${myClass.length} students in ${sec.name}`]]} actions={<button className="btn btn-primary" onClick={() => go('attendance')}><Icon name="check" size={16} /> Mark attendance — {sec.name}</button>} />
      <div className="grid g-4">
        <Stat label="Periods today" value={classes.length} foot={classes[0] ? `First at ${classes[0].start_time}` : 'Free day'} icon="calendar" />
        <Stat label={`Class ${sec.name} strength`} value={myClass.length} foot={`${myClass.filter((s) => s.gender === 'F').length} girls · ${myClass.filter((s) => s.gender === 'M').length} boys`} icon="users" />
        <Stat label={`${sec.name} attendance today`} value={pct(att.pct, 0)} foot={`${att.absent} absent · ${att.late} late`} icon="check" tone="green" />
        <Stat label="Homework posted" value={data.homework.filter((h) => h.teacher_id === persona.teacher.id).length} foot="This week" icon="book" />
      </div>
      <div className="grid g-main">
        <Card icon="calendar" tone="teal" title="Today’s classes" pad={false}><PeriodList slots={classes} showSection /></Card>
        <QuickActions items={[['clip-check', 'Mark attendance', 'attendance', 'green'], ['notebook', 'Add homework', 'homework', 'indigo'], ['medal', 'Enter marks', 'results', 'violet'], ['megaphone', 'Send notice', 'notices', 'rose']]} />
      </div>
      <div className="grid g-2">
        <Card icon="plane" tone="teal" title="Leave requests" pad={false}>
          <div className="list">
            {leaves.map((l) => (
              <div key={l.id} className="row">
                <Avatar name={l.requester} size="sm" />
                <div className="grow"><div className="strong small">{l.requester}</div><div className="xs muted">{fmtDate(l.from_date)}–{fmtDate(l.to_date)} · {l.reason}</div></div>
                {l.status === 'pending' ? <div className="row" style={{ gap: 6 }}><button className="btn btn-sm" onClick={() => { actions.setLeave(l.id, 'rejected'); notify('Leave rejected'); }}>Reject</button><button className="btn btn-sm btn-success" onClick={() => { actions.setLeave(l.id, 'approved'); notify('Leave approved'); }}>Approve</button></div> : <StatusBadge status={l.status} />}
              </div>
            ))}
          </div>
        </Card>
        <NoticesCard limit={3} audience="Staff" />
      </div>
    </div>
  );
}

export function ChildSwitcher() {
  const { persona, childIdx, setChildIdx, idx } = useSchool();
  if (persona.role.key !== 'parent') return null;
  return (
    <div className="row wrap" style={{ gap: 8 }} role="tablist" aria-label="My children">
      {persona.children.map((c, i) => (
        <button key={c.id} role="tab" aria-selected={i === childIdx} className="btn" onClick={() => setChildIdx(i)} style={i === childIdx ? { borderColor: 'var(--brand)', background: 'var(--brand-50)', color: 'var(--brand)' } : undefined}>
          <Avatar name={c.full_name} size="sm" /> {c.full_name.split(' ')[0]} · {idx.sections[c.section_id].name}
        </button>
      ))}
    </div>
  );
}

function ChildHome({ student, parent }) {
  const { data, idx, persona } = useSchool();
  const go = useGo();
  const sec = idx.sections[student.section_id];
  const att = studentAttendance(data, student.id);
  const todayStatus = idx.attToday[student.id];
  const fees = data.fee_invoices.filter((f) => f.student_id === student.id);
  const due = fees.filter((f) => f.status === 'due' || f.status === 'overdue');
  const exam = data.exams.find((e) => e.name.startsWith('Half'));
  const rc = reportCard(data, idx, student.id, exam.id);
  const next = data.exams.find((e) => e.status === 'scheduled');
  const slots = daySchedule(data, { sectionId: sec.id, day: todayDow() });
  const hw = pendingHomework(data, sec.id).filter((h) => !h.overdue).slice(0, 4);
  const route = student.route_id && idx.routes[student.route_id];
  const stop = student.stop_id && idx.stops[student.stop_id];
  return (
    <div className="stack">
      <Welcome name={parent ? persona.name : student.full_name} sub={parent ? `Parent · ${persona.children.length} children at ${data.school.short_name}` : `Class ${sec.name} · Roll no. ${student.roll_no}`} actions={parent ? <ChildSwitcher /> : null} />
      <div className="card card-b row wrap" style={{ gap: 16 }}>
        <Avatar name={student.full_name} size="lg" />
        <div className="grow">
          <div className="strong" style={{ fontSize: 17 }}>{student.full_name}</div>
          <div className="small muted">Class {sec.name} · Roll {student.roll_no} · Adm. {student.admission_no}</div>
          <div className="small muted">Class teacher: {idx.teachers[sec.class_teacher_id]?.full_name}</div>
        </div>
        <div className="row wrap" style={{ gap: 8 }}>
          <span className="small muted">Today</span>
          <StatusBadge status={todayStatus || 'present'} />
        </div>
      </div>
      <div className="grid g-4">
        <Stat label="Attendance (24 days)" value={pct(att.pct, 0)} foot={`${att.absent} absent · ${att.late} late`} icon="check" tone={att.pct < 85 ? 'amber' : 'green'} />
        <Stat label={exam.name} value={`${rc.pct.toFixed(1)}%`} foot={`Grade ${rc.grade}`} icon="award" />
        <Stat label="Fees due" value={due.length ? inr(due.reduce((a, f) => a + Number(f.amount), 0)) : 'Nil'} foot={due.length ? `${due.filter((f) => f.status === 'overdue').length} overdue` : 'All clear'} icon="wallet" tone={due.some((f) => f.status === 'overdue') ? 'red' : undefined} />
        <Stat label="Next exam" value={fmtDate(next?.starts_on)} foot={next?.name} icon="calendar" />
      </div>
      <div className="grid g-main">
        <Card icon="calendar" tone="teal" title={`Today’s timetable — ${sec.name}`} pad={false} action={<button className="btn btn-ghost btn-sm" onClick={() => go('timetable')}>Week</button>}><PeriodList slots={slots} showTeacher /></Card>
        <div className="stack">
          <Card icon="notebook" tone="indigo" title="Homework due" pad={false} action={<button className="btn btn-ghost btn-sm" onClick={() => go('homework')}>All</button>}>
            <div className="list">
              {hw.length ? hw.map((h) => (
                <div key={h.id}><div className="row between top"><span className="strong small">{h.title}</span><Badge tone="amber">Due {fmtDate(h.due_on)}</Badge></div><div className="xs muted">{idx.subjects[h.subject_id]?.name}</div></div>
              )) : <div className="muted small">No pending homework.</div>}
            </div>
          </Card>
          {route && parent && (
            <Card icon="bus" tone="amber" title="School bus" action={<button className="btn btn-ghost btn-sm" onClick={() => go('transport')}>Track</button>}>
              <div className="row"><IconTile icon="bus" size={36} /><div className="grow"><div className="strong small">{route.code} · {route.name}</div><div className="xs muted">Pickup: {stop?.name} at {stop?.eta} AM · Driver {route.driver_name}</div></div></div>
            </Card>
          )}
          {due.length > 0 && parent && (
            <Card>
              <div className="row between"><div><div className="strong small">{due[0].title}</div><div className="xs muted">Due {fmtDate(due[0].due_on)}</div></div><button className="btn btn-primary btn-sm" onClick={() => go('fees')}>Pay {inr(due[0].amount)}</button></div>
            </Card>
          )}
        </div>
      </div>
      <NoticesCard limit={3} audience={parent ? 'Parents' : 'Students'} />
    </div>
  );
}

function ParentDash() { const { persona } = useSchool(); return <ChildHome student={persona.child} parent />; }
function StudentDash() { const { persona } = useSchool(); return <ChildHome student={persona.student} />; }

function DriverDash() {
  const { data, idx, persona, trip } = useSchool();
  const go = useGo();
  const route = persona.route;
  const stops = data.route_stops.filter((s) => s.route_id === route.id);
  const riders = data.students.filter((s) => s.route_id === route.id);
  const v = data.vehicles.find((x) => x.id === route.vehicle_id);
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <Welcome name={persona.name} sub={`Morning pickup · ${route.code}`} />
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ background: 'var(--brand-ink)', color: '#fff', padding: 20 }} className="row between wrap">
          <div>
            <div className="upper" style={{ color: 'rgba(255,255,255,.7)' }}>Today’s route</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{route.code} · {route.name}</div>
            <div style={{ color: 'rgba(255,255,255,.75)' }}>{v?.reg_no} · {v?.model}</div>
          </div>
          <button className="btn btn-lg" style={{ background: trip.status === 'running' ? 'var(--accent)' : '#fff', borderColor: 'transparent', color: 'var(--brand-ink)', minWidth: 180 }} onClick={() => go('trip')}>
            <Icon name={trip.status === 'running' ? 'nav' : 'play'} size={18} /> {trip.status === 'running' ? 'Continue trip' : trip.status === 'done' ? 'Trip completed' : 'Start trip'}
          </button>
        </div>
        <div className="grid g-4" style={{ padding: 16 }}>
          <div><div className="xs muted strong">Departure</div><div className="strong" style={{ fontSize: 22 }}>{route.departs_at} AM</div></div>
          <div><div className="xs muted strong">Stops</div><div className="strong" style={{ fontSize: 22 }}>{stops.length}</div></div>
          <div><div className="xs muted strong">Students</div><div className="strong" style={{ fontSize: 22 }}>{riders.length}</div></div>
          <div><div className="xs muted strong">Attendant</div><div className="strong">{route.attendant_name}</div></div>
        </div>
      </div>
      <div className="grid g-2">
        <Card icon="map-pin" tone="rose" title="Pickup points" pad={false}>
          <div className="list">
            {stops.map((s) => <div key={s.id} className="row"><span className="time-col">{s.eta}</span><span className="grow small strong">{s.name}</span><span className="xs muted">{riders.filter((r) => r.stop_id === s.id).length} students</span></div>)}
          </div>
        </Card>
        <div className="stack">
          <Card icon="bus" tone="amber" title="Vehicle">
            <div className="stack-sm small">
              <div className="row between"><span className="muted">Registration</span><strong>{v?.reg_no}</strong></div>
              <div className="row between"><span className="muted">Capacity</span><strong>{v?.capacity} seats</strong></div>
              <div className="row between"><span className="muted">Fitness valid till</span><strong>{fmtDate(v?.fitness_valid_till, { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
            </div>
          </Card>
          <Card icon="bell-ring" tone="red" title="Alerts" pad={false}>
            <div className="list">{data.notifications.filter((n) => n.audience === 'driver').map((n) => <div key={n.id}><div className="strong small">{n.title}</div><div className="xs muted">{n.body} · {ago(n.created_at)}</div></div>)}</div>
          </Card>
          <button className="btn btn-danger btn-lg"><Icon name="alert" size={18} /> Emergency — call school</button>
        </div>
      </div>
    </div>
  );
}

function ReceptionDash() {
  const { data, persona } = useSchool();
  const go = useGo();
  const inside = data.visitors.filter((v) => v.status === 'inside');
  const t = todayISO();
  return (
    <div className="stack">
      <Welcome name={persona.name} sub="Front office" actions={<><button className="btn" onClick={() => go('reception')}><Icon name="call" size={16} /> Log call</button><button className="btn btn-primary" onClick={() => go('reception')}><Icon name="plus" size={16} /> New visitor</button></>} />
      <div className="grid g-4">
        <Stat label="Visitors inside" value={inside.length} foot={`${data.visitors.length} today`} icon="door" />
        <Stat label="New enquiries" value={data.admission_enquiries.filter((e) => e.status === 'new').length} foot={`${data.admission_enquiries.filter((e) => e.follow_up_on === t).length} follow-ups due today`} icon="desk" />
        <Stat label="Calls logged" value={data.phone_logs.length} foot="Last 24 hours" icon="call" />
        <Stat label="Open complaints" value={data.complaints.filter((c) => c.status !== 'resolved').length} foot="Across departments" icon="message" tone="amber" />
      </div>
      <div className="grid g-main">
        <Card icon="door" tone="teal" title="Visitor book — today" pad={false} action={<button className="btn btn-ghost btn-sm" onClick={() => go('reception')}>Open</button>}>
          <div className="table-wrap"><table className="table"><thead><tr><th>Badge</th><th>Visitor</th><th>Purpose</th><th>In</th><th>Status</th></tr></thead>
            <tbody>{data.visitors.slice(0, 6).map((v) => <tr key={v.id}><td className="small strong">{v.badge_no}</td><td>{v.name}</td><td className="small">{v.purpose}</td><td className="small tnum">{fmtTime(v.check_in)}</td><td><StatusBadge status={v.status} /></td></tr>)}</tbody></table></div>
        </Card>
        <Card icon="user-plus" tone="blue" title="Admission enquiries" pad={false}>
          <div className="list">{data.admission_enquiries.slice(0, 5).map((e) => <div key={e.id} className="row"><div className="grow"><div className="strong small">{e.student_name} · {e.grade}</div><div className="xs muted">{e.parent_name} · {e.source}</div></div><StatusBadge status={e.status} /></div>)}</div>
        </Card>
      </div>
    </div>
  );
}

function WardenDash() {
  const { data, persona, idx } = useSchool();
  const go = useGo();
  const cap = data.rooms.reduce((a, r) => a + (r.status === 'active' ? r.capacity : 0), 0);
  const occ = data.rooms.reduce((a, r) => a + r.occupied, 0);
  const hostellers = data.students.filter((s) => s.hostel_room_id);
  return (
    <div className="stack">
      <Welcome name={persona.name} sub="Hostel management" actions={<button className="btn btn-primary" onClick={() => go('hostel')}><Icon name="bed" size={16} /> Allocate room</button>} />
      <div className="grid g-4">
        <Stat label="Occupancy" value={pct((occ / cap) * 100, 0)} foot={`${occ} of ${cap} beds`} icon="bed" />
        <Stat label="Rooms available" value={data.rooms.filter((r) => r.status === 'active' && r.occupied < r.capacity).length} foot={`${data.rooms.length} rooms total`} icon="door" tone="green" />
        <Stat label="Hostellers (in app)" value={hostellers.length} foot="Classes 9–10" icon="users" />
        <Stat label="Under maintenance" value={data.rooms.filter((r) => r.status === 'maintenance').length} foot="Rooms" icon="settings" tone="amber" />
      </div>
      <div className="grid g-2">
        {data.hostels.map((h) => {
          const rooms = data.rooms.filter((r) => r.hostel_id === h.id);
          const c = rooms.reduce((a, r) => a + (r.status === 'active' ? r.capacity : 0), 0);
          const o = rooms.reduce((a, r) => a + r.occupied, 0);
          return (
            <Card key={h.id} title={h.name} action={<Badge tone="blue">{h.type}</Badge>}>
              <div className="stack-sm">
                <div className="row between small"><span className="muted">Warden</span><strong>{h.warden_name}</strong></div>
                <div className="row between small"><span className="muted">Rooms</span><strong>{rooms.length}</strong></div>
                <div className="row between small"><span className="muted">Beds occupied</span><strong>{o} / {c}</strong></div>
                <Progress value={(o / c) * 100} />
              </div>
            </Card>
          );
        })}
      </div>
      <Card icon="clip-check" tone="indigo" title="Hostellers — night roll call" pad={false}>
        <div className="table-wrap"><table className="table"><thead><tr><th>Student</th><th>Class</th><th>Room</th><th>Today</th></tr></thead>
          <tbody>{hostellers.slice(0, 8).map((s) => <tr key={s.id}><td className="strong small">{s.full_name}</td><td>{idx.sections[s.section_id].name}</td><td>{idx.rooms[s.hostel_room_id]?.room_no}</td><td><StatusBadge status={idx.attToday[s.id] || 'present'} /></td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}

function CanteenDash() {
  const { data, persona } = useSchool();
  const go = useGo();
  const total = data.canteen_sales.reduce((a, s) => a + Number(s.total), 0);
  const low = data.canteen_items.filter((i) => i.stock < 15);
  return (
    <div className="stack">
      <Welcome name={persona.name} sub="Canteen" actions={<button className="btn btn-primary" onClick={() => go('canteen')}><Icon name="cart" size={16} /> New bill</button>} />
      <div className="grid g-4">
        <Stat label="Sales today" value={inr(total)} foot={`${data.canteen_sales.length} bills`} icon="rupee" tone="green" />
        <Stat label="Average bill" value={inr(total / (data.canteen_sales.length || 1))} foot="Per student" icon="receipt" />
        <Stat label="Menu items" value={data.canteen_items.length} foot={`${new Set(data.canteen_items.map((i) => i.category)).size} categories`} icon="coffee" />
        <Stat label="Low stock" value={low.length} foot={low.map((l) => l.name).join(', ') || 'All stocked'} icon="alert" tone={low.length ? 'red' : undefined} />
      </div>
      <div className="grid g-main">
        <Card icon="receipt" tone="navy" title="Recent bills" pad={false}>
          <div className="table-wrap"><table className="table"><thead><tr><th>Bill</th><th>Customer</th><th className="num">Items</th><th>Paid via</th><th className="num">Amount</th></tr></thead>
            <tbody>{data.canteen_sales.slice(0, 8).map((s) => <tr key={s.id}><td className="small strong">{s.bill_no}</td><td className="small">{s.customer}</td><td className="num">{s.items_count}</td><td className="small">{s.method}</td><td className="num strong">{inr(s.total)}</td></tr>)}</tbody></table></div>
        </Card>
        <Card icon="package" tone="amber" title="Stock watch" pad={false}>
          <div className="list">{[...data.canteen_items].sort((a, b) => a.stock - b.stock).slice(0, 6).map((i) => <div key={i.id} className="row"><div className="grow"><div className="strong small">{i.name}</div><div className="xs muted">{i.category} · {inr(i.price)}</div></div><Badge tone={i.stock < 15 ? 'red' : 'green'}>{i.stock} left</Badge></div>)}</div>
        </Card>
      </div>
    </div>
  );
}

function ScannerDash() {
  const { data, idx, persona } = useSchool();
  const go = useGo();
  const s = attendanceStats(attendanceOn(data, idx.today));
  const recent = data.students.slice(30, 38);
  return (
    <div className="stack" style={{ maxWidth: 900 }}>
      <Welcome name={persona.name} sub="Main gate · Morning entry 07:15–08:15" />
      <button className="card" style={{ padding: 24, textAlign: 'left', cursor: 'pointer', background: 'var(--brand)', borderColor: 'var(--brand)', color: '#fff' }} onClick={() => go('scanner')}>
        <div className="row" style={{ gap: 16 }}>
          <Icon name="qr" size={44} />
          <div className="grow"><div style={{ fontSize: 22, fontWeight: 700 }}>Open QR scanner</div><div style={{ opacity: .8 }}>Scan student ID cards, staff badges and visitor passes</div></div>
          <Icon name="arrow" size={24} />
        </div>
      </button>
      <div className="grid g-4">
        <Stat label="Checked in" value={num(s.present + s.late)} foot={`of ${s.total} students`} icon="user-check" tone="green" />
        <Stat label="Late arrivals" value={s.late} foot="After 07:55" icon="clock" tone="amber" />
        <Stat label="Not arrived" value={s.absent + s.leave} foot={`${s.leave} on approved leave`} icon="user-x" tone="red" />
        <Stat label="Visitors inside" value={data.visitors.filter((v) => v.status === 'inside').length} foot="Passes issued" icon="door" />
      </div>
      <Card icon="scan" tone="green" title="Recent scans" pad={false}>
        <div className="list">{recent.map((st, i) => <div key={st.id} className="row"><Avatar name={st.full_name} size="sm" /><div className="grow"><div className="strong small">{st.full_name}</div><div className="xs muted">Class {idx.sections[st.section_id].name} · {st.admission_no}</div></div><span className="xs muted tnum">07:{String(52 - i * 2).padStart(2, '0')}</span><StatusBadge status={i === 2 ? 'late' : 'present'} /></div>)}</div>
      </Card>
    </div>
  );
}

function SuperDash() {
  const go = useGo();
  const tenants = PLATFORM_TENANTS.map((t) => ({ ...t, ...(t.slug ? DEMO_SCHOOLS.find((s) => s.slug === t.slug) : {}), plan: PLANS.find((p) => p.id === t.plan_id) }));
  const active = tenants.filter((t) => t.status === 'ACTIVE');
  const users = tenants.reduce((a, t) => a + t.billable_users, 0);
  const mrr = active.reduce((a, t) => a + t.billable_users * t.plan.price_per_user, 0);
  const byPlan = PLANS.map((p) => ({ label: p.name, value: active.filter((t) => t.plan_id === p.id).reduce((a, t) => a + t.billable_users * p.price_per_user, 0) }));
  return (
    <div className="stack">
      <Welcome name="Ankit Verma" sub="Miz School platform overview" actions={<button className="btn btn-primary" onClick={() => go('onboarding')}><Icon name="plus" size={16} /> Onboard school</button>} />
      <div className="grid g-4">
        <Stat label="Schools" value={tenants.length} foot={`${active.length} active · ${tenants.filter((t) => t.status === 'TRIAL').length} on trial`} icon="building" />
        <Stat label="Active users" value={num(users)} foot="Billable this month" icon="users" />
        <Stat label="Monthly revenue" value={inr(mrr, true)} foot="Before GST" icon="rupee" tone="green" />
        <Stat label="Past due" value={tenants.filter((t) => t.status === 'PAST_DUE').length} foot="Grace period running" icon="alert" tone="red" />
      </div>
      <div className="grid g-main">
        <Card icon="building" tone="navy" title="Schools" pad={false} action={<button className="btn btn-ghost btn-sm" onClick={() => go('schools')}>All schools</button>}>
          <div className="table-wrap"><table className="table"><thead><tr><th>School</th><th>Plan</th><th className="num">Users</th><th>Status</th></tr></thead>
            <tbody>{tenants.map((t) => <tr key={t.name}><td><div className="row" style={{ gap: 10 }}>{t.slug ? <Crest school={t} size={22} /> : <span className="avatar sm">{t.name[0]}</span>}<div><div className="strong small">{t.name}</div><div className="xs muted">{t.city}</div></div></div></td><td className="small">{t.plan.name}</td><td className="num">{num(t.billable_users)}</td><td><StatusBadge status={t.status} /></td></tr>)}</tbody></table></div>
        </Card>
        <div className="stack">
          <Card icon="coins" tone="green" title="Revenue by plan"><Bars data={byPlan} format={(v) => inr(v, true)} highlightLast={false} /></Card>
          <Card icon="health" tone="green" title="System health" pad={false}>
            <div className="list">{[['API', '182 ms p95'], ['Database', 'Healthy · Mumbai'], ['Notification queue', '0 failed'], ['Storage', '38 GB used']].map(([a, b]) => <div key={a} className="row between small"><span className="row" style={{ gap: 8 }}><span className="dot" style={{ color: 'var(--success)' }} />{a}</span><span className="muted">{b}</span></div>)}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
