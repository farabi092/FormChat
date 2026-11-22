-- FormChat database schema
-- For a NEW Supabase project: paste into the SQL Editor and run once, top to bottom.

-- 1. PROFILES (one row per user, created automatically on signup)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- 2. FORMS
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled form',
  description text,
  slug text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  status text not null default 'draft' check (status in ('draft', 'published')),
  welcome_message text not null default 'Hi there! I have a few quick questions for you.',
  completion_message text not null default 'Thanks! Your response has been recorded.',
  primary_color text not null default '#4f46e5' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create trigger forms_set_updated_at
  before update on public.forms
  for each row execute function public.set_updated_at();

create index forms_user_id_idx on public.forms (user_id);

-- 3. QUESTIONS
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  type text not null check (type in ('short_text', 'email', 'multiple_choice', 'yes_no')),
  label text not null,
  required boolean not null default true,
  options jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create index questions_form_id_position_idx on public.questions (form_id, position);

-- 4. SUBMISSIONS AND ANSWERS
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  submitted_at timestamptz not null default now()
);

create index submissions_form_id_submitted_at_idx
  on public.submissions (form_id, submitted_at desc);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  value text not null,
  unique (submission_id, question_id)
);

create index answers_submission_id_idx on public.answers (submission_id);
create index answers_question_id_idx on public.answers (question_id);

-- 5. ROW LEVEL SECURITY
alter table public.profiles    enable row level security;
alter table public.forms       enable row level security;
alter table public.questions   enable row level security;
alter table public.submissions enable row level security;
alter table public.answers     enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "forms_select_own" on public.forms
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "forms_insert_own" on public.forms
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "forms_update_own" on public.forms
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "forms_delete_own" on public.forms
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "questions_select_own" on public.questions
  for select to authenticated
  using (exists (
    select 1 from public.forms f
    where f.id = questions.form_id and f.user_id = (select auth.uid())
  ));

create policy "questions_insert_own" on public.questions
  for insert to authenticated
  with check (exists (
    select 1 from public.forms f
    where f.id = questions.form_id and f.user_id = (select auth.uid())
  ));

create policy "questions_update_own" on public.questions
  for update to authenticated
  using (exists (
    select 1 from public.forms f
    where f.id = questions.form_id and f.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.forms f
    where f.id = questions.form_id and f.user_id = (select auth.uid())
  ));

create policy "questions_delete_own" on public.questions
  for delete to authenticated
  using (exists (
    select 1 from public.forms f
    where f.id = questions.form_id and f.user_id = (select auth.uid())
  ));

create policy "submissions_select_own" on public.submissions
  for select to authenticated
  using (exists (
    select 1 from public.forms f
    where f.id = submissions.form_id and f.user_id = (select auth.uid())
  ));

create policy "submissions_delete_own" on public.submissions
  for delete to authenticated
  using (exists (
    select 1 from public.forms f
    where f.id = submissions.form_id and f.user_id = (select auth.uid())
  ));

create policy "answers_select_own" on public.answers
  for select to authenticated
  using (exists (
    select 1
    from public.submissions s
    join public.forms f on f.id = s.form_id
    where s.id = answers.submission_id and f.user_id = (select auth.uid())
  ));

-- 6. TABLE PERMISSIONS
-- Anonymous visitors get nothing. Public submissions go through the server API,
-- which uses the service role.
grant usage on schema public to authenticated, service_role;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.forms, public.questions to authenticated;
grant select, delete on public.submissions, public.answers to authenticated;

grant all on all tables in schema public to service_role;

revoke all on all tables in schema public from anon;

-- 7. A FORM CANNOT BE PUBLISHED WITHOUT QUESTIONS
create or replace function public.prevent_publish_without_questions()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  becoming_published boolean := false;
begin
  if new.status = 'published' then
    if tg_op = 'INSERT' then
      becoming_published := true;
    elsif old.status <> 'published' then
      becoming_published := true;
    end if;
  end if;

  if becoming_published and not exists (
    select 1 from public.questions q where q.form_id = new.id
  ) then
    raise exception 'A form needs at least one question before it can be published.';
  end if;

  return new;
end;
$$;

create trigger forms_require_question_to_publish
  before insert or update on public.forms
  for each row execute function public.prevent_publish_without_questions();