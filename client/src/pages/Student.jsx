import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Flash, Modal, Shell, STATUS, ThemeButton, dueInfo, fmt, isUrgent, todayStr } from '../components.jsx';

function TaskDialog({ task, cats, onSave, onDelete, onClose }) {
  const edit = !!task._id;
  const [v, setV] = useState({
    title: task.title || '', description: task.description || '', category: task.category?._id || cats[0]?._id || '',
    priority: task.priority || 'medium', dueDate: task.dueDate || todayStr(),
  });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const submit = async (e) => { e.preventDefault(); try { await onSave({ ...v, _id: task._id }); } catch (x) { setErr(x.message); } };
  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit}>
        <h2>{edit ? 'Edit task' : 'Add task'}</h2>
        {err && <div className="auth-error">{err}</div>}
        <div className="field"><label htmlFor="t-title">Title</label><input id="t-title" required value={v.title} onChange={set('title')} placeholder="e.g. Complete chapter 4 assignment" /></div>
        <div className="field"><label htmlFor="t-desc">Notes</label><textarea id="t-desc" rows={3} value={v.description} onChange={set('description')} placeholder="Optional notes or rubric details..." /></div>
        <div className="row2">
          <div className="field"><label htmlFor="t-cat">Category</label>
            <select id="t-cat" value={v.category} onChange={set('category')}>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          <div className="field"><label htmlFor="t-pri">Priority</label>
            <select id="t-pri" value={v.priority} onChange={set('priority')}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
        </div>
        <div className="field"><label htmlFor="t-due">Due date</label><input id="t-due" type="date" required value={v.dueDate} onChange={set('dueDate')} /></div>
        <div className="dlg-foot">
          {edit && <button className="btn" type="button" style={{ marginRight: 'auto', color: 'var(--hi)' }}
            onClick={() => window.confirm('Delete this task?') && onDelete(task._id)}>Delete</button>}
          <button className="btn" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit">Save task</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Student() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [cats, setCats] = useState([]);
  const [flash, setFlash] = useState(null);
  const [f, setF] = useState({ q: '', status: '', cat: '', pri: '' });
  const [dlg, setDlg] = useState(null); // null = closed, {} = new task, task object = editing

  useEffect(() => {
    Promise.all([api('/tasks'), api('/categories')]).then(([t, c]) => { setTasks(t); setCats(c); })
      .catch((e) => setFlash({ type: 'error', text: e.message }));
  }, []);
  if (!tasks) return <Shell><Flash msg={flash} />{!flash && <p className="muted">Loading your tasks…</p>}</Shell>;

  const note = (text, type = 'notice') => setFlash({ text, type });
  const save = async (d) => {
    if (d._id) { const t = await api('/tasks/' + d._id, { method: 'PUT', body: d }); setTasks((ts) => ts.map((x) => (x._id === t._id ? t : x))); note('Task updated.'); }
    else { const t = await api('/tasks', { method: 'POST', body: d }); setTasks((ts) => [...ts, t]); note('Task added.'); }
    setDlg(null);
  };
  const remove = async (id) => {
    try { await api('/tasks/' + id, { method: 'DELETE' }); setTasks((ts) => ts.filter((x) => x._id !== id)); note('Task deleted.'); setDlg(null); }
    catch (e) { note(e.message, 'error'); }
  };
  const setStatus = async (t, status) => {
    const prev = tasks;
    setTasks((ts) => ts.map((x) => (x._id === t._id ? { ...x, status } : x)));
    try { await api(`/tasks/${t._id}/status`, { method: 'PATCH', body: { status } }); }
    catch (e) { setTasks(prev); note(e.message, 'error'); }
  };

  const count = (s) => tasks.filter((t) => t.status === s).length;
  const pending = count('pending'), progress = count('inprogress'), done = count('completed'), urgent = tasks.filter(isUrgent).length;
  const catCount = new Set(tasks.map((t) => t.category.name)).size;
  const sorted = [...tasks].sort((a, b) => (a.status === 'completed') - (b.status === 'completed') || a.dueDate.localeCompare(b.dueDate));
  const shown = sorted.filter((t) => t.title.toLowerCase().includes(f.q.toLowerCase())
    && (!f.status || (f.status === 'open' ? t.status !== 'completed' : t.status === f.status))
    && (!f.cat || t.category.name === f.cat) && (!f.pri || t.priority === f.pri));
  const setFilter = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Shell>
      <div className="top">
        <div>
          <div className="top-title"><h1>My tasks</h1><span className="badge badge-student">Student Portal</span></div>
          <p className="top-meta">Active Semester &bull; {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="actions">
          <ThemeButton />
          <button className="btn btn-primary" type="button" onClick={() => setDlg({})}>+ Add task</button>
          <div className="user-pill"><span className="avatar">🎓</span><b>{user.name}</b></div>
        </div>
      </div>

      <Flash msg={flash} />

      <section className="summary-section" aria-label="Deadlines and pending tasks summary">
        <div className="summary-card">
          <div className="summary-card-main">
            <div className="summary-header-row"><span className="badge badge-student">Active Semester Overview</span><span className="summary-live-indicator"><span className="live-dot" /> Live tracking</span></div>
            <h2>Task &amp; Deadline Summary</h2>
            <p className="summary-text">You have upcoming assignments requiring action. Prioritize urgent deadlines to keep your submissions on schedule.</p>
          </div>
          <div className="summary-stats-cluster">
            <div className="summary-stat-box"><span className="summary-stat-icon">⏳</span><div><div className="summary-stat-val">{pending}</div><div className="summary-stat-lbl">Pending Tasks</div></div></div>
            <div className="summary-stat-separator" />
            <div className="summary-stat-box urgent"><span className="summary-stat-icon">🚨</span><div><div className="summary-stat-val text-warn">{urgent}</div><div className="summary-stat-lbl">Urgent Deadlines</div></div><span className="badge c-over">Action needed</span></div>
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Task summary">
        {[['Total tasks', '📝', tasks.length, `Across ${catCount} categories`, ''], ['Pending tasks', '⏳', pending, 'Awaiting completion', ''],
          ['In progress', '⚡', progress, 'Currently working on', ''], ['Urgent deadlines', '🚨', urgent, 'Overdue or due today', 'warn'],
          ['Completed', '✅', done, 'Finished assignments', '']].map(([l, i, n, m, c]) => (
          <div className={'stat ' + c} key={l}>
            <div className="stat-head"><span className="stat-label">{l}</span><span className="stat-icon">{i}</span></div>
            <b>{n}</b><div className={'stat-meta' + (c ? ' text-warn' : l === 'Completed' ? ' text-success' : '')}>{m}</div>
          </div>))}
      </section>

      <section className="panel">
        <div className="filters">
          <input type="search" placeholder="Search by task title" aria-label="Search tasks" value={f.q} onChange={setFilter('q')} />
          <select aria-label="Status" value={f.status} onChange={setFilter('status')}>
            <option value="">All statuses</option><option value="open">Not completed</option><option value="pending">Pending</option><option value="inprogress">In progress</option><option value="completed">Completed</option></select>
          <select aria-label="Category" value={f.cat} onChange={setFilter('cat')}><option value="">All categories</option>{cats.map((c) => <option key={c._id}>{c.name}</option>)}</select>
          <select aria-label="Priority" value={f.pri} onChange={setFilter('pri')}><option value="">Any priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
        </div>
        <table>
          <thead><tr><th>Task</th><th className="hide-sm">Category</th><th>Priority</th><th>Due</th><th>Status</th><th /></tr></thead>
          <tbody>
            {shown.map((t) => { const d = dueInfo(t); return (
              <tr key={t._id} className={'task-row' + (t.status === 'completed' ? ' done' : '')}>
                <td><div className="ttl">{t.title}</div></td>
                <td className="hide-sm"><span className="tag">{t.category.name}</span></td>
                <td><span className={'badge p-' + t.priority}>{t.priority[0].toUpperCase() + t.priority.slice(1)}</span></td>
                <td className="num"><div>{fmt(t.dueDate)}</div><span className={'badge ' + d.cls}>{d.text}</span></td>
                <td><select value={t.status} aria-label={'Status for ' + t.title} onChange={(e) => setStatus(t, e.target.value)}>
                  {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
                <td><button className="btn btn-sm" type="button" onClick={() => setDlg(t)}>Edit</button></td>
              </tr>); })}
          </tbody>
        </table>
        {!shown.length && <div className="empty" style={{ display: 'block' }}>{tasks.length ? 'No tasks match these filters. Clear the search or choose another status.' : 'You have no tasks yet. Choose Add task to create your first one.'}</div>}
        <div className="foot">{shown.length} of {tasks.length} tasks</div>
      </section>

      {dlg && <TaskDialog task={dlg} cats={cats} onSave={save} onDelete={remove} onClose={() => setDlg(null)} />}
    </Shell>
  );
}
