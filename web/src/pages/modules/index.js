import Dashboard from '../dashboards/Dashboards.jsx';
import { Students, Teachers, Classes, Attendance, Timetable, Homework, Results } from './Academic.jsx';
import { Fees, Notices, Leave, Notifications, Reports } from './Office.jsx';
import { Transport, Trip, Reception, Hostel, Canteen, Scanner } from './Operations.jsx';
import { Settings, Permissions, Schools, Subscriptions, Plans, Onboarding } from './Admin.jsx';
import { Insights, Branches, Admissions, Communication, Messages, PTM, CalendarPage, GatePass } from './Smart1.jsx';
import { Allocation, MyClasses, ClassRoles } from './Allocation.jsx';
import { Substitution, StaffAttendance, Promotion } from './Staffing.jsx';
import { Lessons, Tests, Library, Payroll, Inventory, Health, Certificates } from './Smart2.jsx';

export const MODULE_PAGES = {
  dashboard: Dashboard,
  students: Students, teachers: Teachers, classes: Classes, attendance: Attendance, timetable: Timetable,
  homework: Homework, results: Results, fees: Fees, notices: Notices, leave: Leave, notifications: Notifications,
  reports: Reports, transport: Transport, trip: Trip, reception: Reception, hostel: Hostel, canteen: Canteen,
  scanner: Scanner, settings: Settings, permissions: Permissions,
  insights: Insights, branches: Branches, admissions: Admissions, communication: Communication, messages: Messages, ptm: PTM,
  calendar: CalendarPage, gatepass: GatePass, lessons: Lessons, tests: Tests, library: Library, payroll: Payroll,
  inventory: Inventory, health: Health, certificates: Certificates,
  allocation: Allocation, myclasses: MyClasses, classroles: ClassRoles, substitution: Substitution, staffatt: StaffAttendance, promotion: Promotion,
  schools: Schools, subscriptions: Subscriptions, plans: Plans, onboarding: Onboarding,
};
