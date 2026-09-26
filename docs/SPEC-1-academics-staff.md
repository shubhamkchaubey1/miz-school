# Miz School: screen-by-screen functional spec (Academic, Allocation, Staffing, Smart2)

Source files, all under `/home/claude/miz-school/web/src/`:
- Screens: `pages/modules/Academic.jsx`, `Allocation.jsx`, `Staffing.jsx`, `Smart2.jsx`
- Rules: `lib/allocation.js`, `lib/substitution.js`, `lib/derive.js`, `data/classes.js`, `data/generate.js` (DAYS/PERIODS)
- Actions and permissions: `lib/store.jsx`, `config/roles.js`
- Routes: `pages/modules/index.js`

**Note:** the route map imports `Certificates` from `Documents.jsx`, so the `Certificates` in Smart2.jsx is dead code. It is not covered here.

## 0. Cross-cutting rules

**Access levels**
- Each role/module pair has an access level of `edit` or `view`. A module missing from the map is hidden.
- Defaults:
  - `school_admin` gets `edit` on every module.
  - Other roles get `edit` only on the modules listed in `EDIT_DEFAULT` (config/roles.js). Everything else in their menu is `view`.
- The access map is stored in localStorage under `miz-access` with version `__v=3`.

**What `view` does to actions**
- Every store action is wrapped. When the current module is `view`, the action:
  - does nothing,
  - shows the toast "View-only access — ask the school admin for edit rights",
  - writes an audit entry of kind `security`: "Blocked: tried to <action humanized> with view-only access".
- Success toasts are also hidden on view-only pages.
- The buttons themselves still render. A production build should hide or disable them.

**Audit log**
- Every allowed action writes one audit row: `{user: persona name, role, device 'Chrome · Windows', ip, kind 'change', module, action: describe()}`.
- The `describe()` texts are listed per action below.

**`push(audiences[], title, body, kind, channels=['push','whatsapp'])`**
- Adds one notification per audience: `{audience, title, body, kind, created_at}`.
- Adds one `comm_logs` row per channel: `{channel, template: title, to: audiences.join(', '), status: 'sent'}`.

**Timing and periods**
- Day of week `todayDow`: 1 = Mon … 6 = Sat. Sunday maps to 1.
- PERIODS:

| Period | Time |
|---|---|
| P1 | 08:00–08:45 |
| P2 | 08:45–09:30 |
| P3 | 09:30–10:15 |
| Short break | 10:15 |
| P4 | 10:35–11:20 |
| P5 | 11:20–12:05 |
| Lunch break | 12:05 |
| P6 | 12:45–13:30 |
| P7 | 13:30–14:15 |

- `currentPeriod` uses minute ranges [480–525, 525–570, 570–615, 635–680, 680–725, 765–810, 810–855].

**Grades (`grade(p)`)**

| Percentage | Grade |
|---|---|
| ≥91 | A1 |
| ≥81 | A2 |
| ≥71 | B1 |
| ≥61 | B2 |
| ≥51 | C1 |
| ≥41 | C2 |
| ≥33 | D |
| below 33 | E |

- Grade badge colour, used in several places: pct ≥75 green, ≥50 blue, otherwise amber.

**Attendance statistics (`attendanceStats`)**
- Counts present / absent / late / leave.
- pct = (present + late) / total × 100.
- "Today" (`idx.today`) is the latest date that exists in the attendance data, not the calendar date.

**Report card (`reportCard`)**
- Rows are that exam's marks, each with pct = obtained / max × 100, sorted by subject code.
- total, max, pct and grade are computed over all rows.
- `sectionResults` sorts students by pct (descending) and assigns rank = index + 1. Ties are not handled.

**Stages (`STAGES`)**

| key | label | range | assessment | school day |
|---|---|---|---|---|
| pre | Pre-primary | LKG – UKG | "Skill checklist & daily diary — no exams" | 08:00 – 12:05 |
| primary | Primary | Class 1 – 5 | "Grades (A1–E) with light unit tests" | 08:00 – 14:15 |
| middle | Middle | Class 6 – 8 | "Marks + grades, 3rd language" | 08:00 – 14:15 |
| secondary | Secondary | Class 9 – 10 | "Board pattern, pre-boards, board registration" | 08:00 – 14:15 |
| senior | Senior Secondary | Class 11 – 12 | "Streams, theory + practical, board exams" | 08:00 – 14:15 |

- Streams: Sci = Science, Com = Commerce, Hum = Humanities.
- Sections:
  - LKG and UKG: A and B. Names look like "LKG-A".
  - Classes 1–10: A and B. Names look like "8A".
  - Classes 11 and 12: Sci, Com and Hum. Names look like "11 Sci".

**Subjects per section (`subjectCodesFor`)**

| Stage / stream | Subject codes |
|---|---|
| pre | ENG HIN MAT EVS ART MUS PE |
| primary | ENG HIN MAT EVS CS ART PE |
| middle | ENG HIN MAT SCI SST SAN CS PE |
| secondary | ENG HIN MAT SCI SST CS PE |
| 11–12 Sci | ENG PHY CHE MAT BIO CS PE |
| 11–12 Com | ENG ACC BST ECO MAT PE |
| 11–12 Hum | ENG HIS POL GEO ECO PE |

- Exam subjects are the list above minus PE, ART and MUS. Pre-primary has no exam subjects.
- PRACTICAL subjects = PHY, CHE, BIO, CS.

**Weekly periods (`slotsPerWeek`)**
- Pre-primary: 28. Everyone else: 39.
- Per-day periods used by the timetable builder:
  - Pre-primary: 5 per day, 3 on Saturday.
  - Others: 7 per day, 4 on Saturday.

**DEFAULT_SCHEME (periods per week per subject)**

| Scheme | Periods per subject |
|---|---|
| pre | ENG 6, HIN 5, MAT 5, EVS 4, ART 3, MUS 3, PE 2 |
| primary | ENG 8, HIN 7, MAT 8, EVS 6, CS 3, ART 3, PE 4 |
| middle | ENG 6, HIN 5, MAT 7, SCI 7, SST 6, SAN 3, CS 2, PE 3 |
| secondary | ENG 6, HIN 5, MAT 8, SCI 8, SST 6, CS 3, PE 3 |
| senior-Sci | ENG 5, PHY 7, CHE 7, MAT 7, BIO 6, CS 4, PE 3 |
| senior-Com | ENG 5, ACC 8, BST 8, ECO 7, MAT 7, PE 4 |
| senior-Hum | ENG 6, HIS 8, POL 8, GEO 7, ECO 6, PE 4 |

- The scheme key is the stage name, or `senior-<stream>` for Classes 11–12.

**Teacher categories (`CATEGORIES`)**

| Category | Label | Stages | Max load / week |
|---|---|---|---|
| NTT | Nursery Teacher | pre | 30 |
| PRT | Primary Teacher | pre, primary | 34 |
| TGT | Trained Graduate Teacher | primary, middle, secondary | 34 |
| PGT | Post Graduate Teacher | secondary, senior | 32 |

- SPECIALIST subjects (PE, ART, MUS, CS) can be taught at any stage.
- HOME_STAGES: NTT → pre, PRT → primary, TGT → middle and secondary, PGT → senior.
- `maxLoad(t)` = `t.max_load`, else the category max, else 32. The UI note also mentions "part-time 15".

**Demo personas**
- Teacher: the class teacher of 8A.
- Student: `meta.demoStudentId`.
- Parent: `meta.demoParentStudentIds`, with a ChildSwitcher.

---

## ACADEMIC

### Academic — Students
- **Who sees it**
  - Nav: school_admin, principal, teacher, reception, librarian, warden.
  - Edit rights: school_admin and principal.
  - Only school_admin sees the action buttons.
  - For warden, the screen becomes "Hostellers" and lists only students with `hostel_room_id`.
- **Header**
  - Title "Students" (warden: "Hostellers").
  - Subtitle "`{shown} of {total} students`". For warden the total counts hostellers only.
- **Actions (school_admin only)**
  - "Import from Excel" — no handler.
  - "Add student" — opens the modal.
- **Filters** (all combined with AND)
  - Search box, placeholder "Search name, admission no., parent or phone". Case-insensitive match on name, admission_no, guardian_name and guardian_phone.
  - Stage select: "All stages (LKG–12)", then one option per stage, "`{label} · {range}`". Changing stage resets the class filter.
  - Class select: "All classes", then "Class {name}" for every section. The list is not filtered by the chosen stage.
