// Extra K-12 modules: admissions CRM, library, online tests, lesson plans, PTM, messages,
// gate passes, health, certificates, payroll, inventory, calendar, co-scholastic grades.
// Built on top of the base dataset so every record points at real students/teachers.

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
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const BOOKS = [
  ['Wings of Fire', 'A. P. J. Abdul Kalam', 'Biography'], ['The Story of My Experiments with Truth', 'M. K. Gandhi', 'Biography'],
  ['Malgudi Days', 'R. K. Narayan', 'Fiction'], ['Swami and Friends', 'R. K. Narayan', 'Fiction'], ['The Room on the Roof', 'Ruskin Bond', 'Fiction'],
  ['The Blue Umbrella', 'Ruskin Bond', 'Fiction'], ['Panchatantra Tales', 'Vishnu Sharma', 'Stories'], ['Godaan', 'Munshi Premchand', 'Hindi'],
  ['Idgah aur Anya Kahaniyan', 'Munshi Premchand', 'Hindi'], ['Madhushala', 'Harivansh Rai Bachchan', 'Hindi'], ['NCERT Mathematics Class 8', 'NCERT', 'Textbook'],
  ['NCERT Science Class 9', 'NCERT', 'Textbook'], ['Concise Physics', 'Selina Publishers', 'Reference'], ['Oxford Student Atlas', 'Oxford', 'Reference'],
  ['A Brief History of Time', 'Stephen Hawking', 'Science'], ['The Jungle Book', 'Rudyard Kipling', 'Classic'], ['Treasure Island', 'R. L. Stevenson', 'Classic'],
  ['Little Women', 'Louisa May Alcott', 'Classic'], ['Discovery of India', 'Jawaharlal Nehru', 'History'], ['India After Gandhi', 'Ramachandra Guha', 'History'],
  ['Tenali Rama Stories', 'Anonymous', 'Stories'], ['Rich Dad Poor Dad', 'Robert Kiyosaki', 'Finance'], ['R. D. Sharma Mathematics 10', 'R. D. Sharma', 'Reference'],
  ['Competition Success Review', 'CSR', 'Magazine'], ['The Hindu — Young World', 'The Hindu', 'Magazine'], ['Harry Potter and the Philosopher’s Stone', 'J. K. Rowling', 'Fiction'],
];

const TOPICS = {
  ENG: ['Reading comprehension', 'Grammar: tenses', 'Letter writing', 'Poem: The Road Not Taken', 'Story writing', 'Active & passive voice', 'Reported speech', 'Notice writing'],
  HIN: ['गद्य: ईदगाह', 'व्याकरण: संधि', 'पत्र लेखन', 'कविता: मधुशाला', 'अनुच्छेद लेखन', 'मुहावरे', 'समास', 'निबंध'],
  MAT: ['Rational numbers', 'Linear equations', 'Quadrilaterals', 'Data handling', 'Squares & square roots', 'Cubes & cube roots', 'Comparing quantities', 'Algebraic expressions', 'Mensuration', 'Exponents'],
  SCI: ['Crop production', 'Microorganisms', 'Synthetic fibres', 'Metals & non-metals', 'Coal & petroleum', 'Combustion & flame', 'Cell structure', 'Force & pressure', 'Friction'],
  SST: ['How, when and where', 'Resources', 'The Indian Constitution', 'Land, soil & water', 'Understanding secularism', 'Agriculture', 'Parliament', 'Judiciary'],
  CS: ['Computer fundamentals', 'HTML basics', 'Spreadsheets', 'Flowcharts', 'Python intro', 'Internet safety'],
};

