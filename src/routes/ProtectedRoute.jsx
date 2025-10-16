import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-blue text-brand-light">
        <span className="animate-pulse text-lg">جارٍ تحميل الجلسة...</span>
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
