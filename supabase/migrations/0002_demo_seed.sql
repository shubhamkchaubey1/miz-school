-- Miz School — demo tenants + realistic sample data.
-- Safe to re-run: demo schools are deleted (cascade) and recreated.

insert into plans (id, name, price_per_user, gst_rate, minimum_users, features) values
  ('basic', 'Basic', 60, 18, 200, '["attendance","timetable","homework","notices","fees"]'),
  ('standard', 'Standard', 100, 18, 300, '["attendance","timetable","homework","notices","fees","results","transport","reception"]'),
  ('premium', 'Premium', 140, 18, 500, '["all_modules","hostel","canteen","payroll","priority_support"]')
on conflict (id) do update set name = excluded.name, price_per_user = excluded.price_per_user;

insert into permissions (key, module, description) values
  ('student.read','students','View students'), ('student.create','students','Add students'), ('student.update','students','Edit students'),
  ('attendance.read','attendance','View attendance'), ('attendance.mark','attendance','Mark attendance'), ('attendance.correct','attendance','Correct attendance'),
  ('timetable.read','timetable','View timetable'), ('timetable.manage','timetable','Edit timetable'),
  ('homework.read','homework','View homework'), ('homework.create','homework','Assign homework'),
  ('results.read','results','View results'), ('results.create','results','Enter marks'), ('results.publish','results','Publish results'),
  ('fees.read','fees','View fees'), ('fees.collect','fees','Collect fees'), ('fees.refund','fees','Refund fees'),
  ('notices.read','communication','Read notices'), ('notices.create','communication','Publish notices'),
  ('transport.read','transport','View transport'), ('transport.trip.manage','transport','Run trips'), ('transport.route.manage','transport','Manage routes'),
  ('reception.manage','reception','Reception desk'), ('hostel.manage','hostel','Hostel management'), ('canteen.manage','canteen','Canteen management'),
  ('scanner.scan','scanner','Gate scanning'), ('school.settings','settings','School settings & branding'), ('payroll.manage','payroll','Payroll')
on conflict (key) do nothing;

delete from role_permissions;
insert into role_permissions (role_key, permission_key)
select 'school_admin', key from permissions
union all select 'principal', key from permissions where key not in ('payroll.manage','fees.refund')
union all select 'teacher', unnest(array['student.read','attendance.read','attendance.mark','timetable.read','homework.read','homework.create','results.read','results.create','notices.read'])
union all select 'parent', unnest(array['attendance.read','timetable.read','homework.read','results.read','fees.read','notices.read','transport.read'])
union all select 'student', unnest(array['attendance.read','timetable.read','homework.read','results.read','notices.read'])
union all select 'driver', unnest(array['transport.read','transport.trip.manage','notices.read'])
union all select 'reception', unnest(array['reception.manage','student.read','notices.read'])
union all select 'warden', unnest(array['hostel.manage','student.read','notices.read'])
union all select 'canteen', unnest(array['canteen.manage','notices.read'])
union all select 'scanner', unnest(array['scanner.scan','attendance.mark']);

