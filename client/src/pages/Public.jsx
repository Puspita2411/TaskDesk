import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { homeFor, useAuth } from '../auth.jsx';
import { ThemeButton } from '../components.jsx';

export function Landing() {
  return (
    <>
      <header className="nav-top">
        <Link className="brand" to="/">Task<span>Desk</span></Link>
        <div className="actions">
          <ThemeButton />
          <Link className="btn btn-sm" to="/login">Sign in</Link>
          <Link className="btn btn-sm btn-primary" to="/register">Create account</Link>
        </div>
      </header>
      <section className="hero">
        <div>
          <div style={{ marginBottom: 12 }}><span className="badge badge-student">Academic Task Management</span></div>
          <h1>Know what is due before it is overdue.</h1>
          <p>TaskDesk keeps assignments, lab reports and personal errands in one list, sorted by what needs attention first.</p>
          <div className="actions" style={{ marginTop: 16, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" to="/login">Sign in</Link>
            <Link className="btn btn-sm" to="/register" style={{ alignSelf: 'center' }}>Create account</Link>
          </div>
        </div>
        <div className="panel">
          <table><tbody>
            <tr><td><div className="ttl">Submit PHP session lab report</div><div className="sub">Web Technology</div></td><td><span className="badge c-over">Overdue 2d</span></td></tr>
            <tr><td><div className="ttl">Renew hostel mess payment</div><div className="sub">Personal</div></td><td><span className="badge c-today">Due today</span></td></tr>
            <tr><td><div className="ttl">Normalize library schema to 3NF</div><div className="sub">DBMS</div></td><td><span className="badge c-soon">1 day left</span></td></tr>
          </tbody></table>
        </div>
      </section>
      <section className="features">
        <div><h3>Courses and tags</h3><p>Group tasks under DBMS, DSA or Personal and filter by any of them.</p></div>
        <div><h3>Priority at a glance</h3><p>High, medium and low badges keep urgent work visible.</p></div>
        <div><h3>Faculty oversight</h3><p>Faculty can monitor completion rates and see where each student stands.</p></div>
      </section>
      <footer className="land-foot">TaskDesk, a student project built with MongoDB, Express, React and Node.js.</footer>
    </>
  );
}

function AuthLayout({ children }) {
  return (
    <main className="auth">
      <section className="auth-aside">
        <Link className="brand" to="/">Task<span>Desk</span></Link>
        <div><h2>Every deadline in one place.</h2><p>Assignments, lab reports and personal errands, ordered by what needs your attention first.</p></div>
        <small>Academic Year 2026</small>
      </section>
      <section className="auth-form">{children}</section>
    </main>
  );
}

export function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [v, setV] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { const r = await api('/auth/login', { method: 'POST', body: v }); signIn(r); nav(homeFor(r.user), { replace: true }); }
    catch (x) { setErr(x.message); }
  };
  return (
    <AuthLayout>
      <form onSubmit={submit}>
        <div className="field-header"><h1>Sign in</h1><p className="muted">Students and faculty use the same sign-in page.</p></div>
        {err && <div className="auth-error">{err}</div>}
        <div className="field"><label htmlFor="email">College email</label>
          <input id="email" type="email" required autoComplete="email" placeholder="you@college.edu" value={v.email} onChange={set('email')} /></div>
        <div className="field"><label htmlFor="password">Password</label>
          <input id="password" type="password" required autoComplete="current-password" value={v.password} onChange={set('password')} /></div>
        <div className="demo-bar">
          <span>Demo accounts</span>
          <span>
            <button className="btn btn-xs" type="button" onClick={() => setV({ email: 'arjun@college.edu', password: 'arjun@123' })}>Student</button>{' '}
            <button className="btn btn-xs" type="button" onClick={() => setV({ email: 'rajeshadmin@gmail.com', password: 'rajesh@123' })}>Admin</button>
          </span>
        </div>
        <button className="btn btn-primary btn-block" type="submit">Sign in</button>
        <p className="alt muted">New student? <Link to="/register">Create an account</Link></p>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [v, setV] = useState({ name: '', email: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (v.password !== v.confirm) return setErr('The two passwords do not match.');
    try { const r = await api('/auth/register', { method: 'POST', body: v }); signIn(r); nav(homeFor(r.user), { replace: true }); }
    catch (x) { setErr(x.message); }
  };
  return (
    <AuthLayout>
      <form onSubmit={submit}>
        <div className="field-header"><h1>Create your account</h1><p className="muted">Set up your task list in under a minute.</p></div>
        {err && <div className="auth-error">{err}</div>}
        <div className="field"><label htmlFor="name">Full name</label><input id="name" required autoComplete="name" placeholder="e.g. Arjun Mehta" value={v.name} onChange={set('name')} /></div>
        <div className="field"><label htmlFor="email">College email</label><input id="email" type="email" required autoComplete="email" placeholder="e.g. arjun@college.edu" value={v.email} onChange={set('email')} /></div>
        <div className="row2">
          <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" minLength={8} required autoComplete="new-password" value={v.password} onChange={set('password')} /></div>
          <div className="field"><label htmlFor="confirm">Confirm password</label><input id="confirm" type="password" minLength={8} required autoComplete="new-password" value={v.confirm} onChange={set('confirm')} /></div>
        </div>
        <button className="btn btn-primary btn-block" type="submit">Create account</button>
        <p className="alt muted">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </AuthLayout>
  );
}
