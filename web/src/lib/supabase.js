// Minimal Supabase REST (PostgREST) client for read-only demo data.
// For production auth flows, swap in @supabase/supabase-js — the table names
// and column shapes stay the same.

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

const PAGE = 1000;

/** Fetch every row of `table` matching `filters` (PostgREST syntax), paging through results. */
export async function selectAll(table, filters = {}, select = '*') {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const qs = new URLSearchParams({ select, ...filters });
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${from}-${from + PAGE - 1}`,
        'Range-Unit': 'items',
      },
    });
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}
