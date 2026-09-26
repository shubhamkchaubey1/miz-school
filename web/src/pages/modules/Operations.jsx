import { useEffect, useMemo, useState } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { PageHead, Card, Stat, StatusBadge, Badge, Tabs, Modal, Avatar, Empty, Search, Bars, inr, fmtDate, fmtTime, ago } from '../../components/ui.jsx';
import { ChildSwitcher } from '../dashboards/Dashboards.jsx';

/* ───────────── Transport ───────────── */
export function Transport() {
  const { data, idx, role, persona } = useSchool();
  const parent = role === 'parent';
  const initial = parent ? persona.child.route_id : role === 'driver' ? persona.route.id : data.routes[0].id;
  const [rid, setRid] = useState(initial || data.routes[0].id);
  const routeId = parent ? persona.child.route_id : rid;
  if (parent && !routeId) return <div><PageHead title="Transport" actions={<ChildSwitcher />} /><Card><Empty>{persona.child.full_name} uses own transport.</Empty></Card></div>;
  const route = idx.routes[routeId];
  const stops = data.route_stops.filter((s) => s.route_id === routeId);
  const riders = data.students.filter((s) => s.route_id === routeId);
  const vehicle = data.vehicles.find((v) => v.id === route.vehicle_id);
  const liveAt = 3; // demo: bus is between stop 3 and 4
  const myStop = parent ? idx.stops[persona.child.stop_id] : null;
  return (
    <div>
      <PageHead title={parent ? 'School bus' : 'Transport'} sub={`${data.routes.length} routes · ${data.vehicles.length} vehicles · ${data.students.filter((s) => s.route_id).length} students`} actions={parent ? <ChildSwitcher /> : null} />
      <div className={parent ? '' : 'grid g-main'} style={{ alignItems: 'start' }}>
        <div className="stack">
          {parent && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ background: 'var(--brand-ink)', color: '#fff', padding: 18 }} className="row between wrap">
                <div><div className="upper" style={{ color: 'rgba(255,255,255,.7)' }}>Live · Morning pickup</div><div style={{ fontSize: 22, fontWeight: 700 }}>{route.code} is near {stops[liveAt - 1]?.name}</div><div style={{ color: 'rgba(255,255,255,.75)' }}>Next stop: {stops[liveAt]?.name} · ETA {stops[liveAt]?.eta} AM</div></div>
                <div style={{ textAlign: 'right' }}><div className="xs" style={{ color: 'rgba(255,255,255,.7)' }}>{persona.child.full_name.split(' ')[0]}’s stop</div><div className="strong" style={{ fontSize: 18 }}>{myStop?.name}</div><div className="xs" style={{ color: 'rgba(255,255,255,.7)' }}>Pickup {myStop?.eta} AM</div></div>
              </div>
              <div className="card-b row wrap small" style={{ gap: 20 }}>
                <span><span className="muted">Driver</span> <strong>{route.driver_name}</strong> · {route.driver_phone}</span>
                <span><span className="muted">Attendant</span> <strong>{route.attendant_name}</strong></span>
                <span><span className="muted">Bus</span> <strong>{vehicle?.reg_no}</strong></span>
              </div>
            </div>
          )}
          <Card title={`Live bus location — ${route.code}`} icon="nav" tone="green" pad={false}><BusMap stops={stops} myStopId={myStop?.id} route={route} /></Card>
          {!parent && (
            <Card title="Routes" pad={false}>
              <div className="table-wrap"><table className="table"><thead><tr><th>Route</th><th>Vehicle</th><th>Driver</th><th className="num">Students</th><th>Departs</th><th>Status</th></tr></thead>
                <tbody>{data.routes.map((r) => <tr key={r.id} onClick={() => setRid(r.id)} style={{ cursor: 'pointer', background: r.id === rid ? 'var(--brand-50)' : undefined }}><td><div className="strong">{r.code}</div><div className="xs muted">{r.name}</div></td><td className="small">{idx.routes[r.id] && data.vehicles.find((v) => v.id === r.vehicle_id)?.reg_no}</td><td className="small">{r.driver_name}<div className="xs muted">{r.driver_phone}</div></td><td className="num">{data.students.filter((s) => s.route_id === r.id).length}</td><td className="tnum">{r.departs_at}</td><td><StatusBadge status={r.status} /></td></tr>)}</tbody></table></div>
            </Card>
          )}
          {!parent && (
            <Card title={`Students on ${route.code}`} pad={false}>
              <div className="table-wrap" style={{ maxHeight: 360 }}><table className="table"><thead><tr><th>Student</th><th>Class</th><th>Stop</th><th>Guardian</th></tr></thead>
                <tbody>{riders.map((s) => <tr key={s.id}><td className="strong small">{s.full_name}</td><td>{idx.sections[s.section_id].name}</td><td className="small">{idx.stops[s.stop_id]?.name}</td><td className="small tnum">{s.guardian_phone}</td></tr>)}</tbody></table></div>
            </Card>
          )}
        </div>
        <Card title={`${route.code} · stops`} style={parent ? { marginTop: 16 } : undefined}>
          <div className="stops">
            {stops.map((s) => (
              <div key={s.id} className={`stop ${s.seq < liveAt ? 'done' : s.seq === liveAt ? 'current' : ''}`}>
                <div className="row between"><span className="strong small">{s.name}{myStop?.id === s.id && <Badge tone="blue">Your stop</Badge>}</span><span className="xs muted tnum">{s.eta}</span></div>
                <div className="xs muted">{riders.filter((r) => r.stop_id === s.id).length} students</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}


/** Simulated live GPS map — in production the bus position comes from the driver app / GPS device. */
export function BusMap({ stops, myStopId, route }) {
  const pts = stops.map((s, i) => [60 + i * (680 / Math.max(1, stops.length - 1)), i % 2 ? 90 : 210 - (i % 3) * 30]);
  const [t, setT] = useState(1.3);
  useEffect(() => { const id = setInterval(() => setT((x) => (x >= stops.length - 1 ? 0 : x + 0.05)), 800); return () => clearInterval(id); }, [stops.length]);
  const i = Math.floor(t); const f = t - i; const a = pts[i]; const b = pts[Math.min(i + 1, pts.length - 1)];
  const bx = a[0] + (b[0] - a[0]) * f; const by = a[1] + (b[1] - a[1]) * f;
  const d = pts.map((p, k) => `${k ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const next = stops[Math.min(i + 1, stops.length - 1)];
  return (
    <div className="busmap">
      <svg viewBox="0 0 800 300" role="img" aria-label={`Live location of bus ${route?.code}`}>
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#dde7d8" strokeWidth="1" /></pattern></defs>
        <rect width="800" height="300" fill="url(#grid)" />
        <path d="M0 150 C200 120 300 260 520 220 S760 100 800 120" stroke="#cfe0f5" strokeWidth="18" fill="none" />
        <path d="M120 0 L160 300 M430 0 L400 300 M650 0 L700 300" stroke="#fff" strokeWidth="10" />
        <path d={d} stroke="var(--brand)" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 0" />
        {pts.map((p, k) => (
          <g key={k}>
            <circle cx={p[0]} cy={p[1]} r={stops[k].id === myStopId ? 11 : 8} fill={k <= i ? 'var(--brand)' : '#fff'} stroke={stops[k].id === myStopId ? '#e0a526' : 'var(--brand)'} strokeWidth="3" />
            <text x={p[0]} y={p[1] + (k % 2 ? -18 : 28)} textAnchor="middle" fontSize="12" fontWeight="600" fill="#33445e">{stops[k].name}</text>
          </g>
        ))}
        <g className="bus-pin" transform={`translate(${bx},${by})`}>
          <circle r="22" fill="var(--accent)" opacity=".25"><animate attributeName="r" values="16;26;16" dur="1.6s" repeatCount="indefinite" /></circle>
          <rect x="-15" y="-11" width="30" height="22" rx="5" fill="var(--brand-ink)" />
          <rect x="-11" y="-7" width="22" height="7" rx="1.5" fill="#fff" />
          <circle cx="-8" cy="11" r="3" fill="#333" /><circle cx="8" cy="11" r="3" fill="#333" />
        </g>
      </svg>
      <div className="row between wrap small" style={{ padding: '8px 12px', background: '#fff', borderTop: '1px solid var(--line)' }}>
        <span className="row" style={{ gap: 6 }}><span className="dot" style={{ color: 'var(--success)' }} /> Live · updated every 10 s</span>
        <span>Next stop: <strong>{next?.name}</strong> · ETA {next?.eta} AM</span>
        <span className="muted">Speed 28 km/h</span>
      </div>
    </div>
  );
}

/* ───────────── Driver trip ───────────── */
export function Trip() {
  const { data, persona, trip, setTrip, notify } = useSchool();
  const route = persona.route;
  const stops = data.route_stops.filter((s) => s.route_id === route.id);
  const riders = data.students.filter((s) => s.route_id === route.id);
  const stop = stops[trip.stopIndex];
  const here = riders.filter((r) => r.stop_id === stop?.id);
  const boardedCount = Object.values(trip.boarded).filter(Boolean).length;
  const now = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const start = () => { setTrip({ status: 'running', stopIndex: 0, boarded: {}, log: [{ t: now(), e: 'Trip started' }] }); notify('Trip started — parents notified'); };
  const next = () => {
    const last = trip.stopIndex >= stops.length - 1;
    if (last) { setTrip({ ...trip, status: 'done', log: [...trip.log, { t: now(), e: `Reached ${stop.name}` }, { t: now(), e: 'Trip completed' }] }); notify('Trip completed'); return; }
    setTrip({ ...trip, stopIndex: trip.stopIndex + 1, log: [...trip.log, { t: now(), e: `Departed ${stop.name}` }] });
  };
  return (
    <div style={{ maxWidth: 720 }}>
      <PageHead title="Today’s trip" sub={`${route.code} · ${route.name}`} />
      {trip.status === 'idle' && (
        <Card>
          <div className="stack" style={{ alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
            <Icon name="bus" size={48} style={{ color: 'var(--brand)' }} />
            <div><div className="strong" style={{ fontSize: 20 }}>{stops.length} stops · {riders.length} students</div><div className="muted">Scheduled departure {route.departs_at} AM</div></div>
            <button className="btn btn-primary btn-lg" style={{ minWidth: 240, height: 56, fontSize: 18 }} onClick={start}><Icon name="play" size={20} /> START TRIP</button>
          </div>
        </Card>
      )}
      {trip.status === 'running' && stop && (
        <div className="stack">
          <div className="card card-b" style={{ background: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' }}>
            <div className="xs" style={{ opacity: .8 }}>Stop {trip.stopIndex + 1} of {stops.length} · ETA {stop.eta}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stop.name}</div>
            <div className="small" style={{ opacity: .85 }}>{boardedCount} of {riders.length} students on board</div>
          </div>
          <Card title={`Boarding at ${stop.name}`} pad={false}>
            <div className="list">
              {here.map((s) => (
                <div key={s.id} className="row">
                  <Avatar name={s.full_name} size="sm" />
                  <div className="grow"><div className="strong small">{s.full_name}</div><div className="xs muted">Class {data.sections.find((x) => x.id === s.section_id)?.name}</div></div>
                  <button className={`btn btn-sm ${trip.boarded[s.id] ? 'btn-success' : ''}`} onClick={() => setTrip({ ...trip, boarded: { ...trip.boarded, [s.id]: !trip.boarded[s.id] } })}>{trip.boarded[s.id] ? <><Icon name="tick" size={14} /> Boarded</> : 'Mark boarded'}</button>
                </div>
              ))}
              {!here.length && <div className="muted small">{stop.seq === 7 ? 'Drop point — all students alight here.' : 'No students at this stop.'}</div>}
            </div>
          </Card>
          <button className="btn btn-primary btn-lg" style={{ height: 54 }} onClick={next}>{trip.stopIndex >= stops.length - 1 ? 'Complete trip' : <>Depart to {stops[trip.stopIndex + 1].name} <Icon name="arrow" size={18} /></>}</button>
        </div>
      )}
      {trip.status === 'done' && (
        <Card><div className="stack" style={{ alignItems: 'center', padding: 20 }}><Icon name="check" size={44} style={{ color: 'var(--success)' }} /><div className="strong" style={{ fontSize: 20 }}>Trip completed</div><div className="muted">{boardedCount} students dropped at school</div><button className="btn" onClick={() => setTrip({ status: 'idle', stopIndex: 0, boarded: {}, log: [] })}>Reset demo</button></div></Card>
      )}
      {trip.log.length > 0 && (
        <Card title="Trip log" pad={false} style={{ marginTop: 16 }}>
          <div className="list">{[...trip.log].reverse().map((l, i) => <div key={i} className="row small"><span className="time-col">{l.t}</span>{l.e}</div>)}</div>
        </Card>
      )}
    </div>
  );
}

/* ───────────── Reception / front office ───────────── */
export function Reception() {
  const { data, actions, notify, idx } = useSchool();
  const [tab, setTab] = useState('visitors');
  const [modal, setModal] = useState(null);
  const [f, setF] = useState({});
  const field = (k, l, type = 'text') => <div className="field" key={k}><label>{l}</label><input className="input" type={type} value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>;
  void idx;
  return (
    <div>
      <PageHead title="Front office" sub="Visitors, enquiries, calls, post and complaints" actions={<>
        <button className="btn" onClick={() => { setF({}); setModal('enquiry'); }}><Icon name="plus" size={16} /> Enquiry</button>
        <button className="btn btn-primary" onClick={() => { setF({}); setModal('visitor'); }}><Icon name="door" size={16} /> Check in visitor</button>
      </>} />
      <Tabs tabs={[['visitors', 'Visitor book'], ['enquiries', 'Admission enquiries'], ['calls', 'Phone calls'], ['postal', 'Postal'], ['complaints', 'Complaints']]} value={tab} onChange={setTab} />
      <Card pad={false} style={{ marginTop: 16 }}>
        <div className="table-wrap">
          {tab === 'visitors' && <table className="table"><thead><tr><th>Badge</th><th>Visitor</th><th>Purpose</th><th>To meet</th><th>In</th><th>Out</th><th /></tr></thead>
            <tbody>{data.visitors.map((v) => <tr key={v.id}><td className="strong small">{v.badge_no}</td><td>{v.name}<div className="xs muted">{v.phone}</div></td><td className="small">{v.purpose}</td><td className="small">{v.host}</td><td className="small tnum">{fmtTime(v.check_in)}</td><td className="small tnum">{v.check_out ? fmtTime(v.check_out) : '—'}</td><td>{v.status === 'inside' ? <button className="btn btn-sm" onClick={() => { actions.checkoutVisitor(v.id); notify(`${v.name} checked out`); }}>Check out</button> : <StatusBadge status={v.status} />}</td></tr>)}</tbody></table>}
          {tab === 'enquiries' && <table className="table"><thead><tr><th>Student</th><th>For</th><th>Parent</th><th>Phone</th><th>Source</th><th>Follow-up</th><th>Status</th></tr></thead>
            <tbody>{data.admission_enquiries.map((e) => <tr key={e.id}><td className="strong">{e.student_name}</td><td>{e.grade}</td><td className="small">{e.parent_name}</td><td className="small tnum">{e.phone}</td><td className="small">{e.source}</td><td className="small">{fmtDate(e.follow_up_on)}</td><td><StatusBadge status={e.status} /></td></tr>)}</tbody></table>}
          {tab === 'calls' && <table className="table"><thead><tr><th>Caller</th><th>Phone</th><th>Type</th><th>Purpose</th><th>Notes</th><th>When</th></tr></thead>
            <tbody>{data.phone_logs.map((c) => <tr key={c.id}><td className="strong">{c.caller}</td><td className="small tnum">{c.phone}</td><td><Badge tone={c.call_type === 'incoming' ? 'blue' : ''}>{c.call_type}</Badge></td><td className="small">{c.purpose}</td><td className="small">{c.notes}</td><td className="small">{ago(c.created_at)}</td></tr>)}</tbody></table>}
          {tab === 'postal' && <table className="table"><thead><tr><th>Type</th><th>Reference</th><th>From / to</th><th>Courier</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>{data.postal_items.map((p) => <tr key={p.id}><td><Badge tone={p.direction === 'receive' ? 'blue' : ''}>{p.direction === 'receive' ? 'Received' : 'Dispatch'}</Badge></td><td className="small tnum">{p.ref_no}</td><td>{p.party}</td><td className="small">{p.courier}</td><td className="small">{fmtDate(p.created_at)}</td><td><StatusBadge status={p.status} /></td></tr>)}</tbody></table>}
          {tab === 'complaints' && <table className="table"><thead><tr><th>Raised by</th><th>Category</th><th>Subject</th><th>When</th><th>Status</th><th /></tr></thead>
            <tbody>{data.complaints.map((c) => <tr key={c.id}><td className="small">{c.raised_by}</td><td><Badge>{c.category}</Badge></td><td className="strong small">{c.subject}</td><td className="small">{ago(c.created_at)}</td><td><StatusBadge status={c.status} /></td><td>{c.status !== 'resolved' && <button className="btn btn-sm" onClick={() => { actions.setComplaint(c.id, 'resolved'); notify('Complaint resolved'); }}>Resolve</button>}</td></tr>)}</tbody></table>}
        </div>
      </Card>
      {modal === 'visitor' && (
        <Modal title="Check in visitor" onClose={() => setModal(null)} footer={<><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" disabled={!f.name} onClick={() => { actions.addVisitor({ name: f.name, phone: f.phone, purpose: f.purpose || 'Meeting', host: f.host || 'Office' }); setModal(null); notify('Visitor pass printed'); }}>Check in & print pass</button></>}>
          <div className="grid g-2">{field('name', 'Visitor name')}{field('phone', 'Mobile')}{field('purpose', 'Purpose')}{field('host', 'Person to meet')}</div>
          <button className="btn" style={{ marginTop: 12 }}><Icon name="scan" size={16} /> Capture photo</button>
        </Modal>
      )}
      {modal === 'enquiry' && (
        <Modal title="New admission enquiry" onClose={() => setModal(null)} footer={<><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" disabled={!f.student_name} onClick={() => { actions.addEnquiry({ student_name: f.student_name, parent_name: f.parent_name, phone: f.phone, grade: f.grade || 'Class 1', source: 'Walk-in', follow_up_on: f.follow_up_on }); setModal(null); setTab('enquiries'); notify('Enquiry saved'); }}>Save enquiry</button></>}>
          <div className="grid g-2">{field('student_name', 'Student name')}{field('grade', 'Class sought')}{field('parent_name', 'Parent name')}{field('phone', 'Mobile')}{field('follow_up_on', 'Follow-up date', 'date')}</div>
        </Modal>
      )}
    </div>
  );
}

/* ───────────── Hostel ───────────── */
export function Hostel() {
  const { data, idx } = useSchool();
  const [hid, setHid] = useState(data.hostels[0].id);
  const [room, setRoom] = useState(null);
  const rooms = data.rooms.filter((r) => r.hostel_id === hid);
  const residents = (rid) => data.students.filter((s) => s.hostel_room_id === rid);
  const cap = rooms.reduce((a, r) => a + (r.status === 'active' ? r.capacity : 0), 0);
  const occ = rooms.reduce((a, r) => a + r.occupied, 0);
  return (
    <div>
      <PageHead title="Hostel" sub="Rooms, allocations and occupancy" actions={<button className="btn btn-primary"><Icon name="plus" size={16} /> New allocation</button>} />
      <Tabs tabs={data.hostels.map((h) => [h.id, h.name])} value={hid} onChange={setHid} />
      <div className="grid g-4" style={{ margin: '16px 0' }}>
        <Stat label="Beds occupied" value={`${occ}/${cap}`} icon="bed" />
        <Stat label="Available beds" value={cap - occ} icon="door" tone="green" />
        <Stat label="Rooms" value={rooms.length} foot={`${rooms.filter((r) => r.room_type === 'Double').length} double · ${rooms.filter((r) => r.room_type === 'Quad').length} quad`} icon="layers" />
        <Stat label="Maintenance" value={rooms.filter((r) => r.status === 'maintenance').length} icon="settings" tone="amber" />
      </div>
      <Card title="Room map" action={<div className="row xs muted" style={{ gap: 12 }}><span className="row" style={{ gap: 4 }}><i style={{ width: 10, height: 10, background: 'var(--brand)', borderRadius: 2, display: 'inline-block' }} />Occupied</span><span className="row" style={{ gap: 4 }}><i style={{ width: 10, height: 10, background: '#e3e9f1', borderRadius: 2, display: 'inline-block' }} />Free</span></div>}>
        {[1, 2, 3].map((fl) => rooms.some((r) => r.floor === fl) && (
          <div key={fl} style={{ marginBottom: 14 }}>
            <div className="upper" style={{ marginBottom: 8 }}>Floor {fl}</div>
            <div className="rooms">
              {rooms.filter((r) => r.floor === fl).map((r) => (
                <button key={r.id} className={`room ${r.status === 'maintenance' ? 'maint' : r.occupied >= r.capacity ? 'full' : ''}`} onClick={() => setRoom(r)}>
                  <div className="strong">{r.room_no}</div>
                  <div className="xs muted">{r.status === 'maintenance' ? 'Maintenance' : `${r.occupied}/${r.capacity} · ${r.room_type}`}</div>
                  <div className="beds">{Array.from({ length: r.capacity }, (_, i) => <i key={i} className={i < r.occupied ? 'on' : ''} />)}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </Card>
      {room && (
        <Modal title={`Room ${room.room_no}`} onClose={() => setRoom(null)}>
          <div className="stack-sm small">
            <div className="row between"><span className="muted">Type</span><strong>{room.room_type} · {room.capacity} beds</strong></div>
            <div className="row between"><span className="muted">Status</span><StatusBadge status={room.status} /></div>
            <div className="divider" />
            <div className="upper">Residents in app</div>
            {residents(room.id).map((s) => <div key={s.id} className="row"><Avatar name={s.full_name} size="sm" /><span className="grow strong">{s.full_name}</span><span className="muted">{idx.sections[s.section_id].name}</span></div>)}
            {!residents(room.id).length && <span className="muted">{room.occupied ? `${room.occupied} residents (from previous session import)` : 'Room is empty.'}</span>}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ───────────── Canteen ───────────── */
export function Canteen() {
  const { data, actions, notify } = useSchool();
  const [tab, setTab] = useState('pos');
  const [cart, setCart] = useState({});
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const items = data.canteen_items;
  const cats = ['All', ...new Set(items.map((i) => i.category))];
  const lines = Object.entries(cart).filter(([, n]) => n > 0).map(([id, n]) => ({ item: items.find((i) => i.id === id), n }));
  const total = lines.reduce((a, l) => a + l.item.price * l.n, 0);
  const add = (id, d) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + d) }));
  const byCat = useMemo(() => { const m = {}; data.canteen_sales.forEach((s, i) => { const k = ['Snacks', 'Meals', 'Beverages', 'Breakfast', 'Healthy'][i % 5]; m[k] = (m[k] || 0) + Number(s.total); }); return Object.entries(m).map(([label, value]) => ({ label, value })); }, [data.canteen_sales]);
  return (
    <div>
      <PageHead title="Canteen" sub="Billing, menu and stock" />
      <Tabs tabs={[['pos', 'Billing'], ['items', 'Items & stock'], ['sales', 'Daily sales']]} value={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === 'pos' && (
          <div className="grid g-main" style={{ alignItems: 'start' }}>
            <Card pad={false}>
              <div className="card-h row wrap"><div className="row wrap" style={{ gap: 6 }}>{cats.map((c) => <button key={c} className="btn btn-sm" style={cat === c ? { background: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' } : undefined} onClick={() => setCat(c)}>{c}</button>)}</div><Search value={q} onChange={setQ} placeholder="Find item" style={{ width: 180 }} /></div>
              <div className="card-b grid g-3" style={{ gap: 8 }}>
                {items.filter((i) => (cat === 'All' || i.category === cat) && (!q || i.name.toLowerCase().includes(q.toLowerCase()))).map((i) => (
                  <button key={i.id} className="card" style={{ padding: 12, textAlign: 'left', cursor: i.stock ? 'pointer' : 'not-allowed', opacity: i.stock ? 1 : 0.5 }} disabled={!i.stock} onClick={() => add(i.id, 1)}>
                    <div className="row between"><span className="strong small">{i.name}</span>{cart[i.id] > 0 && <span className="badge navy">{cart[i.id]}</span>}</div>
                    <div className="row between" style={{ marginTop: 6 }}><span className="strong">{inr(i.price)}</span><span className={`xs ${i.stock < 15 ? '' : 'muted'}`} style={i.stock < 15 ? { color: 'var(--danger)' } : undefined}>{i.stock} left</span></div>
                  </button>
                ))}
              </div>
            </Card>
            <Card title="Current bill" footer={<button className="btn btn-primary btn-block btn-lg" disabled={!lines.length} onClick={() => { const counts = Object.fromEntries(lines.map((l) => [l.item.id, l.n])); actions.addSale({ customer: 'Counter sale', items_count: lines.reduce((a, l) => a + l.n, 0), total, method: 'Wallet' }, counts); setCart({}); notify(`Bill saved · ${inr(total)}`); }}>Charge {inr(total)}</button>}>
              {lines.length ? (
                <div className="stack-sm">
                  {lines.map((l) => <div key={l.item.id} className="row"><span className="grow small strong">{l.item.name}</span><div className="row" style={{ gap: 4 }}><button className="icon-btn" style={{ width: 28, height: 28, border: '1px solid var(--line)' }} onClick={() => add(l.item.id, -1)} aria-label="Remove one"><Icon name="minus" size={14} /></button><span className="tnum strong" style={{ width: 20, textAlign: 'center' }}>{l.n}</span><button className="icon-btn" style={{ width: 28, height: 28, border: '1px solid var(--line)' }} onClick={() => add(l.item.id, 1)} aria-label="Add one"><Icon name="plus" size={14} /></button></div><span className="tnum" style={{ width: 60, textAlign: 'right' }}>{inr(l.item.price * l.n)}</span></div>)}
                  <div className="divider" />
                  <div className="row between"><strong>Total</strong><strong style={{ fontSize: 18 }}>{inr(total)}</strong></div>
                  <div className="field"><label>Student / wallet</label><input className="input" placeholder="Scan ID card or enter admission no." /></div>
                </div>
              ) : <Empty>Tap items to add them to the bill.</Empty>}
            </Card>
          </div>
        )}
        {tab === 'items' && (
          <Card pad={false}>
            <div className="table-wrap"><table className="table"><thead><tr><th>Item</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th /></tr></thead>
              <tbody>{items.map((i) => <tr key={i.id}><td className="strong">{i.name}</td><td><Badge>{i.category}</Badge></td><td className="num">{inr(i.price)}</td><td className="num"><Badge tone={i.stock < 15 ? 'red' : 'green'}>{i.stock} {i.unit}</Badge></td><td><button className="btn btn-sm" onClick={() => { actions.restock(i.id, 25); notify(`${i.name}: +25 added to stock`); }}>+25 stock</button></td></tr>)}</tbody></table></div>
          </Card>
        )}
        {tab === 'sales' && (
          <div className="grid g-main">
            <Card title="Today’s bills" pad={false}>
              <div className="table-wrap"><table className="table"><thead><tr><th>Bill</th><th>Customer</th><th>Time</th><th>Mode</th><th className="num">Amount</th></tr></thead>
                <tbody>{data.canteen_sales.map((s) => <tr key={s.id}><td className="small strong">{s.bill_no}</td><td className="small">{s.customer}</td><td className="small tnum">{fmtTime(s.created_at)}</td><td className="small">{s.method}</td><td className="num strong">{inr(s.total)}</td></tr>)}</tbody></table></div>
            </Card>
            <Card title="Sales by category"><Bars data={byCat} format={(v) => inr(v)} highlightLast={false} /></Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── Gate scanner ───────────── */
export function Scanner() {
  const { data, idx, actions } = useSchool();
  const [scans, setScans] = useState([]);
  const [last, setLast] = useState(null);
  const scan = () => {
    const pool = data.students.filter((s) => !scans.some((x) => x.s.id === s.id));
    const s = pool[Math.floor(Math.random() * pool.length)];
    const late = new Date().getHours() * 60 + new Date().getMinutes() > 7 * 60 + 55 && Math.random() > 0.6;
    const status = late ? 'late' : 'present';
    actions.markStudent(s.id, status);
    const entry = { s, status, t: new Date() };
    setLast(entry);
    setScans((x) => [entry, ...x].slice(0, 12));
  };
  return (
    <div>
      <PageHead title="Gate scanner" sub="Main gate · Student QR ID cards" />
      <div className="grid g-2" style={{ alignItems: 'start' }}>
        <Card>
          <div className="qr-frame">
            <span className="corner" style={{ top: 18, left: 18, borderRight: 0, borderBottom: 0 }} />
            <span className="corner" style={{ top: 18, right: 18, borderLeft: 0, borderBottom: 0 }} />
            <span className="corner" style={{ bottom: 18, left: 18, borderRight: 0, borderTop: 0 }} />
            <span className="corner" style={{ bottom: 18, right: 18, borderLeft: 0, borderTop: 0 }} />
            <span className="scanline" />
            <Icon name="qr" size={90} style={{ color: 'rgba(255,255,255,.18)' }} />
          </div>
          <p className="small muted" style={{ textAlign: 'center', margin: '12px 0' }}>Point the camera at the QR code on the ID card</p>
          <button className="btn btn-primary btn-lg btn-block" onClick={scan}><Icon name="scan" size={18} /> Simulate scan</button>
        </Card>
        <div className="stack">
          {last ? (
            <div className="card card-b row" style={{ gap: 14, borderColor: last.status === 'late' ? '#f3d39a' : '#a6d9bc', background: last.status === 'late' ? 'var(--warn-bg)' : 'var(--success-bg)' }}>
              <Avatar name={last.s.full_name} size="lg" />
              <div className="grow"><div className="strong" style={{ fontSize: 18 }}>{last.s.full_name}</div><div className="small">Class {idx.sections[last.s.section_id].name} · Roll {last.s.roll_no} · {last.s.admission_no}</div><div className="xs muted">Verified · {data.school.short_name} · AY {data.school.academic_year}</div></div>
              <div style={{ textAlign: 'center' }}><Icon name={last.status === 'late' ? 'clock' : 'check'} size={30} style={{ color: last.status === 'late' ? 'var(--warn)' : 'var(--success)' }} /><div className="strong small">{last.status === 'late' ? 'Late' : 'Present'}</div></div>
            </div>
          ) : <Card><Empty>Scan result appears here.</Empty></Card>}
          <Card title={`This session · ${scans.length} scans`} pad={false}>
            <div className="list">{scans.map((x, i) => <div key={i} className="row"><Avatar name={x.s.full_name} size="sm" /><span className="grow small strong">{x.s.full_name}</span><span className="xs muted tnum">{fmtTime(x.t)}</span><StatusBadge status={x.status} /></div>)}{!scans.length && <div className="muted small">No scans yet.</div>}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
