import { generateExtra } from './extra.js';
// Deterministic demo-data generator. Produces the exact same row shapes as the
// Supabase tables in /supabase/migrations, so screens work identically on
// local demo data and on live Supabase data.

const FIRST_M = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Reyansh', 'Kabir', 'Ishaan', 'Rohan', 'Dhruv', 'Krish', 'Aryan', 'Yash', 'Pranav', 'Siddharth', 'Nikhil', 'Rudra', 'Ayaan', 'Kunal', 'Harsh', 'Manav', 'Om', 'Tanmay', 'Veer', 'Rahul'];
const FIRST_F = ['Ananya', 'Diya', 'Aadhya', 'Saanvi', 'Anika', 'Myra', 'Ira', 'Kiara', 'Riya', 'Navya', 'Meera', 'Tara', 'Sara', 'Aditi', 'Kavya', 'Pari', 'Nisha', 'Ishita', 'Prisha', 'Shreya', 'Avni', 'Jiya', 'Mahi', 'Tanvi'];
const LAST = ['Sharma', 'Verma', 'Gupta', 'Agarwal', 'Singh', 'Mehta', 'Jain', 'Kapoor', 'Chauhan', 'Rathore', 'Joshi', 'Saxena', 'Mathur', 'Khandelwal', 'Srivastava', 'Mishra', 'Pandey', 'Bansal', 'Goyal', 'Shekhawat', 'Nair', 'Das', 'Iyer', 'Malhotra'];
const PARENT_M = ['Rajesh', 'Sanjay', 'Amit', 'Vikas', 'Manoj', 'Suresh', 'Deepak', 'Rakesh', 'Anil', 'Vinod', 'Ashok', 'Pankaj'];
const PARENT_F = ['Sunita', 'Pooja', 'Neha', 'Kavita', 'Rekha', 'Anjali', 'Priya', 'Seema', 'Nidhi', 'Ritu', 'Shalini', 'Monika'];

export const SUBJECTS = [
  { code: 'ENG', name: 'English' },
  { code: 'HIN', name: 'Hindi' },
  { code: 'MAT', name: 'Mathematics' },
  { code: 'SCI', name: 'Science' },
  { code: 'SST', name: 'Social Science' },
  { code: 'CS', name: 'Computer Science' },
  { code: 'SAN', name: 'Sanskrit' },
  { code: 'PE', name: 'Physical Education' },
];