create or replace function public.seed_demo_school(p_id uuid, p_seed int) returns void
language plpgsql security definer set search_path = public as $$
declare
  fm text[] := array['Aarav','Vivaan','Aditya','Arjun','Reyansh','Kabir','Ishaan','Rohan','Dhruv','Krish','Aryan','Yash','Pranav','Siddharth','Nikhil','Rudra','Ayaan','Kunal','Harsh','Manav','Om','Tanmay','Veer','Rahul'];
  ff text[] := array['Ananya','Diya','Aadhya','Saanvi','Anika','Myra','Ira','Kiara','Riya','Navya','Meera','Tara','Sara','Aditi','Kavya','Pari','Nisha','Ishita','Prisha','Shreya','Avni','Jiya','Mahi','Tanvi'];
  ln text[] := array['Sharma','Verma','Gupta','Agarwal','Singh','Mehta','Jain','Kapoor','Chauhan','Rathore','Joshi','Saxena','Mathur','Khandelwal','Srivastava','Mishra','Pandey','Bansal','Goyal','Shekhawat','Nair','Das','Iyer','Malhotra'];
  pm text[] := array['Rajesh','Sanjay','Amit','Vikas','Manoj','Suresh','Deepak','Rakesh','Anil','Vinod','Ashok','Pankaj'];
  pf text[] := array['Sunita','Pooja','Neha','Kavita','Rekha','Anjali','Priya','Seema','Nidhi','Ritu','Shalini','Monika'];
  areas text[] := array['Vaishali Nagar','Amrapali Circle','Queens Road','Khatipura','Jhotwara','Gandhi Path',
                        'Malviya Nagar','GT Mall','Jawahar Circle','Durgapura','Tonk Road','Sanganer',
                        'Mansarovar','VT Road','Shipra Path','Madhyam Marg','Metro Mall','Rajat Path',
                        'Raja Park','Adarsh Nagar','Moti Doongri','Janta Colony','Jawahar Nagar','Transport Nagar',
                        'Bani Park','Collectorate','Sindhi Camp','MI Road','Ajmeri Gate','Chandpole',
                        'C-Scheme','Ashok Nagar','Statue Circle','Civil Lines','Sahakar Marg','Lalkothi'];
  s record; sch record; g int; sec text; i int; k int; d int; p int; v uuid; rt uuid; tid uuid;
  subj_ids uuid[]; subj_codes text[] := array['ENG','HIN','MAT','SCI','SST','CS','SAN','PE'];
  subj_names text[] := array['English','Hindi','Mathematics','Science','Social Science','Computer Science','Sanskrit','Physical Education'];
  t_subj int[] := array[1,1,2,2,3,3,3,4,4,4,5,5,6,7,8,3,4,1];
  teacher_ids uuid[] := '{}'; sec_ids uuid[] := '{}'; route_ids uuid[] := '{}';
  female boolean; fname text; lname text; adm int; pre text;
  starts text[] := array['08:00','08:45','09:30','10:35','11:20','12:45','13:30'];
  ends   text[] := array['08:45','09:30','10:15','11:20','12:05','13:30','14:15'];
  tuition int; kid_a uuid; kid_b uuid; room_ids uuid[];
