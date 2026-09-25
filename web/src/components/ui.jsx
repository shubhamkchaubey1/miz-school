import { useEffect } from 'react';
import Icon from './Icon.jsx';

export const inr = (n, compact = false) => {
  if (compact) {
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}k`;
  }
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};
export const num = (n) => Number(n).toLocaleString('en-IN');
export const pct = (n, d = 1) => `${(Number.isFinite(n) ? n : 0).toFixed(d)}%`;
export const initials = (name = '') => name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.|Fr\.|Sr\.)\s*/, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export const fmtDate = (d, opts = { day: 'numeric', month: 'short' }) => (d ? new Date(d).toLocaleDateString('en-IN', opts) : '—');
export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
export const ago = (d) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.round(h / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
};
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export function PageHead({ title, sub, crumbs, actions }) {
  return (
    <div className="page-head">
      <div>
        {crumbs && <div className="crumbs">{crumbs}</div>}
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="row wrap">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, footer, pad = true, className = '', style }) {
  return (
    <section className={`card ${className}`} style={style}>
      {(title || action) && (
        <div className="card-h">
          {typeof title === 'string' ? <h2>{title}</h2> : title}
          {action}
        </div>
      )}
      {pad ? <div className="card-b">{children}</div> : children}
      {footer && <div className="card-f">{footer}</div>}
    </section>
  );
}

export function Stat({ label, value, foot, icon, tone }) {
  const toneStyle = tone === 'green' ? { background: 'var(--success-bg)', color: 'var(--success)' }
    : tone === 'red' ? { background: 'var(--danger-bg)', color: 'var(--danger)' }
    : tone === 'amber' ? { background: 'var(--warn-bg)', color: 'var(--warn)' } : undefined;
  return (
    <div className="card stat">
      <div className="row between">
        <span className="label">{label}</span>
        {icon && <span className="ico" style={toneStyle}><Icon name={icon} size={16} /></span>}
      </div>
      <span className="value">{value}</span>
      {foot && <span className="foot">{foot}</span>}
    </div>
  );
}

const STATUS = {
  present: ['green', 'Present'], absent: ['red', 'Absent'], late: ['amber', 'Late'], leave: ['blue', 'Leave'],
  paid: ['green', 'Paid'], due: ['amber', 'Due'], overdue: ['red', 'Overdue'], upcoming: ['', 'Upcoming'],
  pending: ['amber', 'Pending'], approved: ['green', 'Approved'], rejected: ['red', 'Rejected'],
  open: ['red', 'Open'], in_progress: ['amber', 'In progress'], resolved: ['green', 'Resolved'],
  new: ['blue', 'New'], follow_up: ['amber', 'Follow-up'], visit_scheduled: ['blue', 'Visit scheduled'], admitted: ['green', 'Admitted'], closed: ['', 'Closed'],
  inside: ['green', 'Inside'], checked_out: ['', 'Checked out'],
  scheduled: ['', 'Scheduled'], completed: ['green', 'Completed'], published: ['green', 'Published'],
  received: ['blue', 'Received'], handed_over: ['green', 'Handed over'], dispatched: ['green', 'Dispatched'],
  active: ['green', 'Active'], maintenance: ['amber', 'Maintenance'],
  ACTIVE: ['green', 'Active'], TRIAL: ['blue', 'Trial'], PAST_DUE: ['red', 'Past due'], SUSPENDED: ['red', 'Suspended'],
  important: ['red', 'Important'], normal: ['', 'Normal'],
};
export function StatusBadge({ status }) {
  const [tone, label] = STATUS[status] || ['', status];
  return <span className={`badge ${tone}`}>{label}</span>;
}
export const Badge = ({ tone = '', children }) => <span className={`badge ${tone}`}>{children}</span>;

export function Avatar({ name, size = '' }) {
  return <span className={`avatar ${size}`}>{initials(name)}</span>;
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={value === k} className={`tab ${value === k ? 'active' : ''}`} onClick={() => onChange(k)}>{label}</button>
      ))}
    </div>
  );
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map(([k, label]) => <button key={k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>{label}</button>)}
    </div>
  );
}

export function Search({ value, onChange, placeholder = 'Search…', style }) {
  return (
    <div className="search" style={style}>
      <Icon name="search" size={16} />
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function Progress({ value, color }) {
  return <div className="progress"><span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} /></div>;
}

export function Bars({ data, height = 140, format = (v) => v, highlightLast = true, min = 0 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const h = (v) => (max - min > 0 ? Math.max(4, ((v - min) / (max - min)) * 100) : 100);
  return (
    <div className="bars" style={{ height }}>
      {data.map((d, i) => (
        <div className="b" key={d.label + i} title={`${d.label}: ${format(d.value)}`}>
          <small className="tnum" style={{ color: 'var(--ink-2)' }}>{format(d.value)}</small>
          <span className={`col ${highlightLast && i !== data.length - 1 ? 'muted-col' : ''}`} style={{ height: `${h(d.value)}%` }} />
          <small>{d.label}</small>
        </div>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, width }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" style={width ? { maxWidth: width } : undefined}>
        <div className="card-h"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        <div className="card-b">{children}</div>
        {footer && <div className="card-f row" style={{ justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Empty({ children = 'Nothing here yet.' }) {
  return <div className="empty">{children}</div>;
}
