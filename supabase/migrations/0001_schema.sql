-- Miz School — core multi-tenant schema (demo foundation)
set client_min_messages = warning;
-- Every tenant-owned table carries school_id. RLS is enabled on all tables.

create extension if not exists pgcrypto;

-- ───────────────────────── Platform ─────────────────────────
create table if not exists plans (
  id text primary key,
  name text not null,
  price_per_user numeric(10,2) not null,
  gst_rate numeric(5,2) not null default 18,
  minimum_users int not null default 100,
  features jsonb not null default '[]'
);

create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_name text,
  motto text,
  city text, state text, board text, affiliation_no text,
  established int,
  phone text, email text, website text, address text,
  academic_year text,
  principal_name text,
  is_demo boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists school_branding (
  school_id uuid primary key references schools(id) on delete cascade,
  primary_color text not null default '#1457A6',
  secondary_color text not null default '#0B2345',
  accent_color text not null default '#C8962E',
  crest_initials text,
  logo_url text, favicon_url text, cover_image_url text,
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  plan_id text not null references plans(id),
  status text not null default 'TRIAL', -- TRIAL | ACTIVE | PAST_DUE | SUSPENDED | CANCELLED | EXPIRED
  billable_users int not null default 0,
  started_on date not null default current_date,
  renews_on date
);

-- Membership: which auth user holds which role in which school
create table if not exists school_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_key text not null, -- school_admin | principal | teacher | parent | student | driver | reception | warden | canteen | scanner
  created_at timestamptz not null default now(),
  unique (school_id, user_id, role_key)
);

create table if not exists permissions (key text primary key, module text not null, description text);
create table if not exists role_permissions (role_key text not null, permission_key text not null references permissions(key), primary key (role_key, permission_key));

-- ───────────────────────── Academic ─────────────────────────
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  code text not null, name text not null
);

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  employee_code text not null, full_name text not null, gender text,
  subject_id uuid references subjects(id), designation text,
  phone text, email text, joined_on date, status text default 'active'
);

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  grade int not null, section text not null, name text not null,
  class_teacher_id uuid references teachers(id), room text
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  reg_no text not null, model text, capacity int, fitness_valid_till date
);
create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  code text not null, name text not null, vehicle_id uuid references vehicles(id),
  driver_name text, driver_phone text, attendant_name text, departs_at text, status text default 'scheduled'
);
create table if not exists route_stops (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  route_id uuid not null references routes(id) on delete cascade,
  seq int not null, name text not null, eta text
);

create table if not exists hostels (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null, type text, warden_name text, capacity int
);
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  hostel_id uuid not null references hostels(id) on delete cascade,
  room_no text not null, floor int, room_type text, capacity int, occupied int default 0, status text default 'active'
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  admission_no text not null, roll_no int, full_name text not null, gender text, dob date,
  section_id uuid references sections(id),
  guardian_name text, guardian_phone text, guardian_email text, blood_group text, address text,
  route_id uuid references routes(id), stop_id uuid references route_stops(id),
  hostel_room_id uuid references rooms(id),
  status text default 'active',
  unique (school_id, admission_no)
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  section_id uuid references sections(id),
  date date not null,
  status text not null check (status in ('present','absent','late','leave','half_day','excused')),
  marked_by uuid, created_at timestamptz default now(),
  unique (student_id, date)
);

create table if not exists timetable_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  section_id uuid not null references sections(id) on delete cascade,
  day int not null, period int not null, start_time text, end_time text,
  subject_id uuid references subjects(id), teacher_id uuid references teachers(id), room text
);

create table if not exists homework (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  section_id uuid references sections(id), subject_id uuid references subjects(id), teacher_id uuid references teachers(id),
  title text not null, details text, assigned_on date, due_on date
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null, term text, starts_on date, ends_on date, status text default 'scheduled'
);
create table if not exists marks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  subject_id uuid not null references subjects(id),
  max_marks int not null, marks_obtained numeric(5,1)
);

