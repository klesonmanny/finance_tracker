import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { inputClassName, labelClassName, linkClassName, primaryButtonClassName, errorBoxClassName } from '../components/ui/formStyles';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
      return;
    }

    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    navigate('/dashboard');
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Authentication</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Use your Supabase email and password to access your dashboard.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className={labelClassName}>
            <span>Email address</span>
            <input
              className={inputClassName}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className={labelClassName}>
            <span>Password</span>
            <input
              className={inputClassName}
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className={errorBoxClassName}>{error}</p> : null}
          <button className={`w-full ${primaryButtonClassName}`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="text-sm text-slate-500">
          No account yet?{' '}
          <Link to="/register" className={linkClassName}>
            Create one
          </Link>
        </p>
      </section>
    </AppShell>
  );
}