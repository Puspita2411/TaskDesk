import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, Category, Task } from './models.js';

const r = Router();
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
const sign = (u) => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

// ---- middleware: who is calling, and are they allowed? ----
async function auth(req, res, next) {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    const { id } = jwt.verify(t, process.env.JWT_SECRET);
    const u = await User.findById(id);
    if (!u || u.status !== 'active') return bad(res, 'Please sign in again.', 401);
    req.user = u; next();
  } catch { bad(res, 'Please sign in again.', 401); }
}
const only = (role) => (req, res, next) =>
  req.user.role === role ? next() : bad(res, 'You do not have access to this area.', 403);
r.param('id', (req, res, next, id) => (mongoose.isValidObjectId(id) ? next() : bad(res, 'Not found.', 404)));

async function createUser(b, role = 'student') {
  const name = String(b.name || '').trim(), email = String(b.email || '').trim().toLowerCase(), pw = String(b.password || '');
  if (!name || name.length > 100) return { error: 'Enter the full name.' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (pw.length < 8) return { error: 'Password must be at least 8 characters.' };
  if (await User.exists({ email })) return { error: 'An account with this email already exists.', code: 409 };
  return { user: await User.create({ name, email, passwordHash: await bcrypt.hash(pw, 10), role }) };
}

// ---- auth ----
r.post('/auth/register', async (req, res) => {
  const role = req.body.role;
  if (!role || !['admin', 'student'].includes(role)) {
    return bad(res, 'Please select whether you are signing up as an Admin or a Student.');
  }
  const out = await createUser(req.body, role);
  if (out.error) return bad(res, out.error, out.code);
  res.status(201).json({ token: sign(out.user), user: pub(out.user) });
});
r.post('/auth/login', async (req, res) => {
  const u = await User.findOne({ email: String(req.body.email || '').trim().toLowerCase() });
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.passwordHash))) return bad(res, 'Email or password is incorrect.', 401);
  if (u.status !== 'active') return bad(res, 'This account is suspended. Please contact your administrator.', 403);
  res.json({ token: sign(u), user: pub(u) });
});
r.get('/auth/me', auth, (req, res) => res.json(pub(req.user)));
r.get('/categories', auth, async (req, res) => res.json(await Category.find().sort('name')));

// ---- student: own tasks only ----
const clean = (b) => {
  const t = { title: String(b.title || '').trim(), description: String(b.description || '').trim(),
              category: b.category, priority: b.priority, dueDate: b.dueDate };
  const ok = t.title && t.title.length <= 150 && ['high', 'medium', 'low'].includes(t.priority)
          && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate || '') && mongoose.isValidObjectId(t.category);
  return ok ? t : null;
};
const student = [auth, only('student')];
r.get('/tasks', ...student, async (req, res) => res.json(await Task.find({ user: req.user.id }).populate('category', 'name').sort('dueDate')));
r.post('/tasks', ...student, async (req, res) => {
  const t = clean(req.body); if (!t) return bad(res, 'Fill in the title, category and a valid due date.');
  const doc = await Task.create({ ...t, user: req.user.id });
  res.status(201).json(await doc.populate('category', 'name'));
});
r.put('/tasks/:id', ...student, async (req, res) => {
  const t = clean(req.body); if (!t) return bad(res, 'Fill in the title, category and a valid due date.');
  const doc = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, t, { new: true }).populate('category', 'name');
  doc ? res.json(doc) : bad(res, 'Task not found.', 404);
});
r.patch('/tasks/:id/status', ...student, async (req, res) => {
  const status = req.body.status;
  if (!['pending', 'inprogress', 'completed'].includes(status)) return bad(res, 'Invalid status.');
  const doc = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user.id },
    { status, completedAt: status === 'completed' ? new Date() : null }, { new: true });
  doc ? res.json({ ok: true }) : bad(res, 'Task not found.', 404);
});
r.delete('/tasks/:id', ...student, async (req, res) => {
  const out = await Task.deleteOne({ _id: req.params.id, user: req.user.id });
  out.deletedCount ? res.json({ ok: true }) : bad(res, 'Task not found.', 404);
});

// ---- admin / faculty ----
const admin = [auth, only('admin')];
r.get('/admin/overview', ...admin, async (req, res) => {
  const [students, tasks, cats] = await Promise.all([
    User.find({ role: 'student' }).sort('name'), Task.find(), Category.find()]);
  const now = today(), open = (t) => t.status !== 'completed';
  const rows = students.map((s) => {
    const mine = tasks.filter((t) => t.user.equals(s._id));
    return { id: s.id, name: s.name, email: s.email, status: s.status, total: mine.length,
      done: mine.filter((t) => !open(t)).length, overdue: mine.filter((t) => open(t) && t.dueDate < now).length };
  });
  res.json({
    stats: { students: students.length, activeStudents: students.filter((s) => s.status === 'active').length,
      tasks: tasks.length, completed: tasks.filter((t) => !open(t)).length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      overdue: tasks.filter((t) => open(t) && t.dueDate < now).length,
      urgent: tasks.filter((t) => open(t) && t.dueDate <= now).length },
    students: rows,
    byCategory: cats.map((c) => ({ name: c.name, count: tasks.filter((t) => c._id.equals(t.category)).length })).sort((a, b) => b.count - a.count),
  });
});
r.get('/admin/students/:id', ...admin, async (req, res) => {
  const s = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!s) return bad(res, 'Student not found.', 404);
  const tasks = await Task.find({ user: s._id }).populate('category', 'name').sort('dueDate');
  res.json({ student: { ...pub(s), status: s.status, createdAt: s.createdAt }, tasks });
});
r.post('/admin/students', ...admin, async (req, res) => {
  const out = await createUser(req.body, 'student');
  out.error ? bad(res, out.error, out.code) : res.status(201).json(pub(out.user));
});
r.patch('/admin/students/:id/toggle', ...admin, async (req, res) => {
  const s = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!s) return bad(res, 'Student not found.', 404);
  s.status = s.status === 'active' ? 'suspended' : 'active'; await s.save();
  res.json({ status: s.status });
});

export default r;
