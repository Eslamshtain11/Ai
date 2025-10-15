import {
  BarChart3,
  CreditCard,
  KeySquare,
  LayoutDashboard,
  Layers,
  LogOut,
  Search,
  Wallet
} from 'lucide-react';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAppData } from '../context/AppDataContext';
import { Toaster } from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/payments', label: 'كشف الحساب', icon: CreditCard },
  { to: '/expenses', label: 'المصروفات', icon: Wallet },
  { to: '/analytics', label: 'الإحصاءات', icon: BarChart3 },
  { to: '/students', label: 'بحث الطالب', icon: Search },
  { to: '/groups', label: 'إدارة المجموعات', icon: Layers },
  { to: '/guest-codes', label: 'أكواد الضيوف', icon: KeySquare }
];

export default function Layout({ children }) {
  const { session, signOut } = useAppData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-blue text-brand-light">
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
      <div className="flex flex-col-reverse gap-6 lg:flex-row lg:gap-0">
        <aside
          className={clsx(
            'fixed bottom-0 right-0 top-0 z-40 w-72 transform bg-brand-navy/90 backdrop-blur transition-transform duration-300 lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          )}
        >
          <div className="flex h-full flex-col justify-between py-8">
            <div className="space-y-8 px-6">
              <Link to="/dashboard" className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-widest text-brand-secondary">
                    المحاسب الشخصي
                  </p>
                  <h1 className="text-3xl font-black text-brand-gold">لوحة التحكم</h1>
                </div>
              </Link>
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center justify-between rounded-xl px-4 py-3 text-lg transition-all duration-200',
                          isActive
                            ? 'bg-brand-gold text-brand-blue'
                            : 'text-brand-secondary hover:bg-brand-blue/30 hover:text-brand-light'
                        )
                      }
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span>{item.label}</span>
                      <Icon className="h-5 w-5" />
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            <div className="space-y-3 px-6">
              <div className="rounded-xl border border-brand-secondary/20 bg-brand-blue/30 p-4 text-sm">
                <p className="text-brand-secondary">مرحبًا،</p>
                <p className="text-lg font-semibold text-brand-light">{session?.user?.name}</p>
                <p className="text-brand-secondary">{session?.user?.phone}</p>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-red-400 transition-all hover:bg-red-500/20"
              >
                <span>تسجيل الخروج</span>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-brand-blue px-4 pb-10 pt-6 lg:px-10 lg:pb-12 lg:pt-8">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="ml-auto mb-6 flex items-center gap-2 rounded-xl border border-brand-secondary/40 bg-brand-navy px-4 py-2 text-brand-secondary transition-all hover:text-brand-light lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span>القائمة</span>
          </button>
          <div className="space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
