-- 003: catat transaksi ke dompet yang disebut (nama atau kode)
-- Jalankan di Supabase SQL Editor. Aman diulang.
-- Contoh: "beli pulsa 10rb pakai gopay" -> catat_transaksi(..., p_account => 'gopay').

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
