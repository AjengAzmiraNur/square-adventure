-- =====================================================================
-- SQUARE ADVENTURE — skema database Supabase (PostgreSQL)
-- Jalankan di Supabase SQL Editor atau dengan `supabase db push`.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. profiles — identitas siswa/guru, terhubung ke auth.users
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null check (char_length(full_name) between 2 and 80),
  student_code  text not null unique check (student_code ~ '^[A-Z0-9-]{4,20}$'),
  class_name    text default '',
  role          text not null default 'student' check (role in ('student', 'teacher')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. lessons — empat level materi
-- ---------------------------------------------------------------------
create table if not exists public.lessons (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  level      int  not null unique check (level between 1 and 4),
  title      text not null,
  topic      text not null,
  xp_reward  int  not null default 50
);

-- ---------------------------------------------------------------------
-- 3. lesson_progress
-- ---------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  lesson_id     uuid not null references public.lessons (id) on delete cascade,
  status        text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  check_score   int,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- ---------------------------------------------------------------------
-- 4. quizzes & 5. quiz_questions
-- ---------------------------------------------------------------------
create table if not exists public.quizzes (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  kind           text not null check (kind in ('lesson_check', 'training', 'final')),
  title          text not null,
  difficulty     text not null,
  lesson_slug    text references public.lessons (slug) on update cascade,
  default_count  int not null default 8
);

create table if not exists public.quiz_questions (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references public.quizzes (id) on delete cascade,
  code         text not null unique,
  position     int  not null default 0,
  type         text not null check (type in ('mcq', 'tf', 'number', 'sequence', 'grid_choice')),
  prompt       text not null,
  visual       jsonb,
  options      jsonb,
  answer       jsonb not null,           -- kunci jawaban: hanya dibaca backend
  hint         text,
  explanation  jsonb not null default '[]'::jsonb,
  skill        text,
  ask_reason   boolean not null default false
);

-- ---------------------------------------------------------------------
-- 6. quiz_attempts
-- ---------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  quiz_id             uuid not null references public.quizzes (id) on delete cascade,
  kind                text not null,
  mode                text not null check (mode in ('instant', 'exam')),
  status              text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  question_ids        jsonb not null default '[]'::jsonb,
  responses           jsonb not null default '{}'::jsonb,
  total               int not null default 0,
  score               int,
  points              numeric(6, 1),
  score_pct           numeric(5, 1),
  stars               int,
  xp_awarded          int not null default 0,
  xp_value            int not null default 0,
  timed               boolean not null default false,
  time_limit_seconds  int,
  started_at          timestamptz not null default now(),
  submitted_at        timestamptz,
  duration_seconds    int
);

-- ---------------------------------------------------------------------
-- 7. games, game_sessions (privat, hanya backend), 8. game_attempts
-- ---------------------------------------------------------------------
create table if not exists public.games (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text not null,
  max_xp       int not null default 40
);

create table if not exists public.game_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  game_id      uuid not null references public.games (id) on delete cascade,
  game_slug    text not null,
  difficulty   text,
  rounds       jsonb not null,           -- berisi kunci jawaban: TIDAK boleh dibaca siswa
  state        jsonb not null,
  status       text not null default 'in_progress' check (status in ('in_progress', 'finished')),
  started_at   timestamptz not null default now(),
  expires_at   timestamptz,
  finished_at  timestamptz
);

create table if not exists public.game_attempts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  game_id           uuid not null references public.games (id) on delete cascade,
  difficulty        text,
  score             int not null,
  max_score         int not null,
  score_pct         numeric(5, 1) not null,
  stars             int not null default 0,
  correct_count     int not null default 0,
  rounds_count      int not null default 0,
  xp_awarded        int not null default 0,
  xp_value          int not null default 0,
  duration_seconds  int,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 9. user_stats
-- ---------------------------------------------------------------------
create table if not exists public.user_stats (
  user_id            uuid primary key references public.profiles (id) on delete cascade,
  total_xp           int not null default 0 check (total_xp >= 0),
  level              int not null default 1,
  lessons_completed  int not null default 0,
  games_played       int not null default 0,
  quizzes_completed  int not null default 0,
  stars              int not null default 0,
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 10. achievements & 11. user_achievements
-- ---------------------------------------------------------------------
create table if not exists public.achievements (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text not null,
  icon         text not null default 'award',
  sort_order   int not null default 0
);

create table if not exists public.user_achievements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  achievement_id  uuid not null references public.achievements (id) on delete cascade,
  earned_at       timestamptz not null default now(),
  unique (user_id, achievement_id)
);

