-- Eénmalig in Supabase: SQL Editor → New query → Run
-- Vercel: zet SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (Settings → API)
-- De app praat alleen via jouw server-API met service role; nooit de service key in de frontend.

create table if not exists public.app_state (
  id text primary key default 'default',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;
-- Geen policies voor anon: alleen de server (service_role) gebruikt deze tabel en bypassed RLS.
