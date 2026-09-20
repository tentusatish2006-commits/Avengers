create table if not exists public.notifications (
  id bigserial primary key,
  event_id text unique,
  user_id text,
  role_target text,
  title text not null,
  message text not null,
  notification_type text default 'ALERT',
  severity text default 'MEDIUM',
  link text,
  read_status boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.fcm_tokens (
  id bigserial primary key,
  user_id text,
  role text,
  token text unique not null,
  user_agent text,
  updated_at timestamptz default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_event on public.notifications(event_id);
create index if not exists idx_fcm_tokens_user on public.fcm_tokens(user_id);

alter table public.notifications enable row level security;
alter table public.fcm_tokens enable row level security;

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications for select using (true);
drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications for insert with check (true);
drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications for update using (true);

drop policy if exists "fcm_tokens_select" on public.fcm_tokens;
create policy "fcm_tokens_select" on public.fcm_tokens for select using (true);
drop policy if exists "fcm_tokens_insert" on public.fcm_tokens;
create policy "fcm_tokens_insert" on public.fcm_tokens for insert with check (true);
drop policy if exists "fcm_tokens_update" on public.fcm_tokens;
create policy "fcm_tokens_update" on public.fcm_tokens for update using (true);