- **Table columns**
  - Student (avatar + name)
  - Adm. no.
  - Class (section name)
  - Roll
  - Guardian
  - Phone (guardian phone)
  - Transport: route code, or "Own". For warden this column is "Room" and shows the hostel room_no.
  - Today: status badge from `attToday`. Defaults to "present" when there is no record.
- **Rows**
  - Shows at most 120 rows. Footer: "Showing first 120 — refine your search to see more."
  - Clicking a row opens the Student profile.
  - Empty state: "No students match your search."
- **"Add student" modal**
  - Plain text inputs, no validation and not bound to state: Full name, Date of birth, Guardian name, Guardian mobile, Admission no., Blood group.
  - Class select, which defaults to the first section.
  - Transport select: "Own transport", then "`{code} · {name}`" per route.
  - Buttons: Cancel, "Save student".
  - Save only shows the toast "Student saved (demo)". Nothing is persisted.

### Academic — Student profile (modal, 640px)
- **Header**
  - Large avatar and name.
  - "`Class {sec} · Roll {n} · {admission_no}`".
  - Status badge (`s.status`).
- **Three stat cards**
  - Attendance: `studentAttendance(...).pct`, 0 decimals.
  - "`{first word of the Half-yearly exam name}` result": the grade from `reportCard` for the first exam whose name starts with "Half".
  - Fees due: sum of invoices whose status is not paid and not upcoming. Red when above zero, "Nil" when zero.
- **Personal**
  - Gender: F → Female, otherwise Male.
  - Date of birth, format "d Mon yyyy".
  - Blood group.
  - Address.
- **Guardian**
  - Name, Mobile, Email.
  - Transport: "`{route code} · {stop name}`" or "Own".
- Empty values show "—".

### Academic — Teachers ("Teachers & staff")
- **Who sees it**
  - Nav: school_admin and principal. Both have edit rights.
- **Header**
  - Title "Teachers & staff". Subtitle "`{n} teaching staff`".
  - Button "Add staff" — no handler.
- **Search**
  - "Search staff". Matches name and employee_code.
- **Table columns**
  - Name: avatar, name, email underneath.
  - Emp. code.
  - Subject: main subject name, plus "also {other codes}" when the teacher has more than one subject.
  - Designation: badge, plus "Part-time" when applicable.
  - Class teacher: blue badge with the section they lead, or "—".
  - Load / wk: sum of the teacher's published allocation periods, shown as "/{t.max_load}".
  - Phone.
  - Joined: format "Mon yyyy".

### Academic — Classes ("Classes & sections")
- **Who sees it**
  - Nav: school_admin only.
- **Header**
  - Subtitle "`LKG to Class 12 · {n} sections · {n} students`".
  - Button "Add section" — no handler.
- **Stage cards** (5)
  - Each shows the stage icon, label, range, "{n} sections" and "{n} students".
  - Clicking a card filters to that stage. Clicking it again goes back to all.
- **Per-stage group**
  - Heading with the stage label and range.
  - Badges: the assessment text, and "School day {day}".
- **Section card**
  - Title: section name.
  - Badge: the stream name for senior sections, otherwise the room.
  - Rows:
    - Class teacher.
    - Strength: "`N (xG / yB)`".
    - Present today: `attendanceStats` pct for that section on `idx.today`, rounded, with a progress bar.
    - CR: first names of students whose role is "Class Representative", joined with " & ". Shown only when at least one exists.
    - Subject codes joined with " · ".

### Academic — Attendance (staff view: school_admin, principal, teacher, scanner)
- **Access**
  - Edit rights: principal, teacher, scanner, plus school_admin.
- **Header**
  - Title "Attendance". Subtitle is `idx.today` formatted "weekday, d Month".
- **Tabs**
  - Overview, "Mark attendance", "Absentees ({n})".
  - Default tab is "mark" for teacher and scanner, "overview" for everyone else.
- **Overview tab — KPI cards**
  - School attendance: pct. Foot "`{present+late} of {total}`".
  - Absent: count. Foot "Parents notified by SMS".
  - Late: count. Foot "Arrived after 07:55".
  - On leave: count. Foot "Approved leave".
- **Overview tab — other content**
  - "Last 12 school days": bar chart of each day's pct, axis minimum 80.
  - "Section summary" table: Class, Present, Late, Absent, Leave, Rate (progress bar + %).
  - Clicking a section row opens the Mark tab for that section.
- **Mark attendance tab**
  - Section select. Defaults to the persona's section (8A for teacher), else the first section.
  - Header text: "`{n} students · Class teacher {name}`".
  - Live count badges: P / A / L / Lv.
  - Legend: "P = Present · A = Absent · L = Late · V = Leave".
  - Button "Mark all present".
  - One row per student: roll, avatar, name, and a 4-button toggle P / A / L / V (present / absent / late / leave).
  - Initial state comes from the saved records for that date and section. Students with no record have nothing selected.
  - Footer note: "Absent students’ parents receive an SMS and app notification on save."
  - Button "Save attendance".
- **Save attendance**
  - Calls `saveAttendance(sec, date, marks)`, which replaces all records for that section and date with the marks map.
  - If the number absent is above zero, it pushes:
    - Audience: parent and school_admin.
    - Title: "`{n} student(s) marked absent`".
    - Body: "Parents alerted on WhatsApp and SMS."
    - Kind: attendance.
    - Channels: whatsapp, sms, push.
  - Toast: "`Attendance saved for {sec} · {absent} absent`".
  - Audit: "Marked attendance · Class X · date".
- **Absentees tab**
  - Table: Student, Class, Guardian, Phone, Alert. Alert is always a static badge "SMS sent".
- **Scanner role**
  - Footer text: "Gate scans are recorded automatically; manual corrections are logged in the audit trail."
- **Gap:** there is no role scoping. Teachers can pick any section. Production should limit a teacher to the classes they lead.

### Academic — Attendance (family view: parent, student)
- **Header**
  - Title "Attendance". Subtitle "`{child} · last 24 school days`".
  - Parents get a ChildSwitcher.
- **KPI cards**
  - Attendance: pct, 1 decimal. Amber when below 85, otherwise green. Foot "Minimum required: 75%".
  - Present: days.
  - Absent: days.
  - Late / leave: "`{late} / {leave}`".
- **Month calendar**
  - Weeks start on Monday. Title is "Month yyyy". ‹ and › buttons change the month.
  - Each day is coloured by its status class.
  - Legend: Present (green), Absent (red), "Late / leave" (amber).
- **"Recent days"**
  - The 8 most recent records: date and status badge.

### Academic — Timetable
- **Who sees it**
  - Nav: school_admin, principal, teacher, parent, student.
  - Edit rights: principal, school_admin. There are no edit controls on the screen.
- **Modes**
  - Family (parent, student): fixed to the child's section. Parents get a ChildSwitcher.
  - Teacher: a toggle between "My timetable" and "Class timetable". Defaults to "My timetable".
  - Everyone else: section select, defaulting to `sections[4]`. The select is hidden in "My timetable" mode.
- **Header**
  - Subtitle "`{name} · weekly schedule`" in My mode.
  - Otherwise "`Class {sec} · {room}`".
  - Button "Print" (browser print).
- **Grid**
  - Columns: Period, then Mon–Sat. Today's column is highlighted and labelled "`{Day} · Today`".
  - Break rows: "10:15 Short break" before P4, and "12:05 Lunch break" before P6.
  - Period cell: "P{n}" with start–end time.
  - Each slot shows the subject icon and name, coloured by subject.
  - Second line of the slot:
    - My mode: "Class {sec}".
    - A substitution with no teacher: "Teacher to be assigned" if the substitution is open, otherwise "Library self-study".
    - Otherwise the teacher name without the Mr./Ms./Mrs. prefix.
  - Substituted slots get a tag "`Substitute · for {original teacher}`".
  - The current period today is highlighted with the "now" style.
  - Empty cell: "—" on Saturday after P4, "Free" in My mode, otherwise blank.
- **Data**
  - Today's slots have substitutions applied (`applySubs` for `todayISO`). Other days use the raw timetable.

### Academic — Homework
- **Who sees it**
  - Nav: school_admin, teacher, parent, student.
  - Edit rights: teacher, student, school_admin.
- **Header**
  - Subtitle "`Class {sec} · {n} assignments`".
- **Section selection**
  - Family: fixed to the child's section. Parents get a ChildSwitcher.
  - Teacher: select limited to their own section plus every section in their allocations.
  - Admin: select of all sections.
