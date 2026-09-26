import { useMemo, useState } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { PageHead, Card, Stat, Badge, Avatar, Search, Seg, Tabs, Modal, Progress, Empty, fmtDate, inr, IconTile } from '../../components/ui.jsx';
import { subCandidates, staffStatusOn, periodsToCover, MAX_SUBS_PER_DAY } from '../../lib/substitution.js';
import { shortName } from '../../lib/allocation.js';
import { todayISO, todayDow, studentAttendance, reportCard } from '../../lib/derive.js';
import { DAYS } from '../../data/generate.js';
import { STREAMS, gradeLabel, sectionName } from '../../data/classes.js';

const STATUS_META = {
  present: ['Present', 'green'], late: ['Late', 'amber'], half_day: ['Half day', 'violet'], leave: ['On leave', 'blue'], absent: ['Absent', 'red'],
};
const StatusChip = ({ s }) => <Badge tone={STATUS_META[s]?.[1]}>{STATUS_META[s]?.[0] || 'Not marked'}</Badge>;

/* ───────────── Substitutions ───────────── */
export function Substitution() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const date = todayISO(); const day = todayDow();
  const manage = role === 'principal' || role === 'school_admin';
  const status = staffStatusOn(data, date);
  const subs = (data.substitutions || []).filter((s) => s.date === date).sort((a, b) => a.period - b.period || idx.sections[a.section_id].grade - idx.sections[b.section_id].grade);
  const away = data.teachers.filter((t) => ['absent', 'leave', 'half_day'].includes(status[t.id]));
  const open = subs.filter((s) => s.status === 'open');
  const [pick, setPick] = useState(null);
  const [adding, setAdding] = useState(false);
  const mine = role === 'teacher' ? subs.filter((s) => s.sub_teacher_id === persona.teacher.id) : [];
  const week = data.sub_week || {};
  const fair = [...data.teachers].sort((a, b) => (week[b.id] || 0) - (week[a.id] || 0)).slice(0, 8);

  return (
    <div>
      <PageHead title="Substitutions" sub={`Today · ${fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${DAYS[day - 1]} timetable`}
        actions={manage && <>
          <button className="btn" onClick={() => setAdding(true)}><Icon name="user-x" size={16} /> Mark teacher away</button>
          <button className="btn" onClick={() => { actions.push(['teacher'], 'Today’s substitution arrangement', `${subs.length} periods · see the Substitutions page`, 'notice', ['whatsapp']); notify('Arrangement sent to the staff WhatsApp group'); }}><Icon name="chat" size={16} /> Send to staff group</button>
          <button className="btn btn-primary" disabled={!open.length} onClick={() => { const n = actions.autoAssignSubs(persona.name); notify(`Best substitutes assigned for ${n || open.length} periods`); }}><Icon name="wand" size={16} /> Auto-assign {open.length || ''}</button>
        </>} />

      {role === 'teacher' && (
        <Card title={`My cover duties today (${mine.length})`} icon="refresh" style={{ marginBottom: 16 }}>
          {mine.length ? <div className="grid g-3">{mine.map((s) => (
            <div key={s.id} className="card card-b" style={{ background: 'var(--bg)' }}>
              <div className="row between"><strong>Period {s.period} · {s.start_time}</strong><Badge tone="violet">Cover</Badge></div>
              <div className="small" style={{ marginTop: 6 }}>Class {idx.sections[s.section_id].name} · {idx.subjects[s.subject_id]?.name} · {idx.sections[s.section_id].room}</div>
              <div className="xs muted" style={{ marginTop: 4 }}>For {idx.teachers[s.absent_teacher_id]?.full_name} · today’s lesson plan is shared with you</div>
            </div>
          ))}</div> : <Empty>No cover duty for you today.</Empty>}
        </Card>
      )}

      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Teachers away" value={away.length} foot={away.map((t) => shortName(t).split(' ')[0]).join(', ') || 'Everyone is in'} icon="user-x" tone={away.length ? 'red' : 'green'} />
        <Stat label="Periods to cover" value={subs.length} foot="From today’s timetable" icon="clock" />
        <Stat label="Covered" value={subs.length - open.length} foot={`${subs.filter((s) => s.mode === 'library').length} as library self-study`} icon="check" tone="green" />
        <Stat label="Still open" value={open.length} foot={open.length ? 'Students and parents see “teacher to be assigned”' : 'All periods have a teacher'} icon="alert" tone={open.length ? 'amber' : 'green'} />
      </div>

      <div className="grid alloc-side" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
        <Card pad={false} title="Today’s arrangement" icon="clip-list">
          {subs.length ? <div className="table-wrap"><table className="table">
            <thead><tr><th>Period</th><th>Class</th><th>Subject</th><th>Teacher away</th><th>Taken by</th>{manage && <th />}</tr></thead>
            <tbody>{subs.map((s) => {
              const t = idx.teachers[s.sub_teacher_id];
              return (
                <tr key={s.id}>
                  <td className="nowrap"><strong>P{s.period}</strong> <span className="xs muted">{s.start_time}</span></td>
                  <td className="strong">{idx.sections[s.section_id].name}</td>
                  <td>{idx.subjects[s.subject_id]?.name}</td>
                  <td className="small">{shortName(idx.teachers[s.absent_teacher_id])} <StatusChip s={s.reason} /></td>
                  <td>{s.status === 'open' ? <Badge tone="red">Not assigned</Badge> : s.mode === 'library' ? <Badge tone="teal">Library self-study</Badge> : <div><div className="strong small">{t?.full_name}</div><div className="xs muted">{t?.subject_codes?.includes(idx.subjects[s.subject_id]?.code) ? 'Same subject' : `Teaches ${t?.subject_codes?.[0]}`}{s.sub_teacher_id === persona.teacher?.id ? ' · you' : ''}</div></div>}</td>
                  {manage && <td><button className={`btn btn-sm ${s.status === 'open' ? 'btn-primary' : ''}`} onClick={() => setPick(s)}>{s.status === 'open' ? 'Assign' : 'Change'}</button></td>}
                </tr>
              );
            })}</tbody>
          </table></div> : <Empty>No teacher is away today — nothing to cover.</Empty>}
        </Card>
        <div className="stack">
          <Card title="Away today" icon="user-x">
            {away.length ? <div className="stack">{away.map((t) => {
              const row = (data.staff_attendance || []).find((r) => r.teacher_id === t.id && r.date === date);
              return (
                <div key={t.id} className="row top" style={{ gap: 10 }}>
                  <Avatar name={t.full_name} size="sm" />
                  <div className="grow"><div className="strong small">{t.full_name}</div><div className="xs muted">{row?.note || '—'} · {periodsToCover(data, t.id, day, status[t.id]).length} periods</div><div style={{ marginTop: 4 }}><StatusChip s={status[t.id]} /></div></div>
                  {manage && <button className="btn btn-sm" onClick={() => { actions.markStaff(t.id, 'present'); notify(`${shortName(t)} marked present — their periods are back`); }}>Back</button>}
                </div>
              );
            })}</div> : <Empty>Everyone is in today.</Empty>}
          </Card>
          <Card title="Covers this week" icon="scale">
            <div className="stack-sm">{fair.map((t) => <div key={t.id} className="row small" style={{ gap: 8 }}><span className="grow">{shortName(t)}</span><div style={{ width: 80 }}><Progress value={((week[t.id] || 0) / 6) * 100} /></div><span className="tnum strong" style={{ width: 16, textAlign: 'right' }}>{week[t.id] || 0}</span></div>)}</div>
            <div className="xs muted" style={{ marginTop: 10 }}>Covers are shared fairly: the system prefers teachers with fewer covers this week, and nobody gets more than {MAX_SUBS_PER_DAY} a day.</div>
          </Card>
        </div>
      </div>
      {pick && <PickSubstitute sub={pick} onClose={() => setPick(null)} />}
      {adding && <MarkAway onClose={() => setAdding(false)} />}
    </div>
  );
}