export const PERIODS = [
  { period: 1, start: '08:00', end: '08:45' },
  { period: 2, start: '08:45', end: '09:30' },
  { period: 3, start: '09:30', end: '10:15' },
  { period: 4, start: '10:35', end: '11:20' },
  { period: 5, start: '11:20', end: '12:05' },
  { period: 6, start: '12:45', end: '13:30' },
  { period: 7, start: '13:30', end: '14:15' },
];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n, w = 2) => String(n).padStart(w, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** Last `n` school days (Mon–Sat) ending today (or the last school day). */
export function schoolDays(n, from = new Date()) {
  const out = [];
  let d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (out.length < n) {
    if (d.getDay() !== 0) out.push(iso(d));
    d = addDays(d, -1);
  }
  return out;
}

export function generateSchoolData(school) {
  const r = rng(school.seed * 7919);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const int = (min, max) => min + Math.floor(r() * (max - min + 1));
  const phone = () => `+91 9${int(100000000, 999999999)}`;
  const today = new Date();
  const P = school.slug.slice(0, 3).toUpperCase();

  const subjects = SUBJECTS.map((s, i) => ({ id: `${school.slug}-sub-${i + 1}`, ...s }));

  // Teachers — 2 per core subject + specialists
  const teachers = [];
  const tSubjects = [0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 6, 7, 2, 3, 0];
  const titles = ['Mr.', 'Ms.', 'Mrs.'];
  tSubjects.forEach((si, i) => {
    const female = r() > 0.4;
    const first = female ? pick(PARENT_F) : pick(PARENT_M);
    const last = pick(LAST);
    teachers.push({
      id: `${school.slug}-tch-${i + 1}`,
      employee_code: `${P}-T${pad(i + 1, 3)}`,
      full_name: `${female ? pick(['Ms.', 'Mrs.']) : 'Mr.'} ${first} ${last}`,
      gender: female ? 'F' : 'M',
      subject_id: subjects[si].id,
      designation: i < 4 ? 'PGT' : i < 12 ? 'TGT' : 'PRT',
      phone: phone(),
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${school.slug}.demo.mizschool.app`,
      joined_on: `${int(2008, 2024)}-${pad(int(1, 12))}-01`,
      status: 'active',
    });
  });
  void titles;

  // Sections — grades 6–10, A & B
  const sections = [];
  let ti = 0;
  for (let g = 6; g <= 10; g++) {
    for (const s of ['A', 'B']) {
      sections.push({
        id: `${school.slug}-sec-${g}${s}`,
        grade: g,
        section: s,
        name: `${g}${s}`,
        class_teacher_id: teachers[ti++ % teachers.length].id,
        room: `${g < 9 ? 'Block A' : 'Block B'} · ${g}0${s === 'A' ? 1 : 2}`,
      });
    }
  }

  // Transport
  const vehicles = Array.from({ length: 6 }, (_, i) => ({
    id: `${school.slug}-veh-${i + 1}`,
    reg_no: `RJ14 PA ${int(1000, 9999)}`,
    model: i % 2 ? 'Tata Starbus 40' : 'Ashok Leyland Lynx 32',
    capacity: i % 2 ? 40 : 32,
    fitness_valid_till: iso(addDays(today, int(40, 300))),
  }));
  const areas = [
    ['Vaishali Nagar', 'Amrapali Circle', 'Queens Road', 'Khatipura', 'Jhotwara', 'Gandhi Path'],
    ['Malviya Nagar', 'GT Mall', 'Jawahar Circle', 'Durgapura', 'Tonk Road', 'Sanganer'],
    ['Mansarovar', 'VT Road', 'Shipra Path', 'Madhyam Marg', 'Metro Mall', 'Rajat Path'],
    ['Raja Park', 'Adarsh Nagar', 'Moti Doongri', 'Janta Colony', 'Jawahar Nagar', 'Transport Nagar'],
    ['Bani Park', 'Collectorate', 'Sindhi Camp', 'MI Road', 'Ajmeri Gate', 'Chandpole'],
    ['C-Scheme', 'Ashok Nagar', 'Statue Circle', 'Civil Lines', 'Sahakar Marg', 'Lalkothi'],
  ];
  const routes = vehicles.map((v, i) => ({
    id: `${school.slug}-rt-${i + 1}`,
    code: `R-${pad(i + 1)}`,
    name: `${areas[i][0]} – School`,
    vehicle_id: v.id,
    driver_name: `${pick(PARENT_M)} ${pick(['Singh', 'Yadav', 'Meena', 'Gurjar', 'Khan'])}`,
    driver_phone: phone(),
    attendant_name: `${pick(PARENT_F)} ${pick(LAST)}`,
    departs_at: `07:${pad(int(0, 3) * 5 + 5)}`,
    status: i === 0 ? 'scheduled' : pick(['completed', 'in_progress', 'scheduled']),
  }));
  const route_stops = [];
  routes.forEach((rt, i) => {
    areas[i].forEach((name, k) => {
      const mins = 5 + k * 8;
      route_stops.push({ id: `${rt.id}-s${k + 1}`, route_id: rt.id, seq: k + 1, name, eta: `07:${pad(mins % 60)}` });
    });
    route_stops.push({ id: `${rt.id}-s7`, route_id: rt.id, seq: 7, name: 'School Main Gate', eta: '07:55' });
  });

  // Hostel
  const hostels = [
    { id: `${school.slug}-hos-1`, name: 'Tagore House (Boys)', type: 'Boys', warden_name: 'Mr. Harish Rawat', capacity: 96 },
    { id: `${school.slug}-hos-2`, name: 'Sarojini House (Girls)', type: 'Girls', warden_name: 'Mrs. Leela Menon', capacity: 72 },
  ];
  const rooms = [];
  hostels.forEach((h, hi) => {
    const n = hi === 0 ? 24 : 18;
    for (let k = 0; k < n; k++) {
      const floor = Math.floor(k / 8) + 1;
      const type = k % 6 === 0 ? 'Double' : 'Quad';
      const capacity = type === 'Double' ? 2 : 4;
      const status = k === 7 ? 'maintenance' : 'active';
      const occupied = status === 'maintenance' ? 0 : Math.min(capacity, int(capacity - 2, capacity));
      rooms.push({ id: `${h.id}-r${k + 1}`, hostel_id: h.id, room_no: `${hi ? 'G' : 'B'}-${floor}${pad((k % 8) + 1)}`, floor, room_type: type, capacity, occupied, status });
    }
  });

  // Students — 22 per section
  const students = [];
  let adm = 4100 + school.seed * 10;
  sections.forEach((sec) => {
    for (let k = 0; k < 22; k++) {
      const female = r() > 0.5;
      const last = pick(LAST);
      const first = female ? pick(FIRST_F) : pick(FIRST_M);
      const route = r() > 0.45 ? pick(routes) : null;
      const stops = route ? route_stops.filter((s) => s.route_id === route.id && s.seq < 7) : [];
      students.push({
        id: `${sec.id}-stu-${k + 1}`,
        admission_no: `${P}/${2026 - (sec.grade - 6)}/${adm++}`,
        roll_no: 0,
        full_name: `${first} ${last}`,
        gender: female ? 'F' : 'M',
        dob: `${2026 - sec.grade - 6}-${pad(int(1, 12))}-${pad(int(1, 28))}`,
        section_id: sec.id,
        guardian_name: `${r() > 0.3 ? 'Mr.' : 'Mrs.'} ${r() > 0.3 ? pick(PARENT_M) : pick(PARENT_F)} ${last}`,
        guardian_phone: phone(),
        guardian_email: `${last.toLowerCase()}${int(10, 99)}@gmail.com`,
        blood_group: pick(['A+', 'B+', 'O+', 'AB+', 'O-', 'B-']),
        address: `${int(1, 240)}, ${pick(areas.flat())}, ${school.city}`,
        route_id: route ? route.id : null,
        stop_id: stops.length ? pick(stops).id : null,
        hostel_room_id: null,
        status: 'active',
      });
    }
  });
  // roll numbers alphabetical inside each section
  sections.forEach((sec) => {
    students.filter((s) => s.section_id === sec.id)
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
      .forEach((s, i) => { s.roll_no = i + 1; });
  });
  // Hostellers: a few senior students
  const activeRooms = rooms.filter((x) => x.status === 'active');
  students.filter((s) => s.section_id.endsWith('10A') || s.section_id.endsWith('9B')).slice(0, 26).forEach((s, i) => {
    const pool = activeRooms.filter((rm) => (s.gender === 'M' ? rm.hostel_id === hostels[0].id : rm.hostel_id === hostels[1].id));
    s.hostel_room_id = pool[i % pool.length].id;
  });

  // Demo family: sibling pair shares a guardian (used by the Parent profile)
  const kidA = students.find((s) => s.section_id.endsWith('8A') && s.roll_no === 3);
  const kidB = students.find((s) => s.section_id.endsWith('6B') && s.roll_no === 5);
  kidB.full_name = `${kidB.gender === 'F' ? FIRST_F[3] : FIRST_M[4]} ${kidA.full_name.split(' ')[1]}`;
  kidB.guardian_name = kidA.guardian_name;
  kidB.guardian_phone = kidA.guardian_phone;
  kidB.guardian_email = kidA.guardian_email;
  kidB.route_id = kidA.route_id = routes[0].id;
  kidA.stop_id = kidB.stop_id = route_stops[2].id;

  // Attendance — last 24 school days
  const days = schoolDays(24);
  const attendance = [];
  students.forEach((s) => {
    const reliability = 0.86 + r() * 0.13;
    days.forEach((d, di) => {
      const x = r();
      let status = x < reliability ? 'present' : x < reliability + 0.02 ? 'late' : x < reliability + 0.04 ? 'leave' : 'absent';
      if (di === 0 && s.id === kidA.id) status = 'present';
      attendance.push({ id: `${s.id}-${d}`, student_id: s.id, section_id: s.section_id, date: d, status });
    });
  });

  // Timetable
  const timetable_slots = [];
  const teachersBySubject = (sid) => teachers.filter((t) => t.subject_id === sid);
  sections.forEach((sec, si) => {
    for (let day = 1; day <= 6; day++) {
      const periods = day === 6 ? 4 : 7;
      for (let p = 1; p <= periods; p++) {
        const sub = subjects[(si + day * 3 + p) % subjects.length];
        const pool = teachersBySubject(sub.id);
        const t = pool[(si + p) % pool.length];
        const pr = PERIODS[p - 1];
        timetable_slots.push({ id: `${sec.id}-d${day}p${p}`, section_id: sec.id, day, period: p, start_time: pr.start, end_time: pr.end, subject_id: sub.id, teacher_id: t.id, room: sub.code === 'CS' ? 'Computer Lab' : sub.code === 'SCI' && p > 5 ? 'Science Lab' : sub.code === 'PE' ? 'Playground' : sec.room });
      }
    }
  });

  // Homework
  const hwTitles = {
    ENG: ['Write a letter to the editor on road safety', 'Read Chapter 5 and answer Q1–Q6', 'Prepare a book review (250 words)'],
    HIN: ['पाठ 6 के प्रश्न-उत्तर लिखिए', 'अनुच्छेद लेखन: मेरा विद्यालय', 'मुहावरे — 10 वाक्य'],
    MAT: ['Exercise 7.2 — Q1 to Q12', 'Worksheet: Linear equations', 'Practice set on Mensuration'],
    SCI: ['Draw and label the human heart', 'Lab record: Acids and bases', 'Chapter 4 back exercise'],
    SST: ['Map work: Rivers of India', 'Project: Local self-government', 'Timeline of the Mughal Empire'],
    CS: ['Write 5 HTML tags with examples', 'Flowchart: largest of three numbers', 'Spreadsheet formulas practice'],
    SAN: ['शब्द रूप — बालक', 'धातु रूप — पठ्', 'श्लोक कंठस्थ करें'],
    PE: ['Fitness log for one week', 'Rules of Kho-Kho', 'Yoga asana chart'],
  };
  const homework = [];
  sections.forEach((sec) => {
    for (let k = 0; k < 6; k++) {
      const sub = subjects[(k * 3 + sec.grade) % 6];
      const assigned = addDays(today, -int(0, 6));
      homework.push({
        id: `${sec.id}-hw-${k + 1}`,
        section_id: sec.id,
        subject_id: sub.id,
        teacher_id: teachersBySubject(sub.id)[0].id,
        title: pick(hwTitles[sub.code]),
        details: 'Submit in the class notebook. Neat handwriting and diagrams where needed.',
        assigned_on: iso(assigned),
        due_on: iso(addDays(assigned, int(2, 5))),
      });
    }
  });

  // Exams & marks
  const exams = [
    { id: `${school.slug}-ex-1`, name: 'Periodic Test 1', term: 'Term 1', starts_on: iso(addDays(today, -70)), ends_on: iso(addDays(today, -64)), status: 'published' },
    { id: `${school.slug}-ex-2`, name: 'Half Yearly Examination', term: 'Term 1', starts_on: iso(addDays(today, -21)), ends_on: iso(addDays(today, -10)), status: 'published' },
    { id: `${school.slug}-ex-3`, name: 'Periodic Test 2', term: 'Term 2', starts_on: iso(addDays(today, 24)), ends_on: iso(addDays(today, 30)), status: 'scheduled' },
  ];
  const marks = [];
  const core = subjects.slice(0, 5).concat(subjects[5]);
  students.forEach((s) => {
    const ability = 0.5 + r() * 0.45;
    exams.slice(0, 2).forEach((ex, ei) => {
      const max = ei === 0 ? 40 : 80;
      core.forEach((sub) => {
        const score = Math.max(0.2, Math.min(1, ability + (r() - 0.5) * 0.25));
        marks.push({ id: `${s.id}-${ex.id}-${sub.code}`, exam_id: ex.id, student_id: s.id, subject_id: sub.id, max_marks: max, marks_obtained: Math.round(score * max) });
      });
    });
  });

  // Fees — quarterly tuition + transport
  const tuition = { 6: 14500, 7: 14500, 8: 15800, 9: 17200, 10: 17200 };
  const fee_invoices = [];
  let inv = 1;
  const receiptBase = 50000 + school.seed * 100;
  students.forEach((s) => {
    const sec = sections.find((x) => x.id === s.section_id);
    const q = [
      { title: 'Tuition Fee — Q1 (Apr–Jun)', due: iso(new Date(today.getFullYear(), 3, 15)), amount: tuition[sec.grade] },
      { title: 'Tuition Fee — Q2 (Jul–Sep)', due: iso(new Date(today.getFullYear(), 6, 15)), amount: tuition[sec.grade] },
      { title: 'Tuition Fee — Q3 (Oct–Dec)', due: iso(new Date(today.getFullYear(), 9, 15)), amount: tuition[sec.grade] },
    ];
    if (s.route_id) q.push({ title: 'Transport Fee — Term 1', due: iso(new Date(today.getFullYear(), 6, 15)), amount: 9600 });
    if (s.hostel_room_id) q.push({ title: 'Hostel Fee — Term 1', due: iso(new Date(today.getFullYear(), 6, 15)), amount: 42000 });
    q.forEach((f, qi) => {
      const dueDate = new Date(f.due);
      const past = dueDate < today;
      let status = 'upcoming';
      let paid_on = null;
      if (qi === 0) status = 'paid';
      else if (past) status = r() > 0.16 ? 'paid' : 'overdue';
      else if (addDays(dueDate, -30) < today) status = 'due';
      if (s.id === kidA.id && f.title.includes('Q2')) status = 'overdue';
      if (status === 'paid') { const pd = addDays(dueDate, int(-12, 40)); paid_on = iso(pd > today ? today : pd); }
      fee_invoices.push({
        id: `${s.id}-inv-${qi + 1}`,
        student_id: s.id,
        invoice_no: `INV/${P}/${pad(inv++, 5)}`,
        title: f.title,
        amount: f.amount,
        due_on: f.due,
        status,
        paid_on,
        method: status === 'paid' ? pick(['UPI', 'UPI', 'Net Banking', 'Card', 'Cash', 'Cheque']) : null,
        receipt_no: status === 'paid' ? `RCPT-${receiptBase + inv}` : null,
      });
    });
  });

  const now = new Date();
  const hoursAgo = (h) => new Date(now.getTime() - h * 3600e3).toISOString();

  const notices = [
    { id: `${school.slug}-n1`, title: 'Half Yearly results published', body: 'Report cards for Classes 6–10 are now available in the parent portal. Parent–teacher meeting on Saturday, 10:00 AM – 1:00 PM.', audience: 'Parents, Students', category: 'Academic', priority: 'normal', published_at: hoursAgo(5), author: school.principal_name },
    { id: `${school.slug}-n2`, title: 'Annual Sports Day — house practice schedule', body: 'House-wise practice will be held after 7th period from Monday. Students must carry sports uniform.', audience: 'All', category: 'Sports', priority: 'normal', published_at: hoursAgo(26), author: 'Sports Department' },
    { id: `${school.slug}-n3`, title: 'School closed on Gandhi Jayanti (2 October)', body: 'The school will remain closed on account of Gandhi Jayanti. Transport will not operate.', audience: 'All', category: 'Holiday', priority: 'important', published_at: hoursAgo(50), author: 'Office' },
    { id: `${school.slug}-n4`, title: 'Q3 fee due by 15 October', body: 'Parents are requested to clear the Q3 tuition fee by 15 October to avoid a late fee of ₹50 per day.', audience: 'Parents', category: 'Fees', priority: 'important', published_at: hoursAgo(74), author: 'Accounts Office' },
    { id: `${school.slug}-n5`, title: 'Inter-house science exhibition', body: 'Registrations are open for Classes 8–10. Submit project titles to your science teacher by Friday.', audience: 'Students', category: 'Event', priority: 'normal', published_at: hoursAgo(120), author: 'Science Department' },
    { id: `${school.slug}-n6`, title: 'Staff meeting — Tuesday 2:30 PM', body: 'All teaching staff to assemble in the conference hall. Agenda: Term 2 planning and CCE records.', audience: 'Staff', category: 'Staff', priority: 'normal', published_at: hoursAgo(30), author: school.principal_name },
  ];

  const notifications = [
    { id: `${school.slug}-nt1`, audience: 'parent', title: `${kidA.full_name.split(' ')[0]} marked present`, body: 'Checked in at the main gate at 07:52 AM.', kind: 'attendance', created_at: hoursAgo(2) },
    { id: `${school.slug}-nt2`, audience: 'parent', title: 'Mathematics homework added', body: 'Exercise 7.2 — Q1 to Q12, due Friday.', kind: 'homework', created_at: hoursAgo(4) },
    { id: `${school.slug}-nt3`, audience: 'parent', title: 'Fee overdue — Tuition Q2', body: 'Please clear the pending amount to avoid late fee.', kind: 'fees', created_at: hoursAgo(28) },
    { id: `${school.slug}-nt4`, audience: 'all', title: 'Half Yearly results published', body: 'Report cards are available now.', kind: 'notice', created_at: hoursAgo(5) },
    { id: `${school.slug}-nt5`, audience: 'teacher', title: 'Leave request from parent', body: 'Class 8A · 2 days · Family function', kind: 'leave', created_at: hoursAgo(3) },
    { id: `${school.slug}-nt6`, audience: 'school_admin', title: '12 fee payments received today', body: '₹1,84,600 collected via UPI and Net Banking.', kind: 'fees', created_at: hoursAgo(1) },
    { id: `${school.slug}-nt7`, audience: 'driver', title: 'Route R-01 — stop change', body: 'Pickup at Amrapali Circle moved 50 m ahead of the petrol pump.', kind: 'transport', created_at: hoursAgo(14) },
    { id: `${school.slug}-nt8`, audience: 'student', title: 'Science exhibition registrations open', body: 'Submit your project title by Friday.', kind: 'notice', created_at: hoursAgo(20) },
  ];

  const school_events = [
    { id: `${school.slug}-e1`, title: 'Morning Assembly — House: Tagore', date: iso(today), time: '07:45', venue: 'Main Ground' },
    { id: `${school.slug}-e2`, title: 'Class 10 Pre-board planning', date: iso(today), time: '11:00', venue: 'Conference Hall' },
    { id: `${school.slug}-e3`, title: 'Parent–Teacher Meeting (6–8)', date: iso(addDays(today, 2)), time: '10:00', venue: 'Classrooms' },
    { id: `${school.slug}-e4`, title: 'Annual Sports Day', date: iso(addDays(today, 18)), time: '08:30', venue: 'Sports Complex' },
    { id: `${school.slug}-e5`, title: 'Gandhi Jayanti — Holiday', date: iso(new Date(today.getFullYear(), 9, 2)), time: '—', venue: '—' },
  ];

  const sources = ['Walk-in', 'Website', 'Phone', 'Referral', 'Newspaper'];
  const admission_enquiries = Array.from({ length: 14 }, (_, i) => {
    const female = r() > 0.5; const last = pick(LAST);
    return { id: `${school.slug}-enq-${i + 1}`, student_name: `${female ? pick(FIRST_F) : pick(FIRST_M)} ${last}`, parent_name: `${pick(PARENT_M)} ${last}`, phone: phone(), grade: `Class ${int(1, 9)}`, source: pick(sources), status: pick(['new', 'new', 'follow_up', 'visit_scheduled', 'admitted', 'closed']), created_at: hoursAgo(int(1, 300)), follow_up_on: iso(addDays(today, int(0, 7))) };
  });
  const purposes = ['Meet class teacher', 'Fee enquiry', 'Admission enquiry', 'Document collection', 'Vendor — stationery', 'TC collection', 'Interview'];
  const visitors = Array.from({ length: 10 }, (_, i) => {
    const inAt = new Date(now.getTime() - (i * 38 + 12) * 60e3);
    const out = i > 3 ? new Date(inAt.getTime() + int(15, 70) * 60e3).toISOString() : null;
    return { id: `${school.slug}-vis-${i + 1}`, name: `${pick([...PARENT_M, ...PARENT_F])} ${pick(LAST)}`, phone: phone(), purpose: pick(purposes), host: pick(teachers).full_name, check_in: inAt.toISOString(), check_out: out, badge_no: `V-${pad(100 + i, 3)}`, status: out ? 'checked_out' : 'inside' };
  });
  const phone_logs = Array.from({ length: 8 }, (_, i) => ({ id: `${school.slug}-call-${i + 1}`, caller: `${pick([...PARENT_M, ...PARENT_F])} ${pick(LAST)}`, phone: phone(), purpose: pick(['Admission', 'Fee', 'Transport', 'Leave', 'General']), call_type: pick(['incoming', 'incoming', 'outgoing']), created_at: hoursAgo(i * 3 + 1), notes: pick(['Asked for fee structure', 'Bus timing query', 'Will visit on Monday', 'Informed about PTM', 'Requested call back']) }));
  const postal_items = Array.from({ length: 8 }, (_, i) => ({ id: `${school.slug}-post-${i + 1}`, direction: i % 3 === 0 ? 'dispatch' : 'receive', ref_no: `${pick(['DTDC', 'SP', 'BD'])}${int(100000, 999999)}`, party: pick(['CBSE Regional Office', 'State Bank of India', 'Oxford University Press', 'District Education Office', 'Parent — Class 7B', 'Municipal Corporation']), courier: pick(['India Post', 'DTDC', 'Blue Dart', 'Hand delivery']), created_at: hoursAgo(i * 20 + 3), status: pick(['received', 'handed_over', 'dispatched']) }));
  const complaints = Array.from({ length: 7 }, (_, i) => ({ id: `${school.slug}-cmp-${i + 1}`, raised_by: `Parent — Class ${int(6, 10)}${pick(['A', 'B'])}`, category: pick(['Transport', 'Academics', 'Canteen', 'Infrastructure', 'Hostel']), subject: pick(['Bus arrived late twice this week', 'Water cooler not working on 2nd floor', 'Request for extra maths class', 'Canteen food quality', 'Classroom fan not working', 'Hostel Wi-Fi issue']), status: pick(['open', 'open', 'in_progress', 'resolved']), created_at: hoursAgo(int(2, 200)) }));

  const menu = [
    ['Veg Sandwich', 'Snacks', 40], ['Samosa (2 pc)', 'Snacks', 30], ['Poha', 'Breakfast', 35], ['Idli Sambhar', 'Breakfast', 45], ['Veg Thali', 'Meals', 90], ['Rajma Chawal', 'Meals', 70], ['Paneer Wrap', 'Snacks', 60], ['Fresh Lime Water', 'Beverages', 25], ['Buttermilk', 'Beverages', 20], ['Banana Shake', 'Beverages', 45], ['Fruit Bowl', 'Healthy', 50], ['Sprouts Chaat', 'Healthy', 40], ['Notebook (A4)', 'Stationery', 60], ['Geometry Box', 'Stationery', 120],
  ];
  const canteen_items = menu.map(([name, category, price], i) => ({ id: `${school.slug}-item-${i + 1}`, name, category, price, stock: i === 3 ? 6 : int(18, 140), unit: category === 'Stationery' ? 'pc' : 'plate', is_veg: true }));
  const canteen_sales = Array.from({ length: 16 }, (_, i) => ({ id: `${school.slug}-bill-${i + 1}`, bill_no: `C-${pad(3200 + i, 5)}`, customer: `${pick([...FIRST_M, ...FIRST_F])} · ${int(6, 10)}${pick(['A', 'B'])}`, items_count: int(1, 4), total: int(3, 18) * 10, method: pick(['Wallet', 'Wallet', 'UPI', 'Cash']), created_at: hoursAgo(i * 0.4 + 0.2) }));

  const leave_requests = [
    { id: `${school.slug}-lv-1`, requester: kidA.full_name, requester_type: 'student', section_id: kidA.section_id, from_date: iso(addDays(today, 3)), to_date: iso(addDays(today, 4)), reason: 'Family function in Udaipur', status: 'pending' },
    { id: `${school.slug}-lv-2`, requester: students[40].full_name, requester_type: 'student', section_id: students[40].section_id, from_date: iso(addDays(today, 1)), to_date: iso(addDays(today, 1)), reason: 'Medical appointment', status: 'pending' },
    { id: `${school.slug}-lv-3`, requester: teachers[5].full_name, requester_type: 'staff', section_id: null, from_date: iso(addDays(today, 5)), to_date: iso(addDays(today, 6)), reason: 'Personal work', status: 'pending' },
    { id: `${school.slug}-lv-4`, requester: students[70].full_name, requester_type: 'student', section_id: students[70].section_id, from_date: iso(addDays(today, -6)), to_date: iso(addDays(today, -5)), reason: 'Fever', status: 'approved' },
  ];

  const base = {
    school, subjects, teachers, sections, students, attendance, timetable_slots, homework, exams, marks,
    fee_invoices, notices, notifications, school_events, vehicles, routes, route_stops, hostels, rooms,
    canteen_items, canteen_sales, admission_enquiries, visitors, phone_logs, postal_items, complaints,
    leave_requests, meta: { demoParentStudentIds: [kidA.id, kidB.id], demoStudentId: kidA.id, source: 'local' },
  };
  return { ...base, ...generateExtra(base) };
}
