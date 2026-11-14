import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Flash, Modal, Shell, STATUS, ThemeButton, dueInfo, fmt, isUrgent } from '../components.jsx';

function AddStudent({ onSave, onClose }) {
  const [v, setV] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const submit = async (e) => { e.preventDefault(); try { await onSave(v); } catch (x) { setErr(x.message); } };
  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit}>
        <h2>Add new student</h2>
        {err && <div className="auth-error">{err}</div>}
        <div className="field"><label htmlFor="u-name">Full name</label><input id="u-name" required value={v.name} onChange={set('name')} placeholder="e.g. Ananya Gupta" /></div>
        <div className="field"><label htmlFor="u-email">College email</label><input id="u-email" type="email" required value={v.email} onChange={set('email')} placeholder="e.g. ananya@college.edu" /></div>
        <div className="field"><label htmlFor="u-pass">Temporary password</label><input id="u-pass" minLength={8} required value={v.password} onChange={set('password')} placeholder="At least 8 characters" /></div>
        <div className="dlg-foot"><button className="btn" type="button" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit">Add student</button></div>
      </form>
    </Modal>
  );
}

export function AdminHome() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [flash, setFlash] = useState(null);
  const [adding, setAdding] = useState(false);
  const load = () => api('/admin/overview').then(setD).catch((e) => setFlash({ type: 'error', text: e.message }));
  useEffect(() => { load(); }, []);
  if (!d) return <Shell admin><Flash msg={flash} />{!flash && <p className="muted">Loading…</p>}</Shell>;

  const toggle = async (s) => {
    try { await api(`/admin/students/${s.id}/toggle`, { method: 'PATCH' }); setFlash({ text: 'Student account updated.' }); load(); }
    catch (e) { setFlash({ type: 'error', text: e.message }); }
  };
  const add = async (v) => { await api('/admin/students', { method: 'POST', body: v }); setFlash({ text: v.name + ' was added as a student.' }); setAdding(false); load(); };
  const { stats: s } = d, rate = s.tasks ? Math.round((s.completed / s.tasks) * 100) : 0, max = Math.max(1, ...d.byCategory.map((c) => c.count));

  return (
    <Shell admin>
      <div className="top">
        <div>
          <div className="top-title"><h1>Admin overview</h1><span className="badge badge-admin">Administrator Portal</span></div>
          <p className="top-meta">Usage across all student accounts &bull; {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="actions">
          <ThemeButton />
          <button className="btn btn-primary" type="button" onClick={() => setAdding(true)}>+ Add student</button>
          <div className="user-pill"><span className="avatar">👨‍🏫</span><b>{user.name}</b></div>
        </div>
      </div>

      <Flash msg={flash} />

      <section className="summary-section" aria-label="Deadlines summary">
        <div className="summary-card admin-summary-card">
          <div className="summary-card-main">
            <div className="summary-header-row"><span className="badge badge-admin">Faculty &amp; Staff Oversight</span><span className="summary-live-indicator"><span className="live-dot" /> Live data</span></div>
            <h2>Academic Task &amp; Deadline Summary</h2>
            <p className="summary-text">Pending coursework and urgent deadlines across all student accounts. Open a student to see their full task list.</p>
          </div>
          <div className="summary-stats-cluster">
            <div className="summary-stat-box"><span className="summary-stat-icon">⏳</span><div><div className="summary-stat-val">{s.pending}</div><div className="summary-stat-lbl">Pending Student Tasks</div></div></div>
            <div className="summary-stat-separator" />
            <div className="summary-stat-box urgent"><span className="summary-stat-icon">🚨</span><div><div className="summary-stat-val text-warn">{s.urgent}</div><div className="summary-stat-lbl">Urgent Deadlines</div></div><span className="badge c-over">Action needed</span></div>
          </div>
        </div>
      </section>

      <section className="stats" aria-label="System overview">
        <div className="stat"><div className="stat-head"><span className="stat-label">Registered students</span><span className="stat-icon">👥</span></div><b>{s.students}</b><div className="stat-meta text-success">{s.activeStudents} active accounts</div></div>
        <div className="stat"><div className="stat-head"><span className="stat-label">Tasks created</span><span className="stat-icon">📋</span></div><b>{s.tasks}</b><div className="stat-meta">Across {d.byCategory.length} categories</div></div>
        <div className="stat"><div className="stat-head"><span className="stat-label">Completion rate</span><span className="stat-icon">📈</span></div><b>{rate}%</b><div className="mini-bar"><span style={{ width: rate + '%' }} /></div></div>
        <div className="stat warn"><div className="stat-head"><span className="stat-label">Overdue tasks</span><span className="stat-icon">⚠️</span></div><b>{s.overdue}</b><div className="stat-meta text-warn">Past their due date</div></div>
      </section>

      <div className="grid2">
        <section className="panel">
          <h2>Students</h2>
          <table>
            <thead><tr><th>Name</th><th className="hide-sm">Email</th><th>Tasks</th><th>Done</th><th>Overdue</th><th>Status</th><th /></tr></thead>
            <tbody>
              {d.students.map((st) => { const on = st.status === 'active'; return (
                <tr key={st.id}>
                  <td className="ttl"><Link to={'/admin/students/' + st.id}>{st.name}</Link></td>
                  <td className="hide-sm muted">{st.email}</td>
                  <td className="num">{st.total}</td><td className="num">{st.done}</td>
                  <td className="num">{st.overdue > 0 ? <span className="badge c-over">{st.overdue}</span> : 0}</td>
                  <td><span className={'badge ' + (on ? 'c-done' : 'p-high')}>{on ? 'Active' : 'Suspended'}</span></td>
                  <td><button className="btn btn-sm" type="button" onClick={() => toggle(st)}>{on ? 'Suspend' : 'Restore'}</button></td>
                </tr>); })}
              {!d.students.length && <tr><td colSpan={7} className="muted">No students have registered yet.</td></tr>}
            </tbody>
          </table>
        </section>
        <section className="panel">
          <h2>Tasks by category</h2>
          <div className="bars">
            {d.byCategory.map((c) => (
              <div className="bar" key={c.name}><span>{c.name}</span><i><em style={{ width: (c.count / max) * 100 + '%' }} /></i><span className="num">{c.count}</span></div>))}
          </div>
        </section>
      </div>
      {adding && <AddStudent onSave={add} onClose={() => setAdding(false)} />}
    </Shell>
  );
}

