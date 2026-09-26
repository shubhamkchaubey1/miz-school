# Miz School: screen-by-screen functional spec (taken from the code)

Source root: `/home/claude/miz-school/web/src`. Every quoted label below is the exact UI string. `inr(n)` prints `₹1,23,456`. `inr(n, true)` is the compact form: `₹x.xx Cr` from 1e7, `₹x.x L` from 1e5, `₹x.xk` from 1e3. `pct(n,d)` prints `n.toFixed(d)%`. `ago()` prints `Just now` / `N min ago` / `N hr ago` / `Yesterday` / `N days ago`.

---

## 0. Global framework

### Routing and access (App.jsx, lib/store.jsx, config/roles.js)
- **Route:** `#/s/:slug/:role/:module`.
  - An unknown role falls back to `school_admin`.
  - If the module is not in `access[role]`, the dashboard renders instead, with no message.
  - `dashboard` is always allowed and always edit.
- **Loading state:** a crest plus `Loading school…`. On error: `Could not load school data: <msg>`.
- **Default access (`defaultAccess`):** every module in a role's `nav` becomes `'edit'` if the role is `school_admin` or the module is in `EDIT_DEFAULT[role]`. Otherwise it is `'view'`. Modules not in the nav are absent, which means hidden and blocked.
  - Stored in localStorage `miz-access` with `__v: 3`. A version mismatch resets to defaults.
- **View-only page:**
  - Banner: `View only — you can see this page but not change anything. The school admin can give edit access in Users & Access.`
  - The page is wrapped in `.view-only`, which dims `.btn-primary` buttons (opacity .5, not-allowed cursor). They are still clickable.
- **Guarded actions:** every `actions.*` call checks the current module's level.
  - If the level is `view`: toast `View-only access — ask the school admin for edit rights`, plus an audit entry `{kind:'security', action:'Blocked: tried to <humanized action name> with view-only access'}`. Nothing else happens.
  - On a view-only page, every other toast is suppressed. Only toasts starting with `View-only` show.
  - If allowed: the action runs, then an audit entry is written with the `describe()` text, module = the current module (or `dashboard`), `kind:'change'`.
  - Every audit entry carries: `user` = persona name, `role`, `device:'Chrome · Windows'`, `ip:'103.87.14.22'`.
  - `actions.logAudit` itself is not guarded.
- **`push(audiences, title, body, kind, channels=['push','whatsapp'])`:**
  - Adds one in-app notification per audience.
  - Adds one `comm_logs` row per channel: `{channel, template:title, to:audiences.join(', '), status:'sent'}`.
- **Toast:** lasts 2600 ms, shown with a tick icon.

### `describe()` audit texts (exact)
| Action | Audit text |
|---|---|
| saveAttendance | `Marked attendance · Class {sec} · {date}` |
| markStudent | `Changed attendance of {student} to {status}` |
| payInvoice | `Fee received · {student} · ₹{amount en-IN} · {method or UPI}` |
| addNotice | `Published notice “{title}”` |
| addHomework | `Posted homework · Class {sec} · {subject}` |
| addLeave | `Leave request · {requester}` |
| setLeave | `Leave {status}` |
| saveMarks | `Saved marks · {subject} · {n} students changed` |
| setBranding | `Changed school branding` |
| allocSetCell / allocPublish / allocAuto / setClassTeacher / markStaff / assignSub / autoAssignSubs / setStudentRole / vote / closeElection | (see store; out of scope screens) |
| restoreData | none (restoreData writes its own security entry) |
| push | `Sent notification “{title}” to {audiences}` |
| update | `Updated {table with _→space}` |
| any other action | the humanized name with a capital first letter, e.g. `Add visitor`, `Checkout visitor`, `Add enquiry`, `Set complaint`, `Add sale`, `Restock` |

### Store actions: data changes and notifications
| Action | Data change | Notifications: audience / title / body / kind / channels |
|---|---|---|
| payInvoice(id, method='UPI') | invoice → `status:'paid'`, `paid_on: today`, `method`, `receipt_no: RCPT-<floor(90000+rand*9999)>` | parent, accountant, school_admin / `Fee payment received` / `Paid via {method}. Receipt sent by email.` / fees / push, email, whatsapp |
| addNotice(n) | prepend `{id, published_at: now, priority:'normal', ...n}` | all / title / first 90 characters of the body / notice / push, whatsapp, email |
| addLeave(l) | prepend `{status:'pending', ...l}` | teacher / `New leave request` / `{requester}: {reason}` / leave / push |
| setLeave(id, s) | sets the status | parent / `Leave {status}` / `Your leave request was reviewed by the class teacher.` / leave / push, whatsapp |
| saveAttendance | replaces that section and date | if any absent: parent, school_admin / `{n} student(s) marked absent` / `Parents alerted on WhatsApp and SMS.` / whatsapp, sms, push |
| markStudent(id, status) | upserts attendance for the latest attendance date | none |
| addVisitor(v) | `{check_in: now, check_out: null, status:'inside', badge_no: V-{120+rows.length}, ...v}` | none |
| checkoutVisitor | `status:'checked_out'`, `check_out: now` | none |
| addEnquiry | `{created_at, status:'new', ...e}` | none |
| setComplaint | sets the status | none |
| addSale(sale, items) | bill `C-{padStart(3300+rows.length, 5, '0')}`; stock −qty, floored at 0 | none |
| restock(id, qty) | stock + qty | none |
| setBranding(patch) | merges into `school` and re-applies CSS variables `--brand`, `--brand-ink`, `--accent`; document title `{short_name} · Miz School` | none |
| restoreData(payload, source) | replaces the tables but keeps `meta` and `school`. Adds a security audit entry: user `Rohit Bhatnagar`, role school_admin, module `backup`, `Restored data from {source}. Safety backup taken first.` Adds a backup row `Safety (before restore)`, 37.4 MB, `verified`, `Mumbai (ap-south-1) + Hyderabad copy`, by `System` | none |

### App shell (layout/AppShell.jsx)
- **Demo bar:**
  - Badge `DEMO` and the text `Sample data only — changes are not saved.`
  - `School` select (DEMO_SCHOOLS short names). Changing it navigates to `/s/{slug}/{role}/dashboard`.
  - `Viewing as` select (all 13 roles). Changing it navigates to that role's dashboard.
  - Link `Exit demo` → `#/demo`.
- **Sidebar:**
  - Header: school crest, `short_name`, `{city} · {board}`. Super admin sees the Miz mark instead.
  - Groups come from `role.nav`. Only modules with access are shown; an empty group is hidden. Group labels are uppercase.
  - Each link shows a tinted icon and the `MODULES[k].label`. The parent's dashboard is labelled `Home`. The active link gets `aria-current="page"`.
  - Footer: `{Role label} access` and `Powered by Miz School`.
- **Topbar:**
  - Hamburger (mobile) opens the drawer.
  - Crest + short name. On desktop: the full school name and chip `AY {academic_year}`. The platform role shows neither.
- **Notification bell:**
  - Shows notifications where `audience==='all' || audience===role || (role==='principal' && audience==='school_admin')`.
  - A dot appears when there are any. Aria label: `Notifications (n)`.
  - Menu: header `Notifications` with badge `{n} new`. Each item shows title, body and `ago`. List max height 340. Footer button `View all` → notifications page.
  - Closes on an outside click.
- **Profile menu:**
  - Avatar, persona name and title.
  - Items: `School settings` (school_admin only), `Switch profile` → `/demo?school={slug}`, `Sign out` → `/s/{slug}/login`.
- **Bottom nav (mobile):**
  - `role.bottom` filtered by access. The label is `Home` for the dashboard; otherwise the first word of the module label with `&` removed.
  - Last item: `More`, which opens the drawer.

### Personas
| Role | Name | Title |
|---|---|---|
| school_admin | Rohit Bhatnagar | Administrator |
| principal | school.principal_name | Principal |
| teacher | class teacher of section 8A | `Class Teacher · 8A` |
| parent | guardian of the roll-3 student in 8A; children = all students with the same guardian phone | `Parent of A & B` (ChildSwitcher picks `child`) |
| student | the roll-3 student in 8A | `Class 8A · Roll 3` |
| driver | route[0] driver | `Driver · {code}` |
| reception | Kiran Sethi | Front Office |
| warden | hostels[0] warden | Hostel Warden |
| canteen | Ramesh Kumar | Canteen Manager |
| scanner | Mahesh Chand | Gate 1 · Main Gate |
| librarian | Sunita Mathur | School Library |
| accountant | Vinod Khandelwal | Accounts Office |
| super_admin | Ankit Verma | Miz School Platform |

### Roles, navigation and default EDIT rights (config/roles.js)
Modules not listed under EDIT are VIEW by default. School Admin has EDIT on every module in its nav.

- **school_admin**
  - Nav: Overview[dashboard, insights, branches, notifications]; Admissions[admissions, students, certificates]; Academic[teachers, classes, allocation, timetable, substitution, attendance, lessons, homework, tests, results, classroles, library]; Staff[staffatt, promotion]; Finance[fees, payroll, inventory]; Communication[communication, notices, messages, ptm, calendar, leave]; Operations[transport, gatepass, hostel, canteen, health, reception]; Administration[reports, audit, backup, permissions, settings].
  - Bottom: dashboard, students, attendance, fees, communication.
  - LOCKED_EDIT (cells cannot be changed): permissions, settings, backup, audit.