const QUESTIONS = {
  MAT: [
    ['What is the value of (−3)³?', ['−9', '−27', '27', '9'], 1],
    ['Solve: 2x + 5 = 17', ['x = 5', 'x = 6', 'x = 7', 'x = 11'], 1],
    ['Sum of interior angles of a quadrilateral is', ['180°', '270°', '360°', '540°'], 2],
    ['√144 = ?', ['11', '12', '13', '14'], 1],
    ['Which is a rational number?', ['√2', 'π', '3/4', '√5'], 2],
    ['10% of 250 is', ['2.5', '25', '250', '0.25'], 1],
  ],
  SCI: [
    ['Which organism causes malaria?', ['Bacteria', 'Virus', 'Plasmodium', 'Fungus'], 2],
    ['Nylon is a', ['Natural fibre', 'Synthetic fibre', 'Metal', 'Mineral'], 1],
    ['The unit of force is', ['Joule', 'Newton', 'Watt', 'Pascal'], 1],
    ['Which is a non-metal?', ['Iron', 'Copper', 'Sulphur', 'Zinc'], 2],
    ['Powerhouse of the cell is', ['Nucleus', 'Mitochondria', 'Ribosome', 'Vacuole'], 1],
  ],
  ENG: [
    ['Choose the past tense of “write”', ['writed', 'wrote', 'written', 'writing'], 1],
    ['“The Road Not Taken” was written by', ['Wordsworth', 'Robert Frost', 'Keats', 'Tagore'], 1],
    ['Identify the noun: “The quick fox jumps.”', ['quick', 'fox', 'jumps', 'the'], 1],
  ],
};

