-- Finance Tracker - dashboard + conversation log
-- Jalankan SETELAH schema.sql.
-- Tabel log percakapan, RLS, dan revoke akses anon.

begin;

create table if not exists public.conversation_logs (
  id bigserial primary key,
  chat_id bigint not null,
  message_id bigint,
  direction text not null check (direction in ('in', 'out')),
  kind text,
  text text,
  intent text,
  workflow text,
  execution_id text,
  created_at timestamptz not null default now()
);

create index if not exists conversation_logs_created_idx
  on public.conversation_logs (created_at desc);

create index if not exists conversation_logs_chat_idx
  on public.conversation_logs (chat_id, created_at desc);

alter table public.conversation_logs enable row level security;

alter table public.transactions enable row level security;
alter table public.accounts enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring enable row level security;
alter table public.reminders enable row level security;

revoke all on public.conversation_logs from anon;
revoke all on public.transactions, public.accounts, public.budgets,
  public.recurring, public.reminders from anon;
revoke all on public.v_bulanan_kategori, public.v_harian from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from public;

grant usage on schema public to service_role, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role, authenticated;

commit;
