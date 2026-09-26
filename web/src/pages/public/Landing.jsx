import { PublicNav, Footer } from './PublicChrome.jsx';
import { Crest, CampusArt } from '../../components/Brand.jsx';
import Icon from '../../components/Icon.jsx';
import { DEMO_SCHOOLS } from '../../data/schools.js';
import { ROLES } from '../../config/roles.js';
import { navigate } from '../../lib/router.js';

const FEATURES = [
  ['check', 'Attendance', 'Class-wise marking in under a minute, QR gate check-in and instant absent alerts to parents.'],
  ['calendar', 'Timetable', 'Section and teacher timetables with today’s periods on every dashboard.'],
  ['book', 'Homework', 'Teachers post work with due dates; students and parents see what is pending.'],
  ['award', 'Exams & results', 'Marks entry, grades and printable report cards in the school’s own format.'],
  ['wallet', 'Fees', 'Fee heads, invoices, online payment, receipts and overdue follow-up.'],
  ['bus', 'Transport', 'Routes, stops and trip start/stop for drivers; parents know when the bus is near.'],
  ['desk', 'Front office', 'Admission enquiries, visitor book, call log, postal register and complaints.'],
  ['bed', 'Hostel & canteen', 'Room allocation and occupancy, canteen billing, stock and daily sales.'],
];

export default function Landing() {
  const sx = DEMO_SCHOOLS[0];
  return (
    <div style={{ background: '#fff' }}>
      <PublicNav />
      <section className="hero">
        <div className="pw hero-in">
          <div className="stack" style={{ gap: 20 }}>
            <span className="eyebrow"><Icon name="school" size={15} /> School management for CBSE, ICSE & State Boards</span>
            <h1>Your school’s own portal for attendance, fees, results and parents.</h1>
            <p style={{ fontSize: 18, color: 'var(--ink-2)', maxWidth: 520 }}>
              Miz School gives every school a branded web portal and mobile app — with its crest, colours and name — for principals, teachers, parents, students and staff.
            </p>
            <div className="row wrap">
              <a className="btn btn-primary btn-lg" href="#/demo">Explore the live demo <Icon name="arrow" size={17} /></a>
              <a className="btn btn-lg" href="#/features">Why Miz School</a>
            </div>
            <div className="row wrap small muted" style={{ gap: 18 }}>
              <span className="row" style={{ gap: 6 }}><Icon name="tick" size={15} style={{ color: 'var(--success)' }} /> Web, Android & iPhone</span>
              <span className="row" style={{ gap: 6 }}><Icon name="tick" size={15} style={{ color: 'var(--success)' }} /> 13 role-based apps · 40+ modules</span>
              <span className="row" style={{ gap: 6 }}><Icon name="tick" size={15} style={{ color: 'var(--success)' }} /> Data isolated per school</span>
            </div>
          </div>
          <ProductPreview school={sx} />
        </div>
      </section>

      <section className="section" id="schools" style={{ background: 'var(--bg)' }}>
        <div className="pw stack" style={{ gap: 28 }}>
          <div style={{ maxWidth: 680 }}>
            <div className="upper" style={{ color: 'var(--brand)' }}>One platform · Many schools</div>
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

      <section className="section" id="features">
        <div className="pw stack" style={{ gap: 28 }}>
          <div style={{ maxWidth: 680 }}>
            <div className="upper" style={{ color: 'var(--brand)' }}>Modules</div>
            <h2 className="title" style={{ marginTop: 8 }}>Everything a school office runs on</h2>
            <p className="muted" style={{ marginTop: 8, fontSize: 16 }}>Switch on only what your school uses. A day school never sees hostel menus; a school without buses never sees transport.</p>
          </div>
          <div className="grid g-4">
            {FEATURES.map(([icon, title, text]) => (
              <div key={title} className="card feature">
                <div className="ico"><Icon name={icon} size={20} /></div>
                <h3 style={{ fontSize: 16 }}>{title}</h3>
                <p className="muted small" style={{ marginTop: 6 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="roles" style={{ background: 'var(--bg)' }}>
        <div className="pw stack" style={{ gap: 28 }}>
          <div className="row between wrap">
            <div style={{ maxWidth: 640 }}>
              <div className="upper" style={{ color: 'var(--brand)' }}>For every role</div>
              <h2 className="title" style={{ marginTop: 8 }}>Each person sees only their work</h2>
              <p className="muted" style={{ marginTop: 8, fontSize: 16 }}>One login system, one permission engine, and a menu built for each role.</p>
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

      <section className="section">
        <div className="pw stack" style={{ gap: 28 }}>
          <div style={{ maxWidth: 680 }}>
            <div className="upper" style={{ color: 'var(--brand)' }}>Onboarding</div>
            <h2 className="title" style={{ marginTop: 8 }}>Live in days, not months</h2>
          </div>
          <div className="grid g-4">
            {[
              ['Register your school', 'Name, board, session and the admin’s contact details.'],
              ['Import your identity', 'Enter your website — we detect logo, colours and address for you to review.'],
              ['Approve & set up', 'Confirm branding, add classes, upload students and staff from Excel.'],
              ['Invite families', 'Parents and students get SMS/email invites to your school’s app.'],
            ].map(([t, d], i) => (
              <div key={t} className="card card-b">
                <div className="row" style={{ gap: 10 }}><span className="avatar sm" style={{ background: 'var(--brand)', color: '#fff' }}>{i + 1}</span><h3>{t}</h3></div>
                <p className="small muted" style={{ marginTop: 8 }}>{d}</p>
              </div>
            ))}
          </div>
          <div className="card row between wrap" style={{ padding: '20px 24px', background: 'var(--brand-ink)', borderColor: 'var(--brand-ink)' }}>
            <div>
              <div className="serif" style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>₹100 per active user / month + GST</div>
              <div style={{ color: '#b9c7db' }}>Students, parents and staff — billed on active accounts only.</div>
            </div>
            <div className="row"><a className="btn" href="#/pricing">Pricing details</a><a className="btn btn-primary" href="#/demo" style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#1b1300' }}>Book a demo</a></div>
          </div>
        </div>
      </section>
      <Footer />
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
          <div className="xs muted">Monday · Classes 6–10 · 2 sections each</div>
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
