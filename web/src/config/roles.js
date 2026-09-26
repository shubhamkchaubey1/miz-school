// One design system + one permission engine + role-specific navigation.
// Navigation is configuration — schools can switch modules off (feature flags).

export const MODULES = {
  dashboard: { label: 'Dashboard', icon: 'home' },
  schools: { label: 'Schools', icon: 'building' },
  subscriptions: { label: 'Subscriptions & Billing', icon: 'receipt' },
  plans: { label: 'Plans & Pricing', icon: 'tag' },
  onboarding: { label: 'Website Import', icon: 'globe' },
  insights: { label: 'Smart Insights', icon: 'trend' },
  branches: { label: 'Branches', icon: 'building' },
  admissions: { label: 'Admissions CRM', icon: 'user-plus' },
  students: { label: 'Students', icon: 'users' },
  teachers: { label: 'Teachers & Staff', icon: 'id' },
  classes: { label: 'Classes & Sections', icon: 'layers' },
  attendance: { label: 'Attendance', icon: 'check' },
  timetable: { label: 'Timetable', icon: 'calendar' },
  lessons: { label: 'Lesson Plans & Syllabus', icon: 'clip-list' },
  homework: { label: 'Homework', icon: 'book' },
  tests: { label: 'Online Tests', icon: 'clip-check' },
  results: { label: 'Exams & Report Cards', icon: 'award' },
  library: { label: 'Library', icon: 'library' },
  fees: { label: 'Fees', icon: 'wallet' },
  payroll: { label: 'Payroll & HR', icon: 'coins' },
  inventory: { label: 'Inventory & Assets', icon: 'package' },
  communication: { label: 'WhatsApp, SMS & Email', icon: 'chat' },
  notices: { label: 'Notices', icon: 'megaphone' },
  messages: { label: 'Messages', icon: 'message' },
  ptm: { label: 'PTM Booking', icon: 'cal-check' },
  calendar: { label: 'School Calendar', icon: 'calendar' },
  leave: { label: 'Leave Requests', icon: 'plane' },
  transport: { label: 'Transport', icon: 'bus' },
  trip: { label: "Today's Trip", icon: 'route' },
  gatepass: { label: 'Gate Pass (OTP)', icon: 'door' },
  reception: { label: 'Front Office', icon: 'desk' },
  hostel: { label: 'Hostel', icon: 'bed' },
  canteen: { label: 'Canteen', icon: 'coffee' },
  health: { label: 'Health & Infirmary', icon: 'health' },
  certificates: { label: 'Certificates & ID Cards', icon: 'badge' },
  scanner: { label: 'Gate Scanner', icon: 'qr' },
  reports: { label: 'Reports', icon: 'chart' },
  permissions: { label: 'Users & Access', icon: 'shield' },
  settings: { label: 'School Settings', icon: 'settings' },
  notifications: { label: 'Notifications', icon: 'bell' },
};

