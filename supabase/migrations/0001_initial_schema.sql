create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  transaction_date date not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  period text not null check (period in ('weekly', 'monthly')),
  amount numeric(12, 2) not null check (amount > 0),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0 check (current_amount >= 0),
  target_date date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;

create policy "Profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "Profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Profiles are updatable by owner" on public.profiles
  for update using (auth.uid() = id);

create policy "Categories are viewable by owner" on public.categories
  for select using (auth.uid() = user_id or is_system = true);

create policy "Categories are insertable by owner" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "Categories are updatable by owner" on public.categories
  for update using (auth.uid() = user_id);

create policy "Categories are deletable by owner" on public.categories
  for delete using (auth.uid() = user_id);

create policy "Transactions are viewable by owner" on public.transactions
  for select using (auth.uid() = user_id);

create policy "Transactions are insertable by owner" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "Transactions are updatable by owner" on public.transactions
  for update using (auth.uid() = user_id);

create policy "Transactions are deletable by owner" on public.transactions
  for delete using (auth.uid() = user_id);

create policy "Budgets are viewable by owner" on public.budgets
  for select using (auth.uid() = user_id);

create policy "Budgets are insertable by owner" on public.budgets
  for insert with check (auth.uid() = user_id);

create policy "Budgets are updatable by owner" on public.budgets
  for update using (auth.uid() = user_id);

create policy "Budgets are deletable by owner" on public.budgets
  for delete using (auth.uid() = user_id);

create policy "Savings goals are viewable by owner" on public.savings_goals
  for select using (auth.uid() = user_id);

create policy "Savings goals are insertable by owner" on public.savings_goals
  for insert with check (auth.uid() = user_id);

create policy "Savings goals are updatable by owner" on public.savings_goals
  for update using (auth.uid() = user_id);

create policy "Savings goals are deletable by owner" on public.savings_goals
  for delete using (auth.uid() = user_id);
