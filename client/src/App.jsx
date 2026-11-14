import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { homeFor, useAuth } from './auth.jsx';
import { Landing, Login, Register } from './pages/Public.jsx';
import Student from './pages/Student.jsx';
import { AdminHome, AdminStudent } from './pages/Admin.jsx';

// Only the matching role gets in; the other role is sent to its own dashboard.
function Guard({ role }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}
// Login / register / landing are hidden from people who are already signed in.
function Public() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? <Navigate to={homeFor(user)} replace /> : <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Public />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<Guard role="student" />}>
        <Route path="/dashboard" element={<Student />} />
      </Route>
      <Route element={<Guard role="admin" />}>
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/students/:id" element={<AdminStudent />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
