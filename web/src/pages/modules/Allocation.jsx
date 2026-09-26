import { Fragment, useMemo, useState } from 'react';
import { useSchool } from '../../lib/store.jsx';
import Icon from '../../components/Icon.jsx';
import { PageHead, Card, Stat, Badge, Avatar, Search, Seg, Tabs, Modal, Progress, Empty, fmtDate, ago, IconTile } from '../../components/ui.jsx';
import { validate, loadsOf, rowsByCell, cellKey, fit, FIT_LABEL, maxLoad, shortName, supplyDemand, diffAllocations, demandCells } from '../../lib/allocation.js';
import { STAGES, STREAMS, SCHEME_LABELS, CATEGORIES, schemeKey, slotsPerWeek } from '../../data/classes.js';
import { todayISO } from '../../lib/derive.js';

const tomorrowISO = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
const loadTone = (l, m) => (l > m ? 'red' : l >= m * 0.9 ? 'amber' : l < m * 0.55 ? 'blue' : 'green');
const loadLabel = (l, m) => (l > m ? 'Overloaded' : l >= m * 0.9 ? 'Full' : l < m * 0.55 ? 'Spare capacity' : 'Balanced');
const loadColor = (l, m) => (l > m ? 'var(--danger)' : l >= m * 0.9 ? 'var(--warn)' : 'var(--success)');

function useAllocation() {
  const { data } = useSchool();
  return useMemo(() => {
    const rows = data.alloc_draft || data.allocations;
    const ctx = { sections: data.sections, teachers: data.teachers, scheme: data.subject_scheme, subjects: data.subjects };
    const issues = validate(rows, ctx);
    const changes = data.alloc_draft ? diffAllocations(data.allocations, data.alloc_draft, ctx) : [];
    return { rows, ctx, issues, changes, loads: loadsOf(rows), byCell: rowsByCell(rows), draft: !!data.alloc_draft };
  }, [data.alloc_draft, data.allocations, data.sections, data.teachers, data.subject_scheme, data.subjects]);
}

/* ───────────── Teacher allocation (principal / admin) ───────────── */
export function Allocation() {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const A = useAllocation();
  const [tab, setTab] = useState('grid');
  const [cell, setCell] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const meta = data.alloc_meta || {};
  const canPublish = role === 'principal';
  const demand = demandCells(data.sections, data.subject_scheme).reduce((a, c) => a + c.periods, 0);
  const allotted = A.rows.reduce((a, r) => a + r.periods, 0);
  const errors = A.issues.filter((i) => i.severity === 'error');
  const openQ = (data.alloc_queries || []).filter((q) => q.status === 'open');

  return (
    <div>
      <PageHead title="Teacher allocation" sub={`Who teaches what · Session ${meta.session} · Published v${meta.version} on ${fmtDate(meta.published_at)} (effective ${fmtDate(meta.effective_from)})`}
        actions={<>
          <button className="btn" onClick={() => { actions.allocAuto('empty'); notify('Empty cells filled by auto-suggest'); }}><Icon name="wand" size={16} /> Fill empty cells</button>
          <button className="btn" onClick={() => { actions.allocAuto('all'); notify('New draft suggested from scratch'); }}><Icon name="refresh" size={16} /> Re-suggest all</button>
          {A.draft && <button className="btn" onClick={() => { actions.allocDiscard(); notify('Draft discarded'); }}>Discard draft</button>}
          {A.draft && (canPublish
            ? <button className="btn btn-primary" onClick={() => setPublishing(true)}><Icon name="send" size={16} /> Publish v{meta.version + 1}</button>
            : <button className="btn btn-primary" disabled={meta.submitted} onClick={() => { actions.allocSubmit(persona.name); notify('Sent to the principal for approval'); }}><Icon name="send" size={16} /> {meta.submitted ? 'Waiting for principal' : 'Send for approval'}</button>)}
        </>} />

      {A.draft && (
        <div className="card card-b" style={{ marginBottom: 16, borderLeft: '4px solid var(--warn)' }}>
          <div className="row between wrap">
            <div><div className="strong">Draft — {A.changes.length} change{A.changes.length === 1 ? '' : 's'} not published yet</div>
              <div className="small muted">Teachers, timetable, homework and marks rights still follow v{meta.version} until you publish.{meta.submitted && ` Sent for approval by ${meta.submitted_by}.`}</div></div>
            {errors.length > 0 && <Badge tone="red">{errors.length} error{errors.length > 1 ? 's' : ''} to fix</Badge>}
          </div>
          {A.changes.length > 0 && <div className="stack-sm small" style={{ marginTop: 10 }}>{A.changes.slice(0, 6).map((c) => <div key={c.section_id + c.code}><strong>{c.section} {c.code}:</strong> <span className="muted">{c.from}</span> → {c.to}</div>)}{A.changes.length > 6 && <div className="muted">+ {A.changes.length - 6} more</div>}</div>}
        </div>
      )}

      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Periods needed / week" value={demand.toLocaleString('en-IN')} foot={`${data.sections.length} sections · from subject scheme`} icon="clock" />
        <Stat label="Periods allotted" value={allotted.toLocaleString('en-IN')} foot={allotted === demand ? 'Every period has a teacher' : `${demand - allotted} periods without a teacher`} icon="check" tone={allotted === demand ? 'green' : 'red'} />
        <Stat label="Average teacher load" value={`${(allotted / data.teachers.length).toFixed(1)}`} foot={`${data.teachers.length} teachers · periods per week`} icon="gauge" tone="violet" />
        <Stat label="Issues" value={A.issues.length} foot={A.issues.length ? `${errors.length} errors · ${A.issues.length - errors.length} warnings` : 'All checks passed'} icon="alert" tone={errors.length ? 'red' : A.issues.length ? 'amber' : 'green'} />
      </div>

      {openQ.length > 0 && (
        <Card title={`Requests from teachers (${openQ.length})`} icon="inbox" style={{ marginBottom: 16 }}>
          <div className="stack">{openQ.map((q) => (
            <div key={q.id} className="row top between wrap" style={{ gap: 12 }}>
              <div className="row top" style={{ gap: 10 }}><Avatar name={idx.teachers[q.teacher_id]?.full_name} size="sm" /><div><div className="strong small">{idx.teachers[q.teacher_id]?.full_name} <span className="muted">· {ago(q.at)}</span></div><div className="small">{q.text}</div></div></div>
              {canPublish && <div className="row"><button className="btn btn-sm" onClick={() => { actions.answerAllocQuery(q.id, 'answered', 'Discussed — no change this term.'); notify('Reply sent'); }}>Reply: no change</button><button className="btn btn-sm btn-primary" onClick={() => { actions.answerAllocQuery(q.id, 'accepted', 'Accepted — will be in the next version.'); notify('Accepted — make the change in the grid and publish'); }}>Accept</button></div>}
            </div>
          ))}</div>
        </Card>
      )}

      <Tabs value={tab} onChange={setTab} tabs={[['grid', 'Allocation grid'], ['load', 'Teacher load'], ['need', 'Need vs available'], ['ct', 'Class teachers'], ['scheme', 'Subject scheme'], ['log', 'History']]} />
      <div style={{ marginTop: 16 }}>
        {tab === 'grid' && <AllocGrid A={A} onCell={setCell} />}
        {tab === 'load' && <LoadTab A={A} />}
        {tab === 'need' && <NeedTab A={A} />}
        {tab === 'ct' && <ClassTeacherTab A={A} />}
        {tab === 'scheme' && <SchemeTab />}
        {tab === 'log' && <LogTab />}
      </div>
      {cell && <CellModal cell={cell} A={A} onClose={() => setCell(null)} />}
      {publishing && <PublishModal A={A} onClose={() => setPublishing(false)} />}
    </div>
  );
}

