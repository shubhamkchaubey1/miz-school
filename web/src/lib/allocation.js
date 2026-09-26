// Teacher allocation engine — "who teaches what".
// One allocation row = one teacher teaching one subject in one section for N periods a week.
// A subject can be split between teachers (two rows for the same section + subject).
// Everything downstream (timetable, homework, marks entry, substitution) reads these rows.
import { CATEGORIES, SPECIALIST, HOME_STAGES, schemeKey, slotsPerWeek } from '../data/classes.js';

export const cellKey = (sectionId, code) => `${sectionId}|${code}`;
export const shortName = (t) => (t ? t.full_name.replace(/^(Mr\.|Ms\.|Mrs\.)\s/, '') : '—');
export const maxLoad = (t) => t?.max_load || CATEGORIES[t?.designation]?.max || 32;

/** Periods each section needs per subject, from the school's subject scheme. */
export function demandCells(sections, scheme) {
  const out = [];
  sections.forEach((sec) => Object.entries(scheme[schemeKey(sec)] || {}).forEach(([code, periods]) => { if (periods > 0) out.push({ section: sec, code, periods }); }));
  return out;
}

/** 0 = main subject & right level · 1 = second subject & right level · 2 = can teach but level mismatch · 3 = not their subject */
export function fit(t, code, sec) {
  const subs = t.subject_codes || [];
  const levelOk = SPECIALIST.includes(code) || (CATEGORIES[t.designation]?.stages || []).includes(sec.stage);
  if (!subs.includes(code)) return 3;
  if (!levelOk) return 2;
  return subs[0] === code ? 0 : 1;
}
export const FIT_LABEL = ['Main subject', 'Second subject', 'Different level', 'Not their subject'];

export function loadsOf(rows) {
  const m = {};
  rows.forEach((r) => { if (r.teacher_id) m[r.teacher_id] = (m[r.teacher_id] || 0) + r.periods; });
  return m;
}

export function rowsByCell(rows) {
  const m = {};
  rows.forEach((r) => { (m[cellKey(r.section_id, r.subject_code)] ||= []).push(r); });
  return m;
}

/**
 * Auto-suggest: class teacher teaches own class first, then scarce subjects first,
 * qualified teachers first, same teacher across sibling sections, balanced load.
 * `keep` rows (e.g. cells the principal locked) are never changed.
 */
export function autoAllocate({ sections, teachers, subjects, scheme, keep = [] }) {
  const subByCode = Object.fromEntries(subjects.map((s) => [s.code, s]));
  const active = teachers.filter((t) => t.status !== 'inactive');
  const rows = [...keep];
  const load = loadsOf(rows);
  const kept = rowsByCell(keep);
  const done = new Set(Object.keys(kept));
  const teachesIn = {}; // teacher → set of `${grade}|${code}`
  const add = (sec, code, t, periods) => {
    rows.push({ id: `${sec.id}:${code}:${t.id}`, section_id: sec.id, subject_code: code, subject_id: subByCode[code].id, teacher_id: t.id, periods });
    load[t.id] = (load[t.id] || 0) + periods;
    (teachesIn[t.id] ||= new Set()).add(`${sec.grade}|${code}`);
    done.add(cellKey(sec.id, code));
  };
  const cells = demandCells(sections, scheme);
  // 1 — class teacher first in own class
  sections.forEach((sec) => {
    const ct = active.find((t) => t.id === sec.class_teacher_id);
    if (!ct) return;
    cells.filter((c) => c.section.id === sec.id && !done.has(cellKey(sec.id, c.code)) && fit(ct, c.code, sec) <= 1)
      .sort((a, b) => fit(ct, a.code, sec) - fit(ct, b.code, sec))
      .forEach((c) => { if ((load[ct.id] || 0) + c.periods <= maxLoad(ct)) add(sec, c.code, ct, c.periods); });
  });
  // 2 — remaining cells, scarcest first
  const remaining = cells.filter((c) => !done.has(cellKey(c.section.id, c.code)));
  const scarcity = (c) => active.filter((t) => fit(t, c.code, c.section) <= 1).length;
  remaining.sort((a, b) => scarcity(a) - scarcity(b) || (b.section.grade - a.section.grade) || b.periods - a.periods);
  remaining.forEach((c) => {
    const cands = active.map((t) => ({ t, f: fit(t, c.code, c.section) })).filter((x) => x.f <= 2);
    if (!cands.length) return; // stays unassigned → shows as a gap
    const score = ({ t, f }) => {
      const after = (load[t.id] || 0) + c.periods;
      const over = Math.max(0, after - maxLoad(t));
      const sibling = teachesIn[t.id]?.has(`${c.section.grade}|${c.code}`) ? -0.25 : 0;
      const away = !SPECIALIST.includes(c.code) && !(HOME_STAGES[t.designation] || []).includes(c.section.stage) ? 3 : 0;
      return over * 100 + f * 10 + away + (after / maxLoad(t)) + sibling;
    };
    cands.sort((a, b) => score(a) - score(b));
    add(c.section, c.code, cands[0].t, c.periods);
  });
  return rows;
}