begin
  perform setseed(p_seed / 100.0);
  select * into sch from schools where id = p_id;
  pre := upper(left(sch.slug, 3));

  -- subjects
  for i in 1..8 loop
    insert into subjects (school_id, code, name) values (p_id, subj_codes[i], subj_names[i]) returning id into v;
    subj_ids := subj_ids || v;
  end loop;

  -- teachers
  for i in 1..18 loop
    female := random() > 0.4;
    fname := case when female then pf[1 + floor(random()*12)::int] else pm[1 + floor(random()*12)::int] end;
    lname := ln[1 + floor(random()*24)::int];
    insert into teachers (school_id, employee_code, full_name, gender, subject_id, designation, phone, email, joined_on)
    values (p_id, pre || '-T' || lpad(i::text, 3, '0'),
            (case when female then (array['Ms.','Mrs.'])[1 + floor(random()*2)::int] else 'Mr.' end) || ' ' || fname || ' ' || lname,
            case when female then 'F' else 'M' end, subj_ids[t_subj[i]],
            case when i <= 4 then 'PGT' when i <= 12 then 'TGT' else 'PRT' end,
            '+91 9' || (100000000 + floor(random()*899999999))::bigint,
            lower(fname) || '.' || lower(lname) || '@' || sch.slug || '.demo.mizschool.app',
            make_date(2008 + floor(random()*17)::int, 1 + floor(random()*12)::int, 1))
    returning id into v;
    teacher_ids := teacher_ids || v;
  end loop;

  -- sections 6A..10B
  i := 0;
  for g in 6..10 loop
    foreach sec in array array['A','B'] loop
      i := i + 1;
      insert into sections (school_id, grade, section, name, class_teacher_id, room)
      values (p_id, g, sec, g || sec, teacher_ids[i], (case when g < 9 then 'Block A · ' else 'Block B · ' end) || g || '0' || (case when sec = 'A' then 1 else 2 end))
      returning id into v;
      sec_ids := sec_ids || v;
    end loop;
  end loop;

  -- transport
  for i in 1..6 loop
    insert into vehicles (school_id, reg_no, model, capacity, fitness_valid_till)
    values (p_id, 'RJ14 PA ' || (1000 + floor(random()*8999))::int, case when i % 2 = 0 then 'Tata Starbus 40' else 'Ashok Leyland Lynx 32' end,
            case when i % 2 = 0 then 40 else 32 end, current_date + (40 + floor(random()*260))::int)
    returning id into v;
    insert into routes (school_id, code, name, vehicle_id, driver_name, driver_phone, attendant_name, departs_at, status)
    values (p_id, 'R-' || lpad(i::text, 2, '0'), areas[(i-1)*6 + 1] || ' – School', v,
            pm[1 + floor(random()*12)::int] || ' ' || (array['Singh','Yadav','Meena','Gurjar','Khan'])[1 + floor(random()*5)::int],
            '+91 9' || (100000000 + floor(random()*899999999))::bigint, pf[1 + floor(random()*12)::int] || ' ' || ln[1 + floor(random()*24)::int],
            '07:' || lpad((5 + 5*floor(random()*4))::int::text, 2, '0'),
            case when i = 1 then 'scheduled' else (array['completed','in_progress','scheduled'])[1 + floor(random()*3)::int] end)
    returning id into rt;
    route_ids := route_ids || rt;
    for k in 1..6 loop
      insert into route_stops (school_id, route_id, seq, name, eta) values (p_id, rt, k, areas[(i-1)*6 + k], '07:' || lpad(((5 + (k-1)*8) % 60)::text, 2, '0'));
    end loop;
    insert into route_stops (school_id, route_id, seq, name, eta) values (p_id, rt, 7, 'School Main Gate', '07:55');
  end loop;

  -- hostels & rooms
  insert into hostels (school_id, name, type, warden_name, capacity) values
    (p_id, 'Tagore House (Boys)', 'Boys', 'Mr. Harish Rawat', 96), (p_id, 'Sarojini House (Girls)', 'Girls', 'Mrs. Leela Menon', 72);
  insert into rooms (school_id, hostel_id, room_no, floor, room_type, capacity, occupied, status)
  select p_id, h.id, (case when h.type = 'Boys' then 'B-' else 'G-' end) || (kk/8 + 1) || lpad((kk % 8 + 1)::text, 2, '0'), kk/8 + 1,
         case when kk % 6 = 0 then 'Double' else 'Quad' end, case when kk % 6 = 0 then 2 else 4 end,
         case when kk = 7 then 0 else greatest(0, (case when kk % 6 = 0 then 2 else 4 end) - floor(random()*3)::int) end,
         case when kk = 7 then 'maintenance' else 'active' end
  from hostels h cross join generate_series(0, 23) gs(kk)
  where h.school_id = p_id and (h.type = 'Boys' or kk < 18);

  -- students (22 per section)
  adm := 4100 + p_seed * 10;
  for i in 1..array_length(sec_ids, 1) loop
    select * into s from sections where id = sec_ids[i];
    for k in 1..22 loop
      female := random() > 0.5;
      lname := ln[1 + floor(random()*24)::int];
      fname := case when female then ff[1 + floor(random()*24)::int] else fm[1 + floor(random()*24)::int] end;
      rt := case when random() > 0.45 then route_ids[1 + floor(random()*6)::int] else null end;
      insert into students (school_id, admission_no, full_name, gender, dob, section_id, guardian_name, guardian_phone, guardian_email, blood_group, address, route_id, stop_id)
      values (p_id, pre || '/' || (2026 - (s.grade - 6)) || '/' || adm, fname || ' ' || lname, case when female then 'F' else 'M' end,
              make_date(2026 - s.grade - 6, 1 + floor(random()*12)::int, 1 + floor(random()*28)::int), s.id,
              (case when random() > 0.3 then 'Mr. ' || pm[1 + floor(random()*12)::int] else 'Mrs. ' || pf[1 + floor(random()*12)::int] end) || ' ' || lname,
              '+91 9' || (100000000 + floor(random()*899999999))::bigint, lower(lname) || (10 + floor(random()*89))::int || '@gmail.com',
              (array['A+','B+','O+','AB+','O-','B-'])[1 + floor(random()*6)::int],
              (1 + floor(random()*240))::int || ', ' || areas[1 + floor(random()*36)::int] || ', ' || sch.city,
              rt, (select id from route_stops where route_id = rt and seq = 1 + floor(random()*6)::int limit 1));
      adm := adm + 1;
    end loop;
  end loop;
  update students st set roll_no = x.rn
  from (select id, row_number() over (partition by section_id order by full_name) rn from students where school_id = p_id) x
  where st.id = x.id;

  -- hostellers (10A boys/girls, 9B)
  update students st set hostel_room_id = (
      select r.id from rooms r join hostels h on h.id = r.hostel_id
      where r.school_id = p_id and r.status = 'active' and h.type = case when st.gender = 'M' then 'Boys' else 'Girls' end
      order by r.room_no offset (st.roll_no % 10) limit 1)
  where st.school_id = p_id and st.section_id in (select id from sections where school_id = p_id and name in ('10A','9B')) and st.roll_no <= 13;

  -- demo family: 8A roll 3 + a sibling in 6B roll 5 share one guardian
  select st.id into kid_a from students st join sections se on se.id = st.section_id where st.school_id = p_id and se.name = '8A' and st.roll_no = 3;
  select st.id into kid_b from students st join sections se on se.id = st.section_id where st.school_id = p_id and se.name = '6B' and st.roll_no = 5;
  update students b set full_name = (case when b.gender = 'F' then 'Saanvi ' else 'Reyansh ' end) || split_part(a.full_name, ' ', 2),
         guardian_name = a.guardian_name, guardian_phone = a.guardian_phone, guardian_email = a.guardian_email,
         route_id = route_ids[1], stop_id = (select id from route_stops where route_id = route_ids[1] and seq = 3)
  from students a where a.id = kid_a and b.id = kid_b;
  update students set route_id = route_ids[1], stop_id = (select id from route_stops where route_id = route_ids[1] and seq = 3) where id = kid_a;

  -- attendance: last 24 school days (Mon–Sat)
  insert into attendance (school_id, student_id, section_id, date, status)
  select p_id, st.id, st.section_id, dd::date,
         case when st.id = kid_a and dd::date = (select max(x) from generate_series(current_date - 40, current_date, interval '1 day') x where extract(dow from x) <> 0) then 'present'
              when rnd < 0.9 then 'present' when rnd < 0.93 then 'late' when rnd < 0.95 then 'leave' else 'absent' end
  from students st
  cross join lateral (select x as dd from generate_series(current_date - 40, current_date, interval '1 day') x where extract(dow from x) <> 0 order by x desc limit 24) days
  cross join lateral (select random() + 0 * extract(epoch from dd) as rnd) r
  where st.school_id = p_id;

  -- timetable (Mon–Fri 7 periods, Sat 4)
  for i in 1..array_length(sec_ids, 1) loop
    for d in 1..6 loop
      for p in 1..(case when d = 6 then 4 else 7 end) loop
        k := ((i - 1) + d*3 + p) % 8 + 1;
        select t.id into tid from teachers t where t.school_id = p_id and t.subject_id = subj_ids[k] order by t.employee_code offset ((i + p) % (select count(*) from teachers where school_id = p_id and subject_id = subj_ids[k])) limit 1;
        insert into timetable_slots (school_id, section_id, day, period, start_time, end_time, subject_id, teacher_id, room)
        values (p_id, sec_ids[i], d, p, starts[p], ends[p], subj_ids[k], tid,
                case subj_codes[k] when 'CS' then 'Computer Lab' when 'PE' then 'Playground' else (select room from sections where id = sec_ids[i]) end);
      end loop;
    end loop;
  end loop;

  -- homework (6 per section)
  insert into homework (school_id, section_id, subject_id, teacher_id, title, details, assigned_on, due_on)
  select p_id, se.id, subj_ids[((n*3 + se.grade) % 6) + 1],
         (select id from teachers where school_id = p_id and subject_id = subj_ids[((n*3 + se.grade) % 6) + 1] order by employee_code limit 1),
         (array['Read Chapter 5 and answer Q1–Q6','पाठ 6 के प्रश्न-उत्तर लिखिए','Exercise 7.2 — Q1 to Q12','Draw and label the human heart','Map work: Rivers of India','Flowchart: largest of three numbers'])[((n*3 + se.grade) % 6) + 1],
         'Submit in the class notebook. Neat handwriting and diagrams where needed.',
         current_date - (n % 5), current_date - (n % 5) + 2 + (n % 3)
  from sections se cross join generate_series(0, 5) n where se.school_id = p_id;

  -- exams & marks
  insert into exams (school_id, name, term, starts_on, ends_on, status) values
    (p_id, 'Periodic Test 1', 'Term 1', current_date - 70, current_date - 64, 'published'),
    (p_id, 'Half Yearly Examination', 'Term 1', current_date - 21, current_date - 10, 'published'),
    (p_id, 'Periodic Test 2', 'Term 2', current_date + 24, current_date + 30, 'scheduled');
  insert into marks (school_id, exam_id, student_id, subject_id, max_marks, marks_obtained)
  select p_id, e.id, st.id, sub.id, case when e.name = 'Periodic Test 1' then 40 else 80 end,
         round((case when e.name = 'Periodic Test 1' then 40 else 80 end) * least(1, greatest(0.2, ab.v + (random() - 0.5) * 0.25)))
  from students st
  cross join lateral (select 0.5 + random() * 0.45 + 0 * length(st.full_name) as v) ab
  cross join exams e
  cross join subjects sub
  where st.school_id = p_id and e.school_id = p_id and e.status = 'published' and sub.school_id = p_id and sub.code in ('ENG','HIN','MAT','SCI','SST','CS');

  -- fees
  insert into fee_invoices (school_id, student_id, invoice_no, title, amount, due_on, status, paid_on, method, receipt_no)
  select p_id, st.id, 'INV/' || pre || '/' || lpad((row_number() over ())::text, 5, '0'), f.title,
         case when f.kind = 'T' then (case when se.grade <= 7 then 14500 when se.grade = 8 then 15800 else 17200 end) when f.kind = 'B' then 9600 else 42000 end,
         f.due, x.status,
         case when x.status = 'paid' then least(current_date, f.due + (floor(random()*52)::int - 12)) end,
         case when x.status = 'paid' then (array['UPI','UPI','Net Banking','Card','Cash','Cheque'])[1 + floor(random()*6)::int] end,
         case when x.status = 'paid' then 'RCPT-' || (50000 + floor(random()*40000))::int end
  from students st join sections se on se.id = st.section_id
  cross join lateral (values
      ('Tuition Fee — Q1 (Apr–Jun)', make_date(extract(year from current_date)::int, 4, 15), 'T', 1),
      ('Tuition Fee — Q2 (Jul–Sep)', make_date(extract(year from current_date)::int, 7, 15), 'T', 2),
      ('Tuition Fee — Q3 (Oct–Dec)', make_date(extract(year from current_date)::int, 10, 15), 'T', 3),
      ('Transport Fee — Term 1', make_date(extract(year from current_date)::int, 7, 15), 'B', 4),
      ('Hostel Fee — Term 1', make_date(extract(year from current_date)::int, 7, 15), 'H', 5)
  ) f(title, due, kind, q)
  cross join lateral (select case
      when f.q = 1 then 'paid'
      when st.id = kid_a and f.q = 2 then 'overdue'
      when f.due < current_date then (case when random() > 0.16 then 'paid' else 'overdue' end)
      when f.due - 30 < current_date then 'due' else 'upcoming' end as status) x
  where st.school_id = p_id and (f.kind = 'T' or (f.kind = 'B' and st.route_id is not null) or (f.kind = 'H' and st.hostel_room_id is not null));

  -- communication
  insert into notices (school_id, title, body, audience, category, priority, published_at, author) values
    (p_id, 'Half Yearly results published', 'Report cards for Classes 6–10 are now available in the parent portal. Parent–teacher meeting on Saturday, 10:00 AM – 1:00 PM.', 'Parents, Students', 'Academic', 'normal', now() - interval '5 hours', sch.principal_name),
    (p_id, 'Annual Sports Day — house practice schedule', 'House-wise practice will be held after 7th period from Monday. Students must carry sports uniform.', 'All', 'Sports', 'normal', now() - interval '26 hours', 'Sports Department'),
    (p_id, 'School closed on Gandhi Jayanti (2 October)', 'The school will remain closed on account of Gandhi Jayanti. Transport will not operate.', 'All', 'Holiday', 'important', now() - interval '50 hours', 'Office'),
    (p_id, 'Q3 fee due by 15 October', 'Parents are requested to clear the Q3 tuition fee by 15 October to avoid a late fee of ₹50 per day.', 'Parents', 'Fees', 'important', now() - interval '74 hours', 'Accounts Office'),
    (p_id, 'Inter-house science exhibition', 'Registrations are open for Classes 8–10. Submit project titles to your science teacher by Friday.', 'Students', 'Event', 'normal', now() - interval '120 hours', 'Science Department'),
    (p_id, 'Staff meeting — Tuesday 2:30 PM', 'All teaching staff to assemble in the conference hall. Agenda: Term 2 planning and CCE records.', 'Staff', 'Staff', 'normal', now() - interval '30 hours', sch.principal_name);
  insert into notifications (school_id, audience, title, body, kind, created_at) values
    (p_id, 'parent', (select split_part(full_name, ' ', 1) from students where id = kid_a) || ' marked present', 'Checked in at the main gate at 07:52 AM.', 'attendance', now() - interval '2 hours'),
    (p_id, 'parent', 'Mathematics homework added', 'Exercise 7.2 — Q1 to Q12, due Friday.', 'homework', now() - interval '4 hours'),
    (p_id, 'parent', 'Fee overdue — Tuition Q2', 'Please clear the pending amount to avoid late fee.', 'fees', now() - interval '28 hours'),
    (p_id, 'all', 'Half Yearly results published', 'Report cards are available now.', 'notice', now() - interval '5 hours'),
    (p_id, 'teacher', 'Leave request from parent', 'Class 8A · 2 days · Family function', 'leave', now() - interval '3 hours'),
    (p_id, 'school_admin', '12 fee payments received today', '₹1,84,600 collected via UPI and Net Banking.', 'fees', now() - interval '1 hours'),
    (p_id, 'driver', 'Route R-01 — stop change', 'Pickup at Amrapali Circle moved 50 m ahead of the petrol pump.', 'transport', now() - interval '14 hours'),
    (p_id, 'student', 'Science exhibition registrations open', 'Submit your project title by Friday.', 'notice', now() - interval '20 hours');
  insert into school_events (school_id, title, date, time, venue) values
    (p_id, 'Morning Assembly — House: Tagore', current_date, '07:45', 'Main Ground'),
    (p_id, 'Class 10 Pre-board planning', current_date, '11:00', 'Conference Hall'),
    (p_id, 'Parent–Teacher Meeting (6–8)', current_date + 2, '10:00', 'Classrooms'),
    (p_id, 'Annual Sports Day', current_date + 18, '08:30', 'Sports Complex'),
    (p_id, 'Gandhi Jayanti — Holiday', make_date(extract(year from current_date)::int, 10, 2), '—', '—');
  insert into leave_requests (school_id, requester, requester_type, section_id, from_date, to_date, reason, status)
  select p_id, a.full_name, 'student', a.section_id, current_date + 3, current_date + 4, 'Family function in Udaipur', 'pending' from students a where a.id = kid_a
  union all select p_id, full_name, 'student', section_id, current_date + 1, current_date + 1, 'Medical appointment', 'pending' from (select * from students where school_id = p_id order by admission_no offset 40 limit 1) x
  union all select p_id, full_name, 'staff', null, current_date + 5, current_date + 6, 'Personal work', 'pending' from (select * from teachers where school_id = p_id order by employee_code offset 5 limit 1) y
  union all select p_id, full_name, 'student', section_id, current_date - 6, current_date - 5, 'Fever', 'approved' from (select * from students where school_id = p_id order by admission_no offset 70 limit 1) z;

  -- reception
  insert into admission_enquiries (school_id, student_name, parent_name, phone, grade, source, status, created_at, follow_up_on)
  select p_id, (case when random() > 0.5 then ff[1 + floor(random()*24)::int] else fm[1 + floor(random()*24)::int] end) || ' ' || l, pm[1 + floor(random()*12)::int] || ' ' || l,
         '+91 9' || (100000000 + floor(random()*899999999))::bigint, 'Class ' || (1 + floor(random()*9))::int,
         (array['Walk-in','Website','Phone','Referral','Newspaper'])[1 + floor(random()*5)::int],
         (array['new','new','follow_up','visit_scheduled','admitted','closed'])[1 + floor(random()*6)::int],
         now() - (floor(random()*300) || ' hours')::interval, current_date + floor(random()*7)::int
  from generate_series(1, 14) n cross join lateral (select ln[1 + floor(random()*24)::int] || '' || repeat('', n) as l) q;
  insert into visitors (school_id, name, phone, purpose, host, check_in, check_out, badge_no, status)
  select p_id, pm[1 + floor(random()*12)::int] || ' ' || ln[1 + floor(random()*24)::int], '+91 9' || (100000000 + floor(random()*899999999))::bigint,
         (array['Meet class teacher','Fee enquiry','Admission enquiry','Document collection','Vendor — stationery','TC collection','Interview'])[1 + floor(random()*7)::int],
         (select full_name from teachers where school_id = p_id order by random() limit 1),
         now() - ((n*38 + 12) || ' minutes')::interval,
         case when n > 3 then now() - ((n*38 + 12) || ' minutes')::interval + ((15 + floor(random()*55)) || ' minutes')::interval end,
         'V-' || (100 + n), case when n > 3 then 'checked_out' else 'inside' end
  from generate_series(0, 9) n;
  insert into phone_logs (school_id, caller, phone, purpose, call_type, created_at, notes)
  select p_id, pf[1 + floor(random()*12)::int] || ' ' || ln[1 + floor(random()*24)::int], '+91 9' || (100000000 + floor(random()*899999999))::bigint,
         (array['Admission','Fee','Transport','Leave','General'])[1 + floor(random()*5)::int], (array['incoming','incoming','outgoing'])[1 + floor(random()*3)::int],
         now() - ((n*3 + 1) || ' hours')::interval, (array['Asked for fee structure','Bus timing query','Will visit on Monday','Informed about PTM','Requested call back'])[1 + floor(random()*5)::int]
  from generate_series(0, 7) n;
  insert into postal_items (school_id, direction, ref_no, party, courier, created_at, status)
  select p_id, case when n % 3 = 0 then 'dispatch' else 'receive' end, (array['DTDC','SP','BD'])[1 + floor(random()*3)::int] || (100000 + floor(random()*899999))::int,
         (array['CBSE Regional Office','State Bank of India','Oxford University Press','District Education Office','Parent — Class 7B','Municipal Corporation'])[1 + floor(random()*6)::int],
         (array['India Post','DTDC','Blue Dart','Hand delivery'])[1 + floor(random()*4)::int], now() - ((n*20 + 3) || ' hours')::interval,
         (array['received','handed_over','dispatched'])[1 + floor(random()*3)::int]
  from generate_series(0, 7) n;
  insert into complaints (school_id, raised_by, category, subject, status, created_at)
  select p_id, 'Parent — Class ' || (6 + floor(random()*5))::int || (array['A','B'])[1 + floor(random()*2)::int],
         (array['Transport','Academics','Canteen','Infrastructure','Hostel'])[1 + floor(random()*5)::int],
         (array['Bus arrived late twice this week','Water cooler not working on 2nd floor','Request for extra maths class','Canteen food quality','Classroom fan not working','Hostel Wi-Fi issue'])[1 + floor(random()*6)::int],
         (array['open','open','in_progress','resolved'])[1 + floor(random()*4)::int], now() - ((2 + floor(random()*200)) || ' hours')::interval
  from generate_series(1, 7) n;

  -- canteen
  insert into canteen_items (school_id, name, category, price, stock, unit)
  select p_id, m.name, m.cat, m.price, case when m.name = 'Idli Sambhar' then 6 else 18 + floor(random()*120)::int end, case when m.cat = 'Stationery' then 'pc' else 'plate' end
  from (values ('Veg Sandwich','Snacks',40),('Samosa (2 pc)','Snacks',30),('Poha','Breakfast',35),('Idli Sambhar','Breakfast',45),('Veg Thali','Meals',90),('Rajma Chawal','Meals',70),
               ('Paneer Wrap','Snacks',60),('Fresh Lime Water','Beverages',25),('Buttermilk','Beverages',20),('Banana Shake','Beverages',45),('Fruit Bowl','Healthy',50),
               ('Sprouts Chaat','Healthy',40),('Notebook (A4)','Stationery',60),('Geometry Box','Stationery',120)) m(name, cat, price);
  insert into canteen_sales (school_id, bill_no, customer, items_count, total, method, created_at)
  select p_id, 'C-' || lpad((3200 + n)::text, 5, '0'), fm[1 + floor(random()*24)::int] || ' · ' || (6 + floor(random()*5))::int || (array['A','B'])[1 + floor(random()*2)::int],
         1 + floor(random()*4)::int, (3 + floor(random()*16)::int) * 10, (array['Wallet','Wallet','UPI','Cash'])[1 + floor(random()*4)::int], now() - ((n * 24 + 12) || ' minutes')::interval
  from generate_series(0, 15) n;