const STAGE_TABS = [['pre', 'LKG–UKG'], ['primary', 'Class 1–5'], ['middle', 'Class 6–8'], ['secondary', 'Class 9–10'], ['senior', 'Class 11–12']];

function AllocGrid({ A, onCell }) {
  const { data, idx } = useSchool();
  const [stage, setStage] = useState('middle');
  const secs = data.sections.filter((s) => s.stage === stage);
  const codes = [...new Set(secs.flatMap((s) => Object.keys(data.subject_scheme[schemeKey(s)] || {}).filter((c) => data.subject_scheme[schemeKey(s)][c] > 0)))];
  const issueAt = {};
  A.issues.forEach((i) => { if (i.section_id && i.code) (issueAt[cellKey(i.section_id, i.code)] ||= []).push(i); });
  const changed = new Set(A.changes.map((c) => cellKey(c.section_id, c.code)));
  return (
    <div className="grid alloc-side" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'start' }}>
      <Card pad={false}>
        <div className="card-h row between wrap"><Seg options={STAGE_TABS} value={stage} onChange={setStage} /><span className="xs muted">★ class teacher · number = periods/week · click a cell to change</span></div>
        <div className="table-wrap"><table className="table alloc-table">
          <thead><tr><th>Class</th>{codes.map((c) => <th key={c} className="center">{c}</th>)}<th className="num">Total</th></tr></thead>
          <tbody>{secs.map((s) => {
            const need = data.subject_scheme[schemeKey(s)] || {};
            const tot = A.rows.filter((r) => r.section_id === s.id).reduce((a, r) => a + r.periods, 0);
            return (
              <tr key={s.id}>
                <td className="nowrap"><div className="strong">{s.name}{s.stage === 'senior' && <span className="muted xs"> · {STREAMS[s.section]}</span>}</div><div className="xs muted">★ {shortName(idx.teachers[s.class_teacher_id])}</div></td>
                {codes.map((c) => {
                  if (!need[c]) return <td key={c} className="center muted">—</td>;
                  const list = A.byCell[cellKey(s.id, c)] || [];
                  const iss = issueAt[cellKey(s.id, c)] || [];
                  const err = iss.some((i) => i.severity === 'error');
                  return (
                    <td key={c} className="alloc-cell">
                      <button className={`alloc-btn ${err ? 'err' : iss.length ? 'warn' : ''} ${changed.has(cellKey(s.id, c)) ? 'changed' : ''}`} onClick={() => onCell({ sec: s, code: c })} title={iss.map((i) => i.text).join('\n')}>
                        {list.length ? list.map((r) => <span key={r.teacher_id} className="alloc-line">{r.teacher_id === s.class_teacher_id && '★ '}{shortName(idx.teachers[r.teacher_id]).split(' ')[0]} {shortName(idx.teachers[r.teacher_id]).split(' ')[1]?.[0]}. <b>{r.periods}</b></span>) : <span className="alloc-line" style={{ color: 'var(--danger)' }}>Assign · {need[c]}</span>}
                      </button>
                    </td>
                  );
                })}
                <td className="num strong">{tot}/{slotsPerWeek(s)}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </Card>
      <Card title={`Checks (${A.issues.length})`} icon="shield">
        {A.issues.length ? <div className="stack-sm">{A.issues.slice(0, 14).map((i, k) => (
          <button key={k} className="row top small" style={{ gap: 8, textAlign: 'left', background: 'none', border: 0, padding: 0, cursor: i.code ? 'pointer' : 'default' }} onClick={() => i.code && onCell({ sec: idx.sections[i.section_id], code: i.code })}>
            <Icon name={i.severity === 'error' ? 'alert-circle' : 'alert'} size={16} style={{ color: i.severity === 'error' ? 'var(--danger)' : 'var(--warn)', flex: 'none', marginTop: 2 }} /><span>{i.text}</span>
          </button>
        ))}</div> : <div className="row small" style={{ gap: 8, color: 'var(--success)' }}><Icon name="check" size={18} /> Every period has a qualified teacher, nobody is overloaded and every class teacher teaches their own class.</div>}
        <div className="xs muted" style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 10 }}>Checks run live: missing teacher, periods not matching the scheme, subject/level mismatch, overload, class teacher not teaching the class, one teacher leading two classes.</div>
      </Card>
    </div>
  );
}

