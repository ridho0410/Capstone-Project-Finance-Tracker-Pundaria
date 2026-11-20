# Arsitektur

## Alur utama

```text
Telegram
   │ POST https://DOMAIN/webhook/<uuid>/webhook
   ▼
Caddy
   │ hanya POST /webhook/* dan /webhook-test/*
   ▼
Router (Telegram Trigger → Normalisasi → Pilih Jenis)
   ├─ Teks / Foto / Suara ──► Pemrosesan
   │                             ├─ Catat / Hapus / Ubah ──► Supabase
   │                             ├─ Tanya ─────────────────► Tanya
   │                             └─ Ingatkan ──────────────► Perintah
   ├─ Rekap / Perintah ──────► Perintah
   └─ Bantuan / Tolak ───────► balas langsung di Router
```

## Pintu masuk tiap workflow

| Workflow | Trigger | Siapa yang memulai |
|---|---|---|
| Router | Telegram Trigger | Telegram |
| Pemrosesan | Execute Workflow Trigger | Router |
| Tanya | Execute Workflow Trigger | Pemrosesan |
| Perintah | Execute Workflow Trigger | Router, Pemrosesan |
| Jadwal | 5 Schedule Trigger + email | Waktu (mandiri) |
| Error Handler | Error Trigger | n8n saat workflow error |

## Tanggung jawab

### Router
- Menerima update Telegram.
- Normalisasi: route, teks, `chatId`, `messageId`, `received`, `bulan`, `fileId`, `voiceFileId`.
- Menolak pesan berbahaya.
- Membalas bantuan.
- Meneruskan ke Pemrosesan atau Perintah.

### Pemrosesan
- Teks: klasifikasi niat (`catat`, `tanya`, `hapus`, `ubah`, `ingatkan`).
- Foto: download → OCR → validasi → catat.
- Suara: download → transkripsi → validasi → catat.
- Menulis ke Supabase lewat function RPC.
- Memanggil Tanya untuk pertanyaan.
- Memanggil Perintah untuk pengingat.

### Tanya
- Q&A read-only.
- Membaca transaksi dari Supabase, menjawab lewat model.

### Perintah
- `/rekap`, `/saldo`, `/anggaran`, `/pindah`, `/hapus`, `/undo`, `/rutin`, `/ingatkan`.
- Mengirim balasan ke Telegram.

### Jadwal
- Rekap pagi, laporan mingguan, transaksi rutin, pengingat.
- Branch rekap email bulanan: tanggal 1 pukul 07.00 WIB, query transaksi bulan sebelumnya, buat CSV, kirim via SMTP.
- Berjalan sendiri lewat 5 Schedule Trigger. Ada `Manual Email` untuk tes kirim.

### Error Handler
- Error Trigger.
- Mengirim detail workflow/node/execution ke Telegram.

## Penyimpanan

- **Postgres internal** (`postgres` service): data n8n (workflow, credential terenkripsi, execution).
- **Supabase Postgres**: data keuangan (`transactions`, `budgets`, `accounts`, `recurring`, `reminders`).
- **Volume Caddy**: sertifikat TLS.

## Kenapa Caddy hanya membuka `/webhook/*`

- Editor dan REST n8n dilindungi `FINANCE_EDITOR_IP`.
- Telegram hanya butuh `POST /webhook/*`.
- Path webhook boleh berubah saat node Telegram Trigger dibuat ulang; Caddy tidak perlu diedit.

## Dashboard dan log

```text
Browser admin
  → Caddy (DASHBOARD_HOST)
      ├─ /webhook/* → n8n
      └─ /* → dashboard Next.js
                  → Supabase service role

n8n Router/Pemrosesan/...
  → conversation_logs (Log Masuk / Log Keluar)
```

- Dashboard memakai cookie JWT admin dan service role key server-side.
- Log masuk/keluar ditulis n8n ke `conversation_logs`; dashboard membacanya.
- RLS aktif; `anon` diblokir, service role dan postgres bypass.

## Catatan keamanan

- Webhook Telegram divalidasi oleh secret token di node n8n.
- Webhook baru di luar Telegram harus punya autentikasi sendiri.
- Jangan expose port 5678 ke publik; compose mengikatnya ke `127.0.0.1`.