- **"Assign homework" button** (teacher and admin)
  - Disabled when the user cannot assign. Tooltip: "You don’t teach this class — see My Classes".
  - `canAssign` = school_admin, or a teacher who has at least one allocation in the selected section.
- **Homework list**
  - All homework for the section, sorted by due date ascending.
  - Each card:
    - Subject icon and badge.
    - "`Assigned {date} by {teacher}`".
    - Title and details.
  - Status badge:
    - "Submitted" (green) — local state only.
    - "Past due" (red) when due < today.
    - "Due today" (red).
    - Otherwise "Due Wed, 5 Oct" format (amber).
  - Student: a "Submit" button that only changes local state. Toast "Marked as submitted". Nothing is persisted.
  - Teacher: "`{floor(n × 0.7)} / {n} submitted`". This is a fake number.
  - Empty state: "No homework for this class."
- **Assign modal** ("Assign homework — Class X")
  - Subject select:
    - Teacher: only subjects allocated to them in that class. Hint "Only subjects allotted to you in this class".
    - Admin: all subjects for the section.
  - Due date: date input.
  - Title: placeholder "e.g. Exercise 8.1 — Q1 to Q10".
  - Instructions: textarea.
  - "Attach PDF / image" button — no handler.
  - "Publish" is disabled until Title and Due date are filled.
- **Publish action**
  - `addHomework` prepends `{id, assigned_on: today, subject_id, title, details, due_on, section_id, teacher_id}`. For admin, teacher_id is the persona's teacher or `teachers[0]`.
  - Push: audience parent and student, title "New homework added", body "`{title} — due {due_on}`", kind homework, channel push.
  - Toast: "Homework published — parents notified".
  - Audit: "Posted homework · Class X · Subject".

### Academic — Results (router)
- parent and student see ReportCardView. If the child is pre-primary they see SkillReport instead.
- teacher sees MarksEntry.
- Everyone else sees ResultsOverview. By nav that is school_admin and principal.
- Edit rights: principal, teacher, school_admin.
- The exam select (`ExamSelect`) lists only exams with status `published`. The default exam everywhere is `exams[1]`.

### Results — ResultsOverview ("Exams & report cards")
- **Header**
  - Subtitle "Class 1–12 marks and grades · LKG–UKG use the skill checklist".
  - Exam select.
  - Button "Publish to parents":
    - Push: audience parent and student, title "Report card published", body "`{exam name} results are now available`", kind notice, channels push, whatsapp, email.
    - Toast: "Published — parents notified on app, WhatsApp & email".
    - It does not lock marks, even though the teacher screen says marks are locked once published.
- **Tabs**
  - Merit list (default), Class averages, "Board exams (10 & 12)", "Stream selection (10 → 11)", "Exam schedule".
  - "Graded" sections = every stage except pre-primary.
- **Merit list**
  - Card title "`Merit list — Class {sec}`". Section select defaults to 8A.
  - Columns: Rank, Student, one column per subject code (marks obtained, red when that subject is below 33%), Total ("total/max"), % (1 decimal), Grade badge.
- **Class averages**
  - Bar chart per graded section. Value = mean pct across the section's students, rounded.
- **Board exams — stats**
  - "Class 10 candidates": student count in grade 10.
  - "Class 12 candidates": student count in grade 12.
  - "Registration (LOC)": static "Submitted", foot "Board portal export ready".
  - "Pre-board": `exams[2].starts_on`.
- **Board exams — table** ("List of candidates — board registration")
  - Button "Export LOC". Toast only: "LOC file exported in board format".
  - Columns: Student, Class, Adm. no., DOB, Subjects (subject codes from marks), Documents.
  - Documents is fake: rows where index % 9 == 4 show "Photo pending", all others "Complete".
- **Stream selection**
  - Covers grade-10 students, sorted by pct descending.
  - Columns: Student, Class, Overall %, Maths, Science, Suggested stream.
  - Rule:
    - MAT ≥ 70 and SCI ≥ 70 → "Science (PCM/PCB)"
    - otherwise overall ≥ 60 → "Commerce"
    - otherwise "Humanities"
  - This rule is different from the one used on the Promotion screen (see below).
  - Button "Share with parents":
    - Push: audience parent, title "Stream counselling", body "Suggested stream for Class 11 is ready — book a counselling slot.", channels push, whatsapp.
    - Toast: "Stream suggestions shared with parents".
- **Exam schedule**
  - Columns: Stage, Classes, Assessment, Next.
  - Next:
    - pre: "Skill review — end of term".
    - secondary and senior: "`Pre-board · {exams[2] date}`".
    - Others: "`{exams[2].name} · {date}`".

### Results — MarksEntry (teacher)
- **Class / subject pairs**
  - The teacher's allocations, excluding PE, ART and MUS and excluding pre-primary sections, sorted by grade.
  - Default pair: the teacher's own section if present, otherwise the first pair.
- **Header**
  - Title "Marks entry". Subtitle "`{subject} · max marks {max}`".
  - max = `max_marks` of the existing marks, else 80.
  - Selects: exam, and "`Class {sec} · {subject}`".
- **Table columns**
  - Roll, Student.
  - "Marks / {max}": number input. Values are clamped to 0..max. Empty is allowed.
  - %: 0 decimals, or "—".
  - Grade: badge, red when below 33%.
- Edits reset whenever exam, section or subject changes.
- **Footer**
  - Note: "You can enter marks only for the classes and subjects allotted to you. Marks are locked once the principal publishes results."
  - Button "Save marks".
- **Save marks**
  - `saveMarks(exam, subject, vals)` updates only mark rows that already exist for that exam and subject. It does not create new rows.
  - The filter is by exam and subject only, not by section. In production, scope it to the section as well.
  - Push: audience principal, title "Marks entered", body "A teacher saved marks — ready for review before publishing.", channel push.
  - Toast: "Marks saved".
  - Audit: "`Saved marks · {subject} · {n} students changed`".

### Results — ReportCardView (parent, student; Class 1–12)
- **Header**
  - Title "Results". Subtitle "`{child} · Class {sec}`".
  - ChildSwitcher (parent), exam select, "Download" (print).
- **Report head**
  - School crest and name.
  - "`{address} · Affiliated to {board} ({affiliation_no})`".
  - "`Report Card — {exam} · AY {academic_year}`".
- **Info strip**
  - Student; "Class / Roll" as "sec / roll"; Admission no.; Guardian.
- **Marks table**
  - Columns: Subject, Max, Obtained, % (0 decimals), Grade (badge colour ≥75 / ≥50).
  - For senior sections, practical subjects get the suffix " · theory (practical 30 separately)".
  - Total row: max, total, pct (1 decimal), overall grade in a navy badge.
- **"Co-scholastic areas (NEP holistic progress)"**
  - Rows from `data.co_scholastic[studentId]`: area and grade badge (A green, B blue, other amber).
- **"Class teacher’s remarks"**
  - Text from `smartRemark`.
  - Chips: "Attendance {n}%", "Strongest: {subject with highest pct}", "Focus: {subject with lowest pct}".
- **Footer**
  - "`Class rank: {rank} of {section size}`".
  - "Result:" shows "Pass" when pct ≥ 33, else "Needs improvement". The text is always green.
  - Signature lines: Class Teacher, Principal.

### Results — smartRemark(s, rc, attPct)
- first = the student's first name. He/She from gender. "his"/"her" likewise.
- Tone sentence:
  - pct ≥ 85: "`{first} has delivered an excellent performance this term`"
  - pct ≥ 70: "…has shown consistent effort and good understanding this term"
  - pct ≥ 55: "…is progressing steadily"
  - otherwise: "`{first} needs regular support and practice to reach {his} potential`"
- Attendance sentence:
  - ≥ 95: "Attendance has been exemplary."
  - ≥ 85: "Attendance is regular."
  - otherwise: "Irregular attendance is affecting learning; please ensure daily attendance."
- Output: "`{tone}. {He} shows particular strength in {best}[, while {weak} needs more practice at home]. {att} Keep it up!`"
  - The weak-subject clause is left out when weak = best.
- The code comment says the teacher can edit the remark, but the UI has no editor.

### Results — SkillReport (pre-primary child)
- **Header**
  - Title "Progress report". Subtitle "`{child} · {sec} · skill-based (no exams in pre-primary)`".
  - ChildSwitcher, Download.
