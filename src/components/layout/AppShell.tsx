import { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, CircleDollarSign, Home, LogOut, PiggyBank, Wallet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { secondaryButtonClassName } from '../ui/formStyles';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/transactions', label: 'Transactions', icon: CircleDollarSign },
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/goals', label: 'Goals', icon: PiggyBank },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    navigate('/login');
  }

  return (
    <div className="min-h-screen text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-glow xl:flex-row xl:items-center xl:justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 text-slate-900">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-accent">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Personal Finance Tracker</p>
              <h1 className="text-lg font-semibold">Money, budgets, and goals in one place</h1>
            </div>
          </Link>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition',
                        isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white',
                      ].join(' ')
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <button type="button" className={`${secondaryButtonClassName} flex items-center justify-center gap-2`} onClick={() => void handleSignOut()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
