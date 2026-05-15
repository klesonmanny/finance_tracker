import { ReactNode } from 'react';
import { AppShell } from '../layout/AppShell';

export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <AppShell>
      <section className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">{message}</section>
    </AppShell>
  );
}

export function PageError({ message }: { message: string }) {
  return (
    <AppShell>
      <section className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">{message}</section>
    </AppShell>
  );
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Finance</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
      </div>
      {action}
    </div>
  );
}