-- ---------------------------------------------------------------------
-- 12. activity_logs
-- ---------------------------------------------------------------------
create table if not exists public.activity_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  activity_type  text not null check (activity_type in
                   ('login', 'lesson', 'lesson_check', 'training', 'final', 'game', 'achievement')),
  title          text not null,
  status         text not null,
  detail         jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Index
-- ---------------------------------------------------------------------
create index if not exists idx_lesson_progress_user on public.lesson_progress (user_id);
create index if not exists idx_quiz_questions_quiz on public.quiz_questions (quiz_id, position);
create index if not exists idx_quiz_attempts_user on public.quiz_attempts (user_id, quiz_id, status);
create index if not exists idx_game_sessions_user on public.game_sessions (user_id);
create index if not exists idx_game_attempts_user on public.game_attempts (user_id, game_id);
create index if not exists idx_user_achievements_user on public.user_achievements (user_id);
create index if not exists idx_activity_logs_user on public.activity_logs (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Fungsi penambahan XP secara atomik (hanya untuk service_role/backend)
-- ---------------------------------------------------------------------
create or replace function public.add_user_xp(p_user_id uuid, p_xp int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
begin
  insert into public.user_stats (user_id, total_xp)
  values (p_user_id, greatest(p_xp, 0))
  on conflict (user_id) do update
    set total_xp = public.user_stats.total_xp + greatest(p_xp, 0),
        updated_at = now()
  returning total_xp into v_total;
  return v_total;
end;
$$;

revoke all on function public.add_user_xp(uuid, int) from public, anon, authenticated;
grant execute on function public.add_user_xp(uuid, int) to service_role;

-- =====================================================================
-- ROW LEVEL SECURITY
-- Siswa (role authenticated) hanya dapat MEMBACA data miliknya sendiri.
-- Semua penulisan (skor, XP, lencana, progres) dilakukan backend FastAPI
-- dengan service_role agar skor tidak dapat dimanipulasi dari frontend.
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.lessons           enable row level security;
alter table public.lesson_progress   enable row level security;
alter table public.quizzes           enable row level security;
alter table public.quiz_questions    enable row level security;
alter table public.quiz_attempts     enable row level security;
alter table public.games             enable row level security;
alter table public.game_sessions     enable row level security;
alter table public.game_attempts     enable row level security;
alter table public.user_stats        enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;
alter table public.activity_logs     enable row level security;

-- Katalog publik untuk pengguna yang sudah login
drop policy if exists "catalog read lessons" on public.lessons;
create policy "catalog read lessons" on public.lessons for select to authenticated using (true);
drop policy if exists "catalog read quizzes" on public.quizzes;
create policy "catalog read quizzes" on public.quizzes for select to authenticated using (true);
drop policy if exists "catalog read games" on public.games;
create policy "catalog read games" on public.games for select to authenticated using (true);
drop policy if exists "catalog read achievements" on public.achievements;
create policy "catalog read achievements" on public.achievements for select to authenticated using (true);

-- Data pribadi: hanya pemilik
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "own lesson progress" on public.lesson_progress;
create policy "own lesson progress" on public.lesson_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "own quiz attempts" on public.quiz_attempts;
create policy "own quiz attempts" on public.quiz_attempts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "own game attempts" on public.game_attempts;
create policy "own game attempts" on public.game_attempts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "own stats" on public.user_stats;
create policy "own stats" on public.user_stats for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "own achievements" on public.user_achievements;
create policy "own achievements" on public.user_achievements for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "own activity" on public.activity_logs;
create policy "own activity" on public.activity_logs for select to authenticated using ((select auth.uid()) = user_id);

-- Hak akses Data API (eksplisit, karena proyek baru tidak selalu memberi grant otomatis).
-- Siswa (authenticated) hanya SELECT; RLS di atas tetap membatasi baris.
grant usage on schema public to authenticated, service_role;
grant select on public.profiles, public.lessons, public.lesson_progress, public.quizzes,
  public.quiz_attempts, public.games, public.game_attempts, public.user_stats,
  public.achievements, public.user_achievements, public.activity_logs to authenticated;
revoke insert, update, delete on all tables in schema public from anon, authenticated;
revoke all on public.quiz_questions, public.game_sessions from anon, authenticated;
grant all on all tables in schema public to service_role;

-- quiz_questions dan game_sessions SENGAJA tidak diberi policy:
-- kunci jawaban hanya dapat dibaca backend (service_role melewati RLS).
