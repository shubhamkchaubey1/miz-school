// Pure selectors over the school dataset. Same functions work for local and Supabase data.

export const todayDow = () => { const d = new Date().getDay(); return d === 0 ? 1 : d; }; // 1 = Mon … 6 = Sat

export function attendanceStats(rows) {
  const c = { present: 0, absent: 0, late: 0, leave: 0 };
  rows.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
  const total = rows.length;
  const attended = c.present + c.late;
  return { ...c, total, pct: total ? (attended / total) * 100 : 0 };
}

export function attendanceOn(data, date, sectionId) {
  return data.attendance.filter((a) => a.date === date && (!sectionId || a.section_id === sectionId));
}

export function attendanceTrend(data, idx, n = 10, sectionId) {
  return idx.dates.slice(0, n).reverse().map((d) => ({
    label: new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).replace(' ', ' '),
    date: d,
    value: Math.round(attendanceStats(attendanceOn(data, d, sectionId)).pct * 10) / 10,
  }));
}

export function studentAttendance(data, studentId) {
  const rows = data.attendance.filter((a) => a.student_id === studentId).sort((a, b) => a.date.localeCompare(b.date));
  return { rows, ...attendanceStats(rows) };
}

export function feeSummary(invoices) {
  const s = { collected: 0, pending: 0, overdue: 0, due: 0, paidCount: 0, overdueCount: 0, dueCount: 0 };
  invoices.forEach((f) => {
    const amt = Number(f.amount);
    if (f.status === 'paid') { s.collected += amt; s.paidCount++; }
    else if (f.status === 'overdue') { s.overdue += amt; s.pending += amt; s.overdueCount++; }
    else if (f.status === 'due') { s.due += amt; s.pending += amt; s.dueCount++; }
  });
  s.rate = s.collected + s.pending ? (s.collected / (s.collected + s.pending)) * 100 : 0;
  return s;
}

export function collectionByMonth(invoices) {
  const months = {};
  invoices.filter((f) => f.status === 'paid' && f.paid_on).forEach((f) => {
    const k = f.paid_on.slice(0, 7);
    months[k] = (months[k] || 0) + Number(f.amount);
  });
  return Object.keys(months).sort().slice(-6).map((k) => ({
    label: new Date(`${k}-01`).toLocaleDateString('en-IN', { month: 'short' }),
    value: months[k],
  }));
}

export const grade = (p) => (p >= 91 ? 'A1' : p >= 81 ? 'A2' : p >= 71 ? 'B1' : p >= 61 ? 'B2' : p >= 51 ? 'C1' : p >= 41 ? 'C2' : p >= 33 ? 'D' : 'E');

export function reportCard(data, idx, studentId, examId) {
  const rows = (idx.marksByStudent?.[studentId] || data.marks.filter((m) => m.student_id === studentId)).filter((m) => m.exam_id === examId)
    .map((m) => ({ ...m, subject: idx.subjects[m.subject_id], pct: (Number(m.marks_obtained) / m.max_marks) * 100 }))
    .sort((a, b) => (a.subject?.code || '').localeCompare(b.subject?.code || ''));
  const total = rows.reduce((s, r) => s + Number(r.marks_obtained), 0);
  const max = rows.reduce((s, r) => s + r.max_marks, 0);
  const pct = max ? (total / max) * 100 : 0;
  return { rows, total, max, pct, grade: grade(pct) };
}

export function sectionResults(data, idx, sectionId, examId) {
  const students = idx.studentsBySection[sectionId] || [];
  const list = students.map((s) => ({ student: s, ...reportCard(data, idx, s.id, examId) })).sort((a, b) => b.pct - a.pct);
  list.forEach((r, i) => { r.rank = i + 1; });
  return list;
}

export function daySchedule(data, { sectionId, teacherId, day }) {
  return data.timetable_slots
    .filter((t) => t.day === day && (!sectionId || t.section_id === sectionId) && (!teacherId || t.teacher_id === teacherId))
    .sort((a, b) => a.period - b.period);
}

export function currentPeriod() {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  const ranges = [[480, 525], [525, 570], [570, 615], [635, 680], [680, 725], [765, 810], [810, 855]];
  const i = ranges.findIndex(([a, b]) => m >= a && m < b);
  return i === -1 ? null : i + 1;
}

export function pendingHomework(data, sectionId) {
  const today = todayISO();
  return data.homework.filter((h) => h.section_id === sectionId).sort((a, b) => a.due_on.localeCompare(b.due_on)).map((h) => ({ ...h, overdue: h.due_on < today }));
}

export const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
