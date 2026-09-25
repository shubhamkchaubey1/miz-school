import Dashboard from '../dashboards/Dashboards.jsx';
import { Students, Teachers, Classes, Attendance, Timetable, Homework, Results } from './Academic.jsx';
import { Fees, Notices, Leave, Notifications, Reports } from './Office.jsx';
import { Transport, Trip, Reception, Hostel, Canteen, Scanner } from './Operations.jsx';
import { Settings, Permissions, Schools, Subscriptions, Plans, Onboarding } from './Admin.jsx';

export const MODULE_PAGES = {
  dashboard: Dashboard,
  students: Students, teachers: Teachers, classes: Classes, attendance: Attendance, timetable: Timetable,
  homework: Homework, results: Results, fees: Fees, notices: Notices, leave: Leave, notifications: Notifications,
  reports: Reports, transport: Transport, trip: Trip, reception: Reception, hostel: Hostel, canteen: Canteen,
  scanner: Scanner, settings: Settings, permissions: Permissions,
  schools: Schools, subscriptions: Subscriptions, plans: Plans, onboarding: Onboarding,
};
