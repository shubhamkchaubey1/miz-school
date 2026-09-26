import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadSchoolData, localSchoolData } from '../data/api.js';

const LIVE = import.meta.env.VITE_LIVE_DATA === 'true';
import { roleByKey } from '../config/roles.js';
import { todayISO } from './derive.js';

const Ctx = createContext(null);
export const useSchool = () => useContext(Ctx);

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
    return { students, sections, teachers, subjects, routes, stops, rooms, hostels, dates, today, attToday, studentsBySection, marksByStudent };
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
      super_admin: { name: r.person, title: 'Miz School Platform' },
    };
    return { role: r, ...(map[role] || map.school_admin) };
  }, [data, idx, role, childIdx]);

  // ── Demo mutations (session only; production writes go through the Node API) ──
  const update = useCallback((key, fn) => setData((d) => ({ ...d, [key]: fn(d[key]) })), []);
  const actions = useMemo(() => ({
    saveAttendance(sectionId, date, marks) {
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
      update('fee_invoices', (rows) => rows.map((f) => (f.id === id ? { ...f, status: 'paid', paid_on: todayISO(), method, receipt_no: `RCPT-${Math.floor(90000 + Math.random() * 9999)}` } : f)));
    },
    addNotice(n) { update('notices', (rows) => [{ id: `n-${Date.now()}`, published_at: new Date().toISOString(), priority: 'normal', ...n }, ...rows]); },
    addHomework(h) { update('homework', (rows) => [{ id: `hw-${Date.now()}`, assigned_on: todayISO(), ...h }, ...rows]); },
    addLeave(l) { update('leave_requests', (rows) => [{ id: `lv-${Date.now()}`, status: 'pending', ...l }, ...rows]); },
    setLeave(id, status) { update('leave_requests', (rows) => rows.map((l) => (l.id === id ? { ...l, status } : l))); },
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
      update('marks', (rows) => rows.map((m) => (m.exam_id === examId && m.subject_id === subjectId && values[m.student_id] != null ? { ...m, marks_obtained: values[m.student_id] } : m)));
    },
    setBranding(patch) { setData((d) => { const school = { ...d.school, ...patch }; applyBrand(school); return { ...d, school }; }); },
  }), [update]);

  const value = { slug, role, data, idx, persona, actions, notify, toast, error, childIdx, setChildIdx, trip, setTrip };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