- **principal**
  - Nav: Overview[dashboard, insights, branches, reports, audit, notifications]; Academic[students, teachers, allocation, timetable, substitution, attendance, lessons, results, classroles, promotion]; Staff[staffatt, payroll]; Finance[fees]; Communication[communication, notices, calendar, leave]; Operations[admissions, health, transport].
  - EDIT: allocation, substitution, attendance, lessons, results, classroles, promotion, staffatt, communication, notices, calendar, leave, admissions, health, insights, branches, students, teachers, timetable, notifications, reports.
  - Therefore **fees, payroll, audit and transport are VIEW**.
  - Bottom: dashboard, substitution, attendance, results, fees.
- **teacher**
  - Nav: My Day[dashboard, timetable, myclasses, substitution, calendar, notifications]; Classroom[attendance, lessons, homework, tests, results, students, classroles]; Parents[messages, ptm, notices, leave].
  - EDIT: attendance, lessons, homework, tests, results, classroles, messages, ptm, notices, leave, myclasses, notifications.
  - Bottom: dashboard, timetable, attendance, homework, messages.
- **parent**
  - Nav: My Children[dashboard, attendance, timetable, homework, results, classroles, health]; Payments & documents[fees, certificates]; Connect[messages, ptm, notices, calendar, leave]; Safety[transport, gatepass, notifications].
  - EDIT: fees, messages, ptm, leave, gatepass, certificates, notifications.
  - Bottom: dashboard, attendance, fees, messages, transport.
- **student**
  - Nav: My School[dashboard, timetable, homework, tests, attendance, results, classroles]; Resources[library, calendar]; Updates[notices, notifications].
  - EDIT: homework, tests, classroles, library, notifications.
  - Bottom: dashboard, timetable, homework, tests, results.
- **driver**
  - Nav: Duty[dashboard, trip, transport, notifications]. EDIT: trip, notifications.
- **reception**
  - Nav: Front Office[dashboard, admissions, reception, gatepass, students, certificates]; Updates[calendar, notices, notifications].
  - EDIT: admissions, reception, gatepass, certificates, notifications.
- **accountant**
  - Nav: Accounts[dashboard, fees, payroll, inventory, reports]; Updates[communication, notices].
  - EDIT: fees, payroll, inventory, reports.
- **librarian**
  - Nav: Library[dashboard, library, students, notices]. EDIT: library, notices.
- **warden**
  - Nav: Hostel[dashboard, hostel, students, health, gatepass, notices]. EDIT: hostel, health, gatepass.
- **canteen**
  - Nav: Canteen[dashboard, canteen, notices]. EDIT: canteen.
- **scanner**
  - Nav: Gate[dashboard, scanner, gatepass, attendance, notifications]. EDIT: scanner, gatepass, attendance, notifications.
- **super_admin** (platform)
  - Nav: Platform[dashboard, schools, subscriptions, plans, onboarding]. EDIT: all four.

**PERMISSION_MATRIX** (display only):
- Groups and permissions:
  - Students: student.read, student.create, student.update
  - Attendance: attendance.read, attendance.mark, attendance.correct
  - Timetable: timetable.read, timetable.manage
  - Teacher allocation: allocation.read, allocation.edit, allocation.publish
  - Staff & cover: staff.attendance, substitution.assign, promotion.run
  - Student roles: classroles.assign, classroles.approve
  - Homework: homework.read, homework.create
  - Results: results.read, results.create, results.publish
  - Fees: fees.read, fees.collect, fees.refund
  - Notices: notices.read, notices.create
  - Transport: transport.read, transport.trip.manage, transport.route.manage
  - Operations: reception.manage, hostel.manage, canteen.manage, scanner.scan
  - Administration: school.settings, payroll.manage
- ROLE_PERMISSIONS:
  - school_admin: all except allocation.publish and classroles.approve.
  - principal: all except payroll.manage and fees.refund.
  - teacher: allocation.read, classroles.assign, student.read, attendance.read, attendance.mark, timetable.read, homework.read, homework.create, results.read, results.create, notices.read.
  - parent: attendance.read, timetable.read, homework.read, results.read, fees.read, notices.read, transport.read.
  - student: attendance.read, timetable.read, homework.read, results.read, notices.read.
  - driver: transport.read, transport.trip.manage, notices.read.
  - reception: reception.manage, student.read, notices.read.
  - warden: hostel.manage, student.read, notices.read.
  - canteen: canteen.manage, notices.read.
  - scanner: scanner.scan, attendance.mark.
  - accountant: fees.read, fees.collect, fees.refund, payroll.manage, student.read, notices.read.
  - librarian: student.read, notices.read.

---

## Role dashboards (pages/dashboards/Dashboards.jsx + shared.jsx)

### Shared pieces
- **Welcome banner** (on every dashboard):
  - Campus art background.
  - Crest (not shown for the platform role).
  - Date line: `{Weekday, D Month YYYY} · AY {year}`.
  - H1 `{Good morning|Good afternoon|Good evening}, {first name}`. The cut-offs are hour < 12 and hour < 17. Honorifics are stripped from the name.
  - Optional sub-line, chips and action buttons.
- **QuickActions:** card `Quick actions` with an icon tile grid. Each tile navigates to its module.
- **TodaySchedule:** card `Today & upcoming`. Shows the next 5 `school_events` with date ≥ today, sorted by date then time. Each row: date box, title, `{time}`, `{venue}`; badge `Today` when the event is today.
- **NoticesCard(limit=4, audience):**
  - Title `Notices & circulars`, action `View all`.
  - Filter: `audience==='All'` or the audience string includes the given audience.
  - Each row: category icon (Academic award/violet, Sports trophy/amber, Holiday sun/teal, Fees wallet/green, Event megaphone/rose, Staff users/blue, General bell/navy), title, `Important` badge when priority is important, `{category} · {ago}`.
- **PeriodList:**
  - Each row: `{start_time}`, subject tile, `{Subject}[ — Class X]`, `Period n · start–end · room[ · teacher]`.
  - The current period is highlighted with a `Now` badge. Period windows: 8:00–8:45, 8:45–9:30, 9:30–10:15, 10:35–11:20, 11:20–12:05, 12:45–13:30, 13:30–14:15.
  - Substitution tag: `Substitute for X` or `Cover duty · for X`.
  - Empty state: `No classes scheduled.`
- **CoverCard:** card `Teacher cover today`, action `Arrange` → substitution.
  - With substitutions: `{n} teacher(s) away`, `{covered}/{total} periods covered`, the names of absent teachers, and in red `{n} period(s) still without a teacher`.
  - Otherwise: `All teachers are in today.`

### School Admin (`AdminDash`)
- **Welcome:**
  - Sub: `{school.name} · School overview`.
  - Chips: `{n} students`, `{n} teachers`, `{n} sections`, `{round %} present today`.
  - Buttons: `Reports`, `New notice` (primary, goes to notices).
- **Stats:**
  - `Students`: count; foot `{sections} sections · LKG to Class 12`.
  - `Teachers`: count; foot `{PGT count} PGT · {TGT count} TGT`.
  - `Attendance today`: pct; foot `{absent} absent · {late} late`.
  - `Fees pending`: compact inr of pending; foot `{overdue compact} overdue · {overdueCount} invoices`.
- **Attendance (%) is (present + late) / total** for the latest attendance date.
- **Cards:**
  - `Attendance — last 10 school days`: bars with min 80; note `Percentage of students present or late.`; action `Open`.
  - CoverCard and TodaySchedule.
  - `Class-wise attendance today` table: columns Class, Class teacher, Present (`present+late/total`), Absent (red if > 0), Rate (progress bar, amber if < 90, plus a %).
  - `Pending actions` (each row navigates):
    - `{n} leave requests` / `Awaiting approval` → leave
    - `{n} overdue fee invoices` / inr overdue → fees
    - `{n} open complaints` / `Front office` → reception
    - `{n} new admission enquiries` / `Follow up today` → reception
  - Quick actions: `Add student`, `Attendance`, `Collect fee`, `Timetable`, `Send notice`, `Reports`.
  - NoticesCard (4 notices, all audiences).

### Principal
- **Welcome:**
  - Sub: `Principal’s overview`.
  - Chips: `{%} present today`, `{pending leave} approvals pending`.
  - Button: `Circular to parents` → notices.
- **Stats:**
  - `Students`: foot `{F} girls · {M} boys`.
  - `Attendance today`: foot `{absent} absent`.
  - `Fee collection`: pct(rate, 0); foot `{collected compact} collected`.
  - `Leave approvals`: pending count; foot `Students & staff`.
- **Cards:**
  - `{Half-yearly exam name} — class performance` (non-pre sections). Columns: Class, Average (mean %), Pass % (pct ≥ 33), Topper (`name (x.x%)`). Action `Details` → results.
  - CoverCard, TodaySchedule, `Attendance trend` (last 6 days).
  - NoticesCard.

### Teacher
- **Welcome:**
  - Sub: `{own subject} · Class teacher of 8A`.
  - Chips: `{n} periods today`, `{n} students in 8A`.
  - Button: `Mark attendance — 8A`.
- **Stats:**
  - `Periods today`: foot `Incl. n cover duty`, or `First at hh:mm`, or `Free day`.
  - `Class 8A strength`: girls/boys.
  - `8A attendance today`: pct 0 dp; foot absent/late.
  - `Homework posted`: all homework by this teacher; foot `This week`.
- **Cards:**
  - `Today’s classes` (PeriodList with section).
  - Quick actions: `Mark attendance`, `Add homework`, `Enter marks`, `Send notice`.
  - `Leave requests`: the first 3 where section = 8A or `requester_type==='student'`. Pending rows have `Reject` / `Approve` buttons (`setLeave`); toasts `Leave rejected` / `Leave approved`.
  - NoticesCard(3, `Staff`).

### Parent (ChildHome for the selected child) and Student (ChildHome for self)
- **Welcome:**
  - Parent: name is the parent; sub `Parent · {n} children at {short_name}`; action is the **ChildSwitcher** (tab buttons `{First} · {section}`).
  - Student: sub `Class X · Roll no. N`.
