import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, BarChart3, Users, CreditCard, Wallet, Settings2, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../services/supabaseClient.js';

const navItems = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/students', label: 'الطلاب', icon: Users },
  { to: '/payments', label: 'الدفعات', icon: CreditCard },
  { to: '/expenses', label: 'المصروفات', icon: Wallet },
  { to: '/analytics', label: 'التحليلات', icon: BarChart3 },
  { to: '/settings', label: 'الإعدادات', icon: Settings2 }
];

export default function Layout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-brand-blue text-brand-light">
      <header className="border-b border-brand-secondary/30 bg-brand-navy/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-secondary/30 bg-brand-blue/80 text-brand-light transition hover:border-brand-gold hover:text-brand-gold lg:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-brand-gold">دفاتر المعلم</h1>
              <p className="text-sm text-brand-secondary">متابعة الدخل والمصروفات بسهولة</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-full border border-brand-secondary/30 bg-brand-blue/70 px-4 py-2 text-sm font-bold text-brand-light transition hover:border-brand-gold hover:text-brand-gold"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <nav
          className={`flex flex-col gap-2 rounded-2xl border border-brand-secondary/20 bg-brand-navy/60 p-4 shadow-soft transition-all lg:sticky lg:top-6 lg:w-64 lg:self-start ${
            menuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 overflow-hidden opacity-0 lg:max-h-none lg:opacity-100'
          }`}
        >
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition hover:bg-brand-blue/60 hover:text-brand-gold ${
                  isActive ? 'bg-brand-blue/80 text-brand-gold' : 'text-brand-light'
                }`
              }
              onClick={() => setMenuOpen(false)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <footer className="border-t border-brand-secondary/20 bg-brand-navy/60 py-4 text-center text-xs text-brand-secondary">
        صنع بالحب لمعلمي الدروس الخصوصية © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
