// Substitution engine — when a teacher is absent, every period they had today needs cover.
// Candidates are ranked: same subject > knows the class > fewest periods today > fewest covers this week.
import { maxLoad } from './allocation.js';

export const MAX_SUBS_PER_DAY = 2;
export const OFF_STATUSES = ['absent', 'leave'];
const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Is the teacher away for this period? half-day = leaves after period 4. */
export function isAway(status, period) {
  if (!status) return false;
  if (OFF_STATUSES.includes(status)) return true;
  if (status === 'half_day') return period >= 5;
  return false;
}

export function staffStatusOn(data, date) {
  const m = {};
  (data.staff_attendance || []).forEach((r) => { if (r.date === date) m[r.teacher_id] = r.status; });
  return m;
}

/** Periods a teacher would have missed today, from the timetable. */
export function periodsToCover(data, teacherId, day, status) {
  return data.timetable_slots.filter((s) => s.day === day && s.teacher_id === teacherId && isAway(status, s.period));
}

/** Ranked substitute candidates for one period. */
export function subCandidates(data, sub, { date, subs = data.substitutions || [] } = {}) {
  const status = staffStatusOn(data, date);
  const sec = data.sections.find((s) => s.id === sub.section_id);
  const code = data.subjects.find((s) => s.id === sub.subject_id)?.code;
  const busy = new Set(data.timetable_slots.filter((s) => s.day === sub.day && s.period === sub.period).map((s) => s.teacher_id));
  const todays = subs.filter((s) => s.date === date && s.sub_teacher_id);
  const coveringNow = new Set(todays.filter((s) => s.period === sub.period && s.id !== sub.id).map((s) => s.sub_teacher_id));
  const periodsToday = {};
  data.timetable_slots.forEach((s) => { if (s.day === sub.day) periodsToday[s.teacher_id] = (periodsToday[s.teacher_id] || 0) + 1; });
  const subsToday = {};
  todays.forEach((s) => { subsToday[s.sub_teacher_id] = (subsToday[s.sub_teacher_id] || 0) + 1; });
  const teachesClass = new Set((data.allocations || []).filter((a) => a.section_id === sub.section_id).map((a) => a.teacher_id));
  const week = data.sub_week || {};
  return data.teachers.map((t) => {
    const reasons = [];
    let blocked = null;
    if (t.id === sub.absent_teacher_id) blocked = 'Absent';
    else if (isAway(status[t.id], sub.period)) blocked = status[t.id] === 'half_day' ? 'Half day' : 'On leave';
    else if (t.part_time && t.days && !t.days.includes(DAY_NAMES[sub.day])) blocked = 'Not on campus today';
    else if (busy.has(t.id)) blocked = 'Teaching another class';
    else if (coveringNow.has(t.id)) blocked = 'Already covering this period';
    else if ((subsToday[t.id] || 0) >= MAX_SUBS_PER_DAY) blocked = `Already ${MAX_SUBS_PER_DAY} covers today`;
    let score = 0;
    const same = t.subject_codes?.includes(code);
    if (same) { score += 40; reasons.push(`Teaches ${code}`); }
    if (teachesClass.has(t.id)) { score += 20; reasons.push(`Knows ${sec.name}`); }
    const pt = periodsToday[t.id] || 0;
    score -= pt * 3; reasons.push(`${pt} period${pt === 1 ? '' : 's'} today`);
    const st = subsToday[t.id] || 0;
    score -= st * 8; if (st) reasons.push(`${st} cover today`);
    const w = week[t.id] || 0;
    score -= w * 4; reasons.push(`${w} cover${w === 1 ? '' : 's'} this week`);
    if ((t.max_load || maxLoad(t)) - pt * 6 < 0) score -= 5;
    return { t, score, reasons, blocked, same };
  }).sort((a, b) => (a.blocked ? 1 : 0) - (b.blocked ? 1 : 0) || b.score - a.score);
}

/** Overlays today's substitutions on timetable slots of one day. */
export function applySubs(data, slots, day, date) {
  const map = {};
  (data.substitutions || []).forEach((s) => { if (s.date === date && s.day === day) map[`${s.section_id}|${s.period}`] = s; });
  return slots.map((sl) => {
    const s = map[`${sl.section_id}|${sl.period}`];
    if (!s) return sl;
    return { ...sl, original_teacher_id: s.absent_teacher_id, teacher_id: s.mode === 'library' ? null : s.sub_teacher_id, sub: s, room: s.mode === 'library' ? 'Library (self-study)' : sl.room };
  });
}

/** Builds open substitution rows for a teacher who is away today. */
export function makeSubs(data, teacherId, status, { date, day }) {
  const existing = new Set((data.substitutions || []).filter((s) => s.date === date).map((s) => `${s.section_id}|${s.period}`));
  return periodsToCover(data, teacherId, day, status).filter((sl) => !existing.has(`${sl.section_id}|${sl.period}`)).map((sl) => ({
    id: `sub-${date}-${sl.section_id}-${sl.period}`, date, day, period: sl.period, start_time: sl.start_time, section_id: sl.section_id, subject_id: sl.subject_id,
    absent_teacher_id: teacherId, reason: status, sub_teacher_id: null, mode: 'teacher', status: 'open',
  }));
}