export const ROLES = [
  {
    key: 'school_admin', icon: 'settings', label: 'School Admin', person: 'Rohit Bhatnagar', title: 'Administrator',
    blurb: 'Every module: admissions, academics, fees, payroll, communication and settings.',
    nav: [
      ['Overview', ['dashboard', 'insights', 'branches', 'notifications']],
      ['Admissions', ['admissions', 'students', 'certificates']],
      ['Academic', ['teachers', 'classes', 'timetable', 'attendance', 'lessons', 'homework', 'tests', 'results', 'library']],
      ['Finance', ['fees', 'payroll', 'inventory']],
      ['Communication', ['communication', 'notices', 'messages', 'ptm', 'calendar', 'leave']],
      ['Operations', ['transport', 'gatepass', 'hostel', 'canteen', 'health', 'reception']],
      ['Administration', ['reports', 'permissions', 'settings']],
    ],
    bottom: ['dashboard', 'students', 'attendance', 'fees', 'communication'],
  },
  {
    key: 'principal', icon: 'award', label: 'Principal', person: null, title: 'Principal',
    blurb: 'School overview, smart insights, academics, staff and approvals.',
    nav: [
      ['Overview', ['dashboard', 'insights', 'branches', 'reports', 'notifications']],
      ['Academic', ['students', 'teachers', 'attendance', 'lessons', 'results', 'timetable']],
      ['Finance', ['fees', 'payroll']],
      ['Communication', ['communication', 'notices', 'calendar', 'leave']],
      ['Operations', ['admissions', 'health', 'transport']],
    ],
    bottom: ['dashboard', 'insights', 'attendance', 'results', 'fees'],
  },
  {
    key: 'teacher', icon: 'book', label: 'Teacher', person: null, title: 'Class Teacher · 8A',
    blurb: 'My classes, attendance, lesson plans, homework, online tests and marks.',
    nav: [
      ['My Day', ['dashboard', 'timetable', 'calendar', 'notifications']],
      ['Classroom', ['attendance', 'lessons', 'homework', 'tests', 'results', 'students']],
      ['Parents', ['messages', 'ptm', 'notices', 'leave']],
    ],
    bottom: ['dashboard', 'timetable', 'attendance', 'homework', 'messages'],
  },
  {
    key: 'parent', icon: 'users', label: 'Parent', person: null, title: 'Parent',
    blurb: 'Children, attendance, homework, results, fees, bus, PTM, chat and gate pass.',
    nav: [
      ['My Children', ['dashboard', 'attendance', 'timetable', 'homework', 'results', 'health']],
      ['Payments', ['fees']],
      ['Connect', ['messages', 'ptm', 'notices', 'calendar', 'leave']],
      ['Safety', ['transport', 'gatepass', 'notifications']],
    ],
    bottom: ['dashboard', 'attendance', 'fees', 'messages', 'transport'],
  },
  {
    key: 'student', icon: 'cap', label: 'Student', person: null, title: 'Student · 8A',
    blurb: 'Timetable, homework, online tests, results, library and notices.',
    nav: [
      ['My School', ['dashboard', 'timetable', 'homework', 'tests', 'attendance', 'results']],
      ['Resources', ['library', 'calendar']],
      ['Updates', ['notices', 'notifications']],
    ],
    bottom: ['dashboard', 'timetable', 'homework', 'tests', 'results'],
  },
  {
    key: 'driver', icon: 'bus', label: 'Driver', person: null, title: 'Driver · Route R-01',
    blurb: 'Today’s route, pickup points, boarding and trip log.',
    nav: [['Duty', ['dashboard', 'trip', 'transport', 'notifications']]],
    bottom: ['dashboard', 'trip', 'transport', 'notifications'],
  },
  {
    key: 'reception', icon: 'desk', label: 'Reception', person: 'Kiran Sethi', title: 'Front Office',
    blurb: 'Admissions CRM, visitor book, calls, gate passes and complaints.',
    nav: [
      ['Front Office', ['dashboard', 'admissions', 'reception', 'gatepass', 'students', 'certificates']],
      ['Updates', ['calendar', 'notices', 'notifications']],
    ],
    bottom: ['dashboard', 'admissions', 'reception', 'gatepass'],
  },
  {
    key: 'accountant', icon: 'coins', label: 'Accountant', person: 'Vinod Khandelwal', title: 'Accounts Office',
    blurb: 'Fee collection, dues, payroll, inventory and financial reports.',
    nav: [
      ['Accounts', ['dashboard', 'fees', 'payroll', 'inventory', 'reports']],
      ['Updates', ['communication', 'notices']],
    ],
    bottom: ['dashboard', 'fees', 'payroll', 'reports'],
  },
  {
    key: 'librarian', icon: 'library', label: 'Librarian', person: 'Sunita Mathur', title: 'School Library',
    blurb: 'Catalogue, issue/return, overdue fines and reading reports.',
    nav: [['Library', ['dashboard', 'library', 'students', 'notices']]],
    bottom: ['dashboard', 'library', 'students'],
  },
  {
    key: 'warden', icon: 'bed', label: 'Warden', person: null, title: 'Hostel Warden',
    blurb: 'Hostels, rooms, allocations, health and night roll call.',
    nav: [['Hostel', ['dashboard', 'hostel', 'students', 'health', 'gatepass', 'notices']]],
    bottom: ['dashboard', 'hostel', 'students', 'health'],
  },
  {
    key: 'canteen', icon: 'coffee', label: 'Canteen', person: 'Ramesh Kumar', title: 'Canteen Manager',
    blurb: 'Menu items, stock, billing and daily sales.',
    nav: [['Canteen', ['dashboard', 'canteen', 'notices']]],
    bottom: ['dashboard', 'canteen', 'notices'],
  },
  {
    key: 'scanner', icon: 'qr', label: 'Gate Scanner', person: 'Mahesh Chand', title: 'Gate 1 · Main Gate',
    blurb: 'QR check-in, OTP gate-pass verification and visitor passes.',
    nav: [['Gate', ['dashboard', 'scanner', 'gatepass', 'attendance', 'notifications']]],
    bottom: ['dashboard', 'scanner', 'gatepass', 'attendance'],
  },
  {
    key: 'super_admin', icon: 'building', label: 'Miz Super Admin', person: 'Ankit Verma', title: 'Miz Operations',
    blurb: 'All schools, subscriptions, plans and onboarding.', platform: true,
    nav: [
      ['Platform', ['dashboard', 'schools', 'subscriptions', 'plans', 'onboarding']],
    ],
    bottom: ['dashboard', 'schools', 'subscriptions', 'plans'],
  },
];