- **Child card:**
  - Avatar, name, `Class X · Roll N · Adm. ...`, `Class teacher: ...`.
  - `Today` status badge (defaults to present).
- **Stats:**
  - `Attendance (24 days)`: pct 0; foot absent/late; amber tone if < 85.
  - Pre-primary: `Today’s mood` (diary). Otherwise: the half-yearly exam with `x.x%` and foot `Grade {A1…E}`.
  - Grade bands: A1 ≥ 91, A2 ≥ 81, B1 ≥ 71, B2 ≥ 61, C1 ≥ 51, C2 ≥ 41, D ≥ 33, else E.
  - `Fees due`: sum of due + overdue, or `Nil`; foot `{n} overdue` or `All clear`; red if any overdue.
  - Pre-primary: `Skills mastered` = `{Proficient or Mastered}/8`. Otherwise: `Next exam` (first scheduled exam).
- **Cards:**
  - `Today’s timetable — X` (with teacher), action `Week`.
  - Pre-primary only: `Today at school — daily diary` with Meal, Mood, Activity, Toilet, Water, Photos (`n new photos`), plus `Teacher’s note:`.
  - `Homework due` (pre-primary: `Activity at home`): up to 4 non-overdue items with badge `Due {date}`; action `All`; empty state `No pending homework.`
  - Parent with a bus route: `School bus`, `{code} · {name}`, `Pickup: {stop} at {eta} AM · Driver {name}`, action `Track`.
  - Parent with dues: first due invoice title, `Due {date}`, button `Pay {amount}` → fees.
  - NoticesCard(3, `Parents` or `Students`).

### Driver
- Welcome sub: `Morning pickup · {code}`.
- **Hero:**
  - `Today’s route`, `{code} · {name}`, `{reg_no} · {model}`.
  - Button: `Start trip` / `Continue trip` (accent colour while running) / `Trip completed` → trip.
- **Facts:** Departure `{departs_at} AM`, Stops, Students, Attendant.
- **Cards:**
  - `Pickup points`: eta, name, `n students`.
  - `Vehicle`: Registration, Capacity `n seats`, Fitness valid till.
  - `Alerts`: notifications with audience `driver`.
  - Button `Emergency — call school` (no handler).

### Reception
- Welcome sub: `Front office`. Buttons `Log call` and `New visitor` both go to reception.
- **Stats:**
  - `Visitors inside`: foot `{total} today`.
  - `New enquiries`: foot `{n} follow-ups due today`.
  - `Calls logged`: foot `Last 24 hours`.
  - `Open complaints`: foot `Across departments`.
- **Cards:**
  - `Visitor book — today`: first 6 visitors; columns Badge, Visitor, Purpose, In, Status.
  - `Admission enquiries`: first 5, `{student} · {grade}`, `{parent} · {source}`, status.

### Warden
- Welcome sub: `Hostel management`. Button `Allocate room` → hostel.
- **Stats:**
  - `Occupancy`: occupied / capacity of active rooms; foot `{occ} of {cap} beds`.
  - `Rooms available`: active rooms with occupied < capacity; foot `{n} rooms total`.
  - `Hostellers (in app)`: foot `Classes 9–10`.
  - `Under maintenance`.
- Per-hostel cards: type badge, Warden, Rooms, `Beds occupied o / c`, progress bar.
- `Hostellers — night roll call`: first 8; columns Student, Class, Room, Today status.

### Canteen
- Welcome sub: `Canteen`. Button `New bill`.
- **Stats:**
  - `Sales today`: sum of sales; foot `{n} bills`.
  - `Average bill`: foot `Per student`.
  - `Menu items`: foot `{n} categories`.
  - `Low stock`: stock < 15; foot lists the names or `All stocked`.
- **Cards:**
  - `Recent bills`: 8 rows; columns Bill, Customer, Items, Paid via, Amount.
  - `Stock watch`: 6 lowest-stock items with badge `{n} left` (red if < 15).

### Gate Scanner
- Welcome sub: `Main gate · Morning entry 07:15–08:15`.
- Big button `Open QR scanner`, sub `Scan student ID cards, staff badges and visitor passes`.
- **Stats:**
  - `Checked in` = present + late; foot `of {total} students`.
  - `Late arrivals`: foot `After 07:55`.
  - `Not arrived` = absent + leave; foot `{leave} on approved leave`.
  - `Visitors inside`: foot `Passes issued`.
- `Recent scans`: students 30–37; fake times `07:52` decreasing by 2 minutes; the 3rd row is `late`.

### Accountant
- Welcome sub: `Accounts office`. Buttons `Reports` and `Collect fee`.
- **Stats:**
  - `Collected (session)`: compact; foot `n receipts`.
  - `Collected today`: foot `n payments`.
  - `Overdue`: foot `n invoices`.
  - `Payroll this month`: sum of net.
- **Cards:**
  - `Collection by payment mode`: UPI / Net / Card / Cash / Cheque.
  - `Tally / accounting export` rows:
    - `Fee receipts voucher (XML)` → `Ready`
    - `Payroll journal` → `Ready`
    - `Bank reconciliation — HDFC` → `3 unmatched` (amber)
    - `GST on transport & hostel` → `Not applicable`

### Librarian
- Welcome sub: `School library`. Button `Issue / return`.
- Stats: `Books out`, `Overdue`, `Due today`, `Titles`.
- Cards: `Most borrowed categories`; `Overdue — follow up` (6 rows).

### Miz Super Admin
- Welcome: `Ankit Verma`, sub `Miz School platform overview`, button `Onboard school`.
- **Stats:**
  - `Schools` = 8; foot `5 active · 2 on trial`.
  - `Active users` = sum of billable users = 11,430; foot `Billable this month`.
  - `On trial`: count of TRIAL tenants; foot `Converting this month`.
  - `Past due` = 1; foot `Grace period running`.
- **Cards:**
  - `Schools` table: School, Plan, Users, Status; action `All schools`.
  - `Schools by plan`: count of schools per plan.
  - `System health`: API `182 ms p95`; Database `Healthy · Mumbai`; Notification queue `0 failed`; Storage `38 GB used`.

---

## Office module (pages/modules/Office.jsx)

### Office — Fees (staff view: `FeesOffice`)
- **Who:** every role with `fees` except the parent.
  - Edit: school_admin, accountant.
  - View: principal. Collect and reminders are blocked there.
- **Header:** `Fees` / `Collection, dues and receipts`.
  - Buttons: `Export` (no handler) and primary `Send reminders ({overdueCount})`.
  - Send reminders calls `push(['parent'], 'Fee reminder', 'Your fee is overdue. Pay online in the app to avoid late fee.', 'fees', ['push','whatsapp','sms'])`.
    - Toast: `Reminders sent to {n} parents on WhatsApp + SMS`.
    - Audit: `Sent notification “Fee reminder” to parent`.
- **KPIs** (`feeSummary`: paid → collected; overdue → overdue + pending; due → due + pending; `rate = collected / (collected + pending) × 100`):
  - `Collected this session`: compact; foot `{paidCount} receipts`.
  - `Overdue`: foot `{overdueCount} invoices`.
  - `Due this month`: foot `{dueCount} invoices`.
  - `Collection rate`: pct 1 dp; foot `Of billed to date`.
- **Charts:**
  - `Collections by month`: paid invoices grouped by the `paid_on` month, last 6 months, compact labels.
  - `Class-wise dues`: for each section, name, a progress bar of the section's collection rate, and compact pending amount. Scrolls at 250 px.
- **Fee structure card:** `Fee structure — LKG to Class 12 (AY 2026–27)`.
  - Header note: `Instalments: quarterly · late fee ₹50/day after due date · sibling discount 10%`. This is display only; no late fee or discount is computed anywhere.
  - One row per grade; senior rows are per grade + stream (18 rows).
  - Columns and values:
    - Class: `Class N`, `LKG`/`UKG`, or `11 Science`.
    - Stage: badge (Pre-primary / Primary / Middle / Secondary / Senior Secondary).
    - `Admission (one-time)`: pre-primary ₹15,000; senior ₹25,000; others ₹20,000.
    - `Tuition / quarter`: pre-primary ₹11,000; primary ₹12,500; classes 6–7 ₹14,500; class 8 ₹15,800; secondary ₹17,200; Science ₹21,000; Commerce ₹19,000; Humanities ₹18,000.
    - `Annual tuition` = quarter × 4.
    - `Lab / activity`: senior Science ₹4,500; pre-primary ₹2,000; others ₹1,500.
    - `Transport / term`: ₹9,600 flat.
    - `Students`: count in that grade (or grade + stream).
- **Invoice table:**
  - Tabs: `Overdue` (default), `Due`, `Paid`, `All invoices`.
  - Search placeholder `Student or invoice no.`; matches student name or invoice number, case-insensitive.
  - Columns: Invoice, Student, Class, Fee head, Due, Amount, Status, action.
  - Action: paid rows get a button showing `{receipt_no}` that opens FeeReceipt; others get `Collect`.
  - Maximum 60 rows. Empty state: `No invoices.`
- **Collect fee modal:**
  - Summary box: student name and `{title} · {invoice_no}`.
  - `Payment mode`: toggle buttons `Cash` (default), `UPI`, `Card`, `Cheque`, `Net Banking`. The selection persists across modals.
  - `Reference / remarks`: text, placeholder `Cheque no., UTR, etc.`. Not stored.
  - Buttons: `Cancel`, `Collect {amount}`.
  - On collect: `payInvoice(id, method)`, toast `Receipt generated · {amount}`, then the receipt modal opens automatically.