- **Report head**
  - "`Pre-primary Progress Report · Term 1 · AY {year}`".
  - Info: Child, Class, Class teacher.
- **Table**
  - Columns: "Development area", Level, "Teacher’s observation".
  - Level is a 4-segment bar: Emerging 1, Developing 2, Proficient 3, Mastered 4.
- **"Teacher’s note"**
  - Static text using the child's first name.
- **Side card "Daily diary — this week"**
  - Date, mood badge, "`{activity} · {meal} · {photos} photos`".

---

## ALLOCATION

### Allocation — Teacher allocation (principal, school_admin)
- **Access**
  - Nav: school_admin, principal. Both have edit rights.
  - Only the principal can publish or answer teacher requests.
- **Header**
  - Title "Teacher allocation".
  - Subtitle "`Who teaches what · Session {session} · Published v{version} on {published_at} (effective {effective_from})`".
- **Header buttons**
  - "Fill empty cells": `allocAuto('empty')`. Keeps the current draft (or published rows) and fills only empty cells. Toast "Empty cells filled by auto-suggest".
  - "Re-suggest all": `allocAuto('all')`. Rebuilds from scratch. Toast "New draft suggested from scratch".
  - "Discard draft" (only when a draft exists): clears the draft and sets `submitted=false`. Toast "Draft discarded".
  - With a draft, the principal sees "Publish v{n+1}", which opens the PublishModal.
  - With a draft, school_admin sees "Send for approval":
    - Disabled once submitted, when the label becomes "Waiting for principal".
    - Calls `allocSubmit(name)`. Push: audience principal, title "Teacher allocation sent for approval", body "`{by} prepared a new draft. Review and publish.`", channels push, email.
    - Sets `alloc_meta.submitted=true` and `submitted_by`.
    - Toast: "Sent to the principal for approval".
- **Draft banner** (amber border)
  - "`Draft — {n} change(s) not published yet`".
  - "`Teachers, timetable, homework and marks rights still follow v{version} until you publish.`" plus "Sent for approval by X." when submitted.
  - Red badge "`{n} error(s) to fix`" when there are errors.
  - Up to 6 changes as "`{sec} {code}: {from} → {to}`", then "+ n more".
- **KPI cards**
  - "Periods needed / week": sum of scheme periods over all sections. Foot "`{n} sections · from subject scheme`".
  - "Periods allotted": sum of periods in the current rows (draft, else published).
    - Foot "Every period has a teacher" (green) when equal to the need, else "`{diff} periods without a teacher`" (red).
  - "Average teacher load": allotted ÷ number of teachers, 1 decimal. Foot "`{n} teachers · periods per week`".
  - "Issues": issue count. Foot "`{e} errors · {w} warnings`" or "All checks passed". Red if any errors, amber if only warnings, green if none.
- **"Requests from teachers ({n})"** (open queries only)
  - Each shows avatar, name, time ago and text.
  - Principal only:
    - "Reply: no change" → `answerAllocQuery(id, 'answered', 'Discussed — no change this term.')`. Toast "Reply sent".
    - "Accept" → status accepted, reply "Accepted — will be in the next version.". Toast "Accepted — make the change in the grid and publish".
  - Push on either: audience teacher, title "`Your allocation request was accepted`" or "…answered", body = the reply, channel push.
- **Tabs**
  - Allocation grid, Teacher load, Need vs available, Class teachers, Subject scheme, History.

**Allocation grid tab**
- Stage segment control: LKG–UKG, Class 1–5, Class 6–8 (default), Class 9–10, Class 11–12.
- Hint text: "★ class teacher · number = periods/week · click a cell to change".
- Columns: Class, then every subject code with more than 0 periods in any section of that stage, then Total.
- Class cell: name (plus stream for senior) and "★ {class teacher short name}".
- Subject cell:
  - "—" when the subject is not in that section's scheme.
  - Otherwise a button listing each allocated teacher as "★ First L. **periods**". The ★ appears when that teacher is the class teacher.
  - With no teachers, the button shows a red "Assign · {need}".
  - Cell styling: `err` when the cell has an error, `warn` for warnings, `changed` when it differs from the published version. Tooltip lists the issue texts.
- Total column: "`{allotted in section}/{slotsPerWeek}`".
- **Side card "Checks ({n})"**
  - Up to 14 issues, each with an icon (error or warn). Clicking an issue with a subject code opens that cell.
  - Empty state: "Every period has a qualified teacher, nobody is overloaded and every class teacher teaches their own class."
  - Footer: "Checks run live: missing teacher, periods not matching the scheme, subject/level mismatch, overload, class teacher not teaching the class, one teacher leading two classes."

**validate() rules** (severity, then message)
- For each demand cell:
  - No rows → **error** "`Class {sec} {code} has no teacher`".
  - Sum ≠ scheme → **error** "`Class {sec} {code}: {total} of {periods} periods allotted`".
  - Per teacher, fit 3 → **error** "`{name} doesn’t teach {code} (Class {sec})`".
  - Per teacher, fit 2 → **warn** "`{name} ({designation}) teaching Class {sec} {code} — usually needs a PGT/an NTT/PRT/a TGT`". Which one depends on stage: PGT for senior, NTT/PRT for pre-primary, TGT otherwise.
- Load above maxLoad → **warn** "`{name} has {load} periods (max {max})`".
- Section with no class teacher → **error** "`Class {sec} has no class teacher`".
- Class teacher has no row in their own section → **warn** "`Class teacher of {sec} ({name}) doesn’t teach that class`".
- Teacher is class teacher of more than one section → **warn** "`{name} is class teacher of {n} sections`".

**fit(t, code, sec)**
- 3 = the code is not in the teacher's subject_codes.
- 2 = level mismatch: the subject is not SPECIALIST and the section's stage is not in the teacher's category stages.
- 0 = main subject (`subject_codes[0]`).
- 1 = second subject.
- Labels: "Main subject", "Second subject", "Different level", "Not their subject".

**autoAllocate**
- Considers active teachers only (status ≠ inactive). "Keep" rows are never changed.
- Step 1 — class teachers:
  - For each section, the class teacher takes every not-yet-assigned cell where their fit ≤ 1, main subject first.
  - Each cell is taken only if their load after adding stays ≤ maxLoad.
- Step 2 — remaining cells:
  - Sorted by scarcity (number of teachers with fit ≤ 1) ascending, then grade descending, then periods descending.
  - Candidates are teachers with fit ≤ 2.
  - Score: `over×100 + fit×10 + away(3 if the subject is not specialist and the stage is not the teacher's HOME_STAGE) + after/maxLoad + sibling(−0.25 if the teacher already teaches the same grade and code)`.
  - The lowest score wins. The whole scheme period count goes to that one teacher.
  - Cells with no candidates stay empty.

**CellModal** ("Class {sec} · {subject}", 620px)
- Badges: "{need} periods / week", stage label, "Class teacher: X".
- Teacher rows: one blank row per current teacher, or a single blank row prefilled with periods = need.
- Each row:
  - Teacher select, labelled "Teacher" (or "Teacher n" when split).
    - First option "Select teacher".
    - Options grouped by fit, in optgroups "Main subject", "Second subject", "Different level", "Other teachers (not their subject)".
    - Each group is sorted by load-without-this-cell ÷ maxLoad, ascending.
    - Option text: "`{short name} · {designation} · {loadWithout}/{max} periods[ · part-time]`".
  - Periods: number input, min 1, max = need.
  - Remove (×) button when there is more than one row.
- When a teacher is chosen, the row also shows:
  - A fit badge (green / blue / amber / red).
  - "Load after: x/max", coloured by `loadTone`.
  - "`Teaches {codes} · {category label}[ · comes {days}]`".
- `loadTone` / `loadLabel`:
  - load > max → red "Overloaded".
  - ≥ 90% of max → amber "Full".
  - < 55% of max → blue "Spare capacity".
  - otherwise green "Balanced".
  - The progress-bar colour (`loadColor`) is danger / warn / success.
- "Split with another teacher" adds a row with periods = max(1, need − total).
- Help text: "A split subject (e.g. Physics + Chemistry part of Science) gives each teacher their own periods, homework and marks column; the report card combines them."
- Footer:
  - "`{total} of {need} periods allotted`": green when equal, red and bold otherwise.
  - Cancel, "Save to draft".