export const roleByKey = (k) => ROLES.find((r) => r.key === k);

// Permission matrix shown in Settings → Roles & Permissions (mirrors role_permissions seed)
export const PERMISSION_MATRIX = [
  ['Students', ['student.read', 'student.create', 'student.update']],
  ['Attendance', ['attendance.read', 'attendance.mark', 'attendance.correct']],
  ['Timetable', ['timetable.read', 'timetable.manage']],
  ['Homework', ['homework.read', 'homework.create']],
  ['Results', ['results.read', 'results.create', 'results.publish']],
  ['Fees', ['fees.read', 'fees.collect', 'fees.refund']],
  ['Notices', ['notices.read', 'notices.create']],
  ['Transport', ['transport.read', 'transport.trip.manage', 'transport.route.manage']],
  ['Operations', ['reception.manage', 'hostel.manage', 'canteen.manage', 'scanner.scan']],
  ['Administration', ['school.settings', 'payroll.manage']],
];
const ALL = PERMISSION_MATRIX.flatMap(([, p]) => p);
export const ROLE_PERMISSIONS = {
  school_admin: ALL,
  principal: ALL.filter((p) => !['payroll.manage', 'fees.refund'].includes(p)),
  teacher: ['student.read', 'attendance.read', 'attendance.mark', 'timetable.read', 'homework.read', 'homework.create', 'results.read', 'results.create', 'notices.read'],
  parent: ['attendance.read', 'timetable.read', 'homework.read', 'results.read', 'fees.read', 'notices.read', 'transport.read'],
  student: ['attendance.read', 'timetable.read', 'homework.read', 'results.read', 'notices.read'],
  driver: ['transport.read', 'transport.trip.manage', 'notices.read'],
  reception: ['reception.manage', 'student.read', 'notices.read'],
  warden: ['hostel.manage', 'student.read', 'notices.read'],
  canteen: ['canteen.manage', 'notices.read'],
  scanner: ['scanner.scan', 'attendance.mark'],
  accountant: ['fees.read', 'fees.collect', 'fees.refund', 'payroll.manage', 'student.read', 'notices.read'],
  librarian: ['student.read', 'notices.read'],
};