/** Everything that is wrong or worth a second look. */
export function validate(rows, { sections, teachers, scheme }) {
  const issues = [];
  const tById = Object.fromEntries(teachers.map((t) => [t.id, t]));
  const byCell = rowsByCell(rows);
  const load = loadsOf(rows);
  demandCells(sections, scheme).forEach(({ section: sec, code, periods }) => {
    const list = byCell[cellKey(sec.id, code)] || [];
    const total = list.reduce((a, r) => a + r.periods, 0);
    if (!list.length) issues.push({ type: 'unassigned', severity: 'error', section_id: sec.id, code, text: `Class ${sec.name} ${code} has no teacher` });
    else if (total !== periods) issues.push({ type: 'mismatch', severity: 'error', section_id: sec.id, code, text: `Class ${sec.name} ${code}: ${total} of ${periods} periods allotted` });
    list.forEach((r) => {
      const t = tById[r.teacher_id]; if (!t) return;
      const f = fit(t, code, sec);
      if (f === 3) issues.push({ type: 'not-capable', severity: 'error', section_id: sec.id, code, teacher_id: t.id, text: `${shortName(t)} doesn’t teach ${code} (Class ${sec.name})` });
      else if (f === 2) issues.push({ type: 'qualification', severity: 'warn', section_id: sec.id, code, teacher_id: t.id, text: `${shortName(t)} (${t.designation}) teaching Class ${sec.name} ${code} — usually needs ${sec.stage === 'senior' ? 'a PGT' : sec.stage === 'pre' ? 'an NTT/PRT' : 'a TGT'}` });
    });
  });
  teachers.forEach((t) => {
    if ((load[t.id] || 0) > maxLoad(t)) issues.push({ type: 'overload', severity: 'warn', teacher_id: t.id, text: `${shortName(t)} has ${load[t.id]} periods (max ${maxLoad(t)})` });
  });
  const ctCount = {};
  sections.forEach((sec) => {
    if (!sec.class_teacher_id) { issues.push({ type: 'no-ct', severity: 'error', section_id: sec.id, text: `Class ${sec.name} has no class teacher` }); return; }
    ctCount[sec.class_teacher_id] = (ctCount[sec.class_teacher_id] || 0) + 1;
    if (!rows.some((r) => r.section_id === sec.id && r.teacher_id === sec.class_teacher_id)) issues.push({ type: 'ct-not-teaching', severity: 'warn', section_id: sec.id, teacher_id: sec.class_teacher_id, text: `Class teacher of ${sec.name} (${shortName(tById[sec.class_teacher_id])}) doesn’t teach that class` });
  });
  Object.entries(ctCount).forEach(([tid, n]) => { if (n > 1) issues.push({ type: 'ct-duplicate', severity: 'warn', teacher_id: tid, text: `${shortName(tById[tid])} is class teacher of ${n} sections` }); });
  return issues;
}

/** Need vs available, per subject. */
export function supplyDemand(rows, { sections, teachers, scheme, subjects }) {
  const load = loadsOf(rows);
  const byCode = {};
  demandCells(sections, scheme).forEach(({ code, periods }) => { const x = (byCode[code] ||= { code, demand: 0, sections: 0 }); x.demand += periods; x.sections += 1; });
  return Object.values(byCode).map((x) => {
    const main = teachers.filter((t) => t.status !== 'inactive' && t.subject_codes?.[0] === x.code);
    const capacity = main.reduce((a, t) => a + maxLoad(t), 0);
    const byMain = rows.filter((r) => r.subject_code === x.code && main.some((t) => t.id === r.teacher_id)).reduce((a, r) => a + r.periods, 0);
    const byOthers = rows.filter((r) => r.subject_code === x.code).reduce((a, r) => a + r.periods, 0) - byMain;
    const helpers = teachers.filter((t) => t.status !== 'inactive' && t.subject_codes?.slice(1).includes(x.code)).map((t) => ({ t, spare: maxLoad(t) - (load[t.id] || 0) }));
    return { ...x, name: subjects.find((s) => s.code === x.code)?.name, main, capacity, byMain, byOthers, gap: x.demand - capacity, helpers };
  }).sort((a, b) => b.gap - a.gap);
}

/** Room for a subject period. */
export function roomFor(code, sec, p) {
  if (code === 'CS') return 'Computer Lab';
  if (['PHY', 'CHE', 'BIO'].includes(code) || (code === 'SCI' && p > 5)) return 'Science Lab';
  if (code === 'PE') return 'Playground';
  if (code === 'MUS') return 'Music Room';
  if (code === 'ART') return 'Art Room';
  return sec.room;
}

/**
 * Builds the weekly timetable from the allocation: every allotted period is placed once,
 * a teacher is never in two rooms at the same time, and a subject is spread across the week.
 */
export function buildTimetable(sections, rows, periods, seed = 1) {
  let best = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = tryBuild(sections, rows, periods, seed + attempt);
    if (!best || res.clashes < best.clashes) best = res;
    if (!res.clashes) break;
  }
  return best.slots;
}

