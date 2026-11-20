# Supabase

## 1. Buat project

Buat project baru di [supabase.com](https://supabase.com), lalu buka **SQL Editor**.

## 2. Jalankan schema

Jalankan berurutan:

1. `schema.sql` — tabel finance, function RPC, view, seed akun `utama`.
2. `002-dashboard.sql` — tabel `conversation_logs`, RLS, revoke akses anon.
3. `003-catat-dompet.sql` — hanya untuk database lama; `schema.sql` terbaru sudah memuat perubahan ini.

`schema.sql` membuat:

- Tabel: `accounts`, `budgets`, `recurring`, `reminders`, `transactions`
- Sequence: `recurring_id_seq`, `reminders_id_seq`, `trx_in_seq`, `trx_out_seq`, `trx_tf_seq`
- Function: `catat_transaksi`, `hapus_transaksi`, `ubah_transaksi`, `pindah_dana`, `saldo_text`, `anggaran_text`, `rutin_*`, `ingatkan_*`, `jalankan_recurring`, `undo_terakhir`, `rupiah`, dll.
- View: `v_bulanan_kategori`, `v_harian`
- Seed akun default: `utama`

`002-dashboard.sql` membuat:

- Tabel `conversation_logs` untuk audit percakapan masuk/keluar
- RLS pada semua tabel finance
- `anon` tidak bisa membaca/menulis; service role (dashboard server) dan postgres (n8n) tetap bisa

## 3. Connection string untuk n8n

Buka **Project Settings → Database → Connection string**.

Untuk n8n di server yang hanya punya IPv4, gunakan **Session pooler**:

- Host: `aws-0-<region>.pooler.supabase.com` (lihat dashboard)
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: password database
- SSL: **require**

Di n8n buat credential **Postgres** bernama `Supabase Finance`.

## 4. Kredensial dashboard

Dashboard memakai **service role key** di server (bukan anon key). Ambil dari:

**Project Settings → API Keys → Secret keys**

Isi ke `.env`:

```dotenv
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

Service role key tidak boleh pernah dikirim ke browser. Dashboard mengakses Supabase hanya dari server.

## 5. Akun tambahan

Seed hanya membuat `utama`. Tambah akun lain lewat SQL:

```sql
insert into public.accounts (id, name, kind, opening_balance, is_default, active)
values
  ('bca', 'BCA', 'bank', 0, false, true),
  ('gopay', 'GoPay', 'ewallet', 0, false, true)
on conflict (id) do nothing;
```

## Catatan

- Schema ini dirancang untuk koneksi **Postgres langsung** dari n8n dan **service role** dari dashboard.
- Kalau memakai Supabase REST/RLS untuk aplikasi lain, tambahkan policy terpisah.
- Backup database dari Supabase Dashboard secara berkala.
- Jangan menaruh password/key di file yang di-commit.