function PickSubstitute({ sub, onClose }) {
  const { data, idx, persona, actions, notify } = useSchool();
  const [showAll, setShowAll] = useState(false);
  const cands = subCandidates(data, sub, { date: todayISO() });
  const ok = cands.filter((c) => !c.blocked);
  const blocked = cands.filter((c) => c.blocked);
  const sec = idx.sections[sub.section_id];
  const done = (tid, mode = 'teacher') => { actions.assignSub(sub.id, tid, mode, persona.name); notify(mode === 'library' ? 'Library self-study set — students informed' : `${shortName(idx.teachers[tid])} assigned — teacher, students and parents informed`); onClose(); };
  return (
    <Modal title={`Period ${sub.period} · Class ${sec.name} · ${idx.subjects[sub.subject_id]?.name}`} onClose={onClose} width={620}>
      <div className="stack">
        <div className="small muted">{idx.teachers[sub.absent_teacher_id]?.full_name} is away. Free teachers are ranked: same subject first, then those who already teach {sec.name}, then the lightest day and fewest covers this week.</div>
        <div className="stack-sm">
          {ok.slice(0, showAll ? 40 : 6).map((c, i) => (
            <div key={c.t.id} className="row card card-b" style={{ gap: 12, padding: '10px 12px', background: i === 0 ? 'var(--brand-50)' : undefined }}>
              <Avatar name={c.t.full_name} size="sm" />
              <div className="grow"><div className="strong small">{c.t.full_name} {i === 0 && <Badge tone="blue">Best match</Badge>}</div><div className="row wrap xs" style={{ gap: 4, marginTop: 4 }}>{c.reasons.map((r) => <Badge key={r} tone={r.startsWith('Teaches') ? 'green' : r.startsWith('Knows') ? 'violet' : ''}>{r}</Badge>)}</div></div>
              <button className="btn btn-sm btn-primary" onClick={() => done(c.t.id)}>Assign</button>
            </div>
          ))}
          {ok.length > 6 && <button className="btn btn-ghost btn-sm" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer' : `Show all ${ok.length} free teachers`}</button>}
          {!ok.length && <Empty>No teacher is free this period.</Empty>}
        </div>
        <div className="row between wrap card card-b" style={{ background: 'var(--bg)' }}><span className="small">No teacher free? Send the class to the library for self-study (librarian supervises).</span><button className="btn btn-sm" onClick={() => done(null, 'library')}><Icon name="library" size={14} /> Library self-study</button></div>
        <details className="xs muted"><summary>Why others are not listed ({blocked.length})</summary><div className="stack-sm" style={{ marginTop: 6 }}>{blocked.slice(0, 20).map((c) => <div key={c.t.id}>{c.t.full_name} — {c.blocked}</div>)}</div></details>
      </div>
    </Modal>
  );
}

function MarkAway({ onClose }) {
  const { data, actions, notify } = useSchool();
  const [tid, setTid] = useState('');
  const [st, setSt] = useState('absent');
  const [note, setNote] = useState('');
  const n = tid ? periodsToCover(data, tid, todayDow(), st).length : 0;
  return (
    <Modal title="Mark a teacher away today" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!tid} onClick={() => { actions.markStaff(tid, st, note || null); notify(`${n} period${n === 1 ? '' : 's'} added to today’s cover list`); onClose(); }}>Save</button></>}>
      <div className="stack">
        <div className="field"><label>Teacher</label><select className="select" value={tid} onChange={(e) => setTid(e.target.value)}><option value="">Select</option>{data.teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name} · {t.subject_codes[0]}</option>)}</select></div>
        <div className="field"><label>Status</label><Seg options={[['absent', 'Absent'], ['leave', 'On leave'], ['half_day', 'Half day (after P4)']]} value={st} onChange={setSt} /></div>
        <div className="field"><label>Note</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Informed at 7:15 am — unwell" /></div>
        {tid && <div className="small">{n ? <><strong>{n} period{n === 1 ? '' : 's'}</strong> will need a substitute.</> : 'No periods to cover for this teacher today.'}</div>}
      </div>
    </Modal>
  );
}

