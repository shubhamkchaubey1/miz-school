import { useState } from 'react';
import { PublicNav, Footer } from './PublicChrome.jsx';
import { Crest, CampusArt } from '../../components/Brand.jsx';
import Icon from '../../components/Icon.jsx';
import { IconTile, TONES } from '../../components/ui.jsx';
import { DEMO_SCHOOLS } from '../../data/schools.js';
import { ROLES } from '../../config/roles.js';
import { STAGES } from '../../data/classes.js';
import { navigate } from '../../lib/router.js';

const FEATURES = [
  ['user-plus', 'blue', 'Admissions CRM', 'Enquiry → test → offer → admitted, with online form and fee payment.'],
  ['clip-check', 'green', 'Attendance', 'One-tap class marking, QR gate scan and instant absent alerts on WhatsApp.'],
  ['calendar', 'teal', 'Timetable & lessons', 'Section and teacher timetables, lesson plans and syllabus progress.'],
  ['notebook', 'indigo', 'Homework & online tests', 'Digital diary, auto-marked quizzes and a question bank.'],
  ['medal', 'violet', 'Report cards', 'CBSE / ICSE / NEP holistic cards with auto-drafted remarks.'],
  ['coins', 'amber', 'Fees & accounts', 'Class-wise fee structure, online payment, receipts and reminders.'],
  ['chat', 'green', 'WhatsApp, SMS & email', 'Broadcasts, automations and read receipts in one place.'],
  ['bus', 'amber', 'Transport & live bus', 'Routes, driver app, boarding and a live bus map for parents.'],
  ['door', 'teal', 'OTP gate pass', 'A child leaves early only after the gate verifies a one-time code.'],
  ['trend', 'red', 'Smart insights', 'At-risk students flagged weekly from attendance, marks and dues.'],
  ['library', 'indigo', 'Library, hostel, canteen', 'Issue/return with fines, room allocation, cashless canteen.'],
  ['building', 'navy', 'Branches & access', 'Multi-campus dashboard, role-based access and audit log.'],
];

const FAQ = [
  ['Does it work for a small school?', 'Yes. A school with 50 students can start with attendance, homework, fees and the parent app, and switch on more modules later. You pay only for active users.'],
  ['Which boards and classes are supported?', 'LKG to Class 12 for CBSE, ICSE and State boards — skill-based reports for pre-primary, grades for primary, marks for middle and secondary, and streams with practicals for 11–12.'],
  ['Will parents need to install an app?', 'Parents get an Android/iPhone app, and every important update also goes on WhatsApp and SMS, so no one is left out.'],
  ['Can we use our own school name and logo?', 'Yes. Every school gets its own crest, colours, portal address and branded app screens. Parents never see a vendor brand.'],
  ['How do we move from our current system?', 'Upload students, staff and fees from Excel, enter your website to import branding, approve, and go live — usually within a few days.'],
  ['Is our data safe?', 'Each school’s data is isolated at database level, access is role-based with OTP login, and every sensitive change is recorded in an audit log.'],
];

