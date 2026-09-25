# Miz School — Demo (React + Node.js + Supabase)

Multi-school smart school platform. One codebase, every school branded (crest, colours, name).

## Structure

```
miz-school/
├── web/        React (Vite) — landing, demo selector, branded login, 11 role portals
├── server/     Node.js API (zero dependencies) — attendance writes, billing, branding
└── supabase/
    └── migrations/
        ├── 0001_schema.sql     tables + Row Level Security (tenant isolation)
        └── 0002_demo_seed.sql  3 demo schools, 660 students, attendance, fees, marks…
```

## Run locally

```bash
# 1. Web app
cd web
cp .env.example .env        # paste VITE_SUPABASE_ANON_KEY (Supabase → Settings → API)
npm install
npm run dev                 # http://localhost:5173

# 2. API (optional for the demo)
cd ../server
cp .env.example .env        # paste SUPABASE_SERVICE_ROLE_KEY (server only!)
npm run dev                 # http://localhost:4000/api/v1/health
```

Without an anon key the web app runs on built-in demo data (same shapes as the database).
With the key it reads live from Supabase — the profile menu shows "Data source".

## Supabase

Both migrations have already been run on project `prdidvoyzcgbbtbcrqsk`. To reset demo data,
re-run `0002_demo_seed.sql` in the SQL editor (it deletes and recreates only `is_demo` schools).

RLS rules:
- anyone can **read** rows of demo schools (`is_demo = true`)
- signed-in users read only schools they belong to (`school_members`)
- all writes go through the Node API with the service role — never from the browser

## Roles in the demo

School Admin · Principal · Teacher · Parent (2 children) · Student · Driver · Reception ·
Warden · Canteen · Gate Scanner · Miz Super Admin

## Demo schools

| Slug | School | Theme |
|---|---|---|
| aravali | Aravali Heights Senior Secondary School, Jaipur | Blue / navy / gold |
| crestview | Crestview Convent School, Lucknow | Steel blue / navy / maroon |
| mizdemo | Miz Demo Public School, Jaipur | Royal blue / navy / amber |

Brand colours live in `school_branding`; the crest is generated from initials until a school
uploads its approved logo (`logo_url`).