export function generateExtra(base) {
  const { school, students, teachers, sections, subjects } = base;
  const r = rng(school.seed * 104729);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const today = new Date();
  const now = Date.now();
  const P = school.slug.slice(0, 3).toUpperCase();
  const subBy = Object.fromEntries(subjects.map((s) => [s.code, s]));
  const kidA = students.find((s) => s.id === base.meta?.demoStudentId) || students.find((s) => s.roll_no === 3 && sections.find((x) => x.id === s.section_id)?.name === '8A') || students[0];

  // ── Admissions CRM pipeline ──
  const STAGES = ['enquiry', 'registered', 'test', 'offered', 'admitted'];
  const first = ['Aarav', 'Diya', 'Kabir', 'Myra', 'Vihaan', 'Anika', 'Reyansh', 'Ira', 'Arnav', 'Kiara', 'Atharv', 'Saanvi', 'Shaurya', 'Navya', 'Advik', 'Pari', 'Ayansh', 'Aadhya'];
  const last = ['Sharma', 'Gupta', 'Jain', 'Mehta', 'Singh', 'Agarwal', 'Kapoor', 'Saxena', 'Joshi', 'Rathore'];
  const admissions = Array.from({ length: 24 }, (_, i) => {
    const ln = pick(last);
    const stage = STAGES[Math.min(4, Math.floor(i / 5))] || 'enquiry';
    return {
      id: `adm-${i + 1}`, app_no: `APP/${P}/27/${pad(i + 101, 4)}`, student_name: `${pick(first)} ${ln}`, parent_name: `${pick(['Rajesh', 'Neha', 'Amit', 'Pooja', 'Sanjay', 'Kavita'])} ${ln}`,
      phone: `+91 9${int(100000000, 999999999)}`, grade: pick(['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 3', 'Class 6', 'Class 9', 'Class 11']),
      source: pick(['Website', 'Walk-in', 'Referral', 'Google Ads', 'Newspaper', 'Instagram']), stage,
      test_score: stage === 'test' || stage === 'offered' || stage === 'admitted' ? int(58, 96) : null,
      fee_paid: stage === 'admitted', created_at: addDays(today, -int(1, 40)).toISOString(), counsellor: pick(['Kiran Sethi', 'Meenakshi Rao']),
    };
  });

  // ── Library ──
  const books = BOOKS.map(([title, author, category], i) => {
    const copies = category === 'Textbook' || category === 'Reference' ? int(4, 10) : int(1, 4);
    return { id: `bk-${i + 1}`, accession_no: `${P}-LIB-${pad(1001 + i, 5)}`, isbn: `978-81-${int(100, 999)}-${int(1000, 9999)}-${int(0, 9)}`, title, author, category, copies, rack: `${String.fromCharCode(65 + (i % 6))}-${int(1, 9)}` };
  });
  const book_loans = [];
  students.slice(0, 160).forEach((s, i) => {
    if (i % 3) return;
    const b = pick(books);
    const issued = addDays(today, -int(1, 30));
    const due = addDays(issued, 14);
    const returned = r() > 0.6 ? iso(addDays(issued, int(3, 13))) : null;
    book_loans.push({ id: `ln-${i}`, book_id: b.id, student_id: s.id, issued_on: iso(issued), due_on: iso(due), returned_on: returned });
  });
  book_loans.push({ id: 'ln-kid', book_id: books[0].id, student_id: kidA.id, issued_on: iso(addDays(today, -9)), due_on: iso(addDays(today, 5)), returned_on: null });

  // ── Online tests & question bank ──
  const question_bank = [];
  Object.entries(QUESTIONS).forEach(([code, qs]) => qs.forEach(([q, options, answer], i) => {
    question_bank.push({ id: `q-${code}-${i}`, subject_id: subBy[code]?.id, question: q, options, answer, difficulty: pick(['Easy', 'Medium', 'Hard']), bloom: pick(['Remember', 'Understand', 'Apply']), marks: 1 });
  }));
  const online_tests = [
    { id: 'ot-1', title: 'Maths Quick Quiz — Rational numbers & equations', subject_id: subBy.MAT?.id, section_names: ['8A', '8B'], duration_min: 10, question_ids: question_bank.filter((q) => q.subject_id === subBy.MAT?.id).map((q) => q.id), status: 'live', due: iso(addDays(today, 2)) },
    { id: 'ot-2', title: 'Science Unit Test — Cells & Microorganisms', subject_id: subBy.SCI?.id, section_names: ['8A', '8B', '9A'], duration_min: 15, question_ids: question_bank.filter((q) => q.subject_id === subBy.SCI?.id).map((q) => q.id), status: 'live', due: iso(addDays(today, 4)) },
    { id: 'ot-3', title: 'English Grammar Check', subject_id: subBy.ENG?.id, section_names: ['6A', '6B', '7A', '8A'], duration_min: 8, question_ids: question_bank.filter((q) => q.subject_id === subBy.ENG?.id).map((q) => q.id), status: 'closed', due: iso(addDays(today, -5)) },
  ];
  const test_attempts = [];
  online_tests.forEach((t) => students.filter((s) => t.section_names.includes(sections.find((x) => x.id === s.section_id)?.name)).forEach((s) => {
    if (s.id === kidA.id && t.status === 'live') return;
    if (t.status === 'live' && r() > 0.55) return;
    test_attempts.push({ id: `at-${t.id}-${s.id}`, test_id: t.id, student_id: s.id, score: int(Math.floor(t.question_ids.length * 0.4), t.question_ids.length), total: t.question_ids.length, submitted_at: addDays(today, -int(0, 4)).toISOString() });
  }));

  // ── Lesson plans & syllabus tracking ──
  const lesson_plans = [];
  sections.forEach((sec) => {
    Object.entries(TOPICS).forEach(([code, topics]) => {
      const sub = subBy[code];
      if (!sub) return;
      const done = int(Math.floor(topics.length * 0.35), Math.floor(topics.length * 0.75));
      topics.forEach((topic, i) => {
        lesson_plans.push({
          id: `lp-${sec.id}-${code}-${i}`, section_id: sec.id, subject_id: sub.id, unit: i + 1, topic,
          planned_week: iso(addDays(today, (i - done) * 7)), periods: int(2, 5),
          status: i < done ? 'completed' : i === done ? 'in_progress' : 'planned',
          approved: i <= done + 1, method: pick(['Lecture + demo', 'Activity based', 'Group discussion', 'Lab / practical', 'Flipped classroom']),
        });
      });
    });
  });

  // ── PTM slots ──
  const ptmDate = iso(addDays(today, 2));
  const ptm_slots = [];
  sections.forEach((sec) => {
    const t = teachers.find((x) => x.id === sec.class_teacher_id);
    for (let k = 0; k < 12; k++) {
      const mins = 10 * 60 + k * 15;
      const time = `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
      const booked = r() > 0.55 ? pick(students.filter((s) => s.section_id === sec.id)) : null;
      ptm_slots.push({ id: `ptm-${sec.id}-${k}`, date: ptmDate, time, section_id: sec.id, teacher_id: t?.id, student_id: booked?.id || null, mode: pick(['In person', 'In person', 'Video call']) });
    }
  });
  ptm_slots.filter((p) => p.student_id === kidA.id).forEach((p) => { p.student_id = null; });

  // ── Parent ↔ teacher messages ──
  const sec8a = sections.find((x) => x.id === kidA.section_id);
  const ct = teachers.find((t) => t.id === sec8a?.class_teacher_id) || teachers[0];
  const mathT = teachers.find((t) => t.subject_id === subBy.MAT?.id) || teachers[1];
  const at = (h) => new Date(now - h * 3600e3).toISOString();
  const threads = [
    { id: 'th-1', student_id: kidA.id, teacher_id: ct.id, subject: 'Leave for family function', messages: [
      { from: 'parent', text: `Good morning ma’am, ${kidA.full_name.split(' ')[0]} will be on leave on the 29th and 30th for a family function in Udaipur.`, at: at(26) },
      { from: 'teacher', text: 'Noted. Please make sure the Science worksheet is completed after returning. Leave is approved in the app.', at: at(25) },
      { from: 'parent', text: 'Thank you ma’am, we will.', at: at(24) },
    ] },
    { id: 'th-2', student_id: kidA.id, teacher_id: mathT.id, subject: 'Mathematics — extra practice', messages: [
      { from: 'teacher', text: `${kidA.full_name.split(' ')[0]} did well in the half-yearly, but word problems need practice. I have shared a worksheet in Homework.`, at: at(50) },
      { from: 'parent', text: 'Thank you sir. Is there a doubt-clearing class this week?', at: at(48) },
      { from: 'teacher', text: 'Yes — Thursday 7th period in Room 801.', at: at(47) },
    ] },
  ];
  sections.slice(0, 6).forEach((sec, i) => {
    const s = students.find((x) => x.section_id === sec.id && x.roll_no === 7);
    const t = teachers.find((x) => x.id === sec.class_teacher_id);
    if (s && t && s.id !== kidA.id) threads.push({ id: `th-${i + 3}`, student_id: s.id, teacher_id: t.id, subject: pick(['Bus timing', 'Homework query', 'Uniform', 'Fee receipt', 'Health update']), messages: [{ from: 'parent', text: pick(['Could you please share the revised timetable?', 'My child was unwell yesterday, kindly excuse the missed test.', 'The bus came 15 minutes late today.', 'Please share the syllabus for PT-2.']), at: at(int(2, 60)) }] });
  });

  // ── Gate passes (OTP pickup) ──
  const gate_passes = Array.from({ length: 6 }, (_, i) => {
    const s = students[int(0, students.length - 1)];
    const status = i < 2 ? 'pending' : i < 5 ? 'verified' : 'expired';
    return { id: `gp-${i}`, student_id: s.id, pickup_by: pick(['Father', 'Mother', 'Grandfather', 'Uncle', 'Driver']) , pickup_name: `${pick(['Rajesh', 'Sunita', 'Mahesh', 'Anil', 'Rekha'])} ${s.full_name.split(' ')[1]}`, reason: pick(['Doctor appointment', 'Family function', 'Feeling unwell', 'Early leave — travel']), otp: String(int(1000, 9999)), requested_at: at(i * 0.7 + 0.2), status, verified_at: status === 'verified' ? at(i * 0.6) : null };
  });

  // ── Health / infirmary ──
  const complaintsH = [['Headache', 'Rest + paracetamol (with parent consent)'], ['Stomach ache', 'ORS, rest in infirmary'], ['Minor cut (playground)', 'Cleaned and dressed'], ['Fever 100.4°F', 'Parent called, sent home'], ['Nose bleed', 'Cold compress'], ['Sprained ankle', 'Ice pack, parent informed']];
  const health_visits = Array.from({ length: 14 }, (_, i) => {
    const s = i === 0 ? kidA : students[int(0, students.length - 1)];
    const [c, a] = pick(complaintsH);
    return { id: `hv-${i}`, student_id: s.id, at: at(i * 9 + 3), complaint: c, action: a, nurse: 'Sr. Nurse Anita Paul', parent_notified: r() > 0.3 };
  });
  health_visits[0].complaint = 'Mild headache'; health_visits[0].action = 'Rested 20 min, returned to class'; health_visits[0].at = at(30);
  const health_profiles = Object.fromEntries(students.map((s) => [s.id, {
    height_cm: 120 + (sections.find((x) => x.id === s.section_id)?.grade || 8) * 4 + int(-6, 8), weight_kg: 25 + (sections.find((x) => x.id === s.section_id)?.grade || 8) * 2 + int(-4, 8),
    vision: pick(['6/6', '6/6', '6/9']), allergies: r() > 0.85 ? pick(['Peanuts', 'Dust', 'Lactose', 'Penicillin']) : 'None',
    vaccinations: { 'MMR': true, 'Hepatitis B': true, 'Typhoid': r() > 0.2, 'HPV': r() > 0.7, 'Td booster': r() > 0.4 },
  }]));

  // ── Certificates ──
  const certificates = Array.from({ length: 8 }, (_, i) => {
    const s = students[int(0, students.length - 1)];
    return { id: `ct-${i}`, type: pick(['Bonafide', 'Transfer Certificate', 'Character', 'Fee Paid', 'Bonafide']), student_id: s.id, requested_on: iso(addDays(today, -int(0, 12))), status: pick(['issued', 'issued', 'pending']), serial: `${P}/CERT/${2026}/${pad(301 + i, 4)}` };
  });

  // ── Payroll / HR ──
  const payroll = teachers.map((t, i) => {
    const basic = t.designation === 'PGT' ? 52000 : t.designation === 'TGT' ? 42000 : 34000;
    const hra = Math.round(basic * 0.2), da = Math.round(basic * 0.12), ta = 2400;
    const pf = Math.round(basic * 0.12), pt = 200, tds = t.designation === 'PGT' ? 3100 : 1200;
    const lop = i === 4 ? 1 : 0;
    const gross = basic + hra + da + ta;
    const net = gross - pf - pt - tds - Math.round((gross / 30) * lop);
    return { id: `pay-${t.id}`, teacher_id: t.id, month: today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), basic, hra, da, ta, pf, pt, tds, lop, gross, net, status: i < 3 ? 'processing' : 'paid', present_days: 26 - lop - (i % 3 === 0 ? 1 : 0), working_days: 26 };
  });
  const staff_support = [
    ['Office Superintendent', 'Admin', 38000], ['Accountant', 'Accounts', 36000], ['Receptionist', 'Front Office', 24000], ['Librarian', 'Library', 30000],
    ['Lab Assistant', 'Science', 22000], ['School Nurse', 'Infirmary', 28000], ['Driver', 'Transport', 19000], ['Driver', 'Transport', 19000], ['Security Guard', 'Security', 16000], ['Peon', 'Admin', 14000],
  ].map(([role, dept, sal], i) => ({ id: `sup-${i}`, name: `${pick(['Ramesh', 'Suresh', 'Kamla', 'Geeta', 'Mohan', 'Sunil', 'Rekha', 'Vijay'])} ${pick(last)}`, role, dept, salary: sal, status: 'paid' }));

  // ── Inventory / assets ──
  const inventory = [
    ['Smart board (86")', 'IT', 24, 'Good'], ['Desktop computer', 'IT', 60, 'Good'], ['Projector', 'IT', 12, 'Needs service'], ['Student desk-bench', 'Furniture', 640, 'Good'],
    ['Teacher table', 'Furniture', 48, 'Good'], ['Microscope', 'Science lab', 30, 'Good'], ['Bunsen burner', 'Science lab', 40, 'Good'], ['Football', 'Sports', 25, 'Low stock'],
    ['Cricket kit', 'Sports', 6, 'Good'], ['A4 paper (reams)', 'Stationery', 45, 'Low stock'], ['Whiteboard markers (box)', 'Stationery', 12, 'Low stock'], ['Fire extinguisher', 'Safety', 36, 'Refill due'],
    ['CCTV camera', 'Security', 64, 'Good'], ['RO water purifier', 'Facilities', 14, 'Good'], ['School bus tyres', 'Transport', 12, 'Good'],
  ].map(([name, category, qty, condition], i) => ({ id: `inv-${i}`, code: `${P}-AST-${pad(i + 1, 4)}`, name, category, qty, condition, location: pick(['Block A', 'Block B', 'Computer Lab', 'Store room', 'Sports room', 'Science Lab']), value: qty * int(200, 45000) }));

  // ── Calendar ──
  const Y = today.getFullYear();
  const calendar = [
    [iso(new Date(Y, 9, 2)), 'Gandhi Jayanti', 'holiday'], [iso(new Date(Y, 9, 20)), 'Dussehra', 'holiday'], [iso(new Date(Y, 10, 8)), 'Diwali break begins', 'holiday'],
    [iso(new Date(Y, 10, 14)), 'Children’s Day celebration', 'event'], [iso(addDays(today, 2)), 'Parent–Teacher Meeting', 'ptm'], [iso(addDays(today, 18)), 'Annual Sports Day', 'event'],
    [iso(addDays(today, 24)), 'Periodic Test 2 begins', 'exam'], [iso(addDays(today, 30)), 'Periodic Test 2 ends', 'exam'], [iso(addDays(today, 9)), 'Inter-house Science Exhibition', 'event'],
    [iso(addDays(today, 5)), 'Fire safety drill', 'event'], [iso(new Date(Y, 11, 25)), 'Christmas', 'holiday'], [iso(new Date(Y, 11, 12)), 'Annual Day rehearsal', 'event'],
    [iso(addDays(today, -3)), 'Hindi Diwas', 'event'], [iso(addDays(today, 12)), 'Staff development workshop', 'staff'],
  ].map(([date, title, type], i) => ({ id: `cal-${i}`, date, title, type }));

  // ── Co-scholastic (NEP holistic progress) ──
  const CO = ['Art & craft', 'Music', 'Dance', 'Sports', 'Yoga', 'Discipline', 'Leadership', 'Teamwork'];
  const co_scholastic = Object.fromEntries(students.map((s) => [s.id, CO.map((area) => ({ area, grade: pick(['A', 'A', 'B', 'A', 'B', 'C']) }))]));

  // ── Achievements & discipline (student 360) ──
  const achievements = Array.from({ length: 18 }, (_, i) => {
    const s = i === 0 ? kidA : students[int(0, students.length - 1)];
    return { id: `ach-${i}`, student_id: s.id, title: pick(['1st — Inter-house quiz', 'Gold — District athletics 100 m', 'Best speaker — debate', 'Merit — Olympiad (Maths)', 'Star of the month', 'Science exhibition — 2nd prize']), date: iso(addDays(today, -int(5, 120))) };
  });

  // ── Communication hub: WhatsApp / SMS / Email / App push ──
  const comm_templates = [
    { id: 'tpl-absent', name: 'Absent alert', channel: ['whatsapp', 'sms', 'push'], trigger: 'Student marked absent', text: 'Dear Parent, {student} of Class {class} is absent today ({date}). If this is unplanned, please contact the class teacher. — {school}' },
    { id: 'tpl-fee', name: 'Fee reminder', channel: ['whatsapp', 'email'], trigger: '3 days before due date', text: 'Dear Parent, {fee_head} of ₹{amount} for {student} is due on {due_date}. Pay online: {pay_link} — {school}' },
    { id: 'tpl-receipt', name: 'Fee receipt', channel: ['email', 'push'], trigger: 'Payment received', text: 'Payment of ₹{amount} received for {student}. Receipt no. {receipt}. Thank you! — {school}' },
    { id: 'tpl-result', name: 'Result published', channel: ['whatsapp', 'push', 'email'], trigger: 'Results published', text: 'Report card for {exam} is now available for {student}. View: {link} — {school}' },
    { id: 'tpl-hw', name: 'Homework posted', channel: ['push'], trigger: 'Homework added', text: 'New {subject} homework for {class}: {title}. Due {due_date}.' },
    { id: 'tpl-bus', name: 'Bus near stop', channel: ['push', 'whatsapp'], trigger: 'Bus 1 stop away', text: 'Bus {route} is 1 stop away from {stop}. ETA {eta}.' },
    { id: 'tpl-bday', name: 'Birthday wish', channel: ['whatsapp'], trigger: 'Student birthday', text: 'Happy Birthday {student}! 🎂 Wishing you a wonderful year ahead. — Team {school}' },
    { id: 'tpl-ptm', name: 'PTM invite', channel: ['whatsapp', 'email', 'sms'], trigger: 'Manual broadcast', text: 'PTM on {date}. Book your slot with the class teacher in the app: {link}' },
  ];
  const automations = [
    { id: 'au-1', name: 'Absent → WhatsApp + SMS to parent', when: 'Attendance saved, 09:30 AM', template: 'tpl-absent', on: true, sent_month: 412 },
    { id: 'au-2', name: 'Fee due reminder (T-3, T-0, T+3)', when: 'Daily 10:00 AM', template: 'tpl-fee', on: true, sent_month: 1260 },
    { id: 'au-3', name: 'Receipt on payment', when: 'Instantly', template: 'tpl-receipt', on: true, sent_month: 1588 },
    { id: 'au-4', name: 'Bus approaching stop', when: 'Live GPS geofence', template: 'tpl-bus', on: true, sent_month: 3240 },
    { id: 'au-5', name: 'Birthday wishes', when: 'Daily 07:00 AM', template: 'tpl-bday', on: false, sent_month: 0 },
    { id: 'au-6', name: 'Result published alert', when: 'On publish', template: 'tpl-result', on: true, sent_month: 660 },
  ];
  const CH = ['whatsapp', 'sms', 'email', 'push'];
  const comm_logs = Array.from({ length: 40 }, (_, i) => {
    const s = students[int(0, students.length - 1)];
    const tpl = pick(comm_templates);
    const channel = pick(tpl.channel);
    const st = r();
    return { id: `cl-${i}`, at: at(i * 0.35 + 0.05), channel, template: tpl.name, to: channel === 'email' ? s.guardian_email : s.guardian_phone, student_id: s.id, status: channel === 'whatsapp' ? (st > 0.3 ? 'read' : st > 0.05 ? 'delivered' : 'failed') : channel === 'email' ? (st > 0.4 ? 'opened' : 'delivered') : st > 0.04 ? 'delivered' : 'failed' };
  });
  const comm_stats = { whatsapp: { sent: 4820, delivered: 4731, read: 4102 }, sms: { sent: 2210, delivered: 2168 }, email: { sent: 3380, delivered: 3322, opened: 2104 }, push: { sent: 9640, delivered: 9511 } };
  void CH;

  // ── Branches (multi-campus group) ──
  const branches = [
    { id: 'br-1', name: `${school.short_name} — Main Campus`, city: school.city, students: 2450, teachers: 142, attendance: 96.4, fee_collection: 91, head: school.principal_name, established: school.established, main: true },
    { id: 'br-2', name: `${school.short_name} — North Campus`, city: school.city, students: 1320, teachers: 78, attendance: 94.8, fee_collection: 86, head: 'Mrs. Kavita Rao', established: 2011 },
    { id: 'br-3', name: `${school.short_name} — Junior Wing`, city: school.city, students: 860, teachers: 52, attendance: 97.1, fee_collection: 93, head: 'Ms. Priya Nair', established: 2016 },
    { id: 'br-4', name: `${school.short_name} — ${school.city === 'Jaipur' ? 'Ajmer' : 'Kanpur'} Branch`, city: school.city === 'Jaipur' ? 'Ajmer' : 'Kanpur', students: 1040, teachers: 64, attendance: 93.2, fee_collection: 81, head: 'Mr. Deepak Verma', established: 2019 },
  ];

  return { comm_templates, automations, comm_logs, comm_stats, branches, admissions, books, book_loans, question_bank, online_tests, test_attempts, lesson_plans, ptm_slots, threads, gate_passes, health_visits, health_profiles, certificates, payroll, staff_support, inventory, calendar, co_scholastic, achievements };
}