function CellModal({ cell: { sec, code }, A, onClose }) {
  const { data, idx, actions, notify } = useSchool();
  const need = data.subject_scheme[schemeKey(sec)]?.[code] || 0;
  const current = A.byCell[cellKey(sec.id, code)] || [];
  const [rows, setRows] = useState(current.length ? current.map((r) => ({ teacher_id: r.teacher_id, periods: r.periods })) : [{ teacher_id: '', periods: need }]);
  const total = rows.reduce((a, r) => a + (Number(r.periods) || 0), 0);
  const subj = data.subjects.find((s) => s.code === code);
  const loadWithout = (tid) => (A.loads[tid] || 0) - (current.find((r) => r.teacher_id === tid)?.periods || 0);
  const groups = [0, 1, 2, 3].map((f) => [f, data.teachers.filter((t) => fit(t, code, sec) === f).sort((a, b) => loadWithout(a.id) / maxLoad(a) - loadWithout(b.id) / maxLoad(b))]);
  const set = (i, patch) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  return (
    <Modal title={`Class ${sec.name} · ${subj?.name}`} onClose={onClose} width={620}
      footer={<><span className={`small ${total === need ? '' : 'strong'}`} style={{ marginRight: 'auto', color: total === need ? 'var(--success)' : 'var(--danger)' }}>{total} of {need} periods allotted</span><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { actions.allocSetCell(sec.id, code, rows); notify('Saved to draft — publish to apply'); onClose(); }}>Save to draft</button></>}>
      <div className="stack">
        <div className="row wrap small" style={{ gap: 8 }}><Badge tone="blue">{need} periods / week</Badge><Badge>{STAGES[sec.stage].label}</Badge><Badge>Class teacher: {shortName(idx.teachers[sec.class_teacher_id])}</Badge></div>
        {rows.map((r, i) => {
          const t = idx.teachers[r.teacher_id];
          const after = t ? loadWithout(t.id) + (Number(r.periods) || 0) : 0;
          return (
            <div key={i} className="card card-b" style={{ background: 'var(--bg)' }}>
              <div className="row wrap" style={{ gap: 10, alignItems: 'flex-end' }}>
                <div className="field grow" style={{ minWidth: 240 }}><label>{rows.length > 1 ? `Teacher ${i + 1}` : 'Teacher'}</label>
                  <select className="select" value={r.teacher_id} onChange={(e) => set(i, { teacher_id: e.target.value })}>
                    <option value="">Select teacher</option>
                    {groups.map(([f, list]) => list.length > 0 && (
                      <optgroup key={f} label={f === 3 ? 'Other teachers (not their subject)' : FIT_LABEL[f]}>
                        {list.map((x) => <option key={x.id} value={x.id}>{shortName(x)} · {x.designation} · {loadWithout(x.id)}/{maxLoad(x)} periods{x.part_time ? ' · part-time' : ''}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ width: 110 }}><label>Periods</label><input className="input tnum" type="number" min="1" max={need} value={r.periods} onChange={(e) => set(i, { periods: Number(e.target.value) })} /></div>
                {rows.length > 1 && <button className="btn btn-sm" onClick={() => setRows(rows.filter((_, k) => k !== i))} aria-label="Remove"><Icon name="x" size={14} /></button>}
              </div>
              {t && (
                <div className="row wrap xs" style={{ gap: 8, marginTop: 8 }}>
                  <Badge tone={['green', 'blue', 'amber', 'red'][fit(t, code, sec)]}>{FIT_LABEL[fit(t, code, sec)]}</Badge>
                  <Badge tone={loadTone(after, maxLoad(t))}>Load after: {after}/{maxLoad(t)}</Badge>
                  <span className="muted">Teaches {t.subject_codes.join(', ')} · {CATEGORIES[t.designation].label}{t.part_time ? ` · comes ${t.days}` : ''}</span>
                </div>
              )}
            </div>
          );
        })}
        <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setRows([...rows, { teacher_id: '', periods: Math.max(1, need - total) }])}><Icon name="split" size={16} /> Split with another teacher</button>
        <div className="xs muted">A split subject (e.g. Physics + Chemistry part of Science) gives each teacher their own periods, homework and marks column; the report card combines them.</div>
      </div>
    </Modal>
  );
}

function PublishModal({ A, onClose }) {
  const { data, persona, actions, notify } = useSchool();
  const [eff, setEff] = useState(tomorrowISO());
  const [ok, setOk] = useState(false);
  const errors = A.issues.filter((i) => i.severity === 'error');
  const teachersHit = new Set();
  A.changes.forEach((c) => [...(rowsByCell(data.allocations)[cellKey(c.section_id, c.code)] || []), ...(A.byCell[cellKey(c.section_id, c.code)] || [])].forEach((r) => teachersHit.add(r.teacher_id)));
  const secHit = [...new Set(A.changes.filter((c) => c.teachersChanged).map((c) => c.section))];
  return (
    <Modal title={`Publish allocation v${(data.alloc_meta?.version || 0) + 1}`} onClose={onClose} width={560}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={errors.length > 0 && !ok} onClick={() => { const ch = actions.allocPublish({ effective_from: eff, by: persona.name }); notify(`Published — timetable rebuilt, ${teachersHit.size} teachers notified`); onClose(); return ch; }}>Publish & notify</button></>}>
      <div className="stack">
        <div className="field"><label>Effective from</label><input type="date" className="input" value={eff} min={todayISO()} onChange={(e) => setEff(e.target.value)} /></div>
        <div className="stack-sm small">
          <div className="row" style={{ gap: 8 }}><Icon name="clip-list" size={16} /> {A.changes.length} change{A.changes.length === 1 ? '' : 's'} compared with v{data.alloc_meta?.version}</div>
          <div className="row" style={{ gap: 8 }}><Icon name="calendar" size={16} /> Timetable is rebuilt with no teacher clashes</div>
          <div className="row" style={{ gap: 8 }}><Icon name="chat" size={16} /> WhatsApp + app to {teachersHit.size} teacher{teachersHit.size === 1 ? '' : 's'} with their new class list</div>
          {secHit.length > 0 && <div className="row" style={{ gap: 8 }}><Icon name="users" size={16} /> Parents of {secHit.join(', ')} told about the new subject teacher</div>}
          <div className="row" style={{ gap: 8 }}><Icon name="lock" size={16} /> Homework, marks entry and lesson plans follow the new allocation from {fmtDate(eff)}. Old records keep the old teacher’s name.</div>
        </div>
        {errors.length > 0 && <div className="card card-b" style={{ background: 'var(--danger-bg)' }}><div className="strong small" style={{ color: 'var(--danger)' }}>{errors.length} error{errors.length > 1 ? 's' : ''} still open</div><div className="xs">{errors.slice(0, 4).map((e) => <div key={e.text}>• {e.text}</div>)}</div><label className="row xs" style={{ gap: 6, marginTop: 8 }}><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> Publish anyway (these periods will show as “No teacher”)</label></div>}
      </div>
    </Modal>
  );
}

