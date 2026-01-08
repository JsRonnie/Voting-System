-- Extensions ---------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Profiles ----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'voter' check (role in ('organizer', 'voter')),
  campus_unit text,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, campus_unit, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), new.email),
    coalesce(new.raw_user_meta_data->>'campus_unit', ''),
    coalesce(nullif(lower(new.raw_user_meta_data->>'role'), ''), 'voter')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        campus_unit = excluded.campus_unit,
        role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Elections ----------------------------------------------------------------
create table if not exists public.elections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  share_code integer unique,
  vote_window_start timestamptz,
  vote_window_end timestamptz,
  results_visible boolean not null default false,
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'paused', 'closed')),
  banner_url text,
  deadline timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.assign_share_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated integer;
begin
  if new.share_code is not null then
    return new;
  end if;

  loop
    generated := floor(random() * 900000)::integer + 100000;
    exit when not exists (select 1 from public.elections where share_code = generated);
  end loop;

  new.share_code := generated;
  return new;
end;
$$;

create trigger elections_share_code_trg
before insert on public.elections
for each row
execute function public.assign_share_code();

-- Candidates ---------------------------------------------------------------
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  name text not null,
  slate text,
  vision text,
  number integer,
  photo_url text,
  description text,
  goals text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Votes -------------------------------------------------------------------
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint one_vote_per_election unique (election_id, voter_id)
);

-- Live count (SECURITY DEFINER) -------------------------------------------
create or replace function public.fetch_live_counts(election_id_input uuid)
returns table (
  candidate_id uuid,
  candidate_name text,
  vote_total bigint,
  number integer,
  photo_url text,
  goals text,
  vision text
)
language sql
security definer
set search_path = public
as $$
  select c.id as candidate_id,
         c.name as candidate_name,
         count(v.id) as vote_total,
         c.number,
         c.photo_url,
         coalesce(c.goals, '') as goals,
         coalesce(c.vision, '') as vision
  from public.candidates c
  left join public.votes v on v.candidate_id = c.id
  join public.elections e on e.id = c.election_id
  where c.election_id = election_id_input
    and e.owner_id = auth.uid()
  group by c.id, c.name
  order by vote_total desc;
$$;

grant execute on function public.fetch_live_counts(uuid) to authenticated;

-- Published leaderboard (SECURITY DEFINER) ---------------------------------
create or replace function public.fetch_published_results(election_id_input uuid)
returns table (
  candidate_id uuid,
  candidate_name text,
  vote_total bigint,
  vision text,
  goals text,
  number integer,
  photo_url text
)
language sql
security definer
set search_path = public
as $$
  select c.id as candidate_id,
         c.name as candidate_name,
         count(v.id) as vote_total,
         c.vision,
         c.goals,
         c.number,
         c.photo_url
  from public.candidates c
  left join public.votes v on v.candidate_id = c.id
  join public.elections e on e.id = c.election_id
  where c.election_id = election_id_input
    and e.results_visible is true
  group by c.id, c.name, c.vision
  order by vote_total desc;
$$;

grant execute on function public.fetch_published_results(uuid) to authenticated;

-- Row Level Security ------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.elections enable row level security;
alter table public.candidates enable row level security;
alter table public.votes enable row level security;

create policy "read-own-profile" on public.profiles
  for select using (auth.uid() = id);

create policy "create-own-profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "update-own-profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "public-elections-readable" on public.elections
  for select using (true);

create policy "organizer-owns-election" on public.elections
  for insert with check (auth.uid() = owner_id);

create policy "organizer-updates-election" on public.elections
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "organizer-deletes-election" on public.elections
  for delete using (auth.uid() = owner_id);

create policy "public-candidates-readable" on public.candidates
  for select using (true);

create policy "organizer-manages-candidates" on public.candidates
  using (auth.uid() = (select owner_id from public.elections where id = election_id))
  with check (auth.uid() = (select owner_id from public.elections where id = election_id));

create policy "voter-cast-ballot" on public.votes
  for insert with check (auth.uid() = voter_id);

create policy "view-own-votes" on public.votes
  for select using (auth.uid() = voter_id);

-- Helper indexes ----------------------------------------------------------
create index if not exists votes_election_idx on public.votes (election_id);
create index if not exists votes_voter_idx on public.votes (voter_id);
create index if not exists candidates_election_idx on public.candidates (election_id);
create index if not exists elections_visibility_idx on public.elections (visibility);
create index if not exists elections_status_idx on public.elections (status);
