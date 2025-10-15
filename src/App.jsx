import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useMemo } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import StudentSearch from './pages/StudentSearch';
import Groups from './pages/Groups';
import StudentsRegister from './pages/StudentsRegister';
import ReminderSettings from './pages/ReminderSettings';
import Layout from './components/Layout';
import { useAppData } from './context/AppDataContext';

function RequireAuth() {
  const { session, loading } = useAppData();
  const isAuthenticated = useMemo(() => Boolean(session?.user), [session?.user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-blue text-brand-light">
        <span className="animate-pulse text-lg">جارٍ تحميل البيانات...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

export default function App() {
  const { session } = useAppData();
  const isAuthenticated = Boolean(session?.user);

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/students" element={<StudentSearch />} />
          <Route path="/students/register" element={<StudentsRegister />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/settings/reminders" element={<ReminderSettings />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/auth'} replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
