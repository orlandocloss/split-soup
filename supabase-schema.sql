-- =============================================
-- SPLIT SOUP - SUPABASE DATABASE SCHEMA
-- =============================================
-- Run: drop tables first, then this schema
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique,
  created_at timestamp with time zone default now()
);

-- EVENTS
create table events (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  location text default '',
  description text default '',
  date timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- FRIENDSHIPS
create table friendships (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references profiles(id) on delete cascade not null,
  addressee_id uuid references profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default now(),
  unique(requester_id, addressee_id)
);

-- EVENT INVITATIONS (friends invited to events)
create table event_invitations (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade not null,
  inviter_id uuid references profiles(id) on delete cascade not null,
  invitee_id uuid references profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default now(),
  unique(event_id, invitee_id)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table profiles enable row level security;
alter table events enable row level security;
alter table friendships enable row level security;
alter table event_invitations enable row level security;

-- =============================================
-- POLICIES
-- =============================================

-- PROFILES
create policy "Users can view all profiles"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- EVENTS
create policy "Users can view own events"
  on events for select using (auth.uid() = creator_id);

create policy "Users can view events they are invited to"
  on events for select using (
    exists (
      select 1 from event_invitations
      where event_invitations.event_id = events.id
      and event_invitations.invitee_id = auth.uid()
    )
  );

create policy "Users can insert own events"
  on events for insert with check (auth.uid() = creator_id);

create policy "Users can update own events"
  on events for update using (auth.uid() = creator_id);

create policy "Users can delete own events"
  on events for delete using (auth.uid() = creator_id);

-- FRIENDSHIPS
create policy "Users can view friendships they are part of"
  on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can send friend requests"
  on friendships for insert
  with check (auth.uid() = requester_id);

create policy "Users can update friendships addressed to them"
  on friendships for update
  using (auth.uid() = addressee_id);

create policy "Users can delete friendships they are part of"
  on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- EVENT INVITATIONS
create policy "Users can view invitations for their events"
  on event_invitations for select
  using (auth.uid() = inviter_id);

create policy "Users can view invitations sent to them"
  on event_invitations for select
  using (auth.uid() = invitee_id);

create policy "Users can create invitations for events they participate in"
  on event_invitations for insert
  with check (
    auth.uid() = inviter_id
    and (
      -- Event creator can invite
      exists (
        select 1 from events
        where events.id = event_id
        and events.creator_id = auth.uid()
      )
      or
      -- Accepted invitees can also invite
      exists (
        select 1 from event_invitations ei
        where ei.event_id = event_id
        and ei.invitee_id = auth.uid()
        and ei.status = 'accepted'
      )
    )
  );

create policy "Users can update invitations sent to them"
  on event_invitations for update
  using (auth.uid() = invitee_id);

create policy "Users can delete invitations for own events"
  on event_invitations for delete
  using (auth.uid() = inviter_id);

-- =============================================
-- REALTIME
-- =============================================

alter publication supabase_realtime add table events;
alter publication supabase_realtime add table friendships;
alter publication supabase_realtime add table event_invitations;

-- =============================================
-- INDEXES
-- =============================================

create index idx_events_creator on events(creator_id);
create index idx_events_date on events(date);
create index idx_profiles_email on profiles(email);
create index idx_profiles_username on profiles(username);
create index idx_friendships_requester on friendships(requester_id);
create index idx_friendships_addressee on friendships(addressee_id);
create index idx_event_invitations_event on event_invitations(event_id);
create index idx_event_invitations_invitee on event_invitations(invitee_id);
