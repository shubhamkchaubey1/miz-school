import { DEMO_SCHOOLS, findSchool } from './schools.js';
import { generateSchoolData } from './generate.js';
import { selectAll, supabaseEnabled } from '../lib/supabase.js';

const TABLES = [
  'subjects', 'teachers', 'sections', 'students', 'attendance', 'timetable_slots', 'homework', 'exams', 'marks',
  'fee_invoices', 'notices', 'notifications', 'school_events', 'vehicles', 'routes', 'route_stops', 'hostels', 'rooms',
  'canteen_items', 'canteen_sales', 'admission_enquiries', 'visitors', 'phone_logs', 'postal_items', 'complaints', 'leave_requests',
];

export const PLANS = [
  { id: 'basic', name: 'Basic', price_per_user: 60, gst_rate: 18, minimum_users: 200, features: ['Attendance', 'Timetable', 'Homework', 'Notices', 'Fees'] },
  { id: 'standard', name: 'Standard', price_per_user: 100, gst_rate: 18, minimum_users: 300, features: ['Everything in Basic', 'Exams & results', 'Transport', 'Reception desk', 'Parent & student apps'] },
  { id: 'premium', name: 'Premium', price_per_user: 140, gst_rate: 18, minimum_users: 500, features: ['Everything in Standard', 'Hostel & canteen', 'Payroll', 'Custom domain', 'Priority support'] },
];

// Platform view (Super Admin) — demo tenants + a few illustrative pipeline tenants.
export const PLATFORM_TENANTS = [
  { slug: 'aravali', plan_id: 'standard', status: 'ACTIVE', billable_users: 1600, renews_in: 5 },
  { slug: 'crestview', plan_id: 'premium', status: 'ACTIVE', billable_users: 2210, renews_in: 12 },
  { slug: 'mizdemo', plan_id: 'basic', status: 'TRIAL', billable_users: 480, renews_in: 21 },
  { name: 'Shri Ram Vidya Niketan', city: 'Kota', plan_id: 'standard', status: 'ACTIVE', billable_users: 1340, renews_in: 3 },
  { name: 'Holy Cross Convent', city: 'Ajmer', plan_id: 'standard', status: 'PAST_DUE', billable_users: 960, renews_in: -4 },
  { name: 'Green Valley Academy', city: 'Udaipur', plan_id: 'basic', status: 'ACTIVE', billable_users: 620, renews_in: 17 },
  { name: 'Delhi Heritage School', city: 'Gurugram', plan_id: 'premium', status: 'ACTIVE', billable_users: 3120, renews_in: 9 },
  { name: 'Mount Carmel School', city: 'Bhopal', plan_id: 'standard', status: 'TRIAL', billable_users: 1100, renews_in: 11 },
];

export async function listSchools() {
  if (!supabaseEnabled) return DEMO_SCHOOLS;
  try {
    const [schools, branding] = await Promise.all([
      selectAll('schools', { is_demo: 'eq.true', order: 'slug' }),
      selectAll('school_branding'),
    ]);
    return schools.map((s) => ({ ...findSchool(s.slug), ...s, ...branding.find((b) => b.school_id === s.id) }));
  } catch (e) {
    console.warn('[miz] Supabase unavailable, using local demo data', e);
    return DEMO_SCHOOLS;
  }
}

function withMeta(data, source) {
  const s8a = data.sections.find((s) => s.name === '8A');
  const kidA = data.students.find((s) => s.section_id === s8a.id && s.roll_no === 3) || data.students[0];
  const siblings = data.students.filter((s) => s.guardian_phone === kidA.guardian_phone).sort((a) => (a.id === kidA.id ? -1 : 1));
  data.meta = { demoStudentId: kidA.id, demoParentStudentIds: siblings.map((s) => s.id), source };
  const order = Object.fromEntries(data.sections.map((s, i) => [s.id, i]));
  data.students.sort((a, b) => order[a.section_id] - order[b.section_id] || a.roll_no - b.roll_no);
  return data;
}

// Demo speed: data is built in the browser instantly (no network wait).
// Set VITE_LIVE_DATA=true to read every table from Supabase instead.
const LIVE = import.meta.env.VITE_LIVE_DATA === 'true';
const cache = {};

export function loadSchoolData(slug) {
  if (!cache[slug]) cache[slug] = fetchSchoolData(slug).catch((e) => { delete cache[slug]; throw e; });
  return cache[slug];
}

/** Synchronous local build — lets the first screen render with zero loading time. */
export function localSchoolData(slug) {
  const local = findSchool(slug) || DEMO_SCHOOLS[0];
  if (!cache[`local:${slug}`]) cache[`local:${slug}`] = withMeta(generateSchoolData(local), 'local');
  return cache[`local:${slug}`];
}

async function fetchSchoolData(slug) {
  const local = findSchool(slug) || DEMO_SCHOOLS[0];
  if (!LIVE) return localSchoolData(slug);
  if (supabaseEnabled) {
    try {
      const [school] = await selectAll('schools', { slug: `eq.${slug}` });
      if (school) {
        const [branding] = await selectAll('school_branding', { school_id: `eq.${school.id}` });
        const results = await Promise.all(TABLES.map((t) => selectAll(t, { school_id: `eq.${school.id}` })));
        const data = { school: { ...local, ...school, ...branding } };
        TABLES.forEach((t, i) => { data[t] = results[i]; });
        data.subjects.sort((a, b) => a.code.localeCompare(b.code));
        data.sections.sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section));
        data.teachers.sort((a, b) => a.employee_code.localeCompare(b.employee_code));
        data.route_stops.sort((a, b) => a.seq - b.seq);
        data.routes.sort((a, b) => a.code.localeCompare(b.code));
        data.notices.sort((a, b) => b.published_at.localeCompare(a.published_at));
        data.notifications.sort((a, b) => b.created_at.localeCompare(a.created_at));
        return withMeta(data, 'supabase');
      }
    } catch (e) {
      console.warn('[miz] Supabase load failed, falling back to local demo data', e);
    }
  }
  return withMeta(generateSchoolData(local), 'local');
}