export default function Landing() {
  const sx = DEMO_SCHOOLS[0];
  const [faq, setFaq] = useState(0);
  return (
    <div style={{ background: '#fff' }}>
      <PublicNav />
      <section className="hero hero-dark hero-photo" style={{ backgroundImage: "url(./img/classroom.jpg)" }}>
        <div className="pw hero-in">
          <div className="stack" style={{ gap: 20 }}>
            <span className="eyebrow-dark">Smart school platform · LKG to Class 12</span>
            <h1>Run your entire school from <span className="hl">one app</span> — under your school’s own name.</h1>
            <p className="hero-lead">
              Admissions, attendance, homework, exams, fees, transport and parent communication on WhatsApp — for principals, teachers, parents, students and staff. From a 50-student school to a 50,000-student group.
            </p>
            <div className="row wrap">
              <a className="btn btn-gold btn-lg" href="#/demo">Explore the live demo <Icon name="arrow" size={17} /></a>
              <a className="btn btn-glass btn-lg" href="#/features">Why Miz School</a>
            </div>
            <div className="row wrap small hero-ticks" style={{ gap: 18 }}>
              {['CBSE · ICSE · State boards', 'Android, iPhone & web', 'Data isolated per school'].map((t) => <span key={t} className="row" style={{ gap: 6 }}><Icon name="tick" size={15} style={{ color: '#5eead4' }} /> {t}</span>)}
            </div>
          </div>
          <ProductPreview school={sx} />
        </div>
        <div className="pw">
          <div className="stat-band">
            {[['layers', 'blue', '40+', 'modules in one platform'], ['users', 'violet', '13', 'role-based apps'], ['cap', 'amber', 'LKG–12', 'every stage covered'], ['chat', 'green', '4', 'channels: app, WhatsApp, SMS, email']].map(([ic, tone, n, l]) => <div key={l} className="row" style={{ gap: 14 }}><IconTile icon={ic} tone={tone} size={46} iconSize={22} /><div><div className="n">{n}</div><div className="l">{l}</div></div></div>)}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="pw stack" style={{ gap: 24 }}>
          <div className="row between wrap" style={{ alignItems: 'flex-end' }}>
            <div style={{ maxWidth: 640 }}>
              <div className="kicker">The problem</div>
              <h2 className="title" style={{ marginTop: 8 }}>Schools lose time, money and trust to scattered tools</h2>
            </div>
            <a className="btn" href="#/features">See every problem we solve <Icon name="arrow" size={15} /></a>
          </div>
          <div className="grid g-4">
            {[['wallet', 'red', 'Fees arrive late', 'Manual calls and paper receipts → automatic WhatsApp reminders and online payment.'],
              ['chat', 'green', 'Parents feel left out', '40 WhatsApp groups → one official channel with read receipts.'],
              ['clip-list', 'amber', 'Teachers buried in paperwork', 'Registers & report cards → one tap and auto-calculated.'],
              ['bus', 'teal', 'Safety worries', 'No idea where the bus is → live map and OTP-verified pickup.']].map(([ic, tone, t, d]) => (
              <div key={t} className="card card-b tone-card" style={{ '--t': TONES[tone][1], '--tb': TONES[tone][0] }}><IconTile icon={ic} tone={tone} size={44} iconSize={22} /><h3 style={{ marginTop: 12, fontSize: 16 }}>{t}</h3><p className="small muted" style={{ marginTop: 6 }}>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section day-sec">
        <div className="pw stack" style={{ gap: 24 }}>
          <div className="row between wrap" style={{ alignItems: 'flex-end' }}>
            <div style={{ maxWidth: 640 }}>
              <div className="kicker">A school day on Miz School</div>
              <h2 className="title" style={{ marginTop: 8 }}>Every moment reaches the right person</h2>
            </div>
            <p className="muted" style={{ maxWidth: 380 }}>No calls, no registers, no lost diary notes. The school works as usual — Miz School keeps everyone informed.</p>
          </div>
          <div className="day-grid">
            {[['arrival', '7:40 am', 'Bus reaches school', 'Driver marks boarding. Parents get “Aarav reached school” on WhatsApp and the app.', 'bus'],
              ['classroom', '9:10 am', 'Attendance & homework', 'One tap in class. Absent alerts go out at once; homework lands in every parent’s diary.', 'clip-check'],
              ['preprimary', '11:30 am', 'LKG daily diary', 'Meals, nap, mood and a photo of today’s activity — no exams, just skills tracked gently.', 'palette']].map(([img, time, t, d, ic]) => (
              <figure key={img} className="day-card">
                <div className="day-img"><img src={`./img/${img}.jpg`} alt={t} loading="lazy" width="1512" height="791" /><span className="day-time">{time}</span></div>
                <figcaption>
                  <div className="row" style={{ gap: 10 }}><IconTile icon={ic} size={34} iconSize={17} /><h3 style={{ fontSize: 17 }}>{t}</h3></div>
                  <p className="small muted" style={{ marginTop: 8 }}>{d}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="pw stack" style={{ gap: 24 }}>
          <div style={{ maxWidth: 680 }}>
            <div className="kicker">Every stage, its own features</div>
            <h2 className="title" style={{ marginTop: 8 }}>Built for LKG to Class 12</h2>
            <p className="muted" style={{ marginTop: 8, fontSize: 16 }}>A nursery child doesn’t need exams and a Class 12 student needs streams and board registration — Miz School changes the workflow for each stage automatically.</p>
          </div>
          <div className="stage-row">
            {Object.values(STAGES).map((st, i) => (
              <div key={st.key} className="card card-b stage-card tone-card" style={{ '--t': TONES[st.tone][1], '--tb': TONES[st.tone][0] }}>
                <div className="row between"><IconTile icon={st.icon} tone={st.tone} size={42} iconSize={21} /><span className="xs muted strong">0{i + 1}</span></div>
                <h3 style={{ marginTop: 12, fontSize: 17 }}>{st.label}</h3>
                <div className="strong small" style={{ color: 'var(--brand)' }}>{st.range}</div>
                <p className="small muted" style={{ marginTop: 6 }}>{st.assessment}</p>
                <div className="xs" style={{ marginTop: 8, color: 'var(--ink-2)' }}>{{ pre: 'Daily diary with meals, mood & photos · safe pickup', primary: 'EVS, activity homework, parent app', middle: '3rd language, labs, online tests', secondary: 'Pre-boards, LOC registration, stream counselling', senior: 'Science / Commerce / Humanities, practicals, board exams' }[st.key]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="features" style={{ background: 'var(--bg)' }}>
        <div className="pw stack" style={{ gap: 28 }}>
          <div style={{ maxWidth: 680 }}>
            <div className="kicker">Modules</div>
            <h2 className="title" style={{ marginTop: 8 }}>Everything a school runs on — in one place</h2>
            <p className="muted" style={{ marginTop: 8, fontSize: 16 }}>Switch on only what your school uses. A day school never sees hostel menus; a school without buses never sees transport.</p>
          </div>
          <div className="grid g-4">
            {FEATURES.map(([icon, tone, title, text]) => (
              <div key={title} className="card feature tone-hover" style={{ '--t': TONES[tone][1], '--tb': TONES[tone][0] }}>
                <IconTile icon={icon} tone={tone} size={40} iconSize={20} />
                <h3 style={{ fontSize: 16, marginTop: 12 }}>{title}</h3>
                <p className="muted small" style={{ marginTop: 6 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="pw app-sec">
          <div className="stack" style={{ gap: 16 }}>
            <div className="kicker">For parents</div>
            <h2 className="title">The whole school day, in a parent’s pocket</h2>
            <p className="muted" style={{ fontSize: 16 }}>Attendance the moment it is marked, homework, results, fee payment, the live bus, PTM booking and a private line to the class teacher — in the school’s own app and on WhatsApp.</p>
            <div className="grid g-2" style={{ gap: 10 }}>
              {[['clip-check', 'Present / absent alert'], ['notebook', 'Homework & diary'], ['medal', 'Report cards'], ['coins', 'Pay fees by UPI'], ['bus', 'Live bus location'], ['door', 'OTP early pickup'], ['cal-check', 'Book PTM slot'], ['chat', 'Chat with teacher']].map(([ic, t]) => <div key={t} className="row small strong" style={{ gap: 10 }}><IconTile icon={ic} size={32} />{t}</div>)}
            </div>
          </div>
          <PhoneMock school={sx} />
        </div>
      </section>

      <section className="section" id="schools" style={{ background: 'var(--bg)' }}>
        <div className="pw stack" style={{ gap: 28 }}>
          <div style={{ maxWidth: 680 }}>
            <div className="kicker">One platform · Many schools</div>
            <h2 className="title" style={{ marginTop: 8 }}>Every school looks like itself</h2>
            <p className="muted" style={{ marginTop: 8, fontSize: 16 }}>Same software underneath. Each school gets its own address, crest, colours and campus photo on the login, dashboards, receipts and notices.</p>
          </div>
          <div className="grid g-3">
            {DEMO_SCHOOLS.map((s) => (
              <button key={s.slug} className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'left', cursor: 'pointer' }} onClick={() => navigate(`/s/${s.slug}/login`)}>
                <div style={{ background: s.secondary_color, padding: '22px 20px 0', position: 'relative' }}>
                  <div className="row" style={{ gap: 12 }}>
                    <Crest school={s} size={42} />
                    <div>
                      <div className="serif" style={{ color: '#fff', fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>{s.short_name}</div>
                      <div className="xs" style={{ color: 'rgba(255,255,255,.7)' }}>{s.website}</div>
                    </div>
                  </div>
                  <CampusArt color="rgba(255,255,255,.35)" style={{ marginTop: 10, height: 90 }} />
                  <div style={{ height: 4, background: s.accent_color, position: 'absolute', left: 0, right: 0, bottom: 0 }} />
                </div>
                <div className="card-b row between">
                  <div><div className="strong">{s.name}</div><div className="xs muted">{s.city} · {s.board} · Est. {s.established}</div></div>
                  <Icon name="arrow" size={18} style={{ color: s.primary_color }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="roles">
        <div className="pw stack" style={{ gap: 28 }}>
          <div className="row between wrap">
            <div style={{ maxWidth: 640 }}>
              <div className="kicker">For every role</div>
              <h2 className="title" style={{ marginTop: 8 }}>Each person sees only their work</h2>
              <p className="muted" style={{ marginTop: 8, fontSize: 16 }}>The admin decides who sees what. A teacher sees only their class, a parent only their children, the accountant only accounts.</p>
            </div>
            <a className="btn btn-primary" href="#/demo">Try any profile</a>
          </div>
          <div className="grid g-3">
            {ROLES.map((r) => (
              <button key={r.key} className="role-card" onClick={() => navigate(`/s/aravali/${r.key}/dashboard`)}>
                <span className="ico"><Icon name={r.icon} size={19} /></span>
                <span><span className="strong" style={{ display: 'block' }}>{r.label}</span><span className="small muted">{r.blurb}</span></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="pw stack" style={{ gap: 28 }}>
          <div style={{ maxWidth: 680 }}>
            <div className="kicker">Onboarding</div>
            <h2 className="title" style={{ marginTop: 8 }}>Live in days, not months</h2>
          </div>
          <div className="grid g-4">
            {[
              ['building', 'Register your school', 'Name, board, session and the admin’s mobile number.'],
              ['globe', 'Import your identity', 'Enter your website — we detect logo, colours and address for you to review.'],
              ['upload', 'Upload from Excel', 'Students, staff, classes and fee structure — validated before import.'],
              ['users', 'Invite families', 'Parents and students get WhatsApp/SMS invites to your school’s app.'],
            ].map(([ic, t, d], i) => (
              <div key={t} className="card card-b">
                <div className="row" style={{ gap: 10 }}><span className="avatar sm" style={{ background: 'var(--brand)', color: '#fff' }}>{i + 1}</span><IconTile icon={ic} size={30} /></div>
                <h3 style={{ marginTop: 12 }}>{t}</h3>
                <p className="small muted" style={{ marginTop: 6 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="pw" style={{ maxWidth: 860 }}>
          <div style={{ textAlign: 'center' }}><span className="kicker">FAQ</span></div>
          <h2 className="title" style={{ marginTop: 8, textAlign: 'center', marginBottom: 20 }}>Questions schools ask us</h2>
          <div className="card" style={{ overflow: 'hidden' }}>
            {FAQ.map(([q, a], i) => (
              <div key={q} style={{ borderBottom: i < FAQ.length - 1 ? '1px solid var(--line)' : 0 }}>
                <button className="faq-q" onClick={() => setFaq(faq === i ? -1 : i)} aria-expanded={faq === i}><span>{q}</span><Icon name={faq === i ? 'minus' : 'plus'} size={18} /></button>
                {faq === i && <p className="faq-a">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="pw">
          <div className="card row between wrap cta-band" style={{ gap: 20 }}>
            <div>
              <div className="serif" style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>₹100 per active user / month + GST</div>
              <div style={{ color: '#b9c7db' }}>Students, parents and staff — billed on active accounts only. No setup fee for the pilot.</div>
            </div>
            <div className="row wrap"><a className="btn" href="#/pricing">Pricing details</a><a className="btn btn-primary" href="#/demo" style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#1b1300' }}>Book a demo</a></div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function PhoneMock({ school }) {
  return (
    <div className="phone" style={{ ['--brand']: school.primary_color, ['--brand-ink']: school.secondary_color }}>
      <div className="phone-notch" />
      <div className="phone-top"><Crest school={school} size={22} /><strong className="serif" style={{ fontSize: 14 }}>{school.short_name}</strong><Icon name="bell" size={16} style={{ marginLeft: 'auto' }} /></div>
      <div className="phone-body">
        <div className="strong" style={{ fontSize: 15 }}>Good morning, Vikas</div>
        <div className="xs muted" style={{ marginBottom: 10 }}>Aryan · Class 8A</div>
        <div className="ph-alert"><Icon name="clip-check" size={16} /> Aryan marked present · 07:52 AM</div>
        <div className="ph-grid">
          {[['check', '96%', 'Attendance'], ['medal', 'B1', 'Half yearly'], ['coins', '₹15,800', 'Due 15 Oct'], ['bus', '4 min', 'Bus away']].map(([ic, v, l]) => <div key={l} className="ph-tile"><Icon name={ic} size={15} /><strong>{v}</strong><span>{l}</span></div>)}
        </div>
        <div className="ph-card"><div className="xs strong muted">HOMEWORK</div><div className="small strong">Exercise 7.2 — Q1 to Q12</div><div className="xs muted">Mathematics · due Friday</div></div>
        <div className="ph-card"><div className="xs strong muted">FROM CLASS TEACHER</div><div className="small">PTM on Monday — book your slot.</div><span className="ph-btn">Book slot</span></div>
      </div>
      <div className="phone-nav">{['home', 'clip-check', 'coins', 'chat', 'bus'].map((i) => <Icon key={i} name={i} size={18} />)}</div>
    </div>
  );
}

function ProductPreview({ school }) {
  const bars = [94.1, 95.6, 93.2, 96.8, 95.1, 96.4];
  return (
    <div className="card" style={{ overflow: 'hidden', boxShadow: '0 18px 50px rgba(11,35,69,.14)', ['--brand']: school.primary_color, ['--brand-ink']: school.secondary_color }}>
      <div className="row" style={{ gap: 6, padding: '9px 12px', background: '#eef2f7', borderBottom: '1px solid var(--line)' }}>
        <span className="dot" style={{ color: '#d0d7e2' }} /><span className="dot" style={{ color: '#d0d7e2' }} /><span className="dot" style={{ color: '#d0d7e2' }} />
        <span className="xs muted" style={{ marginLeft: 8, background: '#fff', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 10px' }}>{school.website}</span>
      </div>
      <div className="row" style={{ gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--line)' }}>
        <Crest school={school} size={26} />
        <strong className="serif" style={{ color: school.secondary_color }}>{school.short_name}</strong>
        <span className="badge" style={{ marginLeft: 'auto' }}>AY {school.academic_year}</span>
      </div>
      <div style={{ padding: 14, background: 'var(--bg)' }} className="stack">
        <div>
          <div className="strong" style={{ fontSize: 16 }}>Good morning, Principal</div>
          <div className="xs muted">Monday · LKG to Class 12 · 30 sections</div>
        </div>
        <div className="grid g-4" style={{ gap: 8 }}>
          {[['Students', '1,284'], ['Present today', '96.4%'], ['Fee collected', '₹1.9 Cr'], ['Pending', '₹18.2 L']].map(([l, v]) => (
            <div key={l} className="card" style={{ padding: '8px 10px' }}><div className="xs muted strong">{l}</div><div className="strong tnum" style={{ fontSize: 17 }}>{v}</div></div>
          ))}
        </div>
        <div className="grid g-2" style={{ gap: 8 }}>
          <div className="card" style={{ padding: 10 }}>
            <div className="xs strong">Attendance — last 6 days</div>
            <div className="bars" style={{ height: 82 }}>
              {bars.map((b, i) => <div className="b" key={i}><span className={`col ${i < 5 ? 'muted-col' : ''}`} style={{ height: `${(b - 88) * 10}%`, background: i === 5 ? school.primary_color : undefined }} /></div>)}
            </div>
          </div>
          <div className="card" style={{ padding: 10 }}>
            <div className="xs strong" style={{ marginBottom: 6 }}>Today</div>
            {[['07:45', 'Morning assembly'], ['09:00', 'Class 10 pre-board'], ['11:00', 'PTM — Class 8'], ['14:30', 'Staff meeting']].map(([t, e]) => (
              <div key={t} className="row xs" style={{ gap: 8, padding: '3px 0' }}><span className="strong tnum" style={{ color: school.secondary_color, width: 36 }}>{t}</span>{e}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
