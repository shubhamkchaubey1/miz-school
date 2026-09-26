import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadSchoolData, localSchoolData } from '../data/api.js';

const LIVE = import.meta.env.VITE_LIVE_DATA === 'true';
import { roleByKey, ROLES } from '../config/roles.js';
import { todayISO } from './derive.js';
import { autoAllocate, buildTimetable, diffAllocations, rowsByCell, cellKey } from './allocation.js';
import { PERIODS } from '../data/generate.js';
import { makeSubs, subCandidates } from './substitution.js';
import { todayDow } from './derive.js';

const Ctx = createContext(null);
export const useSchool = () => useContext(Ctx);

const ACCESS_V = 2; // bump when modules are added so saved access picks them up
export const defaultAccess = () => Object.fromEntries(ROLES.map((r) => [r.key, r.nav.flatMap(([, items]) => items)]));
function loadAccess() {
  try { const v = JSON.parse(localStorage.getItem('miz-access') || 'null'); if (v && v.__v === ACCESS_V) { const { __v, ...rest } = v; return { ...defaultAccess(), ...rest }; } } catch { /* storage unavailable */ }
  return defaultAccess();
}

const byId = (rows) => Object.fromEntries(rows.map((r) => [r.id, r]));

export function applyBrand(school) {
  const root = document.documentElement.style;
  root.setProperty('--brand', school?.primary_color || '#1457A6');
  root.setProperty('--brand-ink', school?.secondary_color || '#0B2345');
  root.setProperty('--accent', school?.accent_color || '#C8962E');
  document.title = school ? `${school.short_name} · Miz School` : 'Miz School';
}

