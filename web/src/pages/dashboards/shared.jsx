import { useSchool } from '../../lib/store.jsx';
import { navigate } from '../../lib/router.js';
import Icon from '../../components/Icon.jsx';
import { Card, StatusBadge, IconTile, ago, fmtDate, greeting } from '../../components/ui.jsx';
import { Crest, CampusArt } from '../../components/Brand.jsx';
import { PERIODS } from '../../data/generate.js';
import { currentPeriod, todayISO } from '../../lib/derive.js';

export function useGo() {
  const { slug, role } = useSchool();
  return (m) => navigate(`/s/${slug}/${role}/${m}`);
}

// Subject look — same colour + icon everywhere (timetable, homework, marks)
export const SUBJECT_STYLE = {
  ENG: { icon: 'book', tone: 'blue' }, HIN: { icon: 'lang', tone: 'amber' }, MAT: { icon: 'calc', tone: 'violet' },
  SCI: { icon: 'flask', tone: 'green' }, SST: { icon: 'earth', tone: 'teal' }, CS: { icon: 'monitor', tone: 'indigo' },
  SAN: { icon: 'notebook', tone: 'rose' }, PE: { icon: 'gym', tone: 'red' },
};
export const subjectStyle = (sub) => SUBJECT_STYLE[sub?.code] || { icon: 'book', tone: 'blue' };

/** Branded welcome banner shown at the top of every dashboard. */
export function Welcome({ name, sub, actions, chips }) {
  const { data, persona } = useSchool();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const first = name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Fr\.|Sr\.)\s*/, '').split(' ')[0];
  const platform = persona.role.platform;
  return (
    <section className="welcome">
      <CampusArt className="welcome-art" color="rgba(255,255,255,.16)" />
      <div className="welcome-in">
        {!platform && <span className="welcome-crest"><Crest school={data.school} size={46} /></span>}
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="welcome-date"><Icon name="sun" size={14} /> {today} · AY {data.school.academic_year}</div>
          <h1>{greeting()}, {first}</h1>
          {sub && <p className="welcome-sub">{sub}</p>}
          {chips && <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>{chips.map(([ic, t]) => <span key={t} className="welcome-chip"><Icon name={ic} size={14} /> {t}</span>)}</div>}
        </div>
        {actions && <div className="row wrap welcome-actions">{actions}</div>}
      </div>
      <div className="welcome-stripe" />
    </section>
  );
}

export function QuickActions({ items, title = 'Quick actions' }) {
  const go = useGo();
  return (
    <Card title={title} icon="timer" tone="navy">
      <div className="qa-grid">
        {items.map(([icon, label, mod, tone]) => (
          <button key={label} className="qa" onClick={() => go(mod)}>
            <IconTile icon={icon} tone={tone} size={40} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

export function DateBox({ date }) {
  const d = new Date(date);
  return (
    <span className="date-box">
      <span className="m">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
      <span className="d">{d.getDate()}</span>
    </span>
  );
}

export function TodaySchedule() {
  const { data } = useSchool();
  const today = todayISO();
  const events = data.school_events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 5);
  return (
    <Card title="Today & upcoming" icon="cal-check" tone="teal" pad={false}>
      <div className="list">
        {events.map((e) => (
          <div key={e.id} className="row">
            <DateBox date={e.date} />
            <div className="grow"><div className="strong small">{e.title}</div><div className="xs muted row" style={{ gap: 6 }}><Icon name="clock" size={12} />{e.time}<Icon name="pin" size={12} style={{ marginLeft: 4 }} />{e.venue}</div></div>
            {e.date === today && <span className="badge blue">Today</span>}
          </div>
        ))}
      </div>
    </Card>
  );
}

const NOTICE_ICON = { Academic: ['award', 'violet'], Sports: ['trophy', 'amber'], Holiday: ['sun', 'teal'], Fees: ['wallet', 'green'], Event: ['megaphone', 'rose'], Staff: ['users', 'blue'], General: ['bell', 'navy'] };
export const noticeIcon = (cat) => NOTICE_ICON[cat] || NOTICE_ICON.General;

export function NoticesCard({ limit = 4, audience }) {
  const { data } = useSchool();
  const go = useGo();
  const list = data.notices.filter((n) => !audience || n.audience === 'All' || n.audience.includes(audience)).slice(0, limit);
  return (
    <Card title="Notices & circulars" icon="megaphone" tone="rose" action={<button className="btn btn-ghost btn-sm" onClick={() => go('notices')}>View all <Icon name="right" size={14} /></button>} pad={false}>
      <div className="list">
        {list.map((n) => {
          const [ic, tone] = noticeIcon(n.category);
          return (
            <div key={n.id} className="row">
              <IconTile icon={ic} tone={tone} size={34} />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="row between top" style={{ gap: 8 }}><span className="strong small">{n.title}</span>{n.priority === 'important' && <StatusBadge status="important" />}</div>
                <div className="xs muted" style={{ marginTop: 2 }}>{n.category} · {ago(n.published_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function PeriodList({ slots, showSection, showTeacher }) {
  const { idx } = useSchool();
  const cur = currentPeriod();
  if (!slots.length) return <div className="empty">No classes scheduled.</div>;
  return (
    <div className="list">
      {slots.map((t) => {
        const on = t.period === cur;
        const sub = idx.subjects[t.subject_id];
        const st = subjectStyle(sub);
        return (
          <div key={t.id} className="row" style={on ? { background: 'var(--brand-50)', boxShadow: 'inset 3px 0 0 var(--brand)' } : undefined}>
            <span className="time-col">{t.start_time}</span>
            <IconTile icon={st.icon} tone={st.tone} size={34} />
            <div className="grow">
              <div className="strong small">{sub?.name}{showSection && ` — Class ${idx.sections[t.section_id]?.name}`}</div>
              <div className="xs muted">Period {t.period} · {t.start_time}–{t.end_time} · {t.room}{showTeacher && ` · ${idx.teachers[t.teacher_id]?.full_name}`}</div>
            </div>
            {on && <span className="badge blue">Now</span>}
          </div>
        );
      })}
    </div>
  );
}

export const periodTimes = PERIODS;
