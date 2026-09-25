// Miz School API (Node.js, zero dependencies — uses built-in http + fetch).
// Reads can go browser → Supabase directly under RLS. This service handles
// privileged workflows: writes that need validation, billing, imports, webhooks.
//
// Security rules (from the architecture spec):
//  - Never trust school_id / role sent by the client.
//  - The caller's Supabase JWT is verified, then membership is checked server-side.
//  - Sensitive writes create an audit_logs row.

import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';

// Minimal .env loader
if (existsSync(new URL('../.env', import.meta.url))) {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const PORT = Number(process.env.PORT || 4000);
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

const PLANS = {
  basic: { price_per_user: 60, gst_rate: 18, minimum_users: 200 },
  standard: { price_per_user: 100, gst_rate: 18, minimum_users: 300 },
  premium: { price_per_user: 140, gst_rate: 18, minimum_users: 500 },
};
const ATTENDANCE_STATUSES = new Set(['present', 'absent', 'late', 'leave', 'half_day', 'excused']);
const MARKING_ROLES = new Set(['school_admin', 'principal', 'teacher', 'scanner']);

// ── helpers ──
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 1e6) throw new HttpError(413, 'Payload too large'); }
  try { return raw ? JSON.parse(raw) : {}; } catch { throw new HttpError(400, 'Invalid JSON'); }
}

async function sb(path, { method = 'GET', body, headers = {} } = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new HttpError(503, 'Supabase service credentials are not configured');
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new HttpError(502, `Supabase ${r.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

/** Resolve the caller from their Supabase access token and return their roles in the given school. */
async function requireMember(req, schoolId, allowedRoles) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Missing access token');
  const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` } });
  if (!u.ok) throw new HttpError(401, 'Invalid or expired session');
  const user = await u.json();
  const rows = await sb(`/rest/v1/school_members?select=role_key&school_id=eq.${encodeURIComponent(schoolId)}&user_id=eq.${user.id}`);
  const roles = rows.map((r) => r.role_key);
  if (!roles.some((r) => allowedRoles.has(r))) throw new HttpError(403, 'Not permitted for this school');
  return { user, roles };
}

export function estimateBill({ users, plan = 'standard' }) {
  const p = PLANS[plan];
  if (!p) throw new HttpError(400, 'Unknown plan');
  const n = Number(users);
  if (!Number.isInteger(n) || n < 0) throw new HttpError(400, 'users must be a non-negative integer');
  const billable = Math.max(n, p.minimum_users);
  const subtotal = billable * p.price_per_user;
  const gst = Math.round(subtotal * p.gst_rate) / 100;
  return { plan, active_users: n, billable_users: billable, price_per_user: p.price_per_user, subtotal, gst_rate: p.gst_rate, gst, total: subtotal + gst };
}

// ── routes ──
const routes = [
  ['GET', /^\/api\/v1\/health$/, async () => ({ ok: true, service: 'miz-school-api', supabase: Boolean(SUPABASE_URL && SERVICE_KEY), time: new Date().toISOString() })],

  ['POST', /^\/api\/v1\/billing\/estimate$/, async (req) => estimateBill(await readJson(req))],

  ['GET', /^\/api\/v1\/schools\/([a-z0-9-]+)\/branding$/, async (_req, [slug]) => {
    const [s] = await sb(`/rest/v1/schools?select=id,slug,name,short_name,motto,academic_year,school_branding(*)&slug=eq.${slug}`);
    if (!s) throw new HttpError(404, 'School not found');
    return s;
  }],

  // Mark attendance for one section on one date (idempotent upsert + audit log)
  ['POST', /^\/api\/v1\/attendance$/, async (req) => {
    const body = await readJson(req);
    const { section_id, date, marks } = body;
    if (!section_id || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || typeof marks !== 'object') throw new HttpError(400, 'section_id, date (YYYY-MM-DD) and marks are required');
    // School is derived from the section on the server — never taken from the client.
    const [section] = await sb(`/rest/v1/sections?select=id,school_id&id=eq.${encodeURIComponent(section_id)}`);
    if (!section) throw new HttpError(404, 'Section not found');
    const { user } = await requireMember(req, section.school_id, MARKING_ROLES);
    const students = await sb(`/rest/v1/students?select=id&section_id=eq.${section.id}`);
    const valid = new Set(students.map((s) => s.id));
    const rows = Object.entries(marks).map(([student_id, status]) => {
      if (!valid.has(student_id)) throw new HttpError(400, `Student ${student_id} is not in this section`);
      if (!ATTENDANCE_STATUSES.has(status)) throw new HttpError(400, `Invalid status ${status}`);
      return { school_id: section.school_id, student_id, section_id: section.id, date, status, marked_by: user.id };
    });
    await sb('/rest/v1/attendance?on_conflict=student_id,date', { method: 'POST', body: rows, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
    await sb('/rest/v1/audit_logs', { method: 'POST', body: { school_id: section.school_id, user_id: user.id, action: 'attendance.mark', entity: 'section', entity_id: section.id, new_value: { date, count: rows.length } }, headers: { Prefer: 'return=minimal' } });
    return { saved: rows.length };
  }],
];

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, 'http://localhost');
  for (const [method, re, handler] of routes) {
    const m = url.pathname.match(re);
    if (m && req.method === method) {
      try { return send(res, 200, await handler(req, m.slice(1))); }
      catch (e) { return send(res, e.status || 500, { error: e.status ? e.message : 'Internal error' }); }
    }
  }
  send(res, 404, { error: 'Not found' });
});

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  server.listen(PORT, () => console.log(`Miz School API on http://localhost:${PORT}`));
}
export { server };
