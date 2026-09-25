import { useSchool } from '../../lib/store.jsx';
import { navigate } from '../../lib/router.js';
import Icon from '../../components/Icon.jsx';
import { Card, StatusBadge, ago, fmtDate, greeting } from '../../components/ui.jsx';
import { PERIODS } from '../../data/generate.js';
import { currentPeriod, todayISO } from '../../lib/derive.js';

export function useGo() {
  const { slug, role } = useSchool();
  return (m) => navigate(`/s/${slug}/${role}/${m}`);
}

export function Welcome({ name, sub, actions }) {
  const { data } = useSchool();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const first = name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Fr\.|Sr\.)\s*/, '').split(' ')[0];
  return (
    <div className="page-head">
      <div>
        <div className="crumbs">{today} · AY {data.school.academic_year}</div>
        <h1>{greeting()}, {first}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="row wrap">{actions}</div>}
    </div>
  );
}

export function QuickActions({ items }) {
  const go = useGo();
  return (
    <Card title="Quick actions">
      <div className="grid g-2" style={{ gap: 8 }}>
        {items.map(([icon, label, mod]) => (
          <button key={label} className="btn" style={{ justifyContent: 'flex-start', height: 44 }} onClick={() => go(mod)}>
            <Icon name={icon} size={17} style={{ color: 'var(--brand)' }} /> {label}
          </button>
        ))}
      </div>
    </Card>
  );
}

export function TodaySchedule() {
  const { data } = useSchool();
  const today = todayISO();
  const events = data.school_events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 5);
  return (
    <Card title="Today & upcoming" pad={false}>
      <div className="list">
        {events.map((e) => (
          <div key={e.id} className="row top">
            <span className="time-col">{e.time}</span>
            <div className="grow"><div className="strong small">{e.title}</div><div className="xs muted">{e.date === today ? 'Today' : fmtDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {e.venue}</div></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NoticesCard({ limit = 4, audience }) {
  const { data } = useSchool();
  const go = useGo();
  const list = data.notices.filter((n) => !audience || n.audience === 'All' || n.audience.includes(audience)).slice(0, limit);
  return (
    <Card title="Notices" action={<button className="btn btn-ghost btn-sm" onClick={() => go('notices')}>View all</button>} pad={false}>
      <div className="list">
        {list.map((n) => (
          <div key={n.id}>
            <div className="row between top"><span className="strong small">{n.title}</span>{n.priority === 'important' && <StatusBadge status="important" />}</div>
            <div className="xs muted" style={{ marginTop: 2 }}>{n.category} · {ago(n.published_at)}</div>
          </div>
        ))}
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
        return (
          <div key={t.id} className="row" style={on ? { background: 'var(--brand-50)', boxShadow: 'inset 3px 0 0 var(--brand)' } : undefined}>
            <span className="time-col">{t.start_time}</span>
            <div className="grow">
              <div className="strong small">{idx.subjects[t.subject_id]?.name}{showSection && ` — Class ${idx.sections[t.section_id]?.name}`}</div>
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