function LoadTab({ A }) {
  const { data, idx } = useSchool();
  const [q, setQ] = useState('');
  const [f, setF] = useState('all');
  const ctOf = {}; data.sections.forEach((s) => { ctOf[s.class_teacher_id] = s.name; });
  const byT = {}; A.rows.forEach((r) => { (byT[r.teacher_id] ||= []).push(r); });
  const list = data.teachers.filter((t) => (!q || t.full_name.toLowerCase().includes(q.toLowerCase())) && (f === 'all' || (f === 'over' ? (A.loads[t.id] || 0) > maxLoad(t) : f === 'spare' ? (A.loads[t.id] || 0) < maxLoad(t) * 0.55 : true)));
  return (
    <Card pad={false}>
      <div className="card-h row wrap"><Search value={q} onChange={setQ} placeholder="Search teacher" style={{ flex: 1, maxWidth: 300 }} /><Seg options={[['all', 'All'], ['over', 'Overloaded'], ['spare', 'Spare capacity']]} value={f} onChange={setF} /></div>
      <div className="table-wrap"><table className="table">
        <thead><tr><th>Teacher</th><th>Can teach</th><th>Classes (periods)</th><th style={{ width: 190 }}>Load / week</th><th>Status</th></tr></thead>
        <tbody>{list.map((t) => {
          const l = A.loads[t.id] || 0; const m = maxLoad(t);
          return (
            <tr key={t.id}>
              <td><div className="row" style={{ gap: 10 }}><Avatar name={t.full_name} size="sm" /><div><div className="strong">{t.full_name}</div><div className="xs muted">{t.designation}{t.part_time ? ` · part-time (${t.days})` : ''}{ctOf[t.id] ? ` · ★ Class teacher ${ctOf[t.id]}` : ''}</div></div></div></td>
              <td className="small"><strong>{idx.subjects[t.subject_id]?.name}</strong>{t.subject_codes.length > 1 && <span className="muted"> + {t.subject_codes.slice(1).join(', ')}</span>}</td>
              <td><div className="row wrap" style={{ gap: 4 }}>{(byT[t.id] || []).sort((a, b) => idx.sections[a.section_id].grade - idx.sections[b.section_id].grade).map((r) => <Badge key={r.id} tone={r.section_id && idx.sections[r.section_id].class_teacher_id === t.id ? 'navy' : ''}>{idx.sections[r.section_id].name} {r.subject_code} {r.periods}</Badge>)}{!byT[t.id] && <span className="muted small">No classes</span>}</div></td>
              <td><div className="row small" style={{ gap: 8 }}><div className="grow"><Progress value={(l / m) * 100} color={loadColor(l, m)} /></div><span className="tnum strong">{l}/{m}</span></div></td>
              <td><Badge tone={loadTone(l, m)}>{loadLabel(l, m)}</Badge></td>
            </tr>
          );
        })}</tbody>
      </table></div>
    </Card>
  );
}

