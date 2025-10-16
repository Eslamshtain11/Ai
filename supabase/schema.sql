create extension if not exists "pgcrypto";

-- ملف التعريف الخفيف
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique,
  created_at timestamptz default now()
);

-- مجموعات
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);
create index if not exists groups_user_idx on public.groups(user_id);

-- طلاب
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  name text not null,
  phone text,
  join_date date,
  monthly_fee numeric(12,2) default 0,
  note text,
  created_at timestamptz default now()
);
create index if not exists students_user_idx on public.students(user_id);

-- دفعات
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  date date not null default current_date,
  note text,
  created_at timestamptz default now()
);
create index if not exists payments_user_idx on public.payments(user_id);
create index if not exists payments_date_idx on public.payments(date);

-- مصروفات
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  date date not null default current_date,
  note text,
  created_at timestamptz default now()
);
create index if not exists expenses_user_idx on public.expenses(user_id);
create index if not exists expenses_date_idx on public.expenses(date);

-- إعدادات تذكير
create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminder_days_before int default 3 check(reminder_days_before between 0 and 60),
  reminder_days_after int default 0 check(reminder_days_after between 0 and 60),
  updated_at timestamptz default now()
);

-- تفعيل RLS
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.settings enable row level security;

-- سياسات: المستخدم يرى/يعدّل بياناته فقط
create policy "own profile" on public.profiles for select using (auth.uid() = id);
create policy "own profile upsert" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own groups read" on public.groups for select using (auth.uid() = user_id);
create policy "own groups write" on public.groups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own students read" on public.students for select using (auth.uid() = user_id);
create policy "own students write" on public.students for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own payments read" on public.payments for select using (auth.uid() = user_id);
create policy "own payments write" on public.payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own expenses read" on public.expenses for select using (auth.uid() = user_id);
create policy "own expenses write" on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own settings read" on public.settings for select using (auth.uid() = user_id);
create policy "own settings write" on public.settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- صلاحيات أساسية
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;

-- RPC: ضمان وجود profile بعد التسجيل/الدخول
create or replace function public.ensure_profile(p_name text, p_phone text)
returns void language sql security definer as $$
  insert into public.profiles (id, full_name, phone)
  values (auth.uid(), coalesce(p_name,'بدون اسم'), nullif(p_phone,''))
  on conflict (id) do update set full_name = excluded.full_name,
                                 phone = coalesce(excluded.phone, public.profiles.phone);
$$;
grant execute on function public.ensure_profile(text,text) to anon, authenticated;