/* ───────────── Staff attendance ───────────── */
export function StaffAttendance() {
  const { data, idx, actions, notify } = useSchool();
  const [tab, setTab] = useState('today');
  const [q, setQ] = useState('');
  const [f, setF] = useState('all');
  const date = todayISO(); const day = todayDow();
  const status = staffStatusOn(data, date);
  const todayRows = Object.fromEntries((data.staff_attendance || []).filter((r) => r.date === date).map((r) => [r.teacher_id, r]));
  const counts = Object.fromEntries(Object.keys(STATUS_META).map((k) => [k, data.teachers.filter((t) => status[t.id] === k).length]));
  const list = data.teachers.filter((t) => (!q || t.full_name.toLowerCase().includes(q.toLowerCase())) && (f === 'all' || status[t.id] === f));
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const upcoming = data.leave_requests.filter((l) => l.requester_type === 'staff' && l.from_date >= date).slice(0, 3);
  const dates = [...new Set((data.staff_attendance || []).map((r) => r.date))].sort().slice(-24);
  const byTD = {}; (data.staff_attendance || []).forEach((r) => { byTD[`${r.teacher_id}|${r.date}`] = r.status; });
  return (
    <div>
      <PageHead title="Staff attendance" sub={`${fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} · biometric, face scan and geo-fenced app check-in`} />
      {upcoming.length > 0 && <div className="card card-b row wrap" style={{ gap: 10, marginBottom: 16, borderLeft: '4px solid var(--warn)' }}><Icon name="plane" size={18} /><span className="small"><strong>Coming leave:</strong> {upcoming.map((l) => `${l.requester} (${fmtDate(l.from_date)}–${fmtDate(l.to_date)}, ${l.status})`).join(' · ')} — plan cover in Substitutions.</span></div>}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 16 }}>
        {Object.entries(STATUS_META).map(([k, [label, tone]]) => <button key={k} className="card card-b" style={{ textAlign: 'left', cursor: 'pointer', borderColor: f === k ? 'var(--brand)' : undefined }} onClick={() => setF(f === k ? 'all' : k)}><div className="xs muted strong">{label}</div><div className="row between"><span style={{ fontSize: 24, fontWeight: 700 }}>{counts[k]}</span><Badge tone={tone}>{Math.round((counts[k] / data.teachers.length) * 100)}%</Badge></div></button>)}
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[['today', 'Today'], ['month', 'Monthly register']]} />
      <div style={{ marginTop: 16 }}>
        {tab === 'today' && (
          <Card pad={false}>
            <div className="card-h"><Search value={q} onChange={setQ} placeholder="Search staff" style={{ flex: 1, maxWidth: 320 }} /></div>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Teacher</th><th>Check-in</th><th>Source</th><th>Periods today</th><th>Status</th></tr></thead>
              <tbody>{list.map((t) => {
                const r = todayRows[t.id];
                const cover = ['absent', 'leave', 'half_day'].includes(status[t.id]) ? periodsToCover(data, t.id, day, status[t.id]).length : 0;
                return (
                  <tr key={t.id}>
                    <td><div className="row" style={{ gap: 10 }}><Avatar name={t.full_name} size="sm" /><div><div className="strong">{t.full_name}</div><div className="xs muted">{idx.subjects[t.subject_id]?.name} · {t.designation}{r?.note ? ` · ${r.note}` : ''}</div></div></div></td>
                    <td className="tnum small">{r?.check_in || '—'}</td>
                    <td className="small muted">{r?.source || '—'}</td>
                    <td className="small">{data.timetable_slots.filter((s) => s.day === day && s.teacher_id === t.id).length}{cover > 0 && <Badge tone="amber">{cover} to cover</Badge>}</td>
                    <td><div className="row wrap" style={{ gap: 4 }}>{Object.entries(STATUS_META).map(([k, [label, tone]]) => <button key={k} className={`chip-btn ${status[t.id] === k ? `on ${tone}` : ''}`} onClick={() => { if (status[t.id] !== k) { actions.markStaff(t.id, k); notify(['absent', 'leave', 'half_day'].includes(k) ? `${shortName(t)}: ${label} — periods added to Substitutions` : `${shortName(t)}: ${label}`); } }}>{label}</button>)}</div></td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          </Card>
        )}
        {tab === 'month' && (
          <Card pad={false}>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Teacher</th><th>Last {dates.length} school days</th><th className="num">Present</th><th className="num">Late</th><th className="num">Leave</th><th className="num">Absent</th><th className="num">Rate</th></tr></thead>
              <tbody>{data.teachers.map((t) => {
                const st = dates.map((d) => byTD[`${t.id}|${d}`]);
                const c = (k) => st.filter((x) => x === k).length;
                const rate = ((c('present') + c('late') + c('half_day') * 0.5) / dates.length) * 100;
                return (
                  <tr key={t.id}><td className="strong small nowrap">{t.full_name}</td>
                    <td><div className="att-strip">{st.map((x, i) => <span key={i} title={`${dates[i]}: ${STATUS_META[x]?.[0] || '—'}`} className={`att-dot ${STATUS_META[x]?.[1] || ''}`} />)}</div></td>
                    <td className="num">{c('present')}</td><td className="num">{c('late')}</td><td className="num">{c('leave')}</td><td className="num">{c('absent')}</td><td className="num strong">{rate.toFixed(0)}%</td></tr>
                );
              })}</tbody>
            </table></div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ───────────── Promotion (year-end) ───────────── */
export function Promotion() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const [secId, setSecId] = useState(data.sections.find((s) => s.name === '10A')?.id || data.sections[0].id);
  const [rules, setRules] = useState({ minAtt: 75, holdDues: false, allowComp: 1 });
  const [sel, setSel] = useState({});
  const [dest, setDest] = useState({});
  const sec = idx.sections[secId];
  const exam = data.exams[1]?.id;
  const done = (data.promotions || []).filter((p) => p.from_section_id === secId);
  const rows = useMemo(() => (idx.studentsBySection[secId] || []).slice().sort((a, b) => a.roll_no - b.roll_no).map((s) => {
    const att = studentAttendance(data, s.id).pct;
    const rc = sec.stage === 'pre' ? null : reportCard(data, idx, s.id, exam);
    const fails = rc ? rc.rows.filter((r) => r.pct < 33).length : 0;
    const dues = data.fee_invoices.filter((f) => f.student_id === s.id && f.status === 'overdue').reduce((a, f) => a + Number(f.amount), 0);
    const m = rc ? Object.fromEntries(rc.rows.map((x) => [x.subject?.code, x.pct])) : {};
    let action = 'promote';
    if (sec.grade === 12) action = 'graduate';
    else if (att < rules.minAtt - 10 || fails > rules.allowComp + 1) action = 'detain';
    else if (fails > rules.allowComp || att < rules.minAtt) action = 'review';
    if (rules.holdDues && dues > 0 && action === 'promote') action = 'hold';
    const stream = (m.MAT || 0) >= 70 && (m.SCI || 0) >= 70 ? 'Sci' : (m.MAT || 0) >= 55 ? 'Com' : 'Hum';
    const next = sec.grade === 12 ? null : sec.grade === 10 ? `11 ${stream}` : sectionName(sec.grade + 1, sec.stage === 'senior' ? sec.section : sec.section);
    return { s, att, rc, fails, dues, action, next, stream };
  }), [data, idx, secId, rules, sec, exam]);
  const ACT = { promote: ['Promote', 'green'], review: ['Needs review', 'amber'], detain: ['Detain', 'red'], graduate: ['Graduate', 'navy'], hold: ['Hold — dues', 'amber'] };
  const eligible = rows.filter((r) => ['promote', 'graduate'].includes(r.action));
  const chosen = rows.filter((r) => sel[r.s.id] ?? ['promote', 'graduate'].includes(r.action));
  const nextOf = (r) => dest[r.s.id] || r.next;
  return (
    <div>
      <PageHead title="Promotion & year-end" sub="Session 2026-27 → 2027-28 · promotions apply on 1 April · parents informed on WhatsApp" actions={<select className="select" style={{ width: 'auto' }} value={secId} onChange={(e) => { setSecId(e.target.value); setSel({}); setDest({}); }}>{data.sections.map((s) => <option key={s.id} value={s.id}>Class {s.name}</option>)}</select>} />
      <div className="grid alloc-side" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'start' }}>
        <Card pad={false} title={`Class ${sec.name} → ${sec.grade === 12 ? 'Alumni' : sec.grade === 10 ? 'Class 11 (stream by marks)' : `Class ${gradeLabel(sec.grade + 1)}`}`} icon="trend"
          action={<button className="btn btn-sm btn-primary" disabled={!chosen.length || done.length > 0} onClick={() => {
            actions.update('promotions', (p) => [...(p || []), ...chosen.map((r) => ({ id: `pr-${r.s.id}`, student_id: r.s.id, from_section_id: secId, to: r.action === 'graduate' ? 'Alumni' : nextOf(r), action: r.action === 'graduate' ? 'graduate' : 'promote', effective: '2027-04-01', by: persona.name }))]);
            actions.push(['parent'], sec.grade === 12 ? 'Congratulations on graduating!' : 'Promotion for 2027-28', sec.grade === 12 ? 'Transfer certificate and alumni card will be issued.' : `Your child is promoted. New class starts 1 April.`, 'notice', ['push', 'whatsapp']);
            notify(`${chosen.length} students ${sec.grade === 12 ? 'graduated' : 'promoted'} — parents informed`);
          }}>{done.length ? `Done (${done.length})` : `${sec.grade === 12 ? 'Graduate' : 'Promote'} ${chosen.length} selected`}</button>}>
          <div className="table-wrap"><table className="table">
            <thead><tr><th /><th>Student</th><th className="num">Attendance</th><th className="num">Result</th><th className="num">Below 33%</th><th className="num">Dues</th><th>Suggestion</th><th>Next class</th></tr></thead>
            <tbody>{rows.map((r) => {
              const on = sel[r.s.id] ?? ['promote', 'graduate'].includes(r.action);
              const p = done.find((x) => x.student_id === r.s.id);
              return (
                <tr key={r.s.id}>
                  <td><input type="checkbox" checked={on} disabled={!!done.length} onChange={(e) => setSel({ ...sel, [r.s.id]: e.target.checked })} /></td>
                  <td><div className="strong small">{r.s.roll_no}. {r.s.full_name}</div></td>
                  <td className="num" style={{ color: r.att < rules.minAtt ? 'var(--danger)' : undefined }}>{r.att.toFixed(0)}%</td>
                  <td className="num">{r.rc ? `${r.rc.pct.toFixed(0)}%` : 'Skills'}</td>
                  <td className="num">{r.fails || '—'}</td>
                  <td className="num">{r.dues ? inr(r.dues) : '—'}</td>
                  <td>{p ? <Badge tone="green">Done → {p.to}</Badge> : <Badge tone={ACT[r.action][1]}>{ACT[r.action][0]}</Badge>}</td>
                  <td>{sec.grade === 12 ? <span className="small">Alumni + TC</span> : sec.grade === 10 ? <select className="select" style={{ height: 30, width: 'auto' }} value={nextOf(r)} onChange={(e) => setDest({ ...dest, [r.s.id]: e.target.value })}>{Object.keys(STREAMS).map((k) => <option key={k} value={`11 ${k}`}>11 {STREAMS[k]}</option>)}</select> : <span className="small strong">{r.next}</span>}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        </Card>
        <div className="stack">
          <Card title="Promotion rules" icon="settings">
            <div className="stack small">
              <div className="field"><label>Minimum attendance</label><Seg options={[[65, '65%'], [75, '75%'], [85, '85%']]} value={rules.minAtt} onChange={(v) => setRules({ ...rules, minAtt: v })} /></div>
              <div className="field"><label>Subjects allowed below 33% (compartment)</label><Seg options={[[0, 'None'], [1, '1'], [2, '2']]} value={rules.allowComp} onChange={(v) => setRules({ ...rules, allowComp: v })} /></div>
              <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={rules.holdDues} onChange={(e) => setRules({ ...rules, holdDues: e.target.checked })} /> Hold promotion if fees are overdue</label>
              <div className="xs muted">LKG–UKG: no exams — promoted on skill review. Class 10 → 11 stream is suggested from Maths & Science marks. Class 12 → alumni with TC.</div>
            </div>
          </Card>
          <Card title="Summary" icon="chart">
            <div className="stack-sm small">{Object.entries(ACT).map(([k, [l, tone]]) => { const n = rows.filter((r) => r.action === k).length; return n ? <div key={k} className="row between"><Badge tone={tone}>{l}</Badge><strong>{n}</strong></div> : null; })}<div className="row between"><span className="muted">Selected</span><strong>{chosen.length} / {rows.length}</strong></div><div className="xs muted">{eligible.length} meet all rules automatically.</div></div>
          </Card>
        </div>
      </div>
    </div>
  );
}