### Office — Fees (parent view: `FeesParent`)
- **Who:** parent (EDIT).
- **Header:** `Fees`, sub `{child} · Class {section}`, ChildSwitcher.
- **Scope:** the selected child's invoices, sorted by due date ascending.
- **KPIs:**
  - `Outstanding`: pending or `Nil`; red if any overdue; foot `{overdue} overdue` or `No overdue fees`.
  - `Paid this session`: foot `{n} receipts`.
  - `Next due`: date of the first unpaid invoice; foot its title or `—`.
- **List rows:** title, `{invoice_no} · Due {d Mon yyyy}`, amount, status badge, button:
  - paid → `Receipt`
  - upcoming → disabled `Pay`
  - otherwise → `Pay now`
- **Pay school fee modal:**
  - Title, `{child} · {invoice}`, amount.
  - If overdue, red note: `Late fee of ₹50/day applies after the due date.`
  - `Pay using` radio: `UPI (GPay, PhonePe, Paytm)` (default), `Debit / credit card`, `Net banking`.
  - Note: `Demo only — no real payment is made. In production this opens the school’s payment gateway.`
  - Buttons: `Cancel`, `Pay {amount}`.
  - On pay: always calls `payInvoice(id, 'UPI')` regardless of the radio. Toast `Payment successful — receipt sent to your email`.
- (A legacy `Receipt` component also exists in the file but is unused.)

### Documents — Fee receipt (`FeeReceipt` modal, width 720)
- **Header:**
  - Crest, school name, address, `Ph {phone} · {email} · Affiliation No. {no}`.
  - Box `FEE RECEIPT` with `Original`, or `Duplicate copy` once printed. Duplicates also get a `DUPLICATE` watermark.
  - "Printed" = the count of audit entries with action `Printed receipt {no}` is > 0.