end $$;

-- (Re)create demo tenants
delete from schools where is_demo;

insert into schools (id, slug, name, short_name, motto, city, state, board, affiliation_no, established, phone, email, website, address, academic_year, principal_name, is_demo) values
  ('11111111-1111-4111-8111-111111111111','aravali','Aravali Heights Senior Secondary School','Aravali Heights','Truth · Service · Excellence','Jaipur','Rajasthan','CBSE','DEMO-1730',1962,'+91 141 256 1100','office@aravali.demo.mizschool.app','aravali.mizschool.app','Sector 7, Jagatpura, Jaipur 302017','2026–27','Mr. Alok Bhargava',true),
  ('22222222-2222-4222-8222-222222222222','crestview','Crestview Convent School','Crestview','Knowledge is Light','Lucknow','Uttar Pradesh','ICSE','DEMO-114',1978,'+91 522 402 7788','office@crestview.demo.mizschool.app','crestview.mizschool.app','Vibhuti Khand, Gomti Nagar, Lucknow 226010','2026–27','Mrs. Rachel Fernandes',true),
  ('33333333-3333-4333-8333-333333333333','mizdemo','Miz Demo Public School','Miz Demo School','Learn · Lead · Serve','Jaipur','Rajasthan','CBSE','DEMO-001',2004,'+91 141 400 2026','hello@demo.mizschool.app','demo.mizschool.app','Plot 12, Malviya Nagar, Jaipur 302017','2026–27','Dr. Anita Mehra',true);

