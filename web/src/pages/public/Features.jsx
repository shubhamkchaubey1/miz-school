import { PublicNav, Footer } from './PublicChrome.jsx';
import Icon from '../../components/Icon.jsx';
import { IconTile } from '../../components/ui.jsx';
import { ROLES } from '../../config/roles.js';

const PROBLEMS = [
  ['wallet', 'red', 'Fees come late and follow-up is manual', 'Accounts staff call parents one by one, receipts are hand-written and nobody knows the real outstanding.', 'Online payment links, automatic WhatsApp reminders (T-3, T-0, T+3), instant receipts and a live defaulter list.'],
  ['chat', 'green', 'Parents are in the dark — or in 40 WhatsApp groups', 'Messages get lost in class groups, personal numbers of teachers are shared, nothing is recorded.', 'One official channel: WhatsApp Business, SMS, email and app push with read receipts, plus private parent–teacher chat inside the app.'],
  ['clip-list', 'amber', 'Registers, diaries and report cards on paper', 'Teachers spend hours on attendance, marks totals and remarks instead of teaching.', 'One-tap attendance, auto-calculated report cards in CBSE/ICSE/NEP formats and auto-drafted remarks the teacher only reviews.'],
  ['layers', 'violet', 'Five different apps that don’t talk to each other', 'Fees in one tool, transport in another, admissions in Excel — data never matches.', 'One platform, one login, one database: admission → student → fees → results → alumni.'],
  ['bus', 'teal', 'Child safety worries — bus and early pickup', 'Parents wait at stops without knowing where the bus is; anyone can claim to pick up a child.', 'Live bus map with “bus is near” alerts, driver boarding checklist, and OTP-verified gate passes.'],
  ['trend', 'blue', 'Management decides on gut feeling', 'Owners see numbers only at year end — low attendance or weak students are noticed too late.', 'Smart Insights flags at-risk students (attendance + marks + dues) every week, with suggested actions.'],
  ['user-plus', 'rose', 'Admission enquiries leak away', 'Walk-ins and website leads sit in notebooks; nobody follows up on time.', 'Admissions CRM pipeline, online form with fee payment, and automatic follow-ups.'],
  ['school', 'navy', 'Software looks generic, costs a fortune, needs training', 'Parents see a vendor’s brand, schools pay heavy licence fees, and staff find it hard to use.', 'Every school gets its own branded portal & app, a simple pay-per-active-user price and a clean interface anyone can use.'],
];

const GAPS = [
  ['Your school’s own brand (crest, colours, domain)', 'Vendor brand', 'Built in, per school'],
  ['WhatsApp Business with read receipts & automations', 'SMS only / add-on', 'Included'],
  ['OTP-verified early pickup (gate pass)', 'Rare', 'Included'],
  ['Early-warning insights on at-risk students', 'Static reports', 'Weekly, automatic'],
  ['NEP holistic progress card + auto remarks', 'Manual', 'Included'],
  ['Admissions CRM with online fee payment', 'Separate product', 'Included'],
  ['Parent PTM slot booking & private chat', 'Phone calls', 'Included'],
  ['Multi-branch group dashboard', 'Enterprise-only', 'All plans can add branches'],
  ['Pricing', 'Big licence + setup fee', '₹ per active user / month'],
  ['Go-live time', 'Months', 'Days — import from Excel & website'],
];

const SIZES = [
  ['home', 'blue', 'Small school', '50 – 500 students', ['Setup in a day from Excel', 'Parent app + WhatsApp from day one', 'Attendance, homework, fees, results', 'Pay only for active users']],
  ['school', 'violet', 'Mid-size school', '500 – 5,000 students', ['Transport, hostel, library, canteen', 'Admissions CRM and online tests', 'Payroll, inventory, certificates', 'Role-based access for every department']],
  ['building', 'navy', 'School group / chain', '5,000 – 50,000+ students', ['Unlimited branches, one group dashboard', 'Branch-level access and reports', 'Custom domain & white-label mobile app', 'Priority support and data migration']],
];

const MODULE_GROUPS = [
  ['Admissions & students', 'user-plus', ['Admissions CRM & pipeline', 'Online admission form + fee', 'Student 360° profile', 'Documents & certificates', 'ID cards with QR', 'Alumni record']],
  ['Academics', 'book', ['Timetable & substitution', 'Lesson plans & syllabus tracker', 'Homework / digital diary', 'Online tests & question bank', 'Exams, marks & report cards', 'NEP holistic progress card']],
  ['Attendance & safety', 'check', ['One-tap class attendance', 'QR / RFID / face-ready gate scan', 'Absent alerts on WhatsApp', 'OTP gate pass for pickup', 'Visitor management', 'Health & infirmary records']],
  ['Finance', 'wallet', ['Fee structures & instalments', 'Online payment & receipts', 'Automatic reminders', 'Payroll with PF / PT / TDS', 'Inventory & assets', 'Tally-ready exports']],
  ['Communication', 'chat', ['WhatsApp Business, SMS, email, push', 'Automations & templates', 'Parent–teacher chat', 'PTM slot booking', 'Notices & circulars', 'School calendar']],
  ['Operations', 'bus', ['Transport with live bus map', 'Driver trip & boarding', 'Hostel rooms & roll call', 'Canteen billing & wallet', 'Library with fines', 'Front office desk']],
  ['Management', 'trend', ['Smart Insights (at-risk students)', 'Multi-branch dashboard', 'Reports & CSV/Excel export', 'Users, roles & access', 'Audit log', 'School branding & settings']],
];