function NeedTab({ A }) {
  const { data } = useSchool();
  const rows = supplyDemand(A.rows, A.ctx);
  const demand = rows.reduce((a, r) => a + r.demand, 0);
  const cap = data.teachers.reduce((a, t) => a + maxLoad(t), 0);
  const tight = rows.filter((r) => r.gap > 0);
  return (
    <div className="stack">
      <div className="grid g-3">
        <Stat label="Periods the school needs" value={demand.toLocaleString('en-IN')} foot="All sections, per week" icon="clock" />
        <Stat label="Teaching capacity" value={cap.toLocaleString('en-IN')} foot={`${Math.round((demand / cap) * 100)}% used`} icon="users" tone="violet" />
        <Stat label="Subjects short on main teachers" value={tight.length} foot={tight.length ? tight.map((r) => r.code).join(', ') : 'None'} icon="alert" tone={tight.length ? 'amber' : 'green'} />
      </div>
      <Card pad={false} title="Need vs available by subject" icon="scale">
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Subject</th><th className="num">Sections</th><th className="num">Periods needed</th><th className="num">Main teachers</th><th className="num">Their capacity</th><th>Status</th><th>What the system suggests</th></tr></thead>
          <tbody>{rows.map((r) => {
            const helpers = r.helpers.filter((h) => h.spare > 0).sort((a, b) => b.spare - a.spare);
            const short = Math.max(0, r.gap - helpers.reduce((a, h) => a + h.spare, 0));
            return (
              <tr key={r.code}>
                <td className="strong">{r.name}</td><td className="num">{r.sections}</td><td className="num">{r.demand}</td><td className="num">{r.main.length}</td><td className="num">{r.capacity}</td>
                <td>{r.gap > 0 ? <Badge tone="red">{r.gap} short</Badge> : r.gap > -6 ? <Badge tone="amber">Tight ({-r.gap} spare)</Badge> : <Badge tone="green">{-r.gap} spare</Badge>}</td>
                <td className="small">{r.gap <= 0 ? (r.byOthers ? `${r.byOthers} periods are with second-subject teachers — can move back to main teachers.` : 'Covered by main teachers.')
                  : <>{helpers.length > 0 && <>Use {helpers.slice(0, 2).map((h) => `${shortName(h.t)} (${h.spare} spare)`).join(', ')}. </>}{short > 0 && <strong style={{ color: 'var(--danger)' }}>Hire {Math.ceil(short / 15)} part-time {r.name} teacher{Math.ceil(short / 15) > 1 ? 's' : ''} ({short} periods).</strong>}</>}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </Card>
      <div className="xs muted">Capacity = weekly limit of teachers whose <strong>main</strong> subject it is. Limits: NTT 30, PRT 34, TGT 34, PGT 32, part-time 15 — change per teacher in Teachers & Staff.</div>
    </div>
  );
}

function ClassTeacherTab({ A }) {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const [pending, setPending] = useState(null);
  const [eff, setEff] = useState(todayISO());
  const canEdit = role === 'principal' || role === 'school_admin';
  const ctCount = {}; data.sections.forEach((s) => { ctCount[s.class_teacher_id] = (ctCount[s.class_teacher_id] || 0) + 1; });
  const teachesIn = (sid) => new Set(A.rows.filter((r) => r.section_id === sid).map((r) => r.teacher_id));
  const options = (sid, current) => {
    const inClass = teachesIn(sid);
    const a = data.teachers.filter((t) => inClass.has(t.id));
    const b = data.teachers.filter((t) => !inClass.has(t.id));
    const label = (t) => `${shortName(t)} · ${t.designation}${ctCount[t.id] && t.id !== current ? ` · already CT of ${data.sections.find((s) => s.class_teacher_id === t.id)?.name}` : ''}`;
    return <><optgroup label="Teaches this class">{a.map((t) => <option key={t.id} value={t.id}>{label(t)}</option>)}</optgroup><optgroup label="Other teachers">{b.map((t) => <option key={t.id} value={t.id}>{label(t)}</option>)}</optgroup></>;
  };
  return (
    <>
      <Card pad={false}>
        <div className="card-h small muted">Rule: a class teacher must teach the class, and leads only one section. The co-class teacher takes over automatically during the class teacher’s leave.</div>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Class</th><th>Class teacher</th><th>Co-class teacher</th><th>Since</th><th>Checks</th></tr></thead>
          <tbody>{data.sections.map((s) => {
            const inClass = teachesIn(s.id);
            return (
              <tr key={s.id}>
                <td className="strong nowrap">{s.name} <span className="xs muted">· {(idx.studentsBySection[s.id] || []).length} students</span></td>
                <td>{canEdit ? <select className="select" style={{ minWidth: 220 }} value={s.class_teacher_id} onChange={(e) => setPending({ s, patch: { class_teacher_id: e.target.value } })}>{options(s.id, s.class_teacher_id)}</select> : shortName(idx.teachers[s.class_teacher_id])}</td>
                <td>{canEdit ? <select className="select" style={{ minWidth: 200 }} value={s.co_class_teacher_id || ''} onChange={(e) => setPending({ s, patch: { co_class_teacher_id: e.target.value || null } })}><option value="">None</option>{options(s.id)}</select> : shortName(idx.teachers[s.co_class_teacher_id])}</td>
                <td className="small nowrap">{fmtDate(s.class_teacher_since)}</td>
                <td><div className="row wrap" style={{ gap: 4 }}>{inClass.has(s.class_teacher_id) ? <Badge tone="green">Teaches class</Badge> : <Badge tone="amber">Doesn’t teach class</Badge>}{ctCount[s.class_teacher_id] > 1 && <Badge tone="red">Leads {ctCount[s.class_teacher_id]} classes</Badge>}</div></td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </Card>
      {pending && (
        <Modal title={`Change for Class ${pending.s.name}`} onClose={() => setPending(null)} footer={<><button className="btn" onClick={() => setPending(null)}>Cancel</button><button className="btn btn-primary" onClick={() => { actions.setClassTeacher(pending.s.id, pending.patch, { by: persona.name, effective_from: eff }); notify('Saved — parents and teachers notified'); setPending(null); }}>Confirm</button></>}>
          <div className="stack small">
            {pending.patch.class_teacher_id && <div><strong>{shortName(idx.teachers[pending.s.class_teacher_id])}</strong> → <strong>{shortName(idx.teachers[pending.patch.class_teacher_id])}</strong> as class teacher.</div>}
            {'co_class_teacher_id' in pending.patch && <div>Co-class teacher → <strong>{shortName(idx.teachers[pending.patch.co_class_teacher_id]) }</strong></div>}
            <div className="field"><label>Effective from</label><input type="date" className="input" value={eff} onChange={(e) => setEff(e.target.value)} /></div>
            {pending.patch.class_teacher_id && <div className="muted">From this date attendance marking, student leave approval, report card remarks, PTM and the class parents’ chat move to the new class teacher. Attendance marked before this date keeps the old teacher’s name. Parents of {pending.s.name} get a WhatsApp message.</div>}
          </div>
        </Modal>
      )}
    </>
  );
}

function SchemeTab() {
  const { data, role, actions, notify } = useSchool();
  const canEdit = role === 'principal' || role === 'school_admin';
  return (
    <div className="stack">
      <div className="small muted">Periods per week for each subject. Changing a number updates what every class needs and opens a draft of the allocation.</div>
      <div className="grid g-3">
        {Object.entries(data.subject_scheme).map(([key, subs]) => {
          const slots = key === 'pre' ? 28 : 39;
          const tot = Object.values(subs).reduce((a, n) => a + n, 0);
          const n = data.sections.filter((s) => schemeKey(s) === key).length;
          return (
            <Card key={key} title={SCHEME_LABELS[key]} action={<Badge tone={tot === slots ? 'green' : 'red'}>{tot}/{slots}</Badge>}>
              <div className="stack-sm">
                {Object.entries(subs).map(([code, p]) => (
                  <div key={code} className="row between small">
                    <span>{data.subjects.find((s) => s.code === code)?.name}</span>
                    {canEdit ? <input className="input tnum" style={{ width: 70, height: 30 }} type="number" min="0" max="12" value={p} onChange={(e) => { actions.setScheme(key, code, e.target.value); notify('Scheme changed — draft updated'); }} /> : <strong>{p}</strong>}
                  </div>
                ))}
                <div className="xs muted" style={{ marginTop: 6 }}>{n} section{n > 1 ? 's' : ''} · {tot === slots ? 'fits the week' : tot > slots ? `${tot - slots} periods more than the week has` : `${slots - tot} free periods (library / games)`}</div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function LogTab() {
  const { data } = useSchool();
  return (
    <Card title="Allocation history" icon="history">
      <div className="stack">{(data.alloc_log || []).map((l) => (
        <div key={l.id} className="row top" style={{ gap: 12 }}>
          <IconTile icon={l.version ? 'send' : 'user-cog'} tone={l.version ? 'blue' : 'violet'} size={34} />
          <div><div className="small strong">{l.version ? `Version ${l.version}` : 'Class teacher change'} · {fmtDate(l.at, { day: 'numeric', month: 'short', year: 'numeric' })}</div><div className="small">{l.text}</div><div className="xs muted">By {l.by}</div></div>
        </div>
      ))}</div>
    </Card>
  );
}

/* ───────────── My classes (teacher) ───────────── */
export function MyClasses() {
  const { data, idx, persona, actions, notify } = useSchool();
  const t = persona.teacher;
  const mine = (data.allocations || []).filter((a) => a.teacher_id === t.id).sort((a, b) => idx.sections[a.section_id].grade - idx.sections[b.section_id].grade);
  const load = mine.reduce((a, r) => a + r.periods, 0);
  const ctOf = data.sections.filter((s) => s.class_teacher_id === t.id);
  const coOf = data.sections.filter((s) => s.co_class_teacher_id === t.id);
  const subs = (data.substitutions || []).filter((s) => s.sub_teacher_id === t.id);
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState('');
  const myQ = (data.alloc_queries || []).filter((q) => q.teacher_id === t.id);
  return (
    <div>
      <PageHead title="My classes & subjects" sub={`Allocation v${data.alloc_meta?.version} · effective ${fmtDate(data.alloc_meta?.effective_from)} · set by the principal`} actions={<button className="btn" onClick={() => setAsking(true)}><Icon name="message" size={16} /> Request a change</button>} />
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <Stat label="Periods / week" value={`${load}/${maxLoad(t)}`} foot={loadLabel(load, maxLoad(t))} icon="gauge" tone={loadTone(load, maxLoad(t))} />
        <Stat label="Classes" value={new Set(mine.map((m) => m.section_id)).size} foot={[...new Set(mine.map((m) => m.subject_code))].join(' · ')} icon="layers" />
        <Stat label="Class teacher of" value={ctOf.map((s) => s.name).join(', ') || '—'} foot={coOf.length ? `Co-class teacher of ${coOf.map((s) => s.name).join(', ')}` : 'Attendance, leave, remarks'} icon="star" tone="amber" />
        <Stat label="Substitution duties" value={subs.length} foot="Today" icon="refresh" tone="violet" />
      </div>
      <div className="grid alloc-side" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
        <Card pad={false} title="What I teach" icon="book">
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Class</th><th>Subject</th><th className="num">Periods / week</th><th>Shared with</th><th className="num">Students</th></tr></thead>
            <tbody>{mine.map((r) => {
              const others = (idx.allocByCell[cellKey(r.section_id, r.subject_code)] || []).filter((x) => x.teacher_id !== t.id);
              return (
                <tr key={r.id}><td className="strong">{idx.sections[r.section_id].name}{idx.sections[r.section_id].class_teacher_id === t.id && <span title="Class teacher"> ★</span>}</td><td>{idx.subjects[r.subject_id]?.name}</td><td className="num">{r.periods}</td><td className="small muted">{others.map((o) => `${shortName(idx.teachers[o.teacher_id])} (${o.periods})`).join(', ') || '—'}</td><td className="num">{(idx.studentsBySection[r.section_id] || []).length}</td></tr>
              );
            })}</tbody>
          </table></div>
        </Card>
        <div className="stack">
          <Card title="This allocation controls" icon="lock">
            <div className="stack-sm small">
              {[['book', 'Homework — only these classes & subjects'], ['award', 'Marks entry — only your subject columns'], ['clip-list', 'Lesson plans & syllabus progress'], ['calendar', 'Your timetable (built automatically)'], ['check', ctOf.length ? `Daily attendance & leave for ${ctOf.map((s) => s.name).join(', ')}` : 'Attendance only if you are a class teacher']].map(([ic, x]) => <div key={x} className="row" style={{ gap: 8 }}><IconTile icon={ic} size={28} />{x}</div>)}
            </div>
          </Card>
          {myQ.length > 0 && <Card title="My requests" icon="inbox"><div className="stack-sm">{myQ.map((q) => <div key={q.id} className="small"><div>{q.text}</div><div className="row" style={{ gap: 6, marginTop: 4 }}><Badge tone={q.status === 'open' ? 'amber' : q.status === 'accepted' ? 'green' : 'blue'}>{q.status === 'open' ? 'With principal' : q.status}</Badge>{q.reply && <span className="xs muted">{q.reply}</span>}</div></div>)}</div></Card>}
        </div>
      </div>
      {asking && (
        <Modal title="Request a change in allocation" onClose={() => setAsking(false)} footer={<><button className="btn" onClick={() => setAsking(false)}>Cancel</button><button className="btn btn-primary" disabled={!text} onClick={() => { actions.raiseAllocQuery(t.id, text); notify('Sent to the principal'); setText(''); setAsking(false); }}>Send</button></>}>
          <div className="field"><label>What would you like changed, and why?</label><textarea className="input" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. I would like to continue with 9B Maths next year for board continuity." /></div>
          <div className="xs muted" style={{ marginTop: 8 }}>You can’t change the allocation yourself — the principal reviews requests and publishes a new version.</div>
        </Modal>
      )}
    </div>
  );
}

/* ───────────── Class representatives & elections ───────────── */
const ROLE_OPTIONS = ['Class Representative', 'Vice CR', 'Discipline Monitor', 'Sports Captain', 'Library Monitor', 'Eco Monitor', 'Helper of the week'];

export function ClassRoles() {
  const { data, idx, role, persona } = useSchool();
  const staffWide = role === 'principal' || role === 'school_admin';
  const family = role === 'parent' || role === 'student';
  const secId = family ? persona.child.section_id : role === 'teacher' ? persona.section.id : null;
  if (staffWide) return <SchoolLeadership />;
  const sec = idx.sections[secId];
  const canManage = role === 'teacher' && sec.class_teacher_id === persona.teacher.id;
  return (
    <div>
      <PageHead title={`Class ${sec.name} — student roles`} sub={`Class teacher ${idx.teachers[sec.class_teacher_id]?.full_name} assigns roles · parents are informed on WhatsApp`} />
      <ElectionBlock sec={sec} canManage={canManage} />
      <SectionRoles sec={sec} canManage={canManage} />
    </div>
  );
}

function SectionRoles({ sec, canManage }) {
  const { data, idx, persona, actions, notify } = useSchool();
  const [edit, setEdit] = useState(null);
  const roles = data.student_roles.filter((r) => r.section_id === sec.id && !r.school_level);
  const students = (idx.studentsBySection[sec.id] || []).slice().sort((a, b) => a.roll_no - b.roll_no);
  return (
    <>
      <Card title="Current roles" icon="badge" action={canManage && <button className="btn btn-sm btn-primary" onClick={() => setEdit({ role: 'Discipline Monitor', method: 'Nominated', term: 'Term 1 · 2026-27' })}><Icon name="plus" size={14} /> Add role</button>}>
        {roles.length ? <div className="grid g-3">{roles.map((r) => {
          const s = idx.students[r.student_id];
          return (
            <div key={r.id} className="card card-b" style={{ background: 'var(--bg)' }}>
              <div className="row" style={{ gap: 10 }}><Avatar name={s?.full_name} /><div className="grow"><div className="strong">{s?.full_name}</div><div className="xs muted">Roll {s?.roll_no}</div></div></div>
              <div className="row wrap" style={{ gap: 6, marginTop: 10 }}><Badge tone="navy">{r.role}</Badge><Badge tone={r.method === 'Election' ? 'violet' : r.method === 'Rotation' ? 'teal' : 'blue'}>{r.method}</Badge></div>
              <div className="xs muted" style={{ marginTop: 6 }}>{r.term} · since {fmtDate(r.since)}{r.next_change ? ` · next change ${fmtDate(r.next_change)}` : ''}</div>
              {canManage && <div className="row" style={{ gap: 6, marginTop: 10 }}><button className="btn btn-sm" onClick={() => setEdit({ ...r })}>Change</button><button className="btn btn-sm" onClick={() => { actions.removeStudentRole(r.id); notify('Role removed'); }}>Remove</button></div>}
            </div>
          );
        })}</div> : <Empty>No roles yet.</Empty>}
        <div className="xs muted" style={{ marginTop: 12 }}>What a CR can do in the app: see the class duty list and mark homework copies collected. A CR cannot mark attendance or see other students’ marks.</div>
      </Card>
      {edit && (
        <Modal title={edit.id ? `Change ${edit.role}` : 'Add a student role'} onClose={() => setEdit(null)} footer={<><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" disabled={!edit.student_id} onClick={() => { actions.setStudentRole({ ...edit, section_id: sec.id, by: persona.teacher.id }); notify('Saved — parent informed on WhatsApp'); setEdit(null); }}>Save & inform parent</button></>}>
          <div className="stack">
            <div className="grid g-2">
              <div className="field"><label>Role</label><select className="select" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>{ROLE_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></div>
              <div className="field"><label>How chosen</label><select className="select" value={edit.method} onChange={(e) => setEdit({ ...edit, method: e.target.value })}>{['Nominated', 'Election', 'Rotation'].map((o) => <option key={o}>{o}</option>)}</select></div>
            </div>
            <div className="field"><label>Student</label><select className="select" value={edit.student_id || ''} onChange={(e) => setEdit({ ...edit, student_id: e.target.value })}><option value="">Select student</option>{students.map((s) => <option key={s.id} value={s.id}>{s.roll_no}. {s.full_name}{data.student_roles.some((r) => r.student_id === s.id) ? ' (already has a role)' : ''}</option>)}</select></div>
            <div className="field"><label>Term</label><select className="select" value={edit.term} onChange={(e) => setEdit({ ...edit, term: e.target.value })}>{['Term 1 · 2026-27', 'Term 2 · 2026-27', 'This month', 'This week', '2026-27'].map((o) => <option key={o}>{o}</option>)}</select></div>
          </div>
        </Modal>
      )}
    </>
  );
}

function ElectionBlock({ sec, canManage }) {
  const { data, idx, role, persona, actions, notify } = useSchool();
  const [starting, setStarting] = useState(false);
  const [form, setForm] = useState({ post: 'Class Representative', term: 'Term 2 · 2026-27', closes_on: tomorrowISO(), candidates: [] });
  const list = (data.elections || []).filter((e) => e.section_id === sec.id);
  const voterId = role === 'student' ? persona.student.id : null;
  const students = (idx.studentsBySection[sec.id] || []).slice().sort((a, b) => a.roll_no - b.roll_no);
  return (
    <div className="stack" style={{ marginBottom: 16 }}>
      {list.map((e) => {
        const total = e.candidates.reduce((a, c) => a + c.votes, 0);
        const voted = voterId && e.voters.includes(voterId);
        const lead = [...e.candidates].sort((a, b) => b.votes - a.votes)[0];
        const showCounts = role !== 'student' || voted || e.status === 'closed';
        return (
          <Card key={e.id} title={`Election · ${e.post} (${e.term})`} icon="vote" action={<Badge tone={e.status === 'open' ? 'green' : ''}>{e.status === 'open' ? `Open till ${fmtDate(e.closes_on)}` : 'Closed'}</Badge>}>
            <div className="stack-sm">
              {e.candidates.map((c) => {
                const s = idx.students[c.student_id];
                return (
                  <div key={c.student_id} className="row" style={{ gap: 12 }}>
                    <Avatar name={s.full_name} size="sm" />
                    <div className="grow"><div className="row between small"><strong>{s.full_name}{e.status === 'closed' && e.winner_id === s.id && ' — elected'}</strong>{showCounts && <span className="tnum">{c.votes} vote{c.votes === 1 ? '' : 's'}</span>}</div>{showCounts && <Progress value={total ? (c.votes / total) * 100 : 0} color={c.student_id === lead.student_id ? 'var(--brand)' : undefined} />}</div>
                    {role === 'student' && e.status === 'open' && !voted && <button className="btn btn-sm btn-primary" onClick={() => { actions.vote(e.id, c.student_id, voterId); notify('Vote recorded — it is secret'); }}>Vote</button>}
                  </div>
                );
              })}
              <div className="row between wrap xs muted" style={{ marginTop: 6 }}>
                <span>{e.voters.length + total - e.voters.length} of {e.eligible} students voted · one vote per student · only {sec.name} can vote{voted ? ' · you have voted' : ''}</span>
                {canManage && e.status === 'open' && <button className="btn btn-sm btn-primary" onClick={() => { actions.closeElection(e.id, persona.teacher.id); notify('Result declared — parents informed'); }}>Close & declare result</button>}
              </div>
            </div>
          </Card>
        );
      })}
      {canManage && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setStarting(true)}><Icon name="vote" size={16} /> Start a class election</button>}
      {starting && (
        <Modal title={`New election — Class ${sec.name}`} onClose={() => setStarting(false)} footer={<><button className="btn" onClick={() => setStarting(false)}>Cancel</button><button className="btn btn-primary" disabled={form.candidates.length < 2} onClick={() => { actions.startElection({ ...form, section_id: sec.id, eligible: students.length, created_by: persona.teacher.id }); notify('Election opened — students can vote in their app'); setStarting(false); }}>Open voting</button></>}>
          <div className="stack">
            <div className="grid g-2">
              <div className="field"><label>Post</label><select className="select" value={form.post} onChange={(e) => setForm({ ...form, post: e.target.value })}>{ROLE_OPTIONS.slice(0, 4).map((o) => <option key={o}>{o}</option>)}</select></div>
              <div className="field"><label>Voting closes</label><input type="date" className="input" value={form.closes_on} onChange={(e) => setForm({ ...form, closes_on: e.target.value })} /></div>
            </div>
            <div className="field"><label>Candidates (pick 2–5)</label>
              <div className="grid g-2" style={{ gap: 6, maxHeight: 240, overflow: 'auto' }}>{students.map((s) => <label key={s.id} className="row small" style={{ gap: 8 }}><input type="checkbox" checked={form.candidates.includes(s.id)} onChange={(e) => setForm({ ...form, candidates: e.target.checked ? [...form.candidates, s.id].slice(0, 5) : form.candidates.filter((x) => x !== s.id) })} />{s.roll_no}. {s.full_name}</label>)}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SchoolLeadership() {
  const { data, idx, actions, notify, role } = useSchool();
  const [stage, setStage] = useState('all');
  const school = data.student_roles.filter((r) => r.school_level);
  const perSec = data.sections.filter((s) => stage === 'all' || s.stage === stage);
  const openEl = (data.elections || []).filter((e) => e.status === 'open');
  return (
    <div>
      <PageHead title="Student leadership" sub="Class teachers assign CRs in their class · head boy/girl and house captains need principal approval" />
      <Card title="School-level roles" icon="crown" style={{ marginBottom: 16 }}>
        <div className="grid g-3">{school.map((r) => {
          const s = idx.students[r.student_id];
          return (
            <div key={r.id} className="card card-b row" style={{ gap: 12, background: 'var(--bg)' }}>
              <Avatar name={s.full_name} />
              <div className="grow"><div className="strong small">{s.full_name}</div><div className="xs muted">{r.role} · Class {idx.sections[s.section_id].name} · {r.method}</div></div>
              {r.status === 'pending' ? (role === 'principal' ? <button className="btn btn-sm btn-primary" onClick={() => { actions.approveStudentRole(r.id); notify('Approved — student and parents informed'); }}>Approve</button> : <Badge tone="amber">Awaiting principal</Badge>) : <Badge tone="green">Approved</Badge>}
            </div>
          );
        })}</div>
      </Card>
      {openEl.length > 0 && <div className="card card-b row wrap" style={{ gap: 10, marginBottom: 16 }}><Icon name="vote" size={18} /><span className="small"><strong>{openEl.length} class election{openEl.length > 1 ? 's' : ''} running:</strong> {openEl.map((e) => `${idx.sections[e.section_id].name} (${e.post}, closes ${fmtDate(e.closes_on)})`).join(', ')}</span></div>}
      <Card pad={false} title="Class representatives by class" icon="badge">
        <div className="card-h"><Seg options={[['all', 'All'], ...STAGE_TABS]} value={stage} onChange={setStage} /></div>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Class</th><th>Class teacher</th><th>Roles</th><th>How chosen</th></tr></thead>
          <tbody>{perSec.map((s) => {
            const rs = data.student_roles.filter((r) => r.section_id === s.id && !r.school_level);
            return (
              <tr key={s.id}><td className="strong">{s.name}</td><td className="small">{shortName(idx.teachers[s.class_teacher_id])}</td>
                <td><div className="row wrap" style={{ gap: 4 }}>{rs.map((r) => <Badge key={r.id}>{r.role === 'Class Representative' ? 'CR' : r.role}: {idx.students[r.student_id]?.full_name.split(' ')[0]}</Badge>)}{!rs.length && <span className="muted small">Not set</span>}</div></td>
                <td className="small">{[...new Set(rs.map((r) => r.method))].join(', ') || '—'}</td></tr>
            );
          })}</tbody>
        </table></div>
      </Card>
    </div>
  );
}
