import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './auth.jsx';

export const STATUS = { pending: 'Pending', inprogress: 'In progress', completed: 'Completed' };
export const fmt = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export const todayStr = () => new Date().toLocaleDateString('en-CA');

// Countdown badge text/colour for a task, worked out from its due date.
export function dueInfo(t) {
  if (t.status === 'completed') return { cls: 'c-done', text: 'Done', days: null };
  const n = new Date(), today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const d = Math.round((new Date(t.dueDate + 'T00:00:00') - today) / 864e5);
  if (d < 0) return { cls: 'c-over', text: `Overdue ${-d}d`, days: d };
  if (d === 0) return { cls: 'c-today', text: 'Due today', days: d };
  if (d <= 3) return { cls: 'c-soon', text: `${d} ${d === 1 ? 'day' : 'days'} left`, days: d };
  return { cls: 'c-ok', text: `${d} days left`, days: d };
}
export const isUrgent = (t) => t.status !== 'completed' && dueInfo(t).days <= 0;

export function ThemeButton() {
  const toggle = () => {
    const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = n;
    try { localStorage.setItem('theme', n); } catch { /* ignore */ }
  };
  return <button className="btn" type="button" onClick={toggle}>Theme</button>;
}

export function Flash({ msg }) {
  if (!msg) return null;
  return <div className={msg.type === 'error' ? 'auth-error' : 'auth-notice'} style={{ marginBottom: 16 }}>{msg.text}</div>;
}

export function Modal({ onClose, children }) {
  const ref = useRef();
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} onClose={onClose}>{children}</dialog>;
}

// Sidebar + content. Each role only ever sees its own single link, so nobody can switch roles.
export function Shell({ admin, children }) {
  const { user, signOut } = useAuth();
  const home = admin ? '/admin' : '/dashboard';
  useEffect(() => { document.body.className = admin ? 'admin-page' : ''; }, [admin]);
  return (
    <div className="app">
      <aside className="side">
        <Link className="brand" to={home}>Task<span>Desk</span></Link>
        <Link className="nav on" to={home}>{admin ? 'Overview' : 'My tasks'}</Link>
        <div className="grow" />
        <div className="who">
          <b>{user.name}</b><br />
          <span className="muted">{admin ? 'Administrator' : 'Student'}</span><br />
          <a href="/login" onClick={(e) => { e.preventDefault(); signOut(); }}>Sign out</a>
        </div>
      </aside>
      <main className={'main' + (admin ? ' admin-overview' : '')}>{children}</main>
    </div>
  );
}
