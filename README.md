# Pundaria — Asisten Keuangan Pribadi

Pundaria adalah asisten keuangan pribadi berbasis **Telegram, n8n, Supabase, Next.js, dan Docker**. Pengguna dapat mencatat transaksi lewat teks, foto struk, atau pesan suara; bertanya tentang kondisi keuangan; menjalankan perintah; dan melihat hasilnya di dashboard web yang bisa dipasang sebagai PWA.

> **Demo:** [t.me/personalasistensaya_bot](https://t.me/personalasistensaya_bot) · Dashboard: `https://pa-pro-dashboard.duckdns.org`

---

## 1. Jalur yang dipilih: P2 + P3

Pundaria **tidak** memakai agent otonom penuh. Pendekatan yang dipilih adalah kombinasi **Phase 2 (Automation & Orchestration)** dan **Phase 3 (AI Agent)**.

| Lapisan | Peran | Implementasi |
|---|---|---|
| **P2 — Automation & Orchestration** | Menjalankan alur secara deterministik, terjadwal, dan dapat diaudit | n8n, Router, workflow Perintah, workflow Jadwal, Supabase RPC, error handler |
| **P3 — AI Agent** | Memahami bahasa manusia dan input multimodal | GPT-4o mini, klasifikasi intent, ekstraksi JSON, OCR struk, transkripsi suara, tanya-jawab dengan konteks |

Prinsipnya:

```text
AI memahami → n8n mengatur → database memutuskan → Telegram/dashboard menampilkan
```

AI hanya **mengusulkan** hasil pemahaman. Validasi, RPC, dan constraint database yang menentukan apakah data boleh disimpan. Pendekatan ini dipilih karena transaksi keuangan tidak boleh ditebak: harus **reliable**, **auditable**, dan **cost-aware**.

---

## 2. Masalah yang diselesaikan

Pencatatan keuangan sering berhenti karena tiga hal:

1. **Friksi input tinggi** — membuka aplikasi, mengisi formulir, memilih kategori, lalu menyimpan terlalu banyak langkah untuk aktivitas yang terjadi puluhan kali sebulan.
2. **Data tersebar** — uang ada di bank, e-wallet, cash, dan spreadsheet; tidak ada satu tempat yang rapi.
3. **Angka ada, insight tidak** — total bulanan bisa dihitung, tetapi sulit tahu ke mana uang pergi dan apa yang harus diubah.

Data **SNLIK 2026** (OJK, LPS, BPS) menunjukkan indeks literasi keuangan **69,57%** dan indeks inklusi **93,61%**. Artinya, kesadaran sudah naik; tantangannya adalah membuat kebiasaan mencatat cukup mudah untuk dilakukan konsisten.

Pundaria menjawabnya dengan **chat sebagai antarmuka utama**:

- catat lewat pesan biasa,
- foto struk dibaca OCR,
- voice note ditranskripsi,
- perintah penting tetap deterministik,
- dashboard dipakai untuk melihat, mengoreksi, dan mengaudit.

---

## 3. Fitur utama

- Catat pemasukan/pengeluaran dari teks: `beli kopi 5rb`
- Catat dari dompet tertentu: `beli pulsa 10rb pakai gopay`
- Catat dari foto struk (OCR) dan pesan suara (transkripsi)
- Ubah/hapus transaksi, `/undo`
- Perintah: `/saldo`, `/rekap`, `/anggaran`, `/pindah`, `/hapus`, `/undo`, `/rutin`, `/ingatkan`, `/dompet`
- Kelola dompet dari chat: `/dompet`, `/dompet tambah BCA`
- Rekap email otomatis tanggal 1 dengan lampiran CSV
- Dashboard: transaksi, dompet, anggaran, rutin, pengingat, log percakapan, export CSV
- PWA: dashboard bisa dipasang seperti aplikasi
- Monitoring uptime dashboard/n8n dengan alert Telegram
- Error handler otomatis ke Telegram admin

---

## 4. Arsitektur dan alur workflow

```text
Telegram
   │  webhook HTTPS
   ▼
Caddy
   │
   ▼
Expense Tracker - Router
   ├── /perintah, /rekap ───────────→ Expense Tracker - Perintah ──→ Supabase
   │
   └── teks / foto / suara ─────────→ Expense Tracker - Pemrosesan
                                           ├── niat Tanya ───────→ Expense Tracker - Tanya (read-only)
                                           ├── niat Catat ───────→ Supabase
                                           ├── niat Ubah/Hapus ──→ Supabase
                                           └── niat Ingatkan ────→ reminders

Expense Tracker - Jadwal (cron) ─────→ rekap pagi/mingguan, rutin, pengingat, email

Error Handler - Finance ←── menangkap error dari workflow lain

Dashboard Next.js ────────────────→ membaca Supabase
```

### Peran enam workflow

| Workflow | Entry point | Dipanggil oleh | Fungsi |
|---|---|---|---|
| `Expense Tracker - Router` | Telegram Trigger | — | Pintu masuk, validasi, log, dan pemilihan jalur |
| `Expense Tracker - Pemrosesan` | Execute Workflow Trigger | Router | Memproses teks/foto/suara; catat, ubah, hapus, ingatkan |
| `Expense Tracker - Tanya` | Execute Workflow Trigger | Pemrosesan | Menjawab pertanyaan dari data, tanpa menulis |
| `Expense Tracker - Perintah` | Execute Workflow Trigger | Router | Menjalankan slash command secara deterministik |
| `Expense Tracker - Jadwal` | 5 Schedule Trigger | — | Rekap pagi/mingguan, rutin, pengingat, email bulanan |
| `Error Handler - Finance` | Error Trigger | n8n saat workflow error | Mengirim notifikasi error ke Telegram admin |

Catatan penting:

- **Tanya tidak dipanggil langsung oleh Router.** Tanya adalah sub-workflow dari Pemrosesan.
- **Semua slash command masuk ke Perintah**, termasuk `/rekap`.
- **Jadwal berjalan sendiri** lewat cron dan tidak dipicu pesan pengguna.
- **Error Handler pasif**; ia hanya aktif jika ada workflow yang gagal.
- Semua jalur menulis ke Supabase dan `conversation_logs`.

---

## 5. Cara menjalankan proyek

### Prasyarat

- Docker Engine + Docker Compose v2
- Domain yang mengarah ke server, misalnya `nama.duckdns.org`
- Port **80** dan **443** terbuka
- Bot Telegram dari BotFather
- Project Supabase (Postgres)
- OpenAI API key
- SMTP/Gmail App Password untuk rekap email

### 5.1 Siapkan environment

```bash
cp .env.example .env
```

Isi `.env`:

```dotenv
FINANCE_HOST=nama.duckdns.org
DASHBOARD_HOST=dashboard.nama.duckdns.org
FINANCE_EDITOR_IP=IP_PUBLIK_KAMU

POSTGRES_PASSWORD=...
N8N_ENCRYPTION_KEY=...
N8N_RUNNERS_AUTH_TOKEN=...

SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

AUTH_SECRET=...
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=...
```

Generate secret:

```bash
openssl rand -hex 32        # N8N_ENCRYPTION_KEY / N8N_RUNNERS_AUTH_TOKEN / AUTH_SECRET
openssl rand -base64 24     # POSTGRES_PASSWORD
```

> `FINANCE_EDITOR_IP` membatasi akses ke editor n8n. Kalau IP publik berubah, perbarui `.env` lalu recreate Caddy. Untuk akses dari mana saja, gunakan Tailscale atau ubah kebijakan akses secara sadar.

### 5.2 Siapkan Supabase

Buka **SQL Editor** di project Supabase, lalu jalankan berurutan:

```text
supabase/schema.sql
supabase/002-dashboard.sql
supabase/003-catat-dompet.sql
```

Ambil **connection string** dari **Project Settings → Database** dan **service role key** dari **Project Settings → API Keys**. Service role key hanya dipakai server, jangan pernah ditaruh di browser atau memakai prefix `NEXT_PUBLIC_`.

### 5.3 Jalankan stack Docker

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail 50 caddy
```

Buka:

```text
https://FINANCE_HOST/          → editor n8n
https://DASHBOARD_HOST/login   → dashboard
```

### 5.4 Buat credential n8n

Di n8n: **Credentials → New**.

| Nama credential | Tipe | Isi |
|---|---|---|
| `Telegram account` | Telegram API | token bot dari BotFather |
| `Supabase Finance` | Postgres | host, port, database, user, password Supabase, SSL `require` |
| `OpenAI account` | OpenAI API | API key OpenAI |
| `SMTP account` | SMTP | Gmail SMTP `smtp.gmail.com:465`, SSL/TLS, App Password |

### 5.5 Import workflow

Import berurutan dari folder `workflows/`:

```text
00-error-handler.json
01-router.json
02-pemrosesan.json
03-tanya.json
04-perintah.json
05-jadwal.json
```

Setelah import:

1. Pilih credential pada setiap node yang merah.
2. Ganti `YOUR_TELEGRAM_CHAT_ID` dengan chat ID kamu.
3. Atur **Settings → Error Workflow** ke `Error Handler - Finance`.
4. Publish semua workflow; **publish Router paling akhir** agar webhook Telegram terdaftar setelah workflow lain siap.
5. Setelah publish workflow Jadwal, restart n8n dan cek **Executions**:

```bash
docker compose restart n8n
```

### 5.6 Dashboard

Dashboard berjalan sebagai service `dashboard` di belakang Caddy.

```bash
docker compose up -d --build dashboard
docker compose logs -f dashboard
```

Login memakai `ADMIN_EMAIL` dan `ADMIN_PASSWORD` dari `.env`. Halaman yang tersedia: Dashboard, Transaksi, Dompet, Anggaran, Rutin, Pengingat, Log Percakapan, dan Bantuan.

### 5.7 Uji cepat

Kirim ke bot Telegram:

```text
/saldo
beli kopi 5rb
/rekap
/anggaran
```

Lalu uji:

```text
foto struk
voice note
/pindah 100000 BCA Gopay
/undo
/rutin
/ingatkan besok bayar listrik jam 9
```

---

## 6. Struktur folder

```text
.
├── compose.yaml                 # Postgres, n8n, task runner, dashboard, Caddy
├── compose.dashboard.yaml       # overlay dashboard
├── Caddyfile                    # HTTPS, webhook, akses editor
├── .env.example                 # contoh konfigurasi
├── docker/
│   └── n8n-task-runners.json
├── workflows/                   # 6 workflow n8n siap import
├── supabase/
│   ├── schema.sql
│   ├── 002-dashboard.sql
│   └── 003-catat-dompet.sql
├── dashboard/                   # Next.js dashboard + PWA
├── scripts/
│   ├── monitor.sh
│   └── update-duckdns.sh
└── docs/
    ├── ARCHITECTURE.md
    ├── DEPLOY-VPS.md
    ├── RUNBOOK-telegram.md
    ├── TROUBLESHOOTING.md
    └── evidence/TEST-EVIDENCE.md
```

`tidak dipakai/` berisi arsip lokal dan tidak disertakan dalam paket bersih.

---

## 7. Pengujian

Bukti pengujian tersedia di [`docs/evidence/TEST-EVIDENCE.md`](docs/evidence/TEST-EVIDENCE.md), meliputi:

- pencatatan teks, foto struk, dan voice note,
- transfer antar dompet,
- hapus dan undo,
- pengingat harian/sekali,
- rekap email dengan CSV,
- export CSV dashboard,
- PWA,
- monitoring uptime,
- jadwal pagi dan pengingat otomatis.

---

## 8. Keamanan dan operasi

- **RLS aktif** di Supabase; akses anon dihapus.
- **Service role key hanya di server**; tidak pernah dikirim ke browser.
- **Dashboard memakai JWT** di cookie `httpOnly`, diverifikasi middleware.
- **Webhook Telegram memakai path rahasia** dan hanya `/webhook/*` yang diteruskan ke n8n.
- **Editor n8n dibatasi** lewat `FINANCE_EDITOR_IP` atau jalur akses yang disengaja.
- **SSH dibatasi** di Security Group.
- **Monitoring** berjalan tiap 5 menit dan mengirim alert ke Telegram.
- Jangan commit `.env`, file `.pem`, atau file kredensial.

---

## 9. Dokumentasi lanjutan

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arsitektur dan keputusan teknis
- [`docs/DEPLOY-VPS.md`](docs/DEPLOY-VPS.md) — deployment server
- [`docs/RUNBOOK-telegram.md`](docs/RUNBOOK-telegram.md) — operasi bot, webhook, email, monitoring
- [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) — masalah umum
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — riwayat perubahan
- [`docs/Pundaria-Speaker-Notes.md`](docs/Pundaria-Speaker-Notes.md) — catatan pembicara

---

## 10. Status

Pundaria sudah berjalan end-to-end: bot Telegram, dashboard, Supabase, workflow terjadwal, email rekap, PWA, dan monitoring. Fokus pengembangan berikutnya adalah keandalan data (backup dan restore), lalu fitur finansial seperti utang-piutang, target tabungan, dan aset/investasi.
