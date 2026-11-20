# Workflows n8n

Import **berurutan**:

| No | File | Workflow | Node | Entry point |
|---|---|---|---|---|
| 1 | `00-error-handler.json` | Error Handler - Finance | 3 | Error Trigger |
| 2 | `01-router.json` | Expense Tracker - Router | 6 | Telegram Trigger |
| 3 | `02-pemrosesan.json` | Expense Tracker - Pemrosesan | 41 | Execute Workflow Trigger |
| 4 | `03-tanya.json` | Expense Tracker - Tanya | 9 | Execute Workflow Trigger |
| 5 | `04-perintah.json` | Expense Tracker - Perintah | 10 | Execute Workflow Trigger |
| 6 | `05-jadwal.json` | Expense Tracker - Jadwal | 22 | 5 Schedule Trigger + Manual Email |

## Credential yang dipakai

| Credential | Tipe | Dipakai di |
|---|---|---|
| `Telegram account` | Telegram API | Router, Pemrosesan, Perintah, Jadwal, Error Handler |
| `Supabase Finance` | Postgres | Pemrosesan, Tanya, Perintah, Jadwal |
| `OpenAI account` | OpenAI API | Pemrosesan, Tanya |
| `SMTP account` | SMTP | Jadwal (branch rekap email) |

Setelah import, node dengan credential merah harus dipilihkan credential kamu. Kalau nama credential sama, biasanya lebih mudah dicocokkan.

## Chat ID

File export memakai placeholder `YOUR_TELEGRAM_CHAT_ID`. Ganti di:

- **Router** → Telegram Trigger → Additional Fields → **Chat IDs**
- **Error Handler - Finance** → node Telegram
- **Jadwal** → 4 node Telegram (rekap/pengingat)

Cari dengan Ctrl+F di editor n8n. Kalau tidak diganti, Telegram tetap mengirim update tetapi n8n mengabaikannya.

## Error Workflow

Untuk setiap workflow (Router, Pemrosesan, Tanya, Perintah, Jadwal):

**Settings → Error Workflow → `Error Handler - Finance`**

File export tidak membawa ID error workflow karena ID berbeda di setiap instance.

## Publish

Publish semua workflow. Publish **Router paling akhir**, karena publish Router yang mendaftarkan webhook Telegram.

Di n8n 2.x gunakan tombol **Publish** (bukan sekadar menyimpan draft). Kalau mengubah Telegram Trigger, **Unpublish → Publish** Router agar `setWebhook` dipanggil ulang.

## Webhook

Caddy mengizinkan `POST /webhook/*` dan `/webhook-test/*`, jadi perubahan `webhookId` tidak perlu edit Caddy. URL production ada di node Telegram Trigger → **Webhook URLs**.

Jangan set webhook manual dengan secret sendiri; biarkan n8n yang mengatur saat publish.

## Rekap email bulanan

Branch email ada di dalam `05-jadwal.json` (bagian bawah), berjalan tanggal 1 pukul 07.00 WIB:

- Node `Jadwal Email Bulanan` (Schedule Trigger) dan `Manual Email` (untuk tes).
- Query transaksi aktif bulan kalender sebelumnya (WIB).
- CSV dan ringkasan disusun dengan **Python Code** (`Susun CSV Email`).
- `Buat File CSV` (Convert to File) mengubah teks CSV menjadi lampiran biner.
- Mengirim email dengan lampiran `pundaria-rekap-YYYY-MM.csv`.

Sebelum import, siapkan credential **SMTP** (mis. Gmail App Password: `smtp.gmail.com`, port 465, SSL/TLS aktif). Setelah import, pilih credential SMTP di node **Kirim Email Rekap** dan ganti `fromEmail`/`toEmail` sesuai akunmu.

## Log percakapan

Workflow sudah menyertakan node logging:

- `Log Masuk` di Router (dari `Normalisasi Pesan`) mencatat pesan user.
- `Log Keluar` di Router/Pemrosesan/Tanya/Perintah/Jadwal/Error Handler mencatat balasan bot.

Keduanya menulis ke tabel `conversation_logs` memakai credential `Supabase Finance`. Jalankan `supabase/002-dashboard.sql` sebelum mengaktifkan workflow.

Kalau ingin mematikan logging, nonaktifkan node `Log Masuk`/`Log Keluar`; jangan hapus tabelnya karena dashboard membaca tabel itu.