export function AdminStudent() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/admin/students/' + id).then(setD).catch((e) => setErr(e.message)); }, [id]);
  if (err) return <Shell admin><Flash msg={{ type: 'error', text: err }} /><Link className="btn" to="/admin">Back to overview</Link></Shell>;
  if (!d) return <Shell admin><p className="muted">Loading…</p></Shell>;

  const { student: s, tasks } = d, c = (st) => tasks.filter((t) => t.status === st).length;
  return (
    <Shell admin>
      <div className="top">
        <div>
          <div className="top-title"><h1>{s.name}</h1><span className={'badge ' + (s.status === 'active' ? 'c-done' : 'p-high')}>{s.status === 'active' ? 'Active' : 'Suspended'}</span></div>
          <p className="top-meta">{s.email} &bull; Joined {new Date(s.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <div className="actions"><ThemeButton /><Link className="btn" to="/admin">Back to overview</Link></div>
      </div>
      <section className="stats" aria-label="Student summary">
        {[['Total tasks', tasks.length, ''], ['Pending', c('pending'), ''], ['In progress', c('inprogress'), ''], ['Overdue or due today', tasks.filter(isUrgent).length, 'warn'], ['Completed', c('completed'), '']].map(([l, n, w]) => (
          <div className={'stat ' + w} key={l}><div className="stat-head"><span className="stat-label">{l}</span></div><b>{n}</b></div>))}
      </section>
      <section className="panel">
        <table>
          <thead><tr><th>Task</th><th className="hide-sm">Category</th><th>Priority</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            {tasks.map((t) => { const di = dueInfo(t); return (
              <tr key={t._id} className={'task-row' + (t.status === 'completed' ? ' done' : '')}>
                <td><div className="ttl">{t.title}</div></td>
                <td className="hide-sm"><span className="tag">{t.category.name}</span></td>
                <td><span className={'badge p-' + t.priority}>{t.priority[0].toUpperCase() + t.priority.slice(1)}</span></td>
                <td className="num"><div>{fmt(t.dueDate)}</div><span className={'badge ' + di.cls}>{di.text}</span></td>
                <td>{STATUS[t.status]}</td>
              </tr>); })}
          </tbody>
        </table>
        {!tasks.length && <div className="empty" style={{ display: 'block' }}>This student has not created any tasks yet.</div>}
      </section>
    </Shell>
  );
}