- There is no validation that blocks saving.
- **Save to draft**
  - `allocSetCell` replaces the cell's rows in the draft, keeping only rows with a teacher and periods > 0.
  - Row id: `{sec}:{code}:{teacher}`.
  - Toast: "Saved to draft — publish to apply".
  - Audit: "`Allocation draft · Class X CODE → A + B`" (or "nobody").

**PublishModal** ("Publish allocation v{n+1}", 560px)
- Effective from: date, default tomorrow, min today.
- Summary lines:
  - "`{n} changes compared with v{version}`".
  - "Timetable is rebuilt with no teacher clashes".
  - "`WhatsApp + app to {n} teachers with their new class list`". The count covers teachers in both the old and new rows of every changed cell.
  - "`Parents of {sections} told about the new subject teacher`". Only sections where the set of teachers changed.
  - "`Homework, marks entry and lesson plans follow the new allocation from {date}. Old records keep the old teacher’s name.`"
- If there are errors:
  - Red box "`{n} errors still open`" listing up to 4.
  - Checkbox "Publish anyway (these periods will show as “No teacher”)".
  - "Publish & notify" stays disabled until the box is ticked.
- **allocPublish**
  - allocations = the draft; the draft is cleared.
  - version + 1.
  - The timetable is rebuilt with `buildTimetable(sections, rows, PERIODS, version+3)`:
    - Up to 6 attempts; the one with the fewest clashes is kept.
    - Periods are placed greedily per day and period. Sections with fewer remaining options pick first.
    - Rooms by subject: CS → Computer Lab; PHY/CHE/BIO, or SCI in P6 and later → Science Lab; PE → Playground; MUS → Music Room; ART → Art Room; otherwise the section's room.
    - A repair pass swaps periods within a section to remove teacher double-bookings.
  - `alloc_meta` gets version, status published, published_at, published_by and effective_from, and submitted=false.
  - `alloc_log` entry: "`Published v{n} — {c} changes, effective {date}. {t} teachers[ and parents of {s} classes] notified. Timetable rebuilt.`"
  - Notifications:
    - To teacher: "`Teacher allocation v{n} published`", body "`Effective {date}. Your classes and timetable are updated.`"
    - If any section's teachers changed, to parent: "Subject teacher update", body "`New subject teacher from {date} for Class {first 3 sections}.`"
  - One comm_log entry on whatsapp, "`Allocation v{n}`", to "`{t} teachers[, parents of …]`".
  - Toast: "`Published — timetable rebuilt, {n} teachers notified`".

**Teacher load tab**
- Search "Search teacher". Filter: All / Overloaded (load > max) / "Spare capacity" (load < 55% of max).
- Columns:
  - Teacher: name plus "`designation[ · part-time (days)][ · ★ Class teacher X]`".
  - Can teach: main subject name plus "+ other codes".
  - Classes (periods): badges "`{sec} {code} {periods}`" sorted by grade. Navy when it is their own class. "No classes" when empty.
  - Load / week: progress bar plus "l/m".
  - Status: loadLabel.

**Need vs available tab**
- KPI cards:
  - "Periods the school needs". Foot "All sections, per week".
  - "Teaching capacity": sum of maxLoad over all teachers. Foot "`{demand/cap %} used`".
  - "Subjects short on main teachers": count of subjects with gap > 0. Foot lists their codes, or "None".
