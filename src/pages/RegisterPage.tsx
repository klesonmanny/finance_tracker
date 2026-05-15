import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { inputClassName, labelClassName, linkClassName, primaryButtonClassName, errorBoxClassName } from '../components/ui/formStyles';
import { supabase } from '../lib/supabase';

export function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
      return;
    }

    setIsSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      navigate('/dashboard');
      return;
    }

    setSuccess('Account created. Check your email for a confirmation link before signing in.');
    setFullName('');
    setEmail('');
    setPassword('');
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Authentication</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Create your account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Create a Supabase account to start tracking your finances.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className={labelClassName}>
            <span>Full name</span>
            <input
              className={inputClassName}
              type="text"
              placeholder="Alex Morgan"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
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
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          {error ? <p className={errorBoxClassName}>{error}</p> : null}
          {success ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>
          ) : null}
          <button className={`w-full ${primaryButtonClassName}`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className={linkClassName}>
            Sign in
          </Link>
        </p>
      </section>
    </AppShell>
  );
}