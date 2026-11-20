# Pundaria Dashboard

Dashboard Next.js untuk monitoring dan CRUD data finance, termasuk log percakapan bot.

Tema: terang/putih modern. Log percakapan menampilkan teks penuh, dan bot mengirim notifikasi Telegram saat anggaran mencapai 80% atau 100%.

Nama tampilan bot Telegram: **Pundaria**; username tetap `personalasistensaya_bot`.

## Arsitektur

```text
Browser
  │ https://DASHBOARD_HOST
  ▼
Caddy (dashboard host)
  ├─ /webhook/* → n8n
  └─ /* → dashboard:3000
                │
                ├─ Supabase service role (server-only)
                └─ conversation_logs

n8n (Router/Pemrosesan/...)
  ├─ Log Masuk / Log Keluar → Supabase conversation_logs
  └─ Postgres credential `Supabase Finance`
```

- Login admin memakai cookie JWT `finance_session` (HttpOnly, Secure, SameSite=Lax).
- Dashboard tidak memakai anon key; service role key hanya di environment server.
- RLS aktif dan `anon` diblokir. Service role dan role `postgres` (n8n) bypass RLS.

## Halaman

| Path | Isi |
|---|---|
| `/login` | Login admin |
| `/` | KPI saldo, pemasukan/pengeluaran, tren, kategori, dompet, anggaran, transaksi terakhir |
| `/transactions` | Filter, daftar, tambah, pindah dana, edit, hapus, export CSV |
| `/transactions/[id]` | Edit/hapus transaksi |
| `/accounts` | CRUD dompet |
| `/budgets` | Set/hapus anggaran + progress |
| `/recurring` | CRUD transaksi rutin |
| `/reminders` | CRUD pengingat |
| `/logs` | Tabel log percakapan masuk/keluar (waktu, arah, jenis, pesan, workflow, intent, ID), export CSV |

## Environment

```dotenv
DASHBOARD_HOST=dashboard.domain
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
AUTH_SECRET=hasil-openssl-rand-hex-32
ADMIN_EMAIL=admin@email.com
ADMIN_PASSWORD=password-kuat
```

`N8N_WEBHOOK_URL` di service n8n diarahkan ke `https://DASHBOARD_HOST/` agar webhook Telegram memakai host dashboard.

## Build dan deploy

```bash
docker compose up -d --build
docker compose logs -f dashboard
```

Atau hanya dashboard:

```bash
docker compose up -d --build dashboard
```

## Log percakapan

- Router: node `Log Masuk` mencatat pesan user (route, teks, chat_id, message_id).
- Router/Pemrosesan/Tanya/Perintah/Jadwal/Error Handler: node `Log Keluar` mencatat balasan bot.
- Data masuk ke `conversation_logs`; dashboard membaca lewat service role.
- Halaman `/logs` memakai tabel ringkas; pesan ditampilkan penuh tanpa elipsis.
- Tombol **Export CSV** di `/transactions` dan `/logs` mengikuti filter yang aktif. Endpoint: `/api/export/transactions` dan `/api/export/logs` (wajib login, maksimal 5.000 baris, UTF-8 BOM agar rapi di Excel).
- Butuh `supabase/002-dashboard.sql`.

## Keamanan

- Jangan pernah memakai `NEXT_PUBLIC_` untuk service role key.
- Signup tidak dipakai; hanya satu admin dari env.
- Ganti `ADMIN_PASSWORD` setelah login pertama.
- Dashboard host publik, tetapi semua halaman (kecuali login) dilindungi middleware.
- `002-dashboard.sql` memblokir `anon`; jangan menambahkan policy anon tanpa kebutuhan.

## Troubleshooting

| Gejala | Solusi |
|---|---|
| Dashboard 502 | `docker compose ps`; pastikan service `dashboard` jalan; cek `docker compose logs dashboard` |
| Login gagal | Cek `ADMIN_EMAIL`/`ADMIN_PASSWORD`; restart dashboard setelah mengubah `.env` |
| Cookie tidak tersimpan | Pastikan HTTPS; `Secure` cookie tidak dipakai di HTTP lokal |
| Tanggal selisih | `formatDate` memakai `Asia/Jakarta`; container boleh UTC |
| Log kosong | Jalankan `002-dashboard.sql`; cek node `Log Masuk`/`Log Keluar` di execution |
| Webhook Telegram 404 | Cek `getWebhookInfo`; host webhook harus `DASHBOARD_HOST`; Caddy route `/webhook/*` ke n8n |
