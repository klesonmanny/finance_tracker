import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';

export function RegisterPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Authentication</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Create your account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Registration will be hooked to Supabase Auth after the first data model pass.</p>
        </div>
        <form className="space-y-4">
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500" type="text" placeholder="Full name" />
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500" type="email" placeholder="Email address" />
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500" type="password" placeholder="Password" />
          <button className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-slate-950 transition hover:bg-accentSoft" type="submit">
            Create account
          </button>
        </form>
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-accentSoft hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </AppShell>
  );
}