-- ───────────────────────── Finance ─────────────────────────
create table if not exists fee_invoices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  invoice_no text not null, title text not null, amount numeric(12,2) not null,
  due_on date, status text not null default 'upcoming', -- upcoming | due | overdue | paid
  paid_on date, method text, receipt_no text
);

-- ───────────────────────── Communication ─────────────────────────
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  title text not null, body text, audience text, category text, priority text default 'normal',
  published_at timestamptz default now(), author text
);
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  audience text not null default 'all', title text not null, body text, kind text,
  created_at timestamptz default now()
);
create table if not exists school_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  title text not null, date date, time text, venue text
);
create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  requester text, requester_type text, section_id uuid references sections(id),
  from_date date, to_date date, reason text, status text default 'pending'
);

-- ───────────────────────── Operations ─────────────────────────
create table if not exists admission_enquiries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  student_name text, parent_name text, phone text, grade text, source text, status text default 'new',
  created_at timestamptz default now(), follow_up_on date
);
create table if not exists visitors (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text, phone text, purpose text, host text, check_in timestamptz default now(), check_out timestamptz,
  badge_no text, status text default 'inside'
);
create table if not exists phone_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  caller text, phone text, purpose text, call_type text, created_at timestamptz default now(), notes text
);
create table if not exists postal_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  direction text, ref_no text, party text, courier text, created_at timestamptz default now(), status text
);
create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  raised_by text, category text, subject text, status text default 'open', created_at timestamptz default now()
);
create table if not exists canteen_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null, category text, price numeric(8,2), stock int, unit text, is_veg boolean default true
);
create table if not exists canteen_sales (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  bill_no text, customer text, items_count int, total numeric(10,2), method text, created_at timestamptz default now()
);

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  school_id uuid references schools(id) on delete cascade,
  user_id uuid, action text not null, entity text, entity_id text,
  old_value jsonb, new_value jsonb, created_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_students_school on students(school_id, section_id);
create index if not exists idx_attendance_school_date on attendance(school_id, date);
create index if not exists idx_marks_school on marks(school_id, exam_id);
create index if not exists idx_fee_school on fee_invoices(school_id, status);
create index if not exists idx_tt_school on timetable_slots(school_id, section_id);

-- ───────────────────────── Row Level Security ─────────────────────────
-- 1) Members of a school can read their school's rows (production path).
-- 2) Anyone can READ rows of schools flagged is_demo (sales demo path).
-- Writes go through the Node API with the service role — never from the browser.

create or replace function public.is_school_member(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from school_members m where m.school_id = sid and m.user_id = auth.uid());
$$;

create or replace function public.is_demo_school(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from schools s where s.id = sid and s.is_demo);
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'school_branding','subscriptions','subjects','teachers','sections','vehicles','routes','route_stops',
    'hostels','rooms','students','attendance','timetable_slots','homework','exams','marks','fee_invoices',
    'notices','notifications','school_events','leave_requests','admission_enquiries','visitors','phone_logs',
    'postal_items','complaints','canteen_items','canteen_sales','audit_logs'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "%s_member_read" on %I', t, t);
    execute format('create policy "%s_member_read" on %I for select to authenticated using (public.is_school_member(school_id))', t, t);
    execute format('drop policy if exists "%s_demo_read" on %I', t, t);
    execute format('create policy "%s_demo_read" on %I for select to anon, authenticated using (public.is_demo_school(school_id))', t, t);
  end loop;
end $$;

alter table schools enable row level security;
drop policy if exists schools_read on schools;
create policy schools_read on schools for select to anon, authenticated using (is_demo or public.is_school_member(id));

alter table plans enable row level security;
drop policy if exists plans_read on plans;
create policy plans_read on plans for select to anon, authenticated using (true);

alter table school_members enable row level security;
drop policy if exists members_self on school_members;
create policy members_self on school_members for select to authenticated using (user_id = auth.uid());

alter table permissions enable row level security;
alter table role_permissions enable row level security;
drop policy if exists permissions_read on permissions;
create policy permissions_read on permissions for select to anon, authenticated using (true);
drop policy if exists role_permissions_read on role_permissions;
create policy role_permissions_read on role_permissions for select to anon, authenticated using (true);