function tryBuild(sections, rows, periods, seed) {
  let a = seed * 2654435761 >>> 0;
  const rnd = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  const busy = new Set();
  const slots = [];
  let clashes = 0;
  const pool = {};
  sections.forEach((sec) => { pool[sec.id] = rows.filter((r) => r.section_id === sec.id).map((r) => ({ ...r, left: r.periods })); });
  for (let day = 1; day <= 6; day++) {
    const usedToday = {};
    sections.forEach((sec) => { usedToday[sec.id] = {}; });
    const maxP = 7;
    for (let p = 1; p <= maxP; p++) {
      const order = [...sections].sort(() => rnd() - 0.5);
      // sections with fewer options pick first
      order.sort((x, y) => pool[x.id].filter((t) => t.left).length - pool[y.id].filter((t) => t.left).length);
      order.forEach((sec) => {
        const perDay = sec.stage === 'pre' ? (day === 6 ? 3 : 5) : day === 6 ? 4 : 7;
        if (p > perDay) return;
        const daysLeft = 7 - day; // including today
        const cands = pool[sec.id].filter((t) => t.left > 0);
        if (!cands.length) return;
        const scoreOf = (t) => {
          const free = !busy.has(`${t.teacher_id}|${day}|${p}`);
          const used = usedToday[sec.id][t.subject_code] || 0;
          const urgency = t.left / daysLeft; // > 1 means it must repeat on some days
          return (free ? 0 : 1000) + used * (urgency > 1.2 ? 3 : 20) - urgency * 5 + rnd();
        };
        cands.sort((x, y) => scoreOf(x) - scoreOf(y));
        const pickT = cands[0];
        const key = `${pickT.teacher_id}|${day}|${p}`;
        if (busy.has(key)) clashes++;
        busy.add(key);
        pickT.left -= 1;
        usedToday[sec.id][pickT.subject_code] = (usedToday[sec.id][pickT.subject_code] || 0) + 1;
        const pr = periods[p - 1];
        slots.push({ id: `${sec.id}-d${day}p${p}`, section_id: sec.id, day, period: p, start_time: pr.start, end_time: pr.end, subject_id: pickT.subject_id, teacher_id: pickT.teacher_id, room: roomFor(pickT.subject_code, sec, p) });
      });
    }
  }
  clashes = repair(slots);
  slots.sort((x, y) => (x.section_id < y.section_id ? -1 : x.section_id > y.section_id ? 1 : x.day - y.day || x.period - y.period));
  return { slots, clashes };
}

/** Swap periods inside a section until no teacher is double-booked. */
function repair(slots) {
  const k = (s) => `${s.teacher_id}|${s.day}|${s.period}`;
  const count = {};
  slots.forEach((s) => { count[k(s)] = (count[k(s)] || 0) + 1; });
  const bySec = {};
  slots.forEach((s) => { (bySec[s.section_id] ||= []).push(s); });
  for (let round = 0; round < 4; round++) {
    let fixed = 0;
    slots.forEach((s) => {
      if (count[k(s)] <= 1) return;
      const o = bySec[s.section_id].find((x) => x !== s && x.teacher_id !== s.teacher_id
        && !count[`${s.teacher_id}|${x.day}|${x.period}`] && !count[`${x.teacher_id}|${s.day}|${s.period}`]);
      if (!o) return;
      count[k(s)]--; count[k(o)]--;
      [s.teacher_id, o.teacher_id] = [o.teacher_id, s.teacher_id];
      [s.subject_id, o.subject_id] = [o.subject_id, s.subject_id];
      [s.room, o.room] = [o.room, s.room];
      count[k(s)] = (count[k(s)] || 0) + 1; count[k(o)] = (count[k(o)] || 0) + 1;
      fixed++;
    });
    if (!fixed) break;
  }
  return Object.values(count).reduce((a, n) => a + Math.max(0, n - 1), 0);
}

/** Human-readable differences between two allocations. */
export function diffAllocations(prev, next, { sections, teachers }) {
  const sById = Object.fromEntries(sections.map((s) => [s.id, s]));
  const tById = Object.fromEntries(teachers.map((t) => [t.id, t]));
  const a = rowsByCell(prev); const b = rowsByCell(next);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const fmt = (list) => (list || []).map((r) => `${shortName(tById[r.teacher_id])} (${r.periods})`).join(' + ') || 'nobody';
  return keys.filter((k) => fmt(a[k]) !== fmt(b[k])).map((k) => {
    const [sid, code] = k.split('|');
    const before = new Set((a[k] || []).map((r) => r.teacher_id));
    const after = new Set((b[k] || []).map((r) => r.teacher_id));
    return { section_id: sid, code, section: sById[sid]?.name, from: fmt(a[k]), to: fmt(b[k]), teachersChanged: [...before].some((x) => !after.has(x)) || [...after].some((x) => !before.has(x)) };
  });
}

export { slotsPerWeek };