- Table "Need vs available by subject", sorted by gap descending:
  - Columns: Subject, Sections, Periods needed, Main teachers (active teachers whose `subject_codes[0]` is this code), Their capacity (sum of those teachers' maxLoad), Status, "What the system suggests".
  - Status:
    - gap > 0 → red "{gap} short".
    - gap > −6 → amber "Tight ({spare} spare)".
    - otherwise green "{spare} spare".
  - Suggestion when gap ≤ 0:
    - If periods are taught by second-subject teachers: "`{n} periods are with second-subject teachers — can move back to main teachers.`"
    - Otherwise: "Covered by main teachers."
  - Suggestion when gap > 0:
    - "`Use {top 2 helpers by spare} ({n} spare). `" Helpers are teachers who have this as a second subject and have spare = maxLoad − load > 0.
    - Remaining shortfall = gap − sum of helper spare. If above zero: "`Hire {ceil(short/15)} part-time {subject} teacher(s) ({short} periods).`"
- Footer: "Capacity = weekly limit of teachers whose main subject it is. Limits: NTT 30, PRT 34, TGT 34, PGT 32, part-time 15 — change per teacher in Teachers & Staff."

**Class teachers tab**
- Note: "Rule: a class teacher must teach the class, and leads only one section. The co-class teacher takes over automatically during the class teacher’s leave."
- Columns:
  - Class: name plus "{n} students".
  - Class teacher: select (principal and admin), otherwise plain text.
    - Optgroups "Teaches this class" and "Other teachers".
    - Option text "`{name} · {designation}[ · already CT of {sec}]`".
  - Co-class teacher: select with "None" plus the same options.
  - Since: `class_teacher_since`.
  - Checks: "Teaches class" (green) or "Doesn’t teach class" (amber), plus "Leads {n} classes" (red) when more than one.
- Changing either select opens a confirm modal, "Change for Class X":
  - "A → B as class teacher", and/or "Co-class teacher → X".
  - Effective from: date, default today.
  - When the class teacher changes: "From this date attendance marking, student leave approval, report card remarks, PTM and the class parents’ chat move to the new class teacher. Attendance marked before this date keeps the old teacher’s name. Parents of X get a WhatsApp message."
- **Confirm → `setClassTeacher`**
  - Updates the section.
  - Sets `class_teacher_since = effective` when the class teacher changed.
  - `alloc_log` entry: "`Class teacher of X: A → B; Co-class teacher of X: … (from date).`"
  - Notifications only when the class teacher changed:
    - To parent: "`New class teacher for {sec}`", body "`{B} is the class teacher of {sec} from {date}.`"
    - To teacher: "`Class teacher change — {sec}`", body "`Attendance, leave approvals and remarks for {sec} move to {B} from {date}.`"
    - comm_log on whatsapp, "Class teacher change", to "Parents of X".
  - Toast: "Saved — parents and teachers notified".
  - No-op if nothing changed.

**Subject scheme tab**
- Note: "Periods per week for each subject. Changing a number updates what every class needs and opens a draft of the allocation."
- One card per scheme key (SCHEME_LABELS: "Pre-primary (LKG–UKG)", "Primary (1–5)", "Middle (6–8)", "Secondary (9–10)", "Class 11–12 Science/Commerce/Humanities").
  - Badge "tot/slots" (slots = 28 for pre, else 39). Green when equal, red otherwise.
  - Per subject: a number input (0–12) for principal and admin, otherwise plain text.
  - Footer: "`{n} sections · fits the week`", or "`{x} periods more than the week has`", or "`{x} free periods (library / games)`".
- **`setScheme`** (fires on every keystroke)
  - Clamps the value to ≥ 0 and updates the scheme.
  - Creates or updates the draft: for sections in that key where the cell has exactly one teacher, sets that row's periods to the new value.
  - Removes rows whose periods are 0.
  - Toast: "Scheme changed — draft updated".

**History tab** ("Allocation history")
- Each entry:
  - Icon: send for versions, user-cog for class teacher changes.
  - "`Version n`" or "Class teacher change", with the date.
  - The text.
  - "By X".

### Allocation — My classes & subjects (teacher)
- **Access**
  - Nav and edit: teacher.
- **Header**
  - Subtitle "`Allocation v{n} · effective {date} · set by the principal`".
  - Button "Request a change".
- **KPI cards**
  - "Periods / week": "load/max". Foot is the loadLabel. Tone from loadTone.
  - Classes: number of distinct sections. Foot lists subject codes joined with " · ".
  - "Class teacher of": section names or "—". Foot "Co-class teacher of X", else "Attendance, leave, remarks".
  - "Substitution duties": count of substitutions where this teacher is the sub. Foot "Today". The code does not filter by date.
- **Table "What I teach"**
  - Class (★ if class teacher), Subject, Periods / week, "Shared with" ("Name (periods)" of other teachers in the same cell, or "—"), Students.
- **Card "This allocation controls"**
  - "Homework — only these classes & subjects"
  - "Marks entry — only your subject columns"
  - "Lesson plans & syllabus progress"
  - "Your timetable (built automatically)"
  - "Daily attendance & leave for {sections}", or "Attendance only if you are a class teacher".
- **"My requests"**
  - Text and a status badge: open → "With principal" (amber); accepted green; answered blue. Plus the reply.
- **Request modal**
  - Field "What would you like changed, and why?", textarea with 4 rows.
  - Placeholder "e.g. I would like to continue with 9B Maths next year for board continuity."
  - Note: "You can’t change the allocation yourself — the principal reviews requests and publishes a new version."
  - "Send" is disabled when the text is empty.
- **`raiseAllocQuery`**
  - Push: audience principal, title "Allocation request from a teacher", body = the first 90 characters, channel push.
  - Adds `{teacher_id, text, at, status:'open'}`.
  - Toast: "Sent to the principal".

### Allocation — Class roles (teacher, parent, student)
- **Access**
  - Nav: school_admin, principal, teacher, parent, student.
  - Edit rights: principal, teacher, student, school_admin.
  - principal and school_admin get SchoolLeadership instead.
- **Section**
  - Family: the child's section. Teacher: their own section (8A).
  - `canManage` = the teacher is the class teacher of that section.
- **Header**
  - Title "`Class {sec} — student roles`".
  - Subtitle "`Class teacher {name} assigns roles · parents are informed on WhatsApp`".
- Content order: ElectionBlock, then the "Current roles" card.

**Current roles** (section roles, excluding school_level ones)
- Card per role:
  - Avatar, name, "Roll n".
  - Badges: role (navy) and method (Election violet, Rotation teal, Nominated blue).
  - "`{term} · since {date}[ · next change {date}]`".
  - For managers: "Change" and "Remove". Remove calls `removeStudentRole` with toast "Role removed" and no notification.
- Empty state: "No roles yet."
- Footer: "What a CR can do in the app: see the class duty list and mark homework copies collected. A CR cannot mark attendance or see other students’ marks."
- **"Add role"** (managers)
  - Modal "Add a student role", or "Change {role}" when editing.
  - Role: Class Representative, Vice CR, Discipline Monitor (default), Sports Captain, Library Monitor, Eco Monitor, Helper of the week.
  - How chosen: Nominated (default), Election, Rotation.
  - Student: "roll. name", with the suffix " (already has a role)" when the student holds any role. Required.
  - Term: "Term 1 · 2026-27" (default), "Term 2 · 2026-27", "This month", "This week", "2026-27".
  - Button "Save & inform parent".
- **`setStudentRole`**
  - Upserts the role row with since = today.
  - Notification to parent: "`{first} is now {role}`", body "`{full} has been appointed {role} of {sec}[ for {term}].`"
  - comm_log on whatsapp, "`{role} appointed`", to the guardian.
  - Toast: "Saved — parent informed on WhatsApp".

**ElectionBlock**
- One card per election in the section: "`Election · {post} ({term})`".
  - Badge "`Open till {date}`" (green) or "Closed".
  - Candidate rows: avatar, name, plus " — elected" for the winner.
  - Vote counts and progress bars are hidden from students until they have voted or the election is closed. Everyone else always sees them. The leader's bar uses the brand colour.
  - Students see "Vote" on each candidate while the election is open and they have not voted.
    - `vote` adds the voter id and +1 to the candidate. Duplicate votes are ignored.
    - Toast: "Vote recorded — it is secret".
    - Audit: "Voted in class election (ballot is secret)".
  - Footer: "`{total votes} of {eligible} students voted · one vote per student · only {sec} can vote[ · you have voted]`".
- **"Close & declare result"** (manager, open elections)
  - Winner = most votes (ties: first in sort order).
  - Upserts the role: it replaces an existing role with the same post in the section held by a student of the same gender, otherwise inserts a new one. Method Election.
  - Notifications:
    - To parent: "`{first} elected {post}`", body "`{full} won the {sec} election with {n} votes ({term}).`"
    - To student: "`Election result — {sec}`", body "`{full} is the new {post}.`"
  - comm_log on whatsapp, "Election result", to "Parents of {sec}".
  - Toast: "Result declared — parents informed".
- **"Start a class election"** (manager)
  - Modal "`New election — Class {sec}`".
  - Post: the first 4 role options. Default "Class Representative".
  - Voting closes: date, default tomorrow.
  - Candidates: checkboxes "roll. name", "(pick 2–5)". A 6th selection is silently dropped.
  - Term: fixed at "Term 2 · 2026-27" (not editable).
  - "Open voting" is disabled with fewer than 2 candidates.
  - **`startElection`**: status open, seats 1, voters [], each candidate starts with votes 0, eligible = section size.
    - Push: audience student and parent, title "`Election: {post}`", body "`Voting is open in the app until {closes_on}. One vote per student.`", channel push.
    - Toast: "Election opened — students can vote in their app".

### Allocation — School leadership (principal, school_admin)
- **Header**
  - Title "Student leadership".
  - Subtitle "Class teachers assign CRs in their class · head boy/girl and house captains need principal approval".
- **"School-level roles"** (rows with `school_level`)
  - Each shows avatar, name, "`{role} · Class {sec} · {method}`".
  - Pending:
    - Principal sees "Approve" → `approveStudentRole` sets status approved and approved_by Principal.
      - Push: audience parent and student, title "Leadership role approved", body "The principal approved a house captain appointment.", channels push, whatsapp.
      - Toast: "Approved — student and parents informed".
    - Admin sees an "Awaiting principal" badge.
  - Otherwise an "Approved" badge.
- **Open elections banner**
  - "`{n} class election(s) running:` {sec} ({post}, closes {date}), …"
- **"Class representatives by class"**
  - Stage filter: All plus the 5 stage tabs.
  - Columns:
    - Class.
    - Class teacher.
    - Roles: badges "CR: {first name}" (other roles use the full role name), or "Not set".
    - How chosen: distinct methods, or "—".

---

## STAFFING

### Staffing — Substitutions
- **Access**
  - Nav: school_admin, principal, teacher.
  - Edit rights: principal, school_admin.
  - `manage` = principal or school_admin.
- **Header**
  - Title "Substitutions". Subtitle "`Today · {weekday d Month} · {Day} timetable`".
- **Manager buttons**
  - "Mark teacher away" opens MarkAway.
  - "Send to staff group":
    - Push: audience teacher, title "Today’s substitution arrangement", body "`{n} periods · see the Substitutions page`", channel whatsapp.
    - Toast: "Arrangement sent to the staff WhatsApp group".
  - "Auto-assign {open count}" (disabled when nothing is open) → `autoAssignSubs(name)`:
    - For each open substitution today, in order, pick the first unblocked candidate from `subCandidates`, updating the running weekly counts as it goes.
    - If there is no candidate, the period becomes library self-study.
    - `sub_week` for the chosen teacher goes up by 1.
    - If anything was assigned:
      - To teacher: "Substitution arrangement published", body "`{n} periods covered for today. Check your duties.`"
      - To student: "Some periods have a substitute today", body "See today’s timetable for who takes your class."
    - Toast: "`Best substitutes assigned for {n} periods`".
- **Teacher only: "My cover duties today ({n})"**
  - Cards: "`Period n · start`", "Cover" badge, "`Class {sec} · {subject} · {room}`", "`For {absent teacher} · today’s lesson plan is shared with you`".
  - Empty state: "No cover duty for you today."
- **KPI cards**
  - "Teachers away": teachers whose status is absent, leave or half_day. Foot lists their first names, or "Everyone is in".
  - "Periods to cover": today's substitutions. Foot "From today’s timetable".
  - Covered: total minus open. Foot "`{n} as library self-study`".
  - "Still open". Foot "Students and parents see “teacher to be assigned”" or "All periods have a teacher".
- **"Today’s arrangement" table**
  - Sorted by period, then grade.
  - Columns:
    - Period: "P{n}" plus time.
    - Class.
    - Subject.
    - "Teacher away": name plus a status chip for the reason.
    - "Taken by":
      - "Not assigned" (red) when open.
      - "Library self-study" (teal).
      - Otherwise the name, with "Same subject" or "Teaches {main code}", plus " · you" when it is the viewer.
    - Manager column: "Assign" (primary, when open) or "Change".
  - Empty state: "No teacher is away today — nothing to cover."
- **"Away today" card**
  - Each: avatar, name, "`{note or —} · {n} periods`", status chip.
  - Manager button "Back" → `markStaff(id, 'present')`. Toast "`{name} marked present — their periods are back`".
  - Empty state: "Everyone is in today."
- **"Covers this week" card**
  - Top 8 teachers by `sub_week`. Bar = count ÷ 6 × 100, plus the count.
  - Note: "Covers are shared fairly: the system prefers teachers with fewer covers this week, and nobody gets more than 2 a day."
- Status chips (STATUS_META):
  - present "Present" green
  - late "Late" amber
  - half_day "Half day" violet
  - leave "On leave" blue
  - absent "Absent" red
  - none: "Not marked"

**subCandidates ranking**
- A candidate is blocked, checked in this order, when they:
  - are the absent teacher: "Absent"
  - are away themselves this period: "Half day" or "On leave". A half day is away from P5 onward; absent and leave are away all day.
  - are part-time and today is not one of their days: "Not on campus today"
  - have a timetable slot at the same day and period: "Teaching another class"
  - are already covering this period: "Already covering this period"
  - already have 2 or more covers today (MAX_SUBS_PER_DAY = 2): "Already 2 covers today"
- Score:
  - +40 if they teach the subject code. Reason "Teaches CODE".
  - +20 if they have any allocation in the section. Reason "Knows {sec}".
  - −3 × periods they teach today. Reason "n periods today".
  - −8 × covers today. Reason "n cover today".
  - −4 × covers this week. Reason "n covers this week".
  - −5 if (max_load − periodsToday × 6) < 0.
- Sort: unblocked first, then score descending.

**PickSubstitute modal** ("`Period n · Class X · Subject`", 620px)
- Intro: "`{absent} is away. Free teachers are ranked: same subject first, then those who already teach {sec}, then the lightest day and fewest covers this week.`"
- Shows the top 6 unblocked candidates.
  - The first is highlighted with a "Best match" badge.
  - Reason badges: "Teaches" green, "Knows" violet.
  - Each has an "Assign" button.
- "`Show all {n} free teachers`" / "Show fewer" (up to 40).
- Empty state: "No teacher is free this period."
- Library box: "No teacher free? Send the class to the library for self-study (librarian supervises)." with a "Library self-study" button.
- Collapsible "`Why others are not listed ({n})`": up to 20 entries, "name — reason".
- **`assignSub(subId, tid, mode, by)`**
  - Sets status assigned, the sub teacher (null for library), mode, assigned_by and assigned_at.
  - `sub_week`: the previous sub teacher goes down by 1 (floored at 0); the new teacher (teacher mode) goes up by 1.
  - Notifications:
    - Teacher mode only, to teacher: "`Cover: Period {p} · {sec} {subject}`", body "`{start} in {room}, for {absent}. Lesson plan for today is attached.`"
    - To student: "`Period {p} {subject}: {who}`" (who = "Self-study in the library" or the teacher). Body "`{absent short} is away today. Go to the library with your {subject} book.`" or "`… Your class will be taken by {teacher}.`"
    - To parent: "`Today in {sec}: substitute for {subject}`", body "`Period {p} will be taken by {who}.`"
  - Toast: "Library self-study set — students informed", or "`{name} assigned — teacher, students and parents informed`".

**MarkAway modal** ("Mark a teacher away today")
- Teacher: select "`{name} · {main code}`". Required.
- Status: segment Absent (default) / "On leave" / "Half day (after P4)".
- Note: placeholder "e.g. Informed at 7:15 am — unwell".
- Preview: "`{n} periods will need a substitute.`" or "No periods to cover for this teacher today."
- Button "Save" → `markStaff`. Toast "`{n} periods added to today’s cover list`".

**`markStaff(teacherId, status, note)`** (today)
- Upserts the staff_attendance row:
  - note: the new note, else the previous note, else null.
  - check_in: the previous time, or the current HH:MM, when the status is present, late or half_day. Otherwise null.
  - source: "Marked by office".
- Deletes all of today's substitutions for this teacher, including assigned ones.
- If the status is absent, leave or half_day, rebuilds open substitutions with `makeSubs`:
  - Covers the teacher's slots today where they are away.
  - Skips any section and period that already has a substitution today.
  - Row id: `sub-{date}-{section}-{period}`. reason = status, status open.
- If new rows were created, notifies principal: "`{n} period(s) need cover`", body "`{name} is absent / on leave / on half day today. Arrange substitutes.`"
- Audit: "`Staff attendance · {name} → {status}`".

### Staffing — Staff attendance
- **Access**
  - Nav: school_admin, principal. Both have edit rights.
- **Header**
  - Subtitle "`{weekday d Month} · biometric, face scan and geo-fenced app check-in`".
- **Upcoming leave banner**
  - Staff leave requests with from_date ≥ today, at most 3.
  - "`Coming leave: {requester} ({from}–{to}, {status}) · … — plan cover in Substitutions.`"
- **Status cards** (5: Present, Late, Half day, On leave, Absent)
  - Count plus "% of all teachers".
  - Clicking a card filters the table to that status. Clicking again clears the filter.
- **Tabs**
  - Today, "Monthly register".
- **Today tab**
  - Search "Search staff".
  - Columns:
    - Teacher: name plus "`subject · designation[ · note]`".
    - Check-in.
    - Source.
    - "Periods today": count of today's slots, plus an amber "{n} to cover" badge when the teacher is away.
    - Status: 5 chip buttons. Clicking a different status → `markStaff`.
      - Toast "`{name}: {label} — periods added to Substitutions`" when away, otherwise "`{name}: {label}`".
- **Monthly register tab**
  - Uses the last 24 distinct dates in the staff attendance data.
  - Columns:
    - Teacher.
    - "Last {n} school days": a coloured dot strip.
    - Present, Late, Leave, Absent.
    - Rate = (present + late + 0.5 × half_day) ÷ days × 100, 0 decimals.

### Staffing — Promotion & year-end
- **Access**
  - Nav: school_admin, principal. Both have edit rights.
- **Header**
  - Title "Promotion & year-end".
  - Subtitle "Session 2026-27 → 2027-28 · promotions apply on 1 April · parents informed on WhatsApp".
  - Section select, default 10A. Changing it resets selections and destinations.
- **Rules card "Promotion rules"**
  - "Minimum attendance": 65 / 75 (default) / 85%.
  - "Subjects allowed below 33% (compartment)": None / 1 (default) / 2.
  - Checkbox "Hold promotion if fees are overdue" (default off).
  - Note: "LKG–UKG: no exams — promoted on skill review. Class 10 → 11 stream is suggested from Maths & Science marks. Class 12 → alumni with TC."
- **Per-student computation** (exam = `exams[1]`)
  - att = overall attendance pct.
  - fails = subjects below 33%. None for pre-primary.
  - dues = sum of overdue invoices.
  - Action:
    1. Grade 12 → graduate.
    2. Otherwise, if att < minAtt − 10 or fails > allowComp + 1 → detain.
    3. Otherwise, if fails > allowComp or att < minAtt → review.
    4. Otherwise promote.
    5. If holdDues is on, dues > 0 and the action is promote → hold.
  - Stream (Promotion's own rule):
    - MAT ≥ 70 and SCI ≥ 70 → Sci
    - MAT ≥ 55 → Com
    - otherwise Hum
  - Next class:
    - Grade 12: none.
    - Grade 10: "11 {stream}".
    - Otherwise `sectionName(grade+1, same section letter)`.
- **Main card**
  - Title "`Class X → Alumni / Class 11 (stream by marks) / Class {next grade}`".
  - Columns:
    - Checkbox. Defaults to on for promote and graduate. Disabled once done.
    - Student: "roll. name".
    - Attendance: red when below minAtt.
    - Result: pct, or "Skills" for pre-primary.
    - "Below 33%": count or "—".
    - Dues: amount or "—".
    - Suggestion: badge Promote (green), "Needs review" (amber), Detain (red), Graduate (navy), "Hold — dues" (amber). After promotion: "Done → {to}".
    - Next class:
      - Grade 12: "Alumni + TC".
      - Grade 10: select "11 Science / 11 Commerce / 11 Humanities", overridable.
      - Otherwise text.
- **Action button**
  - Label "`Promote {n} selected`" or "`Graduate {n} selected`". Once done: "Done ({n})".
  - Disabled when nothing is selected or the section already has promotions.
  - On click:
    - Appends to `promotions`: `{id pr-{sid}, student_id, from_section_id, to (Alumni or next), action promote|graduate, effective '2027-04-01', by}`.
    - Detained or review students are promoted too if they were ticked.
    - Push to parent:
      - Grade 12: "Congratulations on graduating!", body "Transfer certificate and alumni card will be issued."
      - Otherwise: "Promotion for 2027-28", body "Your child is promoted. New class starts 1 April."
      - Channels push, whatsapp.
    - Toast: "`{n} students promoted/graduated — parents informed`".
    - Student section_id is not changed.
- **Summary card**
  - Count per action where above zero.
  - "Selected x / total".
  - "`{n} meet all rules automatically.`" (promote + graduate).

---

## SMART2

### Smart2 — Lesson plans & syllabus
- **Access**
  - Nav: school_admin, principal, teacher.
  - Edit rights: principal, teacher, admin.
- **Header**
  - Subtitle "`Class {sec} · {round(completed/all ×100)}% of the term syllabus completed`".
  - Section select: all sections. Default is the persona's section, else `sections[4]`.
  - Teacher: "New lesson plan" button. Toast only: "Lesson plan sent to coordinator for approval".
- **Subject cards**
  - Only subjects that have plans.
  - Each shows the icon, name, "`{done} of {n} topics done`", % and a progress bar.
  - Clicking selects the subject. Default is the teacher's subject.
- **Card "{subject} — unit plan"**
  - Columns: Unit, Topic, "Week of" (planned_week), Periods, Method, Approval ("Approved" green / "Pending" amber), Status (completed green, in_progress blue, otherwise plain; underscore shown as a space).
  - Teacher: "Mark done" on rows that are not completed. Sets status completed. Toast "Marked completed".
  - No notification.

### Smart2 — Online tests
- **Access**
  - Nav: school_admin, teacher, student.
  - Edit rights: teacher, student, admin.
- **Header**
  - Subtitle: student "`Tests assigned to Class {sec}`"; others "Auto-marked quizzes and unit tests from the question bank".
  - Non-students: "Create test" button. Toast only: "Test builder: pick questions from the bank by topic & difficulty".
- **Tabs** (non-students only)
  - Tests, "`Question bank ({n})`".
- **Test card** (student sees only tests whose `section_names` include their section)
  - Title: subject. Badge Live (green) or Closed.
  - Test title.
  - "`{n} questions · {duration} min · due {date}`".
  - Student:
    - Already attempted: "Submitted" plus "score/total".
    - Live: "Start test".
    - Otherwise: "Missed".
  - Staff: Classes, Submissions (count), Average (mean of score/total ×100) with a progress bar.
- **Question bank table**
  - Columns: Subject (code badge), Question, Difficulty (Hard red / Medium amber / Easy green), "Bloom level", Marks.
- **TakeTest**
  - Header: test title. Subtitle "`Question i of n · {duration} min`". "Exit" button.
  - Progress bar.
  - Question with options A/B/C… as select buttons.
  - "Previous" (disabled on the first question), "Next", and "Submit test" on the last question.
  - Numbered dots for navigation: current, answered, unanswered.
  - There is no timer enforcement.
  - Score = number of answers equal to `q.answer` (the option index).
  - **Submit**
    - Appends a test_attempt `{test_id, student_id, score, total, submitted_at}`.
    - Toast: "`Submitted — you scored {s}/{n}`".
    - Push: audience parent and teacher, title "Online test submitted", body "`{title}: {s}/{n}`", kind homework, channel push.

### Smart2 — Library
- **Access**
  - Nav: school_admin, student, librarian.
  - Edit rights: student, librarian, admin.
- **Header**
  - Subtitle "`{total copies} copies · {titles} titles · barcode ready`".
  - Non-students: "Issue book".
- **Rules**
  - Active loan = no returned_on. Overdue = due_on < today.
  - Fine = days overdue × ₹2.
  - Available = copies − active loans.
- **KPI cards** (non-students)
  - "Books issued": active count.
  - Overdue: count. Foot "`₹{sum of fines} fines pending`".
  - Titles.
  - "Returned this month": the count of all returned loans, not filtered by month.
- **Tabs**
  - Student: "My books" (default), Catalogue.
  - Others: "Issued books" (default), Catalogue.
- **My books**
  - Card per loan: title, author, Due badge (red when overdue, amber otherwise).
  - Returned loans are included too.
  - Empty state: "No books issued."
- **Issued books table** (sorted by due date)
  - Columns: Book (title + accession_no), Student (name + class), Issued, Due (red when overdue), Fine ("₹n" or "—"), "Return" button.
  - Return sets returned_on = today. Toast "`Returned[ · fine ₹n collected]`".
- **Catalogue**
  - Search "Search title, author or category".
  - Columns: Title, Author, Category, Rack, Available ("avail / copies", green when above zero, red otherwise).
- **Issue modal**
  - "Book (scan barcode or pick)": select "`title ({n} available)`". Books with zero available are still selectable.
  - "Student admission no. / ID card": placeholder "Scan ID card".
  - Issue:
    - Finds the student by admission_no. If none matches, falls back to a random one of the first 60 students (demo bug — validate in production).
    - due = today + 14 days.
    - Toast: "`Issued to {name} · due in 14 days`".
    - Push: audience parent and student, title "Library book issued", body "`{title} — return in 14 days`", kind homework, channel push.

### Smart2 — Payroll & HR
- **Access**
  - Nav: school_admin, principal, accountant.
  - Edit rights: accountant, admin.
- **Header**
  - Subtitle "`{payroll[0].month} · PF, PT and TDS computed automatically`".
  - "Bank transfer file" — no handler.
  - "Process payroll" — toast only: "Payroll processed — payslips emailed to all staff".
- **KPI cards**
  - "Net payout": Σ payroll.net + Σ support staff salary, compact ₹. Foot "`{n} employees`".
  - "PF (employer + employee)": Σ pf × 2.
  - "TDS deducted": Σ tds.
  - "Pending approval": count of rows with status processing.
- **"Teaching staff" table**
  - Columns: Employee (name + employee_code), Designation, Days ("present/working"), Gross, Deductions (gross − net), Net pay, Status (paid green, otherwise amber), "Payslip" button.
- **"Support staff" table**
  - Columns: Name, Role, Department, Salary, Status (always "paid").
- **Payslip modal**
  - School crest, "`Payslip · {month}`", name, code and designation.
  - Earnings: Basic, HRA, DA, Transport (ta), Gross.
  - Deductions: Provident fund, Professional tax, TDS, "Loss of pay" = gross − net − pf − pt − tds.
  - Net pay.
  - "Print" button.

### Smart2 — Inventory & assets
- **Access**
  - Nav: school_admin, accountant.
  - Edit rights: accountant, admin.
- **Header**
  - Subtitle "Asset register, stock levels and maintenance".
  - "Purchase request" — toast only: "Purchase request raised".
- **KPI cards**
  - "Asset value": Σ value.
  - Items: Σ qty.
  - "Low stock": count where condition is "Low stock".
  - "Service / refill due": condition matches /service|Refill/i.
- **Category chips**
  - "All" plus the distinct categories.
- **Table**
  - Columns: Code, Item, Category, Location, Qty, Value, Condition (Good green, Low stock red, otherwise amber).

### Smart2 — Health
- **Access**
  - Nav: school_admin, principal, parent, warden.
  - Edit rights: principal, warden, admin.
- **Parent view: "Health record"**
  - Subtitle "`{child} · Blood group {bg}`". ChildSwitcher.
  - KPI cards: Height (cm), Weight (kg), Vision, Allergies (green when "None", otherwise red).
  - Vaccinations: name plus "Done" (green) or "Due" (amber).
  - "Infirmary visits": complaint and "`{action} · {ago}`". Empty state: "No visits this term."
- **Staff view: "Health & infirmary"**
  - Subtitle "Sick-room visits, medical profiles and vaccination tracking".
  - "Log visit" — toast only: "Visit logged — parent notified on WhatsApp".
  - KPI cards:
    - "Visits this week": all visits, not filtered by date.
    - "Sent home": action matches /home/.
    - "Students with allergies": allergies ≠ "None".
    - "HPV / Td due": profiles where `vaccinations['Td booster']` is falsy.
  - Table "Recent infirmary visits": Student, Class, Complaint, "Action taken", When (ago), Parent ("Notified" green or "—").

---

## Stubs to replace in production (UI only, nothing persisted)

**Buttons with no handler at all**
- Import from Excel
- Add staff
- Add section
- Attach PDF / image
- Bank transfer file

**Toast only, nothing saved**
- Save student (Add student)
- New lesson plan
- Create test
- Process payroll
- Purchase request
- Log visit
- Export LOC

**Local state only**
- Homework "Submit" by students

**Fake numbers**
- The homework "70% submitted" count
- The board-exam "Documents" column (every 9th row, index % 9 == 4, shows "Photo pending")