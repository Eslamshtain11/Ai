-- إعداد الامتدادات المطلوبة
create extension if not exists "pgcrypto";

-- جدول المستخدمين
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- جدول المجموعات
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists groups_user_id_idx on public.groups(user_id);

-- جدول الطلاب
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  name text not null,
  phone text,
  join_date date,
  monthly_fee numeric(12,2) default 0,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists students_user_id_idx on public.students(user_id);
create index if not exists students_group_id_idx on public.students(group_id);

-- جدول الدفعات
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_student_id_idx on public.payments(student_id);
create index if not exists payments_date_idx on public.payments(date);

-- جدول المصروفات
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists expenses_user_id_idx on public.expenses(user_id);
create index if not exists expenses_date_idx on public.expenses(date);

-- جدول الإعدادات العامة
create table if not exists public.settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  reminder_days_before integer default 3 check (reminder_days_before between 0 and 60),
  reminder_days_after integer default 2 check (reminder_days_after between 0 and 60),
  use_group_override boolean default false,
  use_student_override boolean default false,
  updated_at timestamptz not null default now()
);

-- جدول إعدادات المجموعات
create table if not exists public.group_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  reminder_days_before integer,
  reminder_days_after integer,
  updated_at timestamptz not null default now(),
  constraint group_settings_unique unique (user_id, group_id)
);
create index if not exists group_settings_user_idx on public.group_settings(user_id);

-- جدول إعدادات الطلاب
create table if not exists public.student_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  reminder_days_before integer,
  reminder_days_after integer,
  updated_at timestamptz not null default now(),
  constraint student_settings_unique unique (user_id, student_id)
);
create index if not exists student_settings_user_idx on public.student_settings(user_id);

-- تفعيل RLS
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.settings enable row level security;
alter table public.group_settings enable row level security;
alter table public.student_settings enable row level security;

-- سياسات جدول المستخدمين
create policy "Users can read own profile" on public.users
  for select
  using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Service inserts users" on public.users
  for insert
  with check (auth.uid() = id);

-- سياسات بيانات الأعمال (تعتمد على مطابقة user_id مع auth.uid)
create policy "Owner select" on public.groups
  for select
  using (auth.uid() = user_id);
create policy "Owner modify" on public.groups
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owner select" on public.students
  for select
  using (auth.uid() = user_id);
create policy "Owner modify" on public.students
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owner select" on public.payments
  for select
  using (auth.uid() = user_id);
create policy "Owner modify" on public.payments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owner select" on public.expenses
  for select
  using (auth.uid() = user_id);
create policy "Owner modify" on public.expenses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owner select" on public.settings
  for select
  using (auth.uid() = user_id);
create policy "Owner modify" on public.settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owner select" on public.group_settings
  for select
  using (auth.uid() = user_id);
create policy "Owner modify" on public.group_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owner select" on public.student_settings
  for select
  using (auth.uid() = user_id);
create policy "Owner modify" on public.student_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- منح صلاحيات مخفضة للدور العام
revoke all on public.users from anon;
revoke all on public.groups from anon;
revoke all on public.students from anon;
revoke all on public.payments from anon;
revoke all on public.expenses from anon;
revoke all on public.settings from anon;
revoke all on public.group_settings from anon;
revoke all on public.student_settings from anon;

grant usage on schema public to anon;