- **Grid:** Receipt no.; Date (dd Mon yyyy); Session; Invoice; Student; Class / Roll; Admission no.; Parent / Guardian.
- **Particulars table** (#, Particulars, Amount (₹) with `.00`):
  - If the title contains `Tuition`:
    - Development fee = round(8% of amount)
    - `Smart class & computer lab` = round(6%)
    - `Activity & sports` = round(4%)
    - `Tuition fee ({period in parentheses from the title})` = the remainder
  - Otherwise: a single line with the title.
  - Always a `Late fee` line of `0.00`.
  - Footer: `Total received`.
- **Amount in words:** `Rupees {Indian-system words} Only` (Crore / Lakh / Thousand / Hundred).
- **Payment grid:**
  - Payment mode.
  - Reference: `Counter` (Cash), `Chq no.` (Cheque), or `Txn`, followed by `hash(receipt_no)+hash(id)[0..5]`.
  - `Balance due this session`: the student's due + overdue total, or `Nil`.
  - `Received by`: `Online — payment gateway` for UPI, Card or Net Banking; otherwise `Accounts Office`.
- **Footer:**
  - QR icon, `Verify: {XXXX-XXXX}` (FNV-1a hash of the receipt number), `mizschool.app/verify`, `Computer-generated receipt; no signature needed.`
  - Signature: `Accounts Officer` / `Authorised signatory`.
- **Terms:** `Fees once paid are not refundable except caution money. Keep this receipt for income-tax (Sec 80C, tuition fee part). Cheques are subject to realisation.`
- **Parent-only note:** `A copy was also sent to your WhatsApp and email when you paid.`
- **Buttons:**
  - `Send on WhatsApp & email`: audit `Receipt {no} sent on WhatsApp`; toast `Receipt sent to {guardian_phone} on WhatsApp and to {guardian_email}`.
  - `Print / Save PDF`: audit `Printed receipt {no}`, then `window.print()` after 50 ms.

### Office — Notices
- **Who:** all roles with notices. The `New notice` button shows only for school_admin, principal and teacher, even though the librarian has EDIT by default.
- **Header:** `Notices & circulars`, sub `{n} published`, button `New notice`.
- **Filters:** category chips: `All` plus the distinct categories.
- **Card per notice:**
  - Category badge, `Important` badge if flagged, `For: {audience}`, `ago`.
  - Title, body, `— {author}`.
- **New notice modal:**
  - `Title` (required; Publish is disabled without it).
  - `Audience`: All (default) / Parents / Students / Staff / `Parents, Students`.
  - `Category`: General (default) / Academic / Holiday / Fees / Event / Sports / Staff.
  - `Message`: textarea, 5 rows.
  - Channel checkboxes `App push` ✓, `SMS` ☐, `Email` ✓. Not wired to anything.
  - Buttons: `Cancel`, `Publish`.
  - On publish: `addNotice({...form, author: persona.name})` → push to `all`. Toast `Notice published — push notification sent`. Audit `Published notice “{title}”`. Title and body reset; audience and category are kept.

### Office — Leave requests
- **Who:** admin and principal (edit), teacher (edit), parent (edit).
- **Header:** `Leave requests`.
  - Sub: parent `Apply for your child’s leave`; others `Student and staff leave approvals`.
  - Parent also gets the ChildSwitcher.
- **Scope:** parent sees requests where the requester equals one of their children's names; everyone else sees all requests.
- **Rows:**
  - Avatar, `{requester} · Staff|Class X`, `{from} – {to} · {reason}`.
  - Non-parent with a pending request: `Reject` and `Approve` (green).
    - Toasts: `Leave rejected` / `Leave approved — attendance updated`. Attendance is not actually changed.
  - Otherwise: a status badge.
- **Empty state:** `No leave requests.`
- **Parent form** `Apply leave — {child first name}`:
  - `From` (date), `To` (date), `Reason` (textarea).
  - Submit is disabled unless From and Reason are filled. To defaults to From.
  - Button `Submit request` → `addLeave({requester: child name, requester_type:'student', section_id, status:'pending', ...})`.
  - Toast: `Leave request sent to class teacher`.

### Office — Notifications
- **Scope:** the same filter as the bell.
- **Header:** `Notifications`, sub `{n} unread` (the total count; there is no read state).
- **List:** kind icon (attendance check, homework book, fees wallet, notice megaphone, leave plane, transport bus, otherwise bell), title, body, ago.
- **Empty state:** `You are all caught up.`
- **`Notification preferences` table:** columns Event, App, SMS, Email. Checkboxes are not persisted.
  | Event | App | SMS | Email | Lock |
  |---|---|---|---|---|
  | Attendance alert | ✓ | ✓ | ✗ | `Mandatory`, disabled |
  | Homework | ✓ | ✗ | ✗ | |
  | Fee receipt | ✓ | ✗ | ✓ | |
  | School notices | ✓ | ✗ | ✓ | |
  | Emergency | ✓ | ✓ | ✓ | `Always on`, disabled |

### Office — Reports
- **Who:** school_admin, principal (edit), accountant (edit).
- **Header:** `Reports`, sub `Download as Excel-compatible CSV or print`.
- **Six cards,** each with buttons `CSV` and `Print`:
  - CSV: quoted cells; filename is the lowercased title with non-word runs replaced by `-`, plus `.csv`; toast `{rows} rows exported`; no audit entry.
  - Print: `window.print()`.
- **Report definitions:**
  1. `Attendance register`: Class, Present, Late, Absent, Leave, Rate %. Latest day, per section.
  2. `Fee defaulters`: Student, Class, Invoice, Amount, Guardian, Phone. Overdue invoices only.
  3. `{exams[1].name} results`: Class, Rank, Student, Total, Max, %, Grade. Non-pre sections.
  4. `Student strength`: Class, Total, Girls, Boys, Transport, Hostel.
  5. `Visitor log`: Badge, Name, Phone, Purpose, Host, In, Out.
  6. `Transport manifest`: Route, Stop, Student, Class, Guardian phone.

---

## Documents — Certificates (pages/modules/Documents.jsx)

- **Who:** school_admin and reception (staff mode, EDIT); parent (parent mode, EDIT).
- **Header:**
  - Staff: `Certificates & ID cards`, sub `Auto-filled from school records · serial register · no-dues check · verify code on every document`.
  - Parent: `Certificates & documents`, sub `Request a certificate — it is issued with a serial number and a verify code`.
- **Tabs:**
  - Staff: `Requests & register` (default), `Issue certificate`, `ID cards`, `Verify`.
  - Parent: `My requests` (default), `Verify a document`.

### Certificate types and codes
| Type | Code | Notes |
|---|---|---|
| Transfer Certificate | TC | needs no-dues |
| Bonafide | BON | |
| Character | CHR | |
| Fee Paid (80C) | FEE | |
| Study / Attendance | STU | |

- **Serial:** `{first 3 letters of slug, upper}/{CODE}/{year}/{(count of certs with same code)+101, padded to 4}`.
- **Verify code:** `XXXX-XXXX` (hash).

### My requests (parent)
- **Table** `Requests`: Certificate, Child, Requested, Status, Serial.
  - Status: `Issued` (green) or `With school office` (amber).
  - Serial shows only when issued.
  - Empty state: `No requests yet.`
- **Form** `Request a certificate`:
  - `Child` select.
  - `Certificate` select (5 types, default Bonafide).
  - `Purpose`: text, placeholder `e.g. passport, bank account, income tax`.
  - Button `Send request`. No validation.
  - Creates `{status:'pending', serial:'—', purpose}`.
  - Push: school_admin, reception / `Certificate request` / `{type} for {child}` / push only.
  - Toast: `Request sent to the school office`.
  - Audits: `Updated certificates` and `Sent notification “Certificate request” to school_admin, reception`.
  - Hint text: TC → `TC needs all dues cleared and library books returned.`; others → `Usually issued within 1 working day.`

### Requests & register (staff)
- Search placeholder `Search serial, student or type`.
- **Columns:** Serial, Type, Student (+ purpose), Requested, Status, Verify code (issued only), action.
- **Action:** `Prepare & issue` (primary, when pending) or `View`. Either one sets the student and type and switches to the Issue tab. The legacy `Fee Paid` type maps to `Fee Paid (80C)`; unknown types map to Bonafide.

### Issue certificate (staff)
- **Left: printable sheet**
  - Crest, school name, `{address} · Affiliation No. … · School code {SLUG3}{seed padded 4}`.
  - Line: `No. {serial}`, `Adm. No.`, `Date: {today}`.
  - Title: `Transfer Certificate`, `Fee Certificate`, `Study Certificate`, or `{type} Certificate`.
  - **Bodies** (the child noun is son or daughter, and he/she follows gender; the parent name has honorifics stripped):
    - Bonafide: `This is to certify that {name}, {son} of {parent}, is a bonafide student of this school, studying in Class {sec} in the academic session {AY}. His/Her admission number is … and date of birth as per school records is {d Month yyyy}.`
    - Character: `…(Adm. No. …), {son} of …, has been a student of this school and is at present in Class …. To the best of our knowledge {he} bears a good moral character, has been regular and disciplined, and has not been involved in any act of indiscipline.`
    - Fee Paid (80C):
      - Amount = Σ round(0.82 × amount) over the student's **paid Tuition** invoices.
      - Financial year = `(Y − (month < April ? 1 : 0))–(last 2 digits of Y + (month < April ? 0 : 1))`.
      - Text: `…received as tuition fee … during the financial year …. This amount excludes development, transport and other charges and is issued for claiming deduction under Section 80C of the Income-tax Act.`, with the amount also in words.
    - Study / Attendance: `…Out of {total} working days so far in this session {he} has attended {present+late} days ({round %}%).`
  - **Transfer Certificate:** a numbered 22-row table:
    1. Name of pupil
    2. Father’s / guardian’s name
    3. Nationality → `Indian`
    4. Whether SC/ST/OBC → `General`
    5. DOB (figures) dd/mm/yyyy
    6. DOB (words): day in words, month name, year in words
    7. Date of first admission & class → `{admission_no split '/' [1]} · Class LKG|1`
    8. Class last studied → `{grade label or '11 (Science)'} — {grade in words or 'Pre-primary'}`
    9. Exam last taken → `{exams[1].name} — Passed`
    10. Whether failed → `No`
    11. Subjects studied (from the stage/stream subject list)
    12. Qualified for promotion → `Yes, to Class {next}` or `Completed Class 12`
    13. Month up to which dues are paid → current month and year if accounts are clear, else `Dues pending`
    14. Fee concession → `None`
    15. Working days / present
    16. NCC → `No`
    17. Games → `Participated in house events`
    18. Conduct → `Good`
    19. Date of application → today
    20. Date of issue → today
    21. Reason for leaving
    22. Remarks → `—`
  - Footer: QR, `Verify: {code}`, `mizschool.app/verify`; signature `Prepared by`; the principal's name with `Principal (seal)`.
- **Right: `Certificate details` card**
  - `Type` select.
  - `Student` select: the first 300 students sorted by grade then roll, shown as `{section} · {name}`.
  - TC only: `Reason for leaving` select: `Parent’s request` (default), `Shifting to another city`, `Passed Class 12`, `Admission in another school`, `Financial reasons`, `Other`.
  - Note: `All fields come from school records … Serial number is taken from the register when you issue.`
  - Buttons: `Print` and `Sign, issue & send`.
- **`No-dues check` card (TC only):**
  | Department | Status | Clear? |
  |---|---|---|
  | Accounts | `₹X pending` or `Clear` | clear if no due/overdue |
  | Library | `N book(s) not returned` or `Clear` | clear if no unreturned loans |
  | Transport | `Pass returned` / `Not using` | always clear |
  | Hostel | `Room vacated` / `Not a hosteller` | always clear |
  | Lab / sports | `Clear` | always clear |
  - If anything is not clear (blocked): field `Issue anyway — reason (admin override, logged)`, placeholder `e.g. Dues waived by management`. Issue is disabled while blocked and the override is empty.
- **On issue:**
  - Row: `{type, student_id, requested_on, issued_on: today, status:'issued', serial, verify, issued_by: persona, reason (TC only), override (only when blocked)}`.
  - Removes the pending request of the same student and type.
  - Push: parent / `{type} issued` / `{name} · No. {serial}. PDF sent on WhatsApp and email.` / push, whatsapp, email.
  - Toast: `Issued {serial} — PDF sent to parent`.
  - Audits: `Updated certificates` and `Sent notification “… issued” to parent`.

### ID cards (staff)
- Uses the section of the currently selected student.
- Header: `Class X · QR works with the gate scanner, library and canteen`, button `Print class sheet ({section count})`.
- Renders the first 8 students. Each card:
  - Crest, short name, `{city} · {AY}`.
  - Initials avatar, name, `Class X · Roll N`.
  - `Adm:`, `Blood:`, `Ph:` and a QR icon.

### Verify (both modes)
- Card `Verify a certificate or receipt`.
- Field `Verify code (printed on the document)`, auto-uppercased, placeholder `e.g. 1K9Q-7ZTA`.
- The check runs at 9 or more characters, against **certificates only** (receipts are not looked up).
  - Match: `Genuine document`, `{type} · No. {serial} · {student} · issued {date}`.
  - No match: `Not found`, `No document with this code was issued by {short_name}.`
- Note: `Receipts and certificates carry this code; anyone (another school, a bank, an embassy) can check it here without logging in.`

---

## Operations (pages/modules/Operations.jsx)

### Operations — Transport
- **Who:** admin (edit); principal, parent and driver (view).
- **Parent without a route:** header `Transport` + ChildSwitcher; empty state `{child} uses own transport.`
- **Header:** `School bus` (parent) or `Transport`, sub `{routes} routes · {vehicles} vehicles · {riders} students`.
- **Default route:** parent → child's route; driver → own route; others → routes[0].
- **Parent live card:**
  - `Live · Morning pickup`, `{code} is near {stops[2].name}`, `Next stop: {stops[3]} · ETA {eta} AM`.
  - Right side: `{child}’s stop`, stop name, `Pickup {eta} AM`.
  - Info row: Driver name · phone, Attendant, Bus reg.
  - The demo has a fixed `liveAt = 3`.
- **`Live bus location — {code}` (BusMap):**
  - SVG 800×300 with a grid, a river, roads and a polyline of stops. The child's stop is drawn larger with an amber ring. Passed stops are filled.
  - An animated bus moves t += 0.05 every 800 ms and loops.
  - Footer: `Live · updated every 10 s`, `Next stop: {name} · ETA {eta} AM`, `Speed 28 km/h`.
- **Non-parent tables:**
  - `Routes`: columns Route (code + name), Vehicle reg, Driver (+ phone), Students, Departs, Status. Clicking a row selects that route (highlighted).
  - `Students on {code}`: Student, Class, Stop, Guardian phone. Max height 360.
- **`{code} · stops`:** each stop shows done/current state (seq < 3 is done; seq = 3 is current), name, a `Your stop` badge for the parent, eta, and `N students`.

### Operations — Today's trip (driver)
- Header: `Today’s trip`, `{code} · {name}`.
- The trip state lives only in context. It is not guarded and not persisted, and no notifications are sent despite the toast.
- **Idle:**
  - `{stops} stops · {riders} students`, `Scheduled departure {time} AM`.
  - Button `START TRIP` → log `Trip started`; toast `Trip started — parents notified`.
- **Running:**
  - Blue card: `Stop i of n · ETA`, stop name, `{boarded} of {riders} students on board`.
  - `Boarding at {stop}`: one toggle per student at the stop, `Mark boarded` ↔ `Boarded`.
    - No students: `Drop point — all students alight here.` if seq = 7, else `No students at this stop.`
  - Next button `Depart to {next stop}` → log `Departed {stop}`.
  - At the last stop the button reads `Complete trip` → logs `Reached {stop}` and `Trip completed`; toast `Trip completed`.
- **Done:** `Trip completed`, `{n} students dropped at school`, button `Reset demo`.
- **`Trip log`:** reverse-chronological `time + event`.

### Operations — Front office (Reception)
- **Who:** admin (edit), reception (edit).
- **Header:** `Front office` / `Visitors, enquiries, calls, post and complaints`. Buttons `Enquiry` and primary `Check in visitor`.
- **Tabs:**
  - `Visitor book`: Badge, Visitor (+ phone), Purpose, To meet, In, Out (`—`), action `Check out` while inside, otherwise a status badge.
    - Check out: `checkoutVisitor`; toast `{name} checked out`; audit `Checkout visitor`.
  - `Admission enquiries`: Student, For, Parent, Phone, Source, Follow-up, Status.
  - `Phone calls`: Caller, Phone, Type (incoming = blue), Purpose, Notes, When.
  - `Postal`: Type (`Received`/`Dispatch`), Reference, From / to, Courier, Date, Status.
  - `Complaints`: Raised by, Category, Subject, When, Status, `Resolve` (unless resolved) → `setComplaint(id,'resolved')`; toast `Complaint resolved`.
- **Check in visitor modal:**
  - Fields: `Visitor name` (required), `Mobile`, `Purpose` (default `Meeting`), `Person to meet` (default `Office`).
  - `Capture photo` (no handler).
  - Button `Check in & print pass`; toast `Visitor pass printed`; audit `Add visitor`.
- **New admission enquiry modal:**
  - Fields: `Student name` (required), `Class sought` (free text, default `Class 1`), `Parent name`, `Mobile`, `Follow-up date` (date).
  - Saved with source `Walk-in`.
  - Button `Save enquiry`; switches to the Enquiries tab; toast `Enquiry saved`.

### Operations — Hostel
- **Who:** admin (edit), warden (edit).
- **Header:** `Hostel` / `Rooms, allocations and occupancy`. Button `New allocation` (no handler).
- Tabs, one per hostel.
- **Stats:**
  - `Beds occupied`: `occ/cap`, where cap counts active rooms only.
  - `Available beds` = cap − occ.
  - `Rooms`: foot `{n} double · {n} quad`.
  - `Maintenance`.
- **`Room map`:** legend Occupied / Free; floors 1–3.
  - Each room tile: number, then `Maintenance` or `{occ}/{cap} · {type}`, plus bed dots.
  - States: full, maint.
- **Room modal:**
  - Type · `n beds`, status.
  - `Residents in app` list. If empty: `{n} residents (from previous session import)` or `Room is empty.`

### Operations — Canteen
- **Who:** admin (edit), canteen (edit).
- **Header:** `Canteen` / `Billing, menu and stock`.
- **Tabs:**
  - **`Billing`:**
    - Category chips and search `Find item`.
    - Item tiles: name, cart count, price, `{stock} left` (red if < 15). Tiles with 0 stock are disabled.
    - `Current bill`: lines with −/+ buttons, line totals, `Total`, and field `Student / wallet` (placeholder `Scan ID card or enter admission no.`, not used).
    - Empty state: `Tap items to add them to the bill.`
    - Button `Charge {total}` (disabled when the bill is empty) → `addSale({customer:'Counter sale', items_count, total, method:'Wallet'}, counts)`; stock is decremented; toast `Bill saved · {total}`.
  - **`Items & stock`:** Item, Category, Price, Stock (`{n} {unit}`, red if < 15), button `+25 stock`; toast `{name}: +25 added to stock`.
  - **`Daily sales`:**
    - `Today’s bills`: Bill, Customer, Time, Mode, Amount.
    - `Sales by category`: synthetic. Sales are bucketed by index mod 5 into Snacks / Meals / Beverages / Breakfast / Healthy.

### Operations — Gate scanner
- **Who:** scanner (edit).
- **Header:** `Gate scanner` / `Main gate · Student QR ID cards`.
- **Left:**
  - QR frame, `Point the camera at the QR code on the ID card`.
  - Button `Simulate scan`: picks a random student not yet scanned this session.
  - The scan is `late` if the time is after 07:55 **and** rand > 0.6; otherwise `present`.
  - Calls `markStudent`; audit `Changed attendance of X to present|late`. No notification.
- **Right:**
  - Result card (green or amber): name, `Class · Roll · Adm`, `Verified · {short} · AY …`, `Late`/`Present`.
  - Empty state: `Scan result appears here.`
  - `This session · n scans`: the last 12. Empty: `No scans yet.`

---

## Smart1 (pages/modules/Smart1.jsx)

### Smart Insights
- **Who:** admin, principal (edit).
- **Header:** `Smart Insights` / `Early-warning signals the school should act on this week`.
- **Risk model:**
  - Covers non-pre-primary students; exam = the first exam whose name starts with `Half`.
  - Signals:
    - attendance < 85% → `Attendance N%`
    - exam % < 55 → `Scored N% in {first word of exam}`
    - any overdue → `₹X overdue`
  - `risk = (att < 85 ? 40 : 0) + (exam < 55 ? 40 : 0) + (overdue ? 20 : 0) + max(0, 90 − att%)`.
  - Only students with at least one signal are listed, sorted by risk descending.
- **KPIs:**
  - `Students needing attention`: foot `Attendance, marks or fees`.
  - `Attendance below 85%`: foot `Last 24 school days`.
  - `Below 55% in exams`: foot = exam name.
  - `Fee collection`: rate, 0 dp; foot `{overdue} overdue`.
- **`Students at risk` table** (top 40): Student, Class, Signals (amber badges), Risk (progress capped at 100; red if > 60, else amber).
  - Button `Message parents` → toast only: `WhatsApp sent to {min(n,20)} parents`.
- **Side cards:**
  - `Subject-wise average`: per subject code, the mean % in that exam.
  - `Top performers`: top 5 by %.
  - `Suggested actions`:
    - `Schedule remedial classes for {lowMarks} students`
    - `Call parents of {lowAtt} low-attendance students`
    - `Send fee reminder to {overdueCount} overdue accounts`
    - `Publish the merit list and appreciate top 5`

### Branches
- **Who:** admin, principal (edit). Uses local state only: not guarded, not audited, not persisted.
- **Header:** `Branches`, sub `{n} campuses under {short} group — one login, consolidated reports`. Button `Add branch`.
- **KPIs:** `Campuses`, `Students (group)`, `Teachers (group)`, `Avg attendance` (mean).
- **Branch card:**
  - Badge `Head office` or the city.
  - Students, Teachers, Attendance %, Fees %.
  - Progress bar of fee collection (amber if < 85).
  - `Head: … · Est. …`.
  - Button `Open` → toast `Switched to {name}`.
- **Add a branch modal:**
  - `Branch name` (required, placeholder `{short} — East Campus`), `City` (defaults to the school city), `Branch head` (default `—`).
  - Note: `Branding, fee structures, report-card templates and roles are copied from the head office…`
  - Button `Create branch` creates the branch with zero stats and established = the current year; toast `Branch created — shares branding, fee plans and reports`.

### Admissions CRM
- **Who:**
  - Edit: admin, principal, reception.
  - Note that the parent-facing Online form lives inside this staff page.
- **Header:** `Admissions CRM` / `Session 2027–28 · enquiry to admission in one pipeline`. Buttons `Online form` and `New application` both open the form tab.
- **Stages:** Enquiry (blue) → Registered (violet) → Test / Interview (amber) → Offer sent (teal) → Admitted (green).
- **KPIs:**
  - `Applications`: foot `This session`.
  - `Tests scheduled`.
  - `Admitted`: foot `Fee received`.
  - `Conversion` = round(admitted / total × 100)%; foot `Enquiry → admission`.
- **Tabs:**
  - **`Pipeline`:** kanban with column counts. Cards show name, `{grade} · {source}`, `Test: N%`, ago, and `‹` / `›` buttons.
    - Move: stage ± 1, clamped. Sets `fee_paid = (next === 'admitted')`.
    - Audit: `Updated admissions`. Toast: `{name} → {Stage} · WhatsApp sent to parent` (no notification is actually sent).
  - **`All applications`:** App no., Student, Class, Parent (+ phone), Source, Counsellor, Stage.
  - **`Online admission form`:**
    - Card `Admission application — {school}`.
    - Fields: `Student’s full name`*; `Class applying for` (Nursery, LKG, UKG, Class 1, Class 2, Class 3, Class 6, Class 9, Class 11; default Class 1); `Date of birth`; `Previous school`; `Parent / guardian name`; `Mobile (WhatsApp)`*; `Email`.
    - Upload buttons (no handlers): Birth certificate, Aadhaar, Previous report card, Passport photo.
    - Footer: `Registration fee ₹1,500 · pay by UPI / card after submitting`, button `Submit & pay ₹1,500` (requires name and mobile).
    - Creates `app_no APP/NEW/{rows+101}`, source Website, stage registered, counsellor Kiran Sethi.
    - Toast: `Application submitted — confirmation sent on WhatsApp & email`. Returns to the pipeline.
    - Side card `How parents see it`, 6 steps:
      1. Link shared on the school website & Instagram
      2. Form filled on phone in 3 minutes
      3. Registration fee paid online
      4. Confirmation + test date on WhatsApp
      5. Result and offer letter by email
      6. Admission fee → student record created automatically
  - **`Lead sources`:**
    - Bars by source: Website, Walk-in, Referral, Google Ads, Newspaper, Instagram (labels use the first word).
    - Bars by class: Nursery, LKG, UKG, C1, C3, C6, C9, C11.
- **Detail modal** (click any card or row):
  - Rows: Application, Class sought, Parent, Mobile, Source, Counsellor, Entrance test (`N%` / `Not taken`), Registration fee (`Pending` in the enquiry stage, else `₹1,500 paid online`).
  - Stage progress badges.
  - Buttons: `Call` (toast `Call logged`), `WhatsApp` (toast `WhatsApp sent`), `Move to next stage` (hidden once admitted).

### WhatsApp, SMS & Email (Communication)
- **Who:** admin, principal (edit); accountant (view).
- **Header:** `WhatsApp, SMS & Email` / `One place for every message the school sends — with delivery and read receipts`.
- **KPIs** (from `comm_stats`):
  - `WhatsApp this month`: foot `% read`.
  - `SMS`: foot `% delivered`.
  - `Email`: foot `% opened`.
  - `App push`: foot `Parent & student apps`.
- **Tabs:**
  - **`Broadcast`:**
    - `Send to` chips with counts:
      - `All parents` = number of students
      - `Class 8A parents` = 22 (hard-coded)
      - `Fee defaulters` = number of overdue invoices
      - `All staff` = teachers + support staff
      - `Bus route R-01` = riders on route[0]
    - `Channels` checkboxes: WhatsApp ✓, SMS ✗, Email ✓, App push ✓.
    - `Message`: default `Dear Parents, the school will remain closed on 2 October on account of Gandhi Jayanti. Classes resume on 3 October. — {short}`. Helper text: `{n} characters · variables like {student} and {class} are filled per parent`.
    - Buttons `Attach PDF / image` and `Schedule` have no handlers.
    - Footer: `{n} recipients · est. cost ₹{round(n × (0.35 if WhatsApp + 0.18 if SMS))}`.
    - Button `Send now`:
      - Adds one comm_log per chosen channel with template `Broadcast`.
      - Toast: `Sent to {n} recipients via {channels}`.
      - Calls `push(['all'], 'School announcement', first 90 characters of the message, 'notice', [])`.
      - Switches to the Delivery log tab.
      - Audits: `Updated comm logs` and `Sent notification “School announcement” to all`.
    - Side card: `WhatsApp preview` (Verified business).
  - **`Automations`:** name, `{when} · {n} sent this month`, channel badges, toggle switch → updates `on`; toast `{name}: ON|OFF`; audit `Updated automations`.
  - **`Templates`:** cards with the trigger, text, channel badges, and `Meta approved` when WhatsApp is a channel.
  - **`Delivery log`:** Time, Channel, Message (template), To, Status (failed red; read or opened green; otherwise blue).

### Messages
- **Who:** admin (edit), teacher (edit), parent (edit).
- **Header:** `Messages` / `Private parent–teacher conversations · school hours 8 AM – 6 PM`.
- **Threads visible:**
  - Parent: threads about their own children.
  - Teacher: threads they own, plus threads for students in 8A.
  - Admin: all threads.
- **List:** avatar and name (parent sees the teacher; staff see the guardian), `{subject} · {last message}`. Empty state: `No conversations yet.`
- **Pane:**
  - Subject, `{student} · Class X · {teacher}`.
  - Bubbles; the viewer's own messages are marked `me`. Admin posts as `teacher`.
  - Input placeholder `Type a message…`; Enter or the send button sends. Trimmed empty text is ignored.
  - Send: appends the message, then push to the other side (`New message`, first 80 characters, push only).
  - Audits: `Updated threads` and `Sent notification “New message” to …`.
- **No thread selected:** `Select a conversation`.

### PTM Booking
- **Who:** admin, teacher (edit), parent (edit).
- **Section:** parent → child's section; teacher → 8A; others → sections[4], with a `Class X` select.
- **Header:** `Parent–Teacher Meeting`, sub `{weekday, d Month} · Class X · {class teacher}`.
- **Parent banner** once booked: `Your slot: {time} · {mode}`. For Video call it adds ` — join link will be shared 10 min before`.
- **Slot cards:** time, mode badge (Video call violet, else blue).
  - Parent sees `Booked` for other families' slots.
  - Staff see `{student} · {guardian}`, or `Available`.
- **Parent actions:**
  - Button `Book this slot` on free slots. Booking frees the child's previous slot.
  - Toast: `PTM booked at {time} — confirmation on WhatsApp`.
  - Push: teacher, parent / `PTM slot booked` / `{child} · {time} · {mode}` (push, whatsapp).
  - The own slot shows badge `Booked by you`.

### School Calendar
- **Who:** admin, principal (edit); teacher, parent, student, reception (view).
- **Header:** `School calendar` / `Holidays, exams, events and PTMs — synced to parent & student apps`. Month navigation `‹ Month YYYY ›`.
- **Month grid:** Monday-first; today highlighted; event chips coloured by type (holiday red, exam violet, event blue, ptm teal, staff amber).
- **`Coming up`:** all events from today on, with a date box and type badge.
- Read-only; there is no add or edit.

### Gate Pass (OTP)
- **Who:**
  - Edit: parent, admin, reception, warden, scanner.
  - The staff side is shown to every role that is not parent.
- **Header:** `Gate pass (OTP pickup)` / `A child leaves early only when the gate verifies the parent’s one-time code`. Parent gets the ChildSwitcher.
- **Table** (`Recent passes` for the parent, `Today’s gate passes` for staff):
  - Columns: Student (+ class), Pickup by (name + relation), Reason, Requested (ago), OTP (parent only), Status.
  - OTP column: the 4 digits while pending, else `••••`.
  - Status colours: verified green, pending amber.
  - Empty state: `No gate passes.`
- **Parent card** `Early pickup — {first}`:
  - `Who will pick up?`: Father (default) / Mother / Grandparent / Relative / Driver.
  - `Name`: defaults to the persona name.
  - `Reason`: default `Doctor appointment`.
  - Note: `The class teacher is informed instantly. The OTP is valid for 2 hours and works only once.` Expiry is not enforced; single use is enforced by the status.
  - Button `Generate OTP pass`:
    - OTP = 1000 + floor(rand × 8999).
    - Creates a pending pass.
    - Toast: `Gate pass created — OTP {code} sent on WhatsApp`.
    - Push: scanner, teacher / `Early pickup requested` / `{child} · {name} ({relation})` (push, whatsapp).
- **Staff card** `Verify OTP at the gate`:
  - 4-digit numeric input (non-digits stripped), placeholder `• • • •`.
  - Button `Verify & release` (enabled only at 4 digits).
  - No match with a pending pass → toast `Invalid or expired OTP`.
  - Match:
    - Status → verified, `verified_at` set.
    - Toast: `Verified — {student} released to {pickup}`.
    - Push: parent, teacher / `Child released at gate` / `{student} left with {pickup} (OTP verified)` / attendance / push, whatsapp, sms.
  - Demo hint: `Demo: pending OTPs are …`

---

## Admin (pages/modules/Admin.jsx)

### School Settings (school_admin only; locked edit)
- **Header:** `School settings` / `Identity, branding and modules`.
- **Tabs:**
  - **`Branding`:**
    - Card `Brand identity`:
      - Crest; button `Upload logo` (no handler), note `PNG or SVG, square, at least 256 px`.
      - Three colour pickers, `Primary`, `Secondary`, `Accent`, each with a hex input accepted only if it matches `^#[0-9a-f]{6}$`i.
      - `Short name`; `Crest initials` (max 3 characters, uppercased); `Motto`.
      - `Login background` button `Upload approved campus photo`.
      - **Every keystroke or colour change calls `setBranding` immediately** and writes the audit `Changed school branding`.
      - Footer: `Changes apply across web, app, receipts and notices.`, button `Save branding` (toast only: `Branding saved (demo session)`).
    - `Preview — login page`: secondary-colour hero with crest, name, motto, campus art and an accent stripe; `Welcome back`, an `Email or mobile` box, `Sign in`.
  - **`School profile`:**
    - Uncontrolled inputs, not saved: School name, Board, Affiliation no., Established, Phone, Email, Portal address, Academic year, Principal, Address.
    - `Save` → toast `Profile saved (demo)`.
  - **`Modules`:** `Enabled modules` checkboxes in local state; they do not affect navigation.
    | Module | Default |
    |---|---|
    | Transport & driver app | on |
    | Hostel | on |
    | Canteen & wallet | on |
    | Front office / visitor management | on |
    | Library | off |
    | Payroll | off |
    | Online tests | off |
    - Sub-text: `Visible to permitted roles` / `Hidden from every menu`. Toast `{label} enabled|disabled`.

### Users & Access (Permissions; school_admin only)
- **Header:** `Users, roles & access` / `Who can log in, what each role sees, and who is allowed to grant access`. Button `Invite user`.
- **Tabs:**
  - **`Users`:** columns User (initials avatar), Role badge, Scope, Login (`{phone} · OTP`), Last active, Status (active green, invited amber, disabled red), action.
    - Seed users:
      - Rohit Bhatnagar (school_admin, Whole school, 2 min ago)
      - the principal (1 hr ago)
      - the first 6 teachers (scope `Class X` if class teacher, else `Subject teacher`)
      - Vinod Khandelwal (accountant, `Fees & payroll`)
      - Sunita Mathur (librarian)
      - Kiran Sethi (reception, `Front office`)
      - the route-1 driver (`Route R-01`, `Today 7:05 AM`)
      - Neha Kulkarni (teacher, Class 7B, invited)
    - Action `Revoke` / `Enable` for everyone except school_admin. Toasts: `Access revoked — user logged out on all devices` / `Access restored`. Local state only.
  - **`View / edit access`:**
    - Legend: `None` hidden from menu, page blocked; `View` can open and read, every change button is blocked; `Edit` can add, change and approve.
    - Grid: rows are all modules except schools, subscriptions, plans, onboarding, dashboard and trip. Columns are the 12 non-platform roles, with headers showing `nE · nV`.
    - Clicking a cell cycles None → View → Edit. It saves to localStorage, writes a security audit `Access changed · {Role} · {Module}: {old} → {new}`, and toasts `{Role} · {Module}: {level}`.
    - Locked cells (school_admin permissions, settings, backup, audit) are disabled, with tooltip `Always on for School Admin`.
    - Footer note: `Click a cell to switch None → View → Edit. Applies instantly and is written to the Audit Log.`
    - Button `Reset to defaults` → security audit `Access reset to Miz defaults`; toast `Reset to Miz defaults`.
  - **`By role`:** role select (default teacher). Cards `Can change (n)` (green badges) and `Can only see (n)` (blue).
    - Note: `Scope still applies on top of access: a teacher with Edit on Homework can post only for the classes and subjects allotted to them; a parent sees only their own children.`
  - **`Permission matrix`:** grouped rows; ✓ or — per role (see section 0).
  - **`Who grants access`:**
    - GRANT_RULES:
      - **School Admin**: `Creates any user, assigns any role, and switches modules on or off for every role.`
      - **Principal**: `Can invite Teachers, Class Teachers and Coordinators, and approve their class/subject scope.`
      - **Class Teacher**: `Can only see students of their own section and subjects they teach — no fees, payroll or settings.`
      - **Parent / Student**: `Created automatically from the admission record; a parent sees only their own children.`
      - **Miz Super Admin**: `Creates the school and its first School Admin — never sees private student data by default.`
    - `How access works`:
      - Invite by mobile number → user logs in with OTP (no shared passwords).
      - Role decides the menu; scope (branch, class, subject, route) decides the rows.
      - Every table is locked per school in the database (row-level security).
      - Every grant, revoke, marks change and fee refund is written to the audit log.
      - Revoking access logs the user out of web and app immediately.
      - Branch staff only see their branch; group management sees all branches.
- **Invite a user modal:**
  - `Full name`*, `Mobile (login by OTP)`*.
  - `Role`: non-platform roles, default teacher.
  - `Scope`: `Whole school`, all section names, `Route {code}`s; default `8A`.
  - Preview `This user will see`: badges per module, with `(view)` suffixed where applicable.
  - Button `Send invite` → adds the user as `invited` (teacher scope gets the `Class ` prefix); toast `Invite sent to {phone} on WhatsApp & SMS`.

### Plans and tenants (data/api.js)
- **Plans:**
  | Plan | Minimum seats | Features |
  |---|---|---|
  | Basic | 200 | Attendance, Timetable, Homework, Notices, Fees |
  | Standard | 300 | Everything in Basic, Exams & results, Transport, Reception desk, Parent & student apps |
  | Premium | 500 | Everything in Standard, Hostel & canteen, Payroll, Custom domain, Priority support |
- **Tenants** (plan / status / users / renews in):
  - aravali: standard / ACTIVE / 1600 / 5
  - crestview: premium / ACTIVE / 2210 / 12
  - mizdemo: basic / TRIAL / 480 / 21
  - Shri Ram Vidya Niketan (Kota): standard / ACTIVE / 1340 / 3
  - Holy Cross Convent (Ajmer): standard / PAST_DUE / 960 / −4
  - Green Valley Academy (Udaipur): basic / ACTIVE / 620 / 17
  - Delhi Heritage School (Gurugram): premium / ACTIVE / 3120 / 9
  - Mount Carmel School (Bhopal): standard / TRIAL / 1100 / 11

### Super Admin — Schools
- **Header:** `Schools`, sub `{n} tenants on the platform`. Link `Onboard school` → onboarding.
- **Columns:**
  - School: crest or initial, city · board.
  - Portal: `website`, or `{first word lowercased}.mizschool.app`.
  - Plan badge, Active users, Status.
  - Action: `Open` → `#/s/{slug}/school_admin/dashboard` for demo tenants; otherwise `Manage` (no handler).

### Super Admin — Subscriptions
- **Header:** `Subscriptions` / `Plan, seat limit and renewal for every school`.
- **KPIs:**
  - `Active users`: total across schools; foot `All schools, this month`.
  - `Paid & active`: count of ACTIVE schools.
  - `Past due` = 1; foot `In grace period`.
  - `Trials ending < 30 days` = 2 (the count of TRIAL tenants).
- **Table:**
  - Columns: School, Plan, Active users, Seat limit, Seats used (bar).
  - Renews: `in N days`, or red `N days overdue`.
  - Status; button `Details`.
- **Details modal:** School; Plan; Active users; Seat limit; Renews; Status; note on seat-limit blocking.

### Super Admin — Plans
- Button `New plan` (no handler).
- **One card per plan:** id badge, `Minimum seats`, feature ticks. Header `Plans` / `Modules and seat minimums per plan — configurable, nothing hard-coded`. No amounts anywhere.

### Super Admin — Website Import (Onboarding)
- **Header:** `Onboard a school` / `Auto-detect → preview → school approves → publish`.
- **Step badges:** `Website`, `Review brand`, `Admin & session`, `Go live`. Done steps show ✓.
- **Steps:**
  - **Step 0:** card `School website`.
    - Field `Website URL`, default `https://www.greenvalley-example.edu.in`.
    - Note: `We read only publicly available details — name, logo, colours, address and contact — and the school approves everything before it is published.`
    - Button `Import brand` → shows `Reading website…` for 1.4 s, then moves to step 1. Detection is mocked.
  - **Step 1:** `Detected details`.
    - Name `Green Valley Academy`, Board `CBSE`, City `Udaipur`, Address `Fatehpura, Udaipur 313004`, Phone `+91 294 245 1200`, Motto `Grow · Learn · Lead`.
    - Colours #1F5FA8 / #12294D / #2E8B57; crest `GV`; site `greenvalley.mizschool.app`.
    - `Portal preview` note: `Logo placeholder generated from initials — replace with the school’s approved logo file.`
    - Buttons `Back`, `Approve`.
  - **Step 2:** `Administrator & academic session`.
    - Inputs (not bound): `Admin name`, `Admin mobile`, `Admin email`, `Academic session (e.g. 2026–27)`.
    - `Plan` select (plan names only).
    - `Start with`: `30-day trial` / `Active subscription`.
    - Buttons `Back`, `Create school`.
  - **Step 3:** `{name} is ready`, `{site} · trial started · invite sent to the school admin`, button `Onboard another`.

---

## Governance (pages/modules/Governance.jsx)

### Audit Log
- **Who:** admin (locked edit), principal (view).
- **Header:** `Audit log` / `Every change, login, export and access change — who, what, when, from which device. Entries can’t be edited or deleted.`
- **`Export CSV`:**
  - Exports the filtered rows without `id`, to `audit-log-YYYY-MM-DD.csv`.
  - Writes the audit `Exported audit log (N rows, CSV)` with kind export.
  - Toast `Audit log downloaded` (suppressed for a view-only principal, though the download still happens).
- **KPIs:**
  - `Events today`: foot `{total} in the last 10 days`.
  - `Security events`: foot `Logins, access changes, blocked actions`.
  - `Exports`: foot `Data leaving the system`.
  - `People active`: distinct users in the last 24 h.
- **Filters:**
  - Search `Search user, action or IP`.
  - Segment `All` / `Changes` / `Security` / `Exports`.
  - `All modules` select (distinct modules; `auth` shows as `Login`).
  - `All roles` select (non-platform roles).
  - Range `Last 24 hours` / `Last 7 days` (default) / `Last 30 days`.
- **Table** (max 200 rows):
  - When: time, then date · ago.
  - Who: avatar, name, role label.
  - Module.
  - What happened: kind badge (Change blue, Security red, Export violet) + action.
  - Device · IP.
- **Empty state:** `No events match these filters.`
- **Footer:** `Stored in the school’s own database partition, append-only (no update or delete permission for any role), kept for 3 years. Marks, fees and access changes also keep the old and new value.`

### Data Backup
- **Who:** school_admin only. `canEdit` is hard-coded as `role === 'school_admin'`.
- **Header:** `Data backup & restore` / `Automatic encrypted backups every night · download your data any time · restore needs typed confirmation`.
- **Buttons:**
  - `Back up now`: adds a Manual backup of 37.2 MB, verified, `Mumbai (ap-south-1) + Hyderabad copy`, by Rohit Bhatnagar. Toast `Backup taken and verified`; audit `Updated backups`.
  - `Download full backup`: JSON `{format:'miz-school-backup', version:1, school: slug, created_at, data}` (meta excluded), saved as `{slug}-backup-YYYY-MM-DD.json`. Export audit `Downloaded full backup (N rows, JSON)`; toast `Full backup downloaded`.
- **KPIs:**
  - `Last backup`: ago; foot `{kind} · verified`.
  - `Records protected`: row count over 15 tables; foot `15 tables`.
  - `Point-in-time restore` `7 days`: foot `Any minute in the last week`.
  - `Kept for` `30 + 12`: foot `30 daily · 12 monthly copies`.
- **Tables** (15): students, teachers, sections, attendance, marks, fee_invoices, homework, allocations, timetable_slots, staff_attendance, substitutions, certificates, student_roles, notices, audit_log.
- **`Backup history`:** Taken, Type (Manual violet, Weekly… blue), Size `n MB`, Stored in, Status `Verified`, `Restore`.
- **`Export one table`:**
  - Select `{table} ({count})`, button `Download CSV` → `{slug}-{table}.csv`.
  - Export audit `Exported {table} (N rows, CSV)`; toast `CSV downloaded — opens in Excel`.
- **`Restore from a file`:** accepts `.json`. Validation errors show as toast `Can’t restore: …`:
  - Wrong format: `Not a Miz School backup file`.
  - Wrong school: `This backup belongs to “{x}”, not {short}`.
- **`How your data is protected`** (6 ticks):
  - Encrypted at rest (AES-256) and in transit (TLS 1.3)
  - Stored in India — Mumbai, with a copy in Hyderabad
  - Each school’s data is separated in the database
  - Backups are test-restored every week
  - Only School Admin can download or restore; every download is in the Audit Log
  - Parents can ask for their child’s data or its deletion (DPDP Act 2023)
- **Restore modal** `Restore school data`:
  - `Source: … · taken …`.
  - Warning: `Everything entered after this backup (attendance, fees, marks) will be replaced. A safety backup of the current data is taken first, so this can be undone.`
  - Field `Type RESTORE to confirm` (auto-uppercased).
  - Red `Restore now`, enabled only when the field equals `RESTORE`.
  - A history restore uses freshly generated seed data; a file restore uses the file's payload.
  - Calls `restoreData`; toast `Data restored — everyone sees the restored version now`.

---

## Known gaps a production rebuild should decide on
- **Displayed but never computed:**
  - Late fee (the receipt always shows 0.00).
  - Sibling discount 10%.
  - Gate-pass OTP 2-hour expiry.
  - Notice channel checkboxes.
  - Notification preferences.
  - Settings module flags.
  - Branches, users and trip data (local state only).
- **Toasts that promise sends that never happen:**
  - Admissions moves (`WhatsApp sent`).
  - `Trip started — parents notified`.
  - `Leave approved — attendance updated`.
- **Hard-coded or mismatched values:**
  - Principal defaults to VIEW on Fees, so they cannot collect.
  - Librarian has EDIT on Notices but cannot see the post button.
  - The parent pay flow always records UPI.
  - The verify screen checks certificates only.
  - Billing KPIs ignore the minimum users; the table applies it.
  - `Class 8A parents` count is fixed at 22.
  - Backup `canEdit` is tied to the role, not to access.