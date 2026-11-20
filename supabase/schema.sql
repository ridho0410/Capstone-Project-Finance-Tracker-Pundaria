-- Finance Tracker - Supabase schema
-- Generated from the live project schema (18 Nov 2026).
-- Run this in Supabase SQL Editor as the postgres user.

begin;
set search_path = public;
set check_function_bodies = off;

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Sequences
create sequence if not exists public."recurring_id_seq";
create sequence if not exists public."reminders_id_seq";
create sequence if not exists public."trx_in_seq";
create sequence if not exists public."trx_out_seq";
create sequence if not exists public."trx_tf_seq";

-- Tables
create table if not exists public."accounts" (
  "id" text not null,
  "name" text not null,
  "kind" text default 'bank'::text not null,
  "opening_balance" numeric(14,2) default 0 not null,
  "is_default" boolean default false not null,
  "active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."budgets" (
  "category" text not null,
  "monthly_limit" numeric(14,2) not null,
  "active" boolean default true not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."recurring" (
  "id" bigint default nextval('recurring_id_seq'::regclass) not null,
  "name" text not null,
  "kind" text not null,
  "category" text not null,
  "amount" numeric(14,2) not null,
  "account_id" text default 'utama'::text not null,
  "note" text default ''::text not null,
  "day_of_month" integer not null,
  "active" boolean default true not null,
  "last_run" date,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."reminders" (
  "id" bigint default nextval('reminders_id_seq'::regclass) not null,
  "teks" text not null,
  "pola" text default 'sekali'::text not null,
  "jam" time without time zone,
  "next_run_at" timestamp with time zone not null,
  "aktif" boolean default true not null,
  "terkirim_terakhir" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."transactions" (
  "id" text not null,
  "occurred_at" date not null,
  "kind" text not null,
  "category" text not null,
  "amount" numeric(14,2) not null,
  "note" text default ''::text not null,
  "source" text default 'telegram'::text not null,
  "telegram_message_id" bigint,
  "created_at" timestamp with time zone default now() not null,
  "account_id" text default 'utama'::text not null,
  "to_account_id" text,
  "deleted_at" timestamp with time zone
);

-- Constraints
alter table public.accounts add constraint "accounts_pkey" PRIMARY KEY (id);
alter table public.budgets add constraint "budgets_monthly_limit_check" CHECK ((monthly_limit > (0)::numeric));
alter table public.budgets add constraint "budgets_pkey" PRIMARY KEY (category);
alter table public.recurring add constraint "recurring_amount_check" CHECK ((amount > (0)::numeric));
alter table public.recurring add constraint "recurring_day_of_month_check" CHECK (((day_of_month >= 1) AND (day_of_month <= 28)));
alter table public.recurring add constraint "recurring_kind_check" CHECK ((kind = ANY (ARRAY['Pemasukan'::text, 'Pengeluaran'::text])));
alter table public.recurring add constraint "recurring_pkey" PRIMARY KEY (id);
alter table public.reminders add constraint "reminders_pkey" PRIMARY KEY (id);
alter table public.transactions add constraint "transactions_amount_check" CHECK ((amount > (0)::numeric));
alter table public.transactions add constraint "transactions_kind_check" CHECK ((kind = ANY (ARRAY['Pemasukan'::text, 'Pengeluaran'::text, 'Transfer'::text])));
alter table public.transactions add constraint "transactions_pkey" PRIMARY KEY (id);
alter table public.transactions add constraint "transactions_telegram_message_id_key" UNIQUE (telegram_message_id);
alter table public.transactions add constraint "transactions_transfer_check" CHECK ((((kind = 'Transfer'::text) AND (to_account_id IS NOT NULL) AND (to_account_id <> account_id)) OR ((kind <> 'Transfer'::text) AND (to_account_id IS NULL))));

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS accounts_one_default_idx ON public.accounts USING btree (is_default) WHERE is_default;
CREATE INDEX IF NOT EXISTS reminders_jatuh_tempo ON public.reminders USING btree (next_run_at) WHERE aktif;
CREATE INDEX IF NOT EXISTS transactions_account_idx ON public.transactions USING btree (account_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS transactions_alive_idx ON public.transactions USING btree (occurred_at DESC) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON public.transactions USING btree (category, occurred_at DESC);
CREATE INDEX IF NOT EXISTS transactions_kind_idx ON public.transactions USING btree (kind, occurred_at DESC);
CREATE INDEX IF NOT EXISTS transactions_occurred_idx ON public.transactions USING btree (occurred_at DESC);

-- Functions
CREATE OR REPLACE FUNCTION public.anggaran_hapus(p_nama text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare v int;
begin
  delete from public.budgets where lower(category) = lower(btrim(coalesce(p_nama, '')));
  get diagnostics v = row_count;
  if v = 0 then return 'Tidak ada anggaran untuk ' || coalesce(p_nama, '') || '.'; end if;
  return 'Anggaran ' || p_nama || ' dihapus.';
end $function$;

CREATE OR REPLACE FUNCTION public.anggaran_set(p_kategori text, p_limit numeric)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare v_nama text := btrim(coalesce(p_kategori, ''));
begin
  if v_nama = '' then return 'Nama kategori kosong. Contoh: /anggaran makanan 3000000'; end if;
  if p_limit is null or p_limit < 1 then return 'Batas harus lebih dari 0.'; end if;

  update public.budgets
     set monthly_limit = p_limit, active = true, updated_at = now()
   where lower(category) = lower(v_nama);

  if not found then
    insert into public.budgets (category, monthly_limit, active)
    values (initcap(v_nama), p_limit, true);
  end if;

  return 'Anggaran ' || initcap(v_nama) || ' diset ' || public.rupiah(p_limit) || ' per bulan.';
end $function$;

CREATE OR REPLACE FUNCTION public.anggaran_text()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  with awal as (
    select date_trunc('month', current_date)::date as mulai,
           (date_trunc('month', current_date) + interval '1 month - 1 day')::date as selesai
  ),
  pakai as (
    select category, sum(amount) as total
    from public.transactions
    where kind = 'Pengeluaran' and deleted_at is null
      and occurred_at between (select mulai from awal) and (select selesai from awal)
    group by category
  )
  select coalesce(string_agg(line, E'\n' order by category), 'Belum ada anggaran.')
  from (
    select b.category,
           b.category || ': ' || public.rupiah(coalesce(p.total, 0)) || ' / ' || public.rupiah(b.monthly_limit) ||
           ' (' || round(100 * coalesce(p.total, 0) / b.monthly_limit) || '%)' ||
           case when b.monthly_limit - coalesce(p.total, 0) >= 0
                then ' — sisa ' || public.rupiah(b.monthly_limit - coalesce(p.total, 0))
                else ' — lebih ' || public.rupiah(coalesce(p.total, 0) - b.monthly_limit)
           end
           as line
    from public.budgets b
    left join pakai p on p.category = b.category
    where b.active
  ) x;
$function$;

CREATE OR REPLACE FUNCTION public.cari_akun(p text)
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select id
  from public.accounts
  where active
    and (lower(id) = lower(trim(p)) or lower(name) = lower(trim(p)))
  order by (lower(id) = lower(trim(p))) desc
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.catat_transaksi(p_occurred date, p_kind text, p_category text, p_amount numeric, p_note text, p_message_id bigint DEFAULT NULL::bigint, p_account text DEFAULT NULL::text, p_ingatkan_hari integer DEFAULT NULL::integer, p_ingatkan_nama text DEFAULT NULL::text)
 RETURNS transactions
 LANGUAGE plpgsql
AS $function$
declare
  hasil public.transactions;
  v_akun text;
  v_nama text;
begin
  v_akun := coalesce(
    public.cari_akun(p_account),
    nullif(trim(p_account), ''),
    (select id from public.accounts where is_default and active limit 1),
    'utama'
  );
  if not exists (select 1 from public.accounts where id = v_akun and active) then
    raise exception 'dompet % tidak dikenal', p_account;
  end if;

  if p_message_id is not null then
    select * into hasil from public.transactions where telegram_message_id = p_message_id;
    if found then
      return hasil;
    end if;
  end if;

  insert into public.transactions (id, occurred_at, kind, category, amount, note, account_id, telegram_message_id)
  values (public.next_trx_id(p_kind), p_occurred, p_kind, p_category, p_amount, coalesce(p_note, ''), v_akun, p_message_id)
  returning * into hasil;

  if p_ingatkan_hari is not null and p_ingatkan_hari between 1 and 28 then
    v_nama := coalesce(nullif(trim(p_ingatkan_nama), ''), p_category);

    update public.recurring
       set kind = p_kind,
           category = p_category,
           amount = p_amount,
           account_id = v_akun,
           day_of_month = p_ingatkan_hari,
           active = true
     where lower(name) = lower(v_nama);

    if not found then
      insert into public.recurring (name, kind, category, amount, account_id, day_of_month, active)
      values (v_nama, p_kind, p_category, p_amount, v_akun, p_ingatkan_hari, true);
    end if;
  end if;

  return hasil;
end $function$;

CREATE OR REPLACE FUNCTION public.hapus_cari(p_teks text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
  v_teks text := lower(btrim(coalesce(p_teks, '')));
  r record;
  n int := 0;
  v_id text := null;
  hasil text := '';
begin
  if v_teks = '' then
    return 'Sebutkan transaksi yang mau dihapus. Contoh: /hapus beli kecap';
  end if;

  for r in
    select id, note, amount
      from public.transactions
     where deleted_at is null
       and (lower(coalesce(note, '')) like '%' || v_teks || '%'
            or lower(category) like '%' || v_teks || '%')
     order by created_at desc
     limit 6
  loop
    n := n + 1;
    v_id := r.id;
    hasil := hasil || E'\n• ' || r.id || ' ' || coalesce(r.note, '') || ' ' || public.rupiah(r.amount);
  end loop;

  if n = 0 then
    return 'Tidak menemukan transaksi dengan kata "' || p_teks || '".';
  end if;
  if n > 1 then
    return 'Ada beberapa transaksi mirip:' || hasil || E'\n\nSebutkan nominalnya, contoh: /hapus ' || p_teks || ' 5000';
  end if;

  perform public.hapus_transaksi(v_id);
  return 'Transaksi ' || v_id || ' dihapus.';
end $function$;

CREATE OR REPLACE FUNCTION public.hapus_transaksi(p_id text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare t public.transactions;
begin
  update public.transactions
     set deleted_at = now()
   where deleted_at is null and upper(id) = upper(trim(p_id))
  returning * into t;

  if not found then
    return 'Transaksi ' || coalesce(p_id, '-') || ' tidak ditemukan atau sudah dihapus.';
  end if;

  return 'Dihapus ' || t.id || E'\n' || t.kind || ' ' || public.rupiah(t.amount) || E'\n' || t.note;
end $function$;

CREATE OR REPLACE FUNCTION public.ingatkan_ambil()
 RETURNS TABLE(id bigint, teks text, pola text)
 LANGUAGE plpgsql
AS $function$
declare r record;
begin
  for r in
    update public.reminders x
       set terkirim_terakhir = now(),
           next_run_at = case
             when x.pola = 'harian'
               then ((((now() at time zone 'Asia/Jakarta')::date + 1) + x.jam) at time zone 'Asia/Jakarta')
             else x.next_run_at
           end,
           aktif = case when x.pola = 'harian' then true else false end
     where x.id in (
       select y.id from public.reminders y
        where y.aktif and y.next_run_at <= now()
        order by y.next_run_at
          for update skip locked
     )
    returning x.id, x.teks, x.pola
  loop
    id := r.id; teks := r.teks; pola := r.pola;
    return next;
  end loop;
end $function$;

CREATE OR REPLACE FUNCTION public.ingatkan_daftar()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare hasil text := ''; r record; n int := 0;
begin
  for r in
    select * from public.reminders where aktif order by next_run_at
  loop
    n := n + 1;
    hasil := hasil || E'\n• #' || r.id || ' ' || r.teks || ' — ' ||
      to_char(r.next_run_at at time zone 'Asia/Jakarta', 'DD Mon HH24:MI') || ' WIB' ||
      case when r.pola = 'harian' then ' (harian)' else '' end;
  end loop;
  if n = 0 then return 'Belum ada pengingat. Contoh: /ingatkan harian 06:00 minum obat'; end if;
  return 'Pengingat aktif (' || n || '):' || hasil || E'\n\nHapus: /ingatkan hapus <id>';
end $function$;

CREATE OR REPLACE FUNCTION public.ingatkan_hapus(p_id bigint)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare v int;
begin
  update public.reminders set aktif = false where id = p_id and aktif;
  get diagnostics v = row_count;
  if v = 0 then return 'Tidak ada pengingat aktif dengan id ' || p_id || '.'; end if;
  return 'Pengingat #' || p_id || ' dihentikan.';
end $function$;

CREATE OR REPLACE FUNCTION public.ingatkan_tambah(p_teks text, p_pola text DEFAULT 'sekali'::text, p_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_jam time without time zone DEFAULT NULL::time without time zone)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
  v_teks text := btrim(coalesce(p_teks, ''));
  v_pola text := lower(btrim(coalesce(p_pola, 'sekali')));
  v_next timestamptz;
begin
  if v_teks = '' then
    return 'Teks pengingat kosong. Contoh: /ingatkan harian 06:00 minum obat';
  end if;
  if v_pola not in ('sekali', 'harian') then
    return 'Pola harus "sekali" atau "harian".';
  end if;

  if v_pola = 'sekali' then
    if p_at is null then
      return 'Waktu pengingat tidak valid.';
    end if;
    if p_at <= now() then
      return 'Waktu pengingat sudah lewat.';
    end if;
    v_next := p_at;
  else
    if p_jam is null then
      return 'Jam pengingat tidak valid.';
    end if;
    v_next := (((now() at time zone 'Asia/Jakarta')::date
                + case when (now() at time zone 'Asia/Jakarta')::time >= p_jam then 1 else 0 end)
               + p_jam) at time zone 'Asia/Jakarta';
  end if;

  insert into public.reminders (teks, pola, jam, next_run_at, aktif)
  values (v_teks, v_pola, case when v_pola = 'harian' then p_jam else p_at::time end, v_next, true);

  return 'Pengingat disimpan: ' || v_teks || E'\nDikirim ' ||
    to_char(v_next at time zone 'Asia/Jakarta', 'DD Mon YYYY HH24:MI') || ' WIB' ||
    case when v_pola = 'harian' then ' (setiap hari)' else '' end;
end $function$;

CREATE OR REPLACE FUNCTION public.jalankan_recurring()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare r record; v_id text; n int := 0; hasil text := '';
begin
  for r in
    select * from public.recurring
    where active
      and day_of_month = extract(day from current_date)::int
      and (last_run is null or last_run < current_date)
  loop
    insert into public.transactions (id, occurred_at, kind, category, amount, note, account_id)
    values (public.next_trx_id(r.kind), current_date, r.kind, r.category, r.amount, '[rutin] ' || r.name, r.account_id)
    returning id into v_id;

    update public.recurring set last_run = current_date where id = r.id;
    n := n + 1;
    hasil := hasil || E'\n• ' || v_id || ' ' || r.name || ' ' || public.rupiah(r.amount);
  end loop;

  if n = 0 then return 'Tidak ada transaksi rutin hari ini.'; end if;
  return 'Transaksi rutin hari ini: ' || n || hasil;
end $function$;

CREATE OR REPLACE FUNCTION public.next_trx_id(p_kind text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
begin
  if p_kind = 'Pemasukan' then
    return 'IN-' || lpad(nextval('public.trx_in_seq')::text, 4, '0');
  elsif p_kind = 'Pengeluaran' then
    return 'OUT-' || lpad(nextval('public.trx_out_seq')::text, 4, '0');
  elsif p_kind = 'Transfer' then
    return 'TR-' || lpad(nextval('public.trx_tf_seq')::text, 4, '0');
  end if;
  raise exception 'kind tidak dikenal: %', p_kind;
end $function$;

CREATE OR REPLACE FUNCTION public.pindah_dana(p_amount numeric, p_from text, p_to text, p_note text DEFAULT ''::text, p_message_id bigint DEFAULT NULL::bigint)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare v_from text; v_to text; v_id text; n1 text; n2 text;
begin
  if p_amount is null or p_amount <= 0 then
    return 'Nominal transfer harus lebih dari 0.';
  end if;
  v_from := public.cari_akun(p_from);
  v_to   := public.cari_akun(p_to);
  if v_from is null then return 'Dompet asal "' || coalesce(p_from,'') || '" tidak ditemukan.'; end if;
  if v_to is null then return 'Dompet tujuan "' || coalesce(p_to,'') || '" tidak ditemukan.'; end if;
  if v_from = v_to then return 'Dompet asal dan tujuan sama.'; end if;

  v_id := public.next_trx_id('Transfer');
  insert into public.transactions (id, occurred_at, kind, category, amount, note, account_id, to_account_id, telegram_message_id)
  values (v_id, current_date, 'Transfer', 'Transfer', p_amount, coalesce(p_note, ''), v_from, v_to, p_message_id);

  select name into n1 from public.accounts where id = v_from;
  select name into n2 from public.accounts where id = v_to;
  return 'Transfer tercatat ' || v_id || E'\n' || n1 || ' -> ' || n2 || E'\n' || public.rupiah(p_amount);
end $function$;

CREATE OR REPLACE FUNCTION public.rupiah(p numeric)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
declare s text;
      hasil text := '';
      i int;
begin
  if p is null then return 'Rp0'; end if;
  s := to_char(abs(p)::bigint, 'FM999999999999999');
  i := length(s);
  while i > 3 loop
    hasil := '.' || substr(s, i - 2, 3) || hasil;
    i := i - 3;
  end loop;
  hasil := substr(s, 1, i) || hasil;
  return (case when p < 0 then '-Rp' else 'Rp' end) || hasil;
end $function$;

CREATE OR REPLACE FUNCTION public.rutin_daftar()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare hasil text := ''; r record; n int := 0;
begin
  for r in select * from public.recurring order by day_of_month, name loop
    n := n + 1;
    hasil := hasil || E'\n• ' || r.name || ' — '
      || case when r.kind = 'Pemasukan' then 'masuk' else 'keluar' end
      || ' ' || public.rupiah(r.amount)
      || ', tgl ' || r.day_of_month
      || case when r.active then '' else ' (nonaktif)' end;
  end loop;

  if n = 0 then
    return 'Belum ada transaksi rutin.' || E'\nTambah dengan: /rutin tambah listrik 350000 5';
  end if;
  return 'Transaksi rutin (' || n || '):' || hasil
    || E'\n\nUbah: /rutin hapus <nama> · /rutin matikan <nama>';
end $function$;

CREATE OR REPLACE FUNCTION public.rutin_hapus(p_nama text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare v int;
begin
  delete from public.recurring where lower(name) = lower(btrim(coalesce(p_nama, '')));
  get diagnostics v = row_count;
  if v = 0 then return 'Tidak menemukan rutin bernama ' || coalesce(p_nama, '') || '.'; end if;
  return 'Rutin dihapus: ' || p_nama;
end $function$;

CREATE OR REPLACE FUNCTION public.rutin_set(p_nama text, p_aktif boolean)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare v int;
begin
  update public.recurring set active = p_aktif where lower(name) = lower(btrim(coalesce(p_nama, '')));
  get diagnostics v = row_count;
  if v = 0 then return 'Tidak menemukan rutin bernama ' || coalesce(p_nama, '') || '.'; end if;
  return 'Rutin ' || p_nama || ' sekarang ' || case when p_aktif then 'aktif' else 'nonaktif' end || '.';
end $function$;

CREATE OR REPLACE FUNCTION public.rutin_tambah(p_nama text, p_nominal numeric, p_tanggal integer, p_kind text DEFAULT 'Pengeluaran'::text, p_kategori text DEFAULT 'Tagihan'::text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare v_nama text := btrim(coalesce(p_nama, ''));
begin
  if v_nama = '' then return 'Nama tidak boleh kosong. Contoh: /rutin tambah listrik 350000 5'; end if;
  if p_nominal is null or p_nominal < 1 then return 'Nominal harus lebih dari 0.'; end if;
  if p_tanggal is null or p_tanggal < 1 or p_tanggal > 28 then
    return 'Tanggal harus 1–28, supaya tidak terlewat di bulan Februari.';
  end if;
  if p_kind not in ('Pemasukan', 'Pengeluaran') then
    return 'Jenis harus Pemasukan atau Pengeluaran.';
  end if;
  if exists (select 1 from public.recurring where lower(name) = lower(v_nama)) then
    return 'Sudah ada rutin bernama ' || v_nama || '. Hapus dulu: /rutin hapus ' || v_nama;
  end if;

  insert into public.recurring (name, kind, category, amount, account_id, day_of_month, active)
  values (v_nama, p_kind, coalesce(nullif(btrim(p_kategori), ''), 'Lainnya'), p_nominal, 'utama', p_tanggal, true);

  return 'Rutin ditambahkan: ' || v_nama || ' · ' || p_kind || ' ' || public.rupiah(p_nominal)
    || ' · tiap tanggal ' || p_tanggal
    || E'\nDicatat otomatis pukul 06:00 saat tanggalnya tiba.';
end $function$;

CREATE OR REPLACE FUNCTION public.saldo_text()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  with gerak as (
    select a.id, a.name, a.opening_balance,
           coalesce(sum(
             case
               when t.kind = 'Pemasukan'   and t.account_id = a.id then t.amount
               when t.kind = 'Pengeluaran' and t.account_id = a.id then -t.amount
               when t.kind = 'Transfer'    and t.account_id = a.id then -t.amount
               when t.kind = 'Transfer'    and t.to_account_id = a.id then t.amount
               else 0
             end
           ), 0) as perubahan
    from public.accounts a
    left join public.transactions t
      on (t.account_id = a.id or t.to_account_id = a.id)
     and t.deleted_at is null
    where a.active
    group by a.id, a.name, a.opening_balance
  )
  select coalesce(string_agg(name || ': ' || public.rupiah(opening_balance + perubahan), E'\n' order by name), 'Belum ada dompet.')
  from gerak;
$function$;

CREATE OR REPLACE FUNCTION public.ubah_transaksi(p_id text, p_amount numeric DEFAULT NULL::numeric, p_category text DEFAULT NULL::text, p_note text DEFAULT NULL::text, p_occurred date DEFAULT NULL::date, p_account text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
  lama public.transactions;
  baru public.transactions;
  v_akun text;
  v_nama_akun text;
  pesan text;
begin
  select * into lama
  from public.transactions
  where deleted_at is null and upper(id) = upper(trim(p_id));

  if not found then
    return 'Transaksi ' || coalesce(p_id, '-') || ' tidak ditemukan atau sudah dihapus.';
  end if;

  if lama.kind = 'Transfer' then
    return 'Transfer tidak bisa diubah dengan perintah ini. Hapus lalu catat ulang.';
  end if;

  if p_amount is not null and p_amount <= 0 then
    return 'Nominal harus lebih dari 0.';
  end if;

  if p_account is not null then
    v_akun := public.cari_akun(p_account);
    if v_akun is null then
      return 'Dompet "' || p_account || '" tidak ditemukan.';
    end if;
  end if;

  update public.transactions set
    amount      = coalesce(p_amount, amount),
    category    = coalesce(nullif(trim(p_category), ''), category),
    note        = coalesce(nullif(trim(p_note), ''), note),
    occurred_at = coalesce(p_occurred, occurred_at),
    account_id  = coalesce(v_akun, account_id)
  where id = lama.id
  returning * into baru;

  pesan := 'Diubah ' || baru.id;

  if baru.amount <> lama.amount then
    pesan := pesan || E'\nNominal: ' || public.rupiah(lama.amount) || ' -> ' || public.rupiah(baru.amount);
  end if;
  if baru.category <> lama.category then
    pesan := pesan || E'\nKategori: ' || lama.category || ' -> ' || baru.category;
  end if;
  if baru.occurred_at <> lama.occurred_at then
    pesan := pesan || E'\nTanggal: ' || lama.occurred_at::text || ' -> ' || baru.occurred_at::text;
  end if;
  if baru.account_id <> lama.account_id then
    select name into v_nama_akun from public.accounts where id = baru.account_id;
    pesan := pesan || E'\nDompet: ' || lama.account_id || ' -> ' || coalesce(v_nama_akun, baru.account_id);
  end if;
  if baru.note <> lama.note then
    pesan := pesan || E'\nKeterangan: ' || lama.note || ' -> ' || baru.note;
  end if;

  return pesan;
end $function$;

CREATE OR REPLACE FUNCTION public.undo_terakhir()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare t public.transactions;
begin
  select * into t
  from public.transactions
  where deleted_at is null
  order by created_at desc, id desc
  limit 1;

  if not found then return 'Belum ada transaksi yang bisa dibatalkan.'; end if;

  update public.transactions set deleted_at = now() where id = t.id;

  return 'Dibatalkan ' || t.id || E'\n' || t.kind || ' ' || public.rupiah(t.amount) || E'\n' || t.note ||
         E'\n\nKetik /undo lagi untuk membatalkan transaksi sebelumnya.';
end $function$;

-- Views
create or replace view public."v_bulanan_kategori" as
SELECT to_char((occurred_at)::timestamp with time zone, 'YYYY-MM'::text) AS bulan,
    category,
    sum(amount) AS total,
    count(*) AS jumlah
   FROM transactions
  WHERE ((kind = 'Pengeluaran'::text) AND (deleted_at IS NULL))
  GROUP BY (to_char((occurred_at)::timestamp with time zone, 'YYYY-MM'::text)), category;

create or replace view public."v_harian" as
SELECT occurred_at,
    kind,
    sum(amount) AS total,
    count(*) AS jumlah
   FROM transactions
  WHERE ((deleted_at IS NULL) AND (kind = ANY (ARRAY['Pemasukan'::text, 'Pengeluaran'::text])))
  GROUP BY occurred_at, kind;

-- Seed default account (edit/add your own accounts as needed)
insert into public.accounts (id, name, kind, opening_balance, is_default, active)
values ('utama', 'Utama', 'cash', 0, true, true)
on conflict (id) do nothing;

commit;
