import { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BarChart3, CircleDollarSign, Home, PiggyBank, Wallet } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/transactions', label: 'Transactions', icon: CircleDollarSign },
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/goals', label: 'Goals', icon: PiggyBank },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 text-white">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Personal Finance Tracker</p>
              <h1 className="text-lg font-semibold">Money, budgets, and goals in one place</h1>
            </div>
          </Link>

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
                        ? 'border-accent/40 bg-accent/15 text-white'
                        : 'border-white/10 bg-slate-950/30 text-slate-300 hover:border-white/20 hover:bg-white/5',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 rounded-3xl border border-white/10 bg-slate-950/40 p-5 shadow-glow backdrop-blur sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}