export function SchoolProvider({ slug, role, children }) {
  const [data, setData] = useState(() => (LIVE ? null : localSchoolData(slug)));
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [childIdx, setChildIdx] = useState(0);
  const [access, setAccessState] = useState(loadAccess);
  const setAccess = useCallback((next) => { setAccessState(next); try { localStorage.setItem('miz-access', JSON.stringify({ ...next, __v: ACCESS_V })); } catch { /* ignore */ } }, []);
  const [trip, setTrip] = useState({ status: 'idle', stopIndex: 0, boarded: {}, log: [] });

  useEffect(() => {
    let alive = true;
    if (!LIVE) { const d = localSchoolData(slug); setData(d); applyBrand(d.school); return () => {}; }
    setData(null);
    loadSchoolData(slug).then((d) => { if (alive) { setData(d); applyBrand(d.school); } }).catch((e) => setError(e));
    return () => { alive = false; };
  }, [slug]);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(window.__mizToast);
    window.__mizToast = setTimeout(() => setToast(null), 2600);
  }, []);

  const idx = useMemo(() => {
    if (!data) return null;
    const students = byId(data.students);
    const sections = byId(data.sections);
    const teachers = byId(data.teachers);
    const subjects = byId(data.subjects);
    const routes = byId(data.routes);
    const stops = byId(data.route_stops);
    const rooms = byId(data.rooms);
    const hostels = byId(data.hostels);
    const dates = [...new Set(data.attendance.map((a) => a.date))].sort().reverse();
    const today = dates[0];
    const attToday = {};
    data.attendance.forEach((a) => { if (a.date === today) attToday[a.student_id] = a.status; });
    const studentsBySection = {};
    data.students.forEach((s) => { (studentsBySection[s.section_id] ||= []).push(s); });
    const marksByStudent = {};
    data.marks.forEach((m) => { (marksByStudent[m.student_id] ||= []).push(m); });
    const allocByTeacher = {};
    (data.allocations || []).forEach((a) => { (allocByTeacher[a.teacher_id] ||= []).push(a); });
    const allocByCell = rowsByCell(data.allocations || []);
    return { students, sections, teachers, subjects, routes, stops, rooms, hostels, dates, today, attToday, studentsBySection, marksByStudent, allocByTeacher, allocByCell };
  }, [data]);

  const persona = useMemo(() => {
    if (!data || !idx) return null;
    const r = roleByKey(role);
    const sec8a = data.sections.find((s) => s.name === '8A');
    const kid = idx.students[data.meta.demoStudentId];
    const children = data.meta.demoParentStudentIds.map((id) => idx.students[id]);
    const teacher = idx.teachers[sec8a.class_teacher_id];
    const map = {
      school_admin: { name: r.person, title: r.title },
      principal: { name: data.school.principal_name, title: 'Principal' },
      teacher: { name: teacher.full_name, title: `Class Teacher · ${sec8a.name}`, teacher, section: sec8a },
      parent: { name: kid.guardian_name, title: `Parent of ${children.map((c) => c.full_name.split(' ')[0]).join(' & ')}`, children, child: children[childIdx] || children[0] },
      student: { name: kid.full_name, title: `Class ${idx.sections[kid.section_id].name} · Roll ${kid.roll_no}`, student: kid, child: kid },
      driver: { name: data.routes[0].driver_name, title: `Driver · ${data.routes[0].code}`, route: data.routes[0] },
      reception: { name: r.person, title: r.title },
      warden: { name: data.hostels[0].warden_name, title: 'Hostel Warden' },
      canteen: { name: r.person, title: r.title },
      scanner: { name: r.person, title: r.title },
      librarian: { name: r.person, title: r.title },
      accountant: { name: r.person, title: r.title },
      super_admin: { name: r.person, title: 'Miz School Platform' },
    };
    return { role: r, ...(map[role] || map.school_admin) };
  }, [data, idx, role, childIdx]);

  // ── Demo mutations (session only; production writes go through the Node API) ──
  const update = useCallback((key, fn) => setData((d) => ({ ...d, [key]: fn(d[key]) })), []);
  /** Every event fans out as an in-app notification + WhatsApp/SMS/email log entry. */
  const push = useCallback((audiences, title, body, kind, channels = ['push', 'whatsapp']) => {
    const at = new Date().toISOString();
    setData((d) => ({
      ...d,
      notifications: [...audiences.map((a, i) => ({ id: `nt-${Date.now()}-${i}`, audience: a, title, body, kind, created_at: at })), ...d.notifications],
      comm_logs: [...channels.map((c, i) => ({ id: `cl-${Date.now()}-${i}`, at, channel: c, template: title, to: audiences.join(', '), status: 'sent' })), ...(d.comm_logs || [])],
    }));
  }, []);
  const actions = useMemo(() => ({
    push,
    /** Generic session-only update for any table: actions.update('books', rows => ...) */
    update,
    saveAttendance(sectionId, date, marks) {
      const absent = Object.values(marks).filter((x) => x === 'absent').length;
      if (absent) push(['parent', 'school_admin'], `${absent} student${absent > 1 ? 's' : ''} marked absent`, 'Parents alerted on WhatsApp and SMS.', 'attendance', ['whatsapp', 'sms', 'push']);
      update('attendance', (rows) => {
        const rest = rows.filter((a) => !(a.section_id === sectionId && a.date === date));
        return [...rest, ...Object.entries(marks).map(([student_id, status]) => ({ id: `${student_id}-${date}`, student_id, section_id: sectionId, date, status }))];
      });
    },
    markStudent(studentId, status) {
      setData((d) => {
        const s = d.students.find((x) => x.id === studentId);
        const date = [...new Set(d.attendance.map((a) => a.date))].sort().reverse()[0];
        const rest = d.attendance.filter((a) => !(a.student_id === studentId && a.date === date));
        return { ...d, attendance: [...rest, { id: `${studentId}-${date}`, student_id: studentId, section_id: s.section_id, date, status }] };
      });
    },
    payInvoice(id, method = 'UPI') {
      push(['parent', 'accountant', 'school_admin'], 'Fee payment received', `Paid via ${method}. Receipt sent by email.`, 'fees', ['push', 'email', 'whatsapp']);
      update('fee_invoices', (rows) => rows.map((f) => (f.id === id ? { ...f, status: 'paid', paid_on: todayISO(), method, receipt_no: `RCPT-${Math.floor(90000 + Math.random() * 9999)}` } : f)));
    },
    addNotice(n) { push(['all'], n.title, n.body?.slice(0, 90), 'notice', ['push', 'whatsapp', 'email']); update('notices', (rows) => [{ id: `n-${Date.now()}`, published_at: new Date().toISOString(), priority: 'normal', ...n }, ...rows]); },
    addHomework(h) { push(['parent', 'student'], 'New homework added', `${h.title} — due ${h.due_on}`, 'homework', ['push']); update('homework', (rows) => [{ id: `hw-${Date.now()}`, assigned_on: todayISO(), ...h }, ...rows]); },
    addLeave(l) { push(['teacher'], 'New leave request', `${l.requester}: ${l.reason}`, 'leave', ['push']); update('leave_requests', (rows) => [{ id: `lv-${Date.now()}`, status: 'pending', ...l }, ...rows]); },
    setLeave(id, status) { push(['parent'], `Leave ${status}`, 'Your leave request was reviewed by the class teacher.', 'leave', ['push', 'whatsapp']); update('leave_requests', (rows) => rows.map((l) => (l.id === id ? { ...l, status } : l))); },
    addVisitor(v) { update('visitors', (rows) => [{ id: `v-${Date.now()}`, check_in: new Date().toISOString(), check_out: null, status: 'inside', badge_no: `V-${120 + rows.length}`, ...v }, ...rows]); },
    checkoutVisitor(id) { update('visitors', (rows) => rows.map((v) => (v.id === id ? { ...v, status: 'checked_out', check_out: new Date().toISOString() } : v))); },
    addEnquiry(e) { update('admission_enquiries', (rows) => [{ id: `e-${Date.now()}`, created_at: new Date().toISOString(), status: 'new', ...e }, ...rows]); },
    setComplaint(id, status) { update('complaints', (rows) => rows.map((c) => (c.id === id ? { ...c, status } : c))); },
    addSale(sale, items) {
      update('canteen_sales', (rows) => [{ id: `b-${Date.now()}`, bill_no: `C-${String(3300 + rows.length).padStart(5, '0')}`, created_at: new Date().toISOString(), ...sale }, ...rows]);
      update('canteen_items', (rows) => rows.map((it) => (items[it.id] ? { ...it, stock: Math.max(0, it.stock - items[it.id]) } : it)));
    },
    restock(id, qty) { update('canteen_items', (rows) => rows.map((it) => (it.id === id ? { ...it, stock: it.stock + qty } : it))); },
    saveMarks(examId, subjectId, values) {
      push(['principal'], 'Marks entered', 'A teacher saved marks — ready for review before publishing.', 'notice', ['push']);
      update('marks', (rows) => rows.map((m) => (m.exam_id === examId && m.subject_id === subjectId && values[m.student_id] != null ? { ...m, marks_obtained: values[m.student_id] } : m)));
    },
    setBranding(patch) { setData((d) => { const school = { ...d.school, ...patch }; applyBrand(school); return { ...d, school }; }); },

    /* ── Teacher allocation (draft → publish) ── */
    allocSetCell(sectionId, code, entries) {
      setData((d) => {
        const base = d.alloc_draft || d.allocations;
        const sub = d.subjects.find((x) => x.code === code);
        const rest = base.filter((a) => !(a.section_id === sectionId && a.subject_code === code));
        const add = entries.filter((e) => e.teacher_id && e.periods > 0).map((e) => ({ id: `${sectionId}:${code}:${e.teacher_id}`, section_id: sectionId, subject_code: code, subject_id: sub.id, teacher_id: e.teacher_id, periods: Number(e.periods) }));
        return { ...d, alloc_draft: [...rest, ...add] };
      });
    },
    allocAuto(mode) {
      setData((d) => {
        const base = d.alloc_draft || d.allocations;
        const keep = mode === 'empty' ? base : [];
        return { ...d, alloc_draft: autoAllocate({ sections: d.sections, teachers: d.teachers, subjects: d.subjects, scheme: d.subject_scheme, keep }) };
      });
    },
    allocDiscard() { setData((d) => ({ ...d, alloc_draft: null, alloc_meta: { ...d.alloc_meta, submitted: false } })); },
    allocSubmit(by) {
      push(['principal'], 'Teacher allocation sent for approval', `${by} prepared a new draft. Review and publish.`, 'notice', ['push', 'email']);
      setData((d) => ({ ...d, alloc_meta: { ...d.alloc_meta, submitted: true, submitted_by: by } }));
    },
    allocPublish({ effective_from, by }) {
      let changes = [];
      setData((d) => {
        const next = d.alloc_draft || d.allocations;
        changes = diffAllocations(d.allocations, next, { sections: d.sections, teachers: d.teachers });
        const version = (d.alloc_meta?.version || 0) + 1;
        const at = new Date().toISOString();
        const tChanged = new Set();
        changes.forEach((c) => {
          [...(rowsByCell(d.allocations)[cellKey(c.section_id, c.code)] || []), ...(rowsByCell(next)[cellKey(c.section_id, c.code)] || [])].forEach((r) => tChanged.add(r.teacher_id));
        });
        const secChanged = new Set(changes.filter((c) => c.teachersChanged).map((c) => c.section));
        const notes = [
          { id: `nt-al-${Date.now()}-t`, audience: 'teacher', title: `Teacher allocation v${version} published`, body: `Effective ${effective_from}. Your classes and timetable are updated.`, kind: 'notice', created_at: at },
          ...(secChanged.size ? [{ id: `nt-al-${Date.now()}-p`, audience: 'parent', title: 'Subject teacher update', body: `New subject teacher from ${effective_from} for Class ${[...secChanged].slice(0, 3).join(', ')}.`, kind: 'notice', created_at: at }] : []),
        ];
        return {
          ...d,
          allocations: next,
          alloc_draft: null,
          timetable_slots: buildTimetable(d.sections, next, PERIODS, version + 3),
          alloc_meta: { ...d.alloc_meta, version, status: 'published', published_at: at, published_by: by, effective_from, submitted: false },
          alloc_log: [{ id: `al-${version}`, at, by, version, text: `Published v${version} — ${changes.length} change${changes.length === 1 ? '' : 's'}, effective ${effective_from}. ${tChanged.size} teacher${tChanged.size === 1 ? '' : 's'}${secChanged.size ? ` and parents of ${secChanged.size} class${secChanged.size === 1 ? '' : 'es'}` : ''} notified. Timetable rebuilt.` }, ...(d.alloc_log || [])],
          notifications: [...notes, ...d.notifications],
          comm_logs: [{ id: `cl-al-${Date.now()}`, at, channel: 'whatsapp', template: `Allocation v${version}`, to: `${tChanged.size} teachers${secChanged.size ? `, parents of ${[...secChanged].join(', ')}` : ''}`, status: 'sent' }, ...(d.comm_logs || [])],
        };
      });
      return changes;
    },
    setScheme(key, code, periods) {
      setData((d) => {
        const scheme = { ...d.subject_scheme, [key]: { ...d.subject_scheme[key], [code]: Math.max(0, Number(periods) || 0) } };
        const base = d.alloc_draft || d.allocations;
        const inKey = new Set(d.sections.filter((s) => (s.stage === 'senior' ? `senior-${s.section}` : s.stage) === key).map((s) => s.id));
        const byCell = rowsByCell(base);
        const draft = base.map((a) => (inKey.has(a.section_id) && a.subject_code === code && byCell[cellKey(a.section_id, code)].length === 1 ? { ...a, periods: scheme[key][code] } : a)).filter((a) => a.periods > 0);
        return { ...d, subject_scheme: scheme, alloc_draft: draft };
      });
    },
    setClassTeacher(sectionId, patch, { by, effective_from }) {
      setData((d) => {
        const sec = d.sections.find((s) => s.id === sectionId);
        const tName = (id) => d.teachers.find((t) => t.id === id)?.full_name || '—';
        const at = new Date().toISOString();
        const texts = [];
        if (patch.class_teacher_id && patch.class_teacher_id !== sec.class_teacher_id) texts.push(`Class teacher of ${sec.name}: ${tName(sec.class_teacher_id)} → ${tName(patch.class_teacher_id)}`);
        if ('co_class_teacher_id' in patch && patch.co_class_teacher_id !== sec.co_class_teacher_id) texts.push(`Co-class teacher of ${sec.name}: ${tName(sec.co_class_teacher_id)} → ${tName(patch.co_class_teacher_id)}`);
        if (!texts.length) return d;
        const ctChanged = patch.class_teacher_id && patch.class_teacher_id !== sec.class_teacher_id;
        return {
          ...d,
          sections: d.sections.map((s) => (s.id === sectionId ? { ...s, ...patch, ...(ctChanged ? { class_teacher_since: effective_from } : {}) } : s)),
          alloc_log: [{ id: `al-ct-${Date.now()}`, at, by, text: `${texts.join('; ')} (from ${effective_from}).` }, ...(d.alloc_log || [])],
          notifications: ctChanged ? [
            { id: `nt-ct-${Date.now()}-p`, audience: 'parent', title: `New class teacher for ${sec.name}`, body: `${tName(patch.class_teacher_id)} is the class teacher of ${sec.name} from ${effective_from}.`, kind: 'notice', created_at: at },
            { id: `nt-ct-${Date.now()}-t`, audience: 'teacher', title: `Class teacher change — ${sec.name}`, body: `Attendance, leave approvals and remarks for ${sec.name} move to ${tName(patch.class_teacher_id)} from ${effective_from}.`, kind: 'notice', created_at: at },
            ...d.notifications] : d.notifications,
          comm_logs: ctChanged ? [{ id: `cl-ct-${Date.now()}`, at, channel: 'whatsapp', template: 'Class teacher change', to: `Parents of ${sec.name}`, status: 'sent' }, ...(d.comm_logs || [])] : d.comm_logs,
        };
      });
    },
    raiseAllocQuery(teacher_id, text) {
      push(['principal'], 'Allocation request from a teacher', text.slice(0, 90), 'notice', ['push']);
      update('alloc_queries', (rows) => [{ id: `aq-${Date.now()}`, teacher_id, text, at: new Date().toISOString(), status: 'open' }, ...(rows || [])]);
    },
    answerAllocQuery(id, status, reply) {
      push(['teacher'], `Your allocation request was ${status === 'accepted' ? 'accepted' : 'answered'}`, reply || 'See Teacher Allocation for details.', 'notice', ['push']);
      update('alloc_queries', (rows) => rows.map((q) => (q.id === id ? { ...q, status, reply } : q)));
    },

    /* ── Staff attendance & substitution ── */
    markStaff(teacherId, status, note) {
      const date = todayISO(); const day = todayDow();
      setData((d) => {
        const t = d.teachers.find((x) => x.id === teacherId);
        const rows = d.staff_attendance.filter((r) => !(r.teacher_id === teacherId && r.date === date));
        const prev = d.staff_attendance.find((r) => r.teacher_id === teacherId && r.date === date);
        const at = new Date();
        const hm = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
        const row = { id: `sa-${teacherId}-${date}`, teacher_id: teacherId, date, status, note: note ?? prev?.note ?? null, check_in: ['present', 'late', 'half_day'].includes(status) ? prev?.check_in || hm : null, check_out: null, source: 'Marked by office' };
        let substitutions = (d.substitutions || []).filter((s) => !(s.date === date && s.absent_teacher_id === teacherId));
        const removed = (d.substitutions || []).length - substitutions.length;
        const view = { ...d, staff_attendance: [...rows, row], substitutions };
        const fresh = ['absent', 'leave', 'half_day'].includes(status) ? makeSubs(view, teacherId, status, { date, day }) : [];
        substitutions = [...substitutions, ...fresh].sort((a, b) => a.period - b.period);
        const notes = fresh.length ? [{ id: `nt-sa-${Date.now()}`, audience: 'principal', title: `${fresh.length} period${fresh.length > 1 ? 's' : ''} need cover`, body: `${t.full_name} is ${status === 'half_day' ? 'on half day' : status === 'leave' ? 'on leave' : 'absent'} today. Arrange substitutes.`, kind: 'attendance', created_at: at.toISOString() }] : [];
        return { ...d, staff_attendance: [...rows, row], substitutions, notifications: [...notes, ...d.notifications], _lastSubChange: { fresh: fresh.length, removed } };
      });
    },
    assignSub(subId, teacherId, mode = 'teacher', by = 'Principal') {
      setData((d) => {
        const sb = d.substitutions.find((x) => x.id === subId);
        const sec = d.sections.find((x) => x.id === sb.section_id);
        const subj = d.subjects.find((x) => x.id === sb.subject_id);
        const t = d.teachers.find((x) => x.id === teacherId);
        const absent = d.teachers.find((x) => x.id === sb.absent_teacher_id);
        const at = new Date().toISOString();
        const who = mode === 'library' ? 'Self-study in the library' : t?.full_name;
        const week = { ...(d.sub_week || {}) };
        if (sb.sub_teacher_id) week[sb.sub_teacher_id] = Math.max(0, (week[sb.sub_teacher_id] || 1) - 1);
        if (teacherId && mode === 'teacher') week[teacherId] = (week[teacherId] || 0) + 1;
        return {
          ...d,
          sub_week: week,
          substitutions: d.substitutions.map((x) => (x.id === subId ? { ...x, sub_teacher_id: mode === 'library' ? null : teacherId, mode, status: 'assigned', assigned_by: by, assigned_at: at } : x)),
          notifications: [
            ...(mode === 'teacher' ? [{ id: `nt-sb-${Date.now()}-t`, audience: 'teacher', title: `Cover: Period ${sb.period} · ${sec.name} ${subj.name}`, body: `${sb.start_time} in ${sec.room}, for ${absent.full_name}. Lesson plan for today is attached.`, kind: 'notice', created_at: at }] : []),
            { id: `nt-sb-${Date.now()}-s`, audience: 'student', title: `Period ${sb.period} ${subj.name}: ${who}`, body: `${absent.full_name.replace(/^(Mr\.|Ms\.|Mrs\.)\s/, '')} is away today. ${mode === 'library' ? 'Go to the library with your ' + subj.name + ' book.' : 'Your class will be taken by ' + t.full_name + '.'}`, kind: 'notice', created_at: at },
            { id: `nt-sb-${Date.now()}-p`, audience: 'parent', title: `Today in ${sec.name}: substitute for ${subj.name}`, body: `Period ${sb.period} will be taken by ${who}.`, kind: 'notice', created_at: at },
            ...d.notifications],
        };
      });
    },
    autoAssignSubs(by = 'Principal') {
      let n = 0;
      setData((d) => {
        const date = todayISO();
        let subs = [...(d.substitutions || [])];
        const week = { ...(d.sub_week || {}) };
        subs = subs.map((sb, i) => {
          if (sb.status !== 'open' || sb.date !== date) return sb;
          const best = subCandidates({ ...d, substitutions: subs, sub_week: week }, sb, { date, subs }).find((c) => !c.blocked);
          const row = best ? { ...sb, sub_teacher_id: best.t.id, mode: 'teacher', status: 'assigned', assigned_by: by, assigned_at: new Date().toISOString() } : { ...sb, mode: 'library', status: 'assigned', assigned_by: by, assigned_at: new Date().toISOString() };
          if (best) week[best.t.id] = (week[best.t.id] || 0) + 1;
          subs[i] = row; n++;
          return row;
        });
        const at = new Date().toISOString();
        return { ...d, substitutions: subs, sub_week: week, notifications: n ? [{ id: `nt-sba-${Date.now()}`, audience: 'teacher', title: 'Substitution arrangement published', body: `${n} periods covered for today. Check your duties.`, kind: 'notice', created_at: at }, { id: `nt-sba-${Date.now()}-s`, audience: 'student', title: 'Some periods have a substitute today', body: 'See today’s timetable for who takes your class.', kind: 'notice', created_at: at }, ...d.notifications] : d.notifications };
      });
      return n;
    },

    /* ── Class representatives & elections ── */
    setStudentRole(roleRow, { notifyParent = true } = {}) {
      setData((d) => {
        const s = d.students.find((x) => x.id === roleRow.student_id);
        const sec = d.sections.find((x) => x.id === s.section_id);
        const at = new Date().toISOString();
        const rows = roleRow.id && d.student_roles.some((x) => x.id === roleRow.id)
          ? d.student_roles.map((x) => (x.id === roleRow.id ? { ...x, ...roleRow, since: todayISO() } : x))
          : [{ id: `sr-${Date.now()}`, since: todayISO(), section_id: s.section_id, ...roleRow }, ...d.student_roles];
        return {
          ...d,
          student_roles: rows,
          notifications: notifyParent ? [{ id: `nt-sr-${Date.now()}`, audience: 'parent', title: `${s.full_name.split(' ')[0]} is now ${roleRow.role}`, body: `${s.full_name} has been appointed ${roleRow.role} of ${sec.name}${roleRow.term ? ` for ${roleRow.term}` : ''}.`, kind: 'notice', created_at: at }, ...d.notifications] : d.notifications,
          comm_logs: notifyParent ? [{ id: `cl-sr-${Date.now()}`, at, channel: 'whatsapp', template: `${roleRow.role} appointed`, to: s.guardian_name, status: 'sent' }, ...(d.comm_logs || [])] : d.comm_logs,
        };
      });
    },
    removeStudentRole(id) { update('student_roles', (rows) => rows.filter((x) => x.id !== id)); },
    approveStudentRole(id) {
      push(['parent', 'student'], 'Leadership role approved', 'The principal approved a house captain appointment.', 'notice', ['push', 'whatsapp']);
      update('student_roles', (rows) => rows.map((x) => (x.id === id ? { ...x, status: 'approved', approved_by: 'Principal' } : x)));
    },
    startElection(e) {
      push(['student', 'parent'], `Election: ${e.post}`, `Voting is open in the app until ${e.closes_on}. One vote per student.`, 'notice', ['push']);
      update('elections', (rows) => [{ id: `el-${Date.now()}`, status: 'open', seats: 1, opened_at: new Date().toISOString(), voters: [], ...e, candidates: e.candidates.map((id) => ({ student_id: id, votes: 0 })) }, ...(rows || [])]);
    },
    vote(electionId, candidateId, voterId) {
      update('elections', (rows) => rows.map((e) => (e.id !== electionId || e.voters.includes(voterId) ? e : { ...e, voters: [...e.voters, voterId], candidates: e.candidates.map((c) => (c.student_id === candidateId ? { ...c, votes: c.votes + 1 } : c)) })));
    },
    closeElection(electionId, by) {
      setData((d) => {
        const e = d.elections.find((x) => x.id === electionId);
        const win = [...e.candidates].sort((a, b) => b.votes - a.votes)[0];
        const s = d.students.find((x) => x.id === win.student_id);
        const sec = d.sections.find((x) => x.id === e.section_id);
        const at = new Date().toISOString();
        const same = d.student_roles.find((x) => x.section_id === e.section_id && x.role === e.post && d.students.find((y) => y.id === x.student_id)?.gender === s.gender);
        const row = { id: same?.id || `sr-${Date.now()}`, section_id: e.section_id, student_id: s.id, role: e.post, method: 'Election', term: e.term, since: todayISO(), by };
        return {
          ...d,
          elections: d.elections.map((x) => (x.id === electionId ? { ...x, status: 'closed', winner_id: s.id, closed_at: at } : x)),
          student_roles: same ? d.student_roles.map((x) => (x.id === same.id ? row : x)) : [row, ...d.student_roles],
          notifications: [
            { id: `nt-el-${Date.now()}-p`, audience: 'parent', title: `${s.full_name.split(' ')[0]} elected ${e.post}`, body: `${s.full_name} won the ${sec.name} election with ${win.votes} votes (${e.term}).`, kind: 'notice', created_at: at },
            { id: `nt-el-${Date.now()}-s`, audience: 'student', title: `Election result — ${sec.name}`, body: `${s.full_name} is the new ${e.post}.`, kind: 'notice', created_at: at },
            ...d.notifications],
          comm_logs: [{ id: `cl-el-${Date.now()}`, at, channel: 'whatsapp', template: 'Election result', to: `Parents of ${sec.name}`, status: 'sent' }, ...(d.comm_logs || [])],
        };
      });
    },
  }), [update, push]);

  const value = { access, setAccess, slug, role, data, idx, persona, actions, notify, toast, error, childIdx, setChildIdx, trip, setTrip };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
