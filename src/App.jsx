import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import StudentSearch from './pages/StudentSearch';
import Groups from './pages/Groups';
import GuestCodes from './pages/GuestCodes';
import GuestView from './pages/GuestView';
import Layout from './components/Layout';
import { useAppData } from './context/AppDataContext';

const protectedRoutes = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/payments', element: <Payments /> },
  { path: '/expenses', element: <Expenses /> },
  { path: '/analytics', element: <Analytics /> },
  { path: '/students', element: <StudentSearch /> },
  { path: '/groups', element: <Groups /> },
  { path: '/guest-codes', element: <GuestCodes /> }
];

export default function App() {
  const location = useLocation();
  const { session } = useAppData();

  const isGuestRoute = useMemo(
    () => location.pathname.startsWith('/guest'),
    [location.pathname]
  );

  if (isGuestRoute) {
    return (
      <Routes>
        <Route path="/guest/:code" element={<GuestView />} />
        <Route path="*" element={<Navigate to="/guest/demo" replace />} />
      </Routes>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        {protectedRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}