insert into school_branding (school_id, primary_color, secondary_color, accent_color, crest_initials) values
  ('11111111-1111-4111-8111-111111111111','#1457A6','#0B2345','#C8962E','AH'),
  ('22222222-2222-4222-8222-222222222222','#0F5E8C','#0A2A43','#8C1D2F','CC'),
  ('33333333-3333-4333-8333-333333333333','#1D4ED8','#0F1E4A','#D99A1E','MD');

insert into subscriptions (school_id, plan_id, status, billable_users, started_on, renews_on) values
  ('11111111-1111-4111-8111-111111111111','standard','ACTIVE',1600, current_date - 180, current_date + 5),
  ('22222222-2222-4222-8222-222222222222','premium','ACTIVE',2210, current_date - 90, current_date + 12),
  ('33333333-3333-4333-8333-333333333333','basic','TRIAL',480, current_date - 9, current_date + 21);

select seed_demo_school('11111111-1111-4111-8111-111111111111', 11);
select seed_demo_school('22222222-2222-4222-8222-222222222222', 23);
select seed_demo_school('33333333-3333-4333-8333-333333333333', 37);

-- The seeder is SECURITY DEFINER: never expose it through the public API.
revoke execute on function public.seed_demo_school(uuid, int) from public, anon, authenticated;

-- Quick check
select s.short_name,
  (select count(*) from students x where x.school_id = s.id) as students,
  (select count(*) from teachers x where x.school_id = s.id) as teachers,
  (select count(*) from attendance x where x.school_id = s.id) as attendance_rows,
  (select count(*) from fee_invoices x where x.school_id = s.id) as invoices
from schools s where s.is_demo order by s.slug;
