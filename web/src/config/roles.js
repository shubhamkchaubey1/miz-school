// One design system + one permission engine + role-specific navigation.
// Navigation is configuration — schools can switch modules off (feature flags).

export const MODULES = {
  dashboard: { label: 'Dashboard', icon: 'home' },
  schools: { label: 'Schools', icon: 'building' },
  subscriptions: { label: 'Subscriptions & Billing', icon: 'receipt' },
  plans: { label: 'Plans & Pricing', icon: 'tag' },
  onboarding: { label: 'Website Import', icon: 'globe' },
  students: { label: 'Students', icon: 'users' },
  teachers: { label: 'Teachers & Staff', icon: 'id' },
  classes: { label: 'Classes & Sections', icon: 'layers' },
  attendance: { label: 'Attendance', icon: 'check' },
  timetable: { label: 'Timetable', icon: 'calendar' },
  homework: { label: 'Homework', icon: 'book' },
  results: { label: 'Exams & Results', icon: 'award' },
  fees: { label: 'Fees', icon: 'wallet' },
  notices: { label: 'Notices', icon: 'megaphone' },
  leave: { label: 'Leave Requests', icon: 'plane' },
  transport: { label: 'Transport', icon: 'bus' },
  trip: { label: "Today's Trip", icon: 'route' },
  reception: { label: 'Front Office', icon: 'desk' },
  hostel: { label: 'Hostel', icon: 'bed' },
  canteen: { label: 'Canteen', icon: 'coffee' },
  scanner: { label: 'Gate Scanner', icon: 'qr' },
  reports: { label: 'Reports', icon: 'chart' },
  permissions: { label: 'Roles & Permissions', icon: 'shield' },
  settings: { label: 'School Settings', icon: 'settings' },
  notifications: { label: 'Notifications', icon: 'bell' },
};

export const ROLES = [
  {
    key: 'school_admin', icon: 'settings', label: 'School Admin', person: 'Rohit Bhatnagar', title: 'Administrator',
    blurb: 'Students, staff, fees, timetable and every school setting.',
    nav: [
      ['Overview', ['dashboard', 'notifications']],
      ['Academic', ['students', 'teachers', 'classes', 'timetable', 'attendance', 'homework', 'results']],
      ['Finance', ['fees']],
      ['Operations', ['transport', 'hostel', 'canteen', 'reception']],
      ['Communication', ['notices', 'leave']],
      ['Administration', ['reports', 'permissions', 'settings']],
    ],
    bottom: ['dashboard', 'students', 'attendance', 'fees', 'notices'],
  },
  {
    key: 'principal', icon: 'award', label: 'Principal', person: null, title: 'Principal',
    blurb: 'School overview, academics, staff and approvals.',
    nav: [
      ['Overview', ['dashboard', 'notifications', 'reports']],
      ['Academic', ['students', 'teachers', 'classes', 'attendance', 'timetable', 'results']],
      ['Finance', ['fees']],
      ['Communication', ['notices', 'leave']],
    ],
    bottom: ['dashboard', 'attendance', 'results', 'fees', 'notices'],
  },
  {
    key: 'teacher', icon: 'book', label: 'Teacher', person: null, title: 'Class Teacher · 8A',
    blurb: 'My classes, attendance, homework and marks entry.',
    nav: [
      ['My Day', ['dashboard', 'timetable', 'notifications']],
      ['Classroom', ['attendance', 'homework', 'results', 'students']],
      ['Communication', ['notices', 'leave']],
    ],
    bottom: ['dashboard', 'timetable', 'attendance', 'homework', 'results'],
  },
  {
    key: 'parent', icon: 'users', label: 'Parent', person: null, title: 'Parent',
    blurb: 'Children, attendance, homework, results, fees and bus.',
    nav: [
      ['My Children', ['dashboard', 'attendance', 'timetable', 'homework', 'results']],
      ['Payments', ['fees']],
      ['School', ['transport', 'notices', 'leave', 'notifications']],
    ],
    bottom: ['dashboard', 'attendance', 'homework', 'fees', 'notifications'],
  },
  {
    key: 'student', icon: 'cap', label: 'Student', person: null, title: 'Student · 8A',
    blurb: 'Timetable, assignments, results and notices.',
    nav: [
      ['My School', ['dashboard', 'timetable', 'homework', 'attendance', 'results']],
      ['Updates', ['notices', 'notifications']],
    ],
    bottom: ['dashboard', 'timetable', 'homework', 'results', 'notices'],
  },
  {
    key: 'driver', icon: 'bus', label: 'Driver', person: null, title: 'Driver · Route R-01',
    blurb: 'Today’s route, pickup points and trip log.',
    nav: [['Duty', ['dashboard', 'trip', 'transport', 'notifications']]],
    bottom: ['dashboard', 'trip', 'transport', 'notifications'],
  },
  {
    key: 'reception', icon: 'desk', label: 'Reception', person: 'Kiran Sethi', title: 'Front Office',
    blurb: 'Enquiries, visitor book, calls, postal and complaints.',
    nav: [
      ['Front Office', ['dashboard', 'reception', 'students']],
      ['Updates', ['notices', 'notifications']],
    ],
    bottom: ['dashboard', 'reception', 'students', 'notices'],
  },
  {
    key: 'warden', icon: 'bed', label: 'Warden', person: null, title: 'Hostel Warden',
    blurb: 'Hostels, rooms, allocations and occupancy.',
    nav: [['Hostel', ['dashboard', 'hostel', 'students', 'notices']]],
    bottom: ['dashboard', 'hostel', 'students', 'notices'],
  },
  {
    key: 'canteen', icon: 'coffee', label: 'Canteen', person: 'Ramesh Kumar', title: 'Canteen Manager',
    blurb: 'Menu items, stock, billing and daily sales.',
    nav: [['Canteen', ['dashboard', 'canteen', 'notices']]],
    bottom: ['dashboard', 'canteen', 'notices'],
  },
  {
    key: 'scanner', icon: 'qr', label: 'Gate Scanner', person: 'Mahesh Chand', title: 'Gate 1 · Main Gate',
    blurb: 'QR check-in for students, staff and visitors.',
    nav: [['Gate', ['dashboard', 'scanner', 'attendance', 'notifications']]],
    bottom: ['dashboard', 'scanner', 'attendance'],
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
};