export default function Features() {
  return (
    <div style={{ background: '#fff' }}>
      <PublicNav />
      <section className="hero">
        <div className="pw" style={{ padding: '56px 20px 40px', maxWidth: 900 }}>
          <span className="eyebrow"><Icon name="school" size={15} /> Why Miz School</span>
          <h1 style={{ fontSize: 42, lineHeight: 1.12, color: 'var(--brand-ink)', marginTop: 16 }}>One branded platform that runs the whole school — and keeps every parent informed.</h1>
          <p style={{ fontSize: 18, color: 'var(--ink-2)', marginTop: 14 }}>
            Miz School replaces paper registers, scattered WhatsApp groups and five disconnected apps with one system that the office, teachers, parents, students, drivers and management actually use every day — for a school of 50 students or a group of 50,000.
          </p>
          <div className="row wrap" style={{ marginTop: 20 }}>
            <a className="btn btn-primary btn-lg" href="#/demo">Try the live demo <Icon name="arrow" size={17} /></a>
            <a className="btn btn-lg" href="#/pricing">See pricing</a>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="pw stack" style={{ gap: 24 }}>
          <div><div className="upper" style={{ color: 'var(--brand)' }}>The problems we solve</div><h2 className="title" style={{ marginTop: 8 }}>What goes wrong in schools today — and what changes</h2></div>
          <div className="grid g-2">
            {PROBLEMS.map(([ic, tone, title, pain, fix]) => (
              <div key={title} className="card card-b">
                <div className="row top" style={{ gap: 14 }}>
                  <IconTile icon={ic} tone={tone} size={46} iconSize={22} />
                  <div className="stack-sm">
                    <h3 style={{ fontSize: 16.5 }}>{title}</h3>
                    <p className="small muted">{pain}</p>
                    <p className="small" style={{ background: 'var(--success-bg)', color: '#14532d', padding: '8px 10px', borderRadius: 8 }}><strong>With Miz:</strong> {fix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="pw stack" style={{ gap: 24 }}>
          <div><div className="upper" style={{ color: 'var(--brand)' }}>Market gap</div><h2 className="title" style={{ marginTop: 8 }}>What typical school ERPs miss</h2><p className="muted" style={{ marginTop: 6 }}>Based on a review of 16 school ERP products used in India and globally.</p></div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Capability</th><th>Typical school ERP</th><th style={{ color: 'var(--brand)' }}>Miz School</th></tr></thead>
              <tbody>{GAPS.map(([c, t, m]) => <tr key={c}><td className="strong">{c}</td><td className="muted">{t}</td><td><span className="row" style={{ gap: 6, color: 'var(--success)', fontWeight: 600 }}><Icon name="check" size={16} />{m}</span></td></tr>)}</tbody>
            </table></div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="pw stack" style={{ gap: 24 }}>
          <div><div className="upper" style={{ color: 'var(--brand)' }}>Any size</div><h2 className="title" style={{ marginTop: 8 }}>From 50 students to 50,000</h2></div>
          <div className="grid g-3">
            {SIZES.map(([ic, tone, t, n, pts]) => (
              <div key={t} className="card card-b">
                <IconTile icon={ic} tone={tone} size={48} iconSize={24} />
                <h3 style={{ fontSize: 18, marginTop: 12 }}>{t}</h3>
                <div className="strong" style={{ color: 'var(--brand)' }}>{n}</div>
                <div className="stack-sm small" style={{ marginTop: 12 }}>{pts.map((p) => <div key={p} className="row" style={{ gap: 8 }}><Icon name="tick" size={15} style={{ color: 'var(--success)' }} />{p}</div>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="pw stack" style={{ gap: 24 }}>
          <div><div className="upper" style={{ color: 'var(--brand)' }}>Everything included</div><h2 className="title" style={{ marginTop: 8 }}>40+ modules, {ROLES.length} role-based apps</h2></div>
          <div className="grid g-3">
            {MODULE_GROUPS.map(([g, ic, items]) => (
              <div key={g} className="card card-b">
                <div className="row"><IconTile icon={ic} size={40} /><h3 style={{ fontSize: 16 }}>{g}</h3></div>
                <div className="stack-sm small" style={{ marginTop: 12 }}>{items.map((x) => <div key={x} className="row" style={{ gap: 8 }}><Icon name="tick" size={14} style={{ color: 'var(--success)' }} />{x}</div>)}</div>
              </div>
            ))}
          </div>
          <div className="row wrap" style={{ gap: 8 }}>{ROLES.map((r) => <a key={r.key} className="btn btn-sm" href={`#/s/aravali/${r.key}/dashboard`}><Icon name={r.icon} size={14} /> {r.label}</a>)}</div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--brand-ink)' }}>
        <div className="pw row between wrap" style={{ gap: 20 }}>
          <div style={{ maxWidth: 640 }}>
            <h2 className="title" style={{ color: '#fff' }}>The end goal</h2>
            <p style={{ color: '#c9d6ea', fontSize: 17, marginTop: 8 }}>A school where fees arrive on time, every parent knows what is happening with their child, teachers teach instead of filling registers, and management sees problems before they grow — all under the school’s own name.</p>
          </div>
          <a className="btn btn-lg" href="#/demo" style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#1b1300' }}>See it in action</a>
        </div>
      </section>
      <Footer />
    </div>
  );
}
