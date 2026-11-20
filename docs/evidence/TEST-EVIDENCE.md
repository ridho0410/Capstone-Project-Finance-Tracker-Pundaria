# Test Evidence

Tanggal uji: **18 November 2026**
Environment: n8n 2.47.7, Caddy 2.11.9, Postgres 16, Supabase, Docker di EC2.

## Matriks uji

| Jalur | Hasil | Bukti |
|---|---|---|
| `/saldo` via Telegram | Berhasil | Router #372/#374 → Perintah #373/#375; balasan saldo |
| `/rekap` via Telegram | Berhasil | Router #423 → Perintah #424; rekap bulanan |
| `/anggaran` via Telegram | Berhasil | Router #425 → Perintah #426; pemakaian anggaran |
| Teks `beli kopi 5rb` | Berhasil | Router #380 → Pemrosesan #381; transaksi tersimpan + balasan |
| Foto struk | Berhasil | OCR → transaksi tersimpan + balasan (konfirmasi user) |
| Voice note | Berhasil | transkripsi → transaksi tersimpan + balasan |
| `Hapus beli toto` | Berhasil | transaksi dihapus + balasan |
| `/undo` | Berhasil | transaksi dibatalkan + balasan |
| `/pindah` | Berhasil | format/validasi + balasan |
| `/rutin` | Berhasil | daftar/tambah rutin + balasan |
| `/ingatkan` | Berhasil | daftar/tambah pengingat + balasan |
| Error Handler | Berhasil | #378 mengirim alert saat #377 gagal |
| Webhook Telegram | Sehat | `pending_update_count=0`, URL Router |

## Uji ketahanan webhookId

- `webhookId` Router diganti dari `f58ea11a-...` menjadi `00080e30-be54-487c-82dc-77b8cac70347`.
- Caddy **tidak diubah** (sudah mengizinkan `POST /webhook/*`).
- `/saldo` tetap masuk: Router **#439** → Perintah **#440** success.

## Bug yang ditemukan dan diperbaiki

1. **Caddy 404**: `FINANCE_TELEGRAM_WEBHOOK_PATH` masih menunjuk path workflow lama. Diperbaiki dengan Caddy `path /webhook/* /webhook-test/*`.
2. **`chat_id` kosong**: node `Balas - Catat` memakai `message.chat.id` dari update mentah, sedangkan Router mengirim `chatId` di root. Diperbaiki di `Balas - Transaksi`, `Balas - Suara`, `Balas - Catat`.
3. **Aktivasi ulang**: `activate` pada workflow yang sudah aktif tidak mendaftarkan webhook. Solusi: **Unpublish → Publish**.

## Dashboard, log, dan EC2 (18 Nov 2026)

- EC2 diubah dari `t3.small` (2 GB) ke `c7i-flex.large` (4 GB); `free -h` menunjukkan **3.7 GiB**.
- Public IP berubah menjadi **108.136.39.23**; DuckDNS `pa-pro` dan `pa-pro-dashboard` diperbarui.
- Login dashboard: berhasil.
- Dashboard membaca data Supabase asli: saldo, pemasukan/pengeluaran, dompet, anggaran, transaksi terakhir.
- CRUD dashboard: tambah transaksi `Tes Dashboard` (OUT-0055) dan hapus kembali; berhasil.
- Log percakapan: `/saldo` via Telegram → Router **#466** → Perintah **#467** success; halaman Log Percakapan menampilkan pesan masuk dan balasan bot.
- Node logging: `Log Masuk` (Router) + `Log Keluar` (Router/Pemrosesan/Tanya/Perintah/Jadwal/Error Handler).
- Webhook Telegram memakai host dashboard; `pending_update_count=0`, tanpa error.
- Semua 6 workflow aktif setelah penambahan logging.

## Catat transaksi per dompet (18 Nov 2026)

- Uji `beli pulsa 10rb pakai gopay`: bot mencatat **OUT-0061** dengan dompet **Gopay**, bukan dompet utama.
- Saldo Gopay turun dari **Rp50.000** menjadi **Rp40.000**; dashboard menampilkan transaksi di dompet Gopay.
- Transaksi uji OUT-0060 dan OUT-0061 sudah dihapus (soft delete) setelah verifikasi.
- Setelah perbaikan encoding, balasan transaksi menampilkan `Lainnya · beli pulsa` (bukan `┬╖`); uji OUT-0062 dihapus kembali.
- `/saldo` setelah restart n8n: BCA Rp1.500.000, Gopay Rp50.000, Utama Rp28.783.900.
- Penyebab awal: `Baca Transaksi Teks` tidak mengekstrak dompet dan `Validasi Transaksi` membuang field `dompet`; dompet sekarang diambil dari `Klasifikasi Niat` dan di-resolve oleh `cari_akun`.

## Branding Pundaria (18 Nov 2026)

- Logo dompet vektor (`branding/pundaria-logo-1.svg`) tampil di sidebar, halaman login, dan favicon dashboard.
- `https://pa-pro-dashboard.duckdns.org/pundaria-logo.svg` dan `.png` → HTTP 200 tanpa login.
- Foto profil bot diperbarui lewat `setMyProfilePhoto`; `getMe` → `first_name=Pundaria`, `username=personalasistensaya_bot`.
- Pesan uji pengiriman logo ke chat sudah dihapus.

## Catatan

- Nominal dan isi transaksi tidak dicantumkan untuk privasi.
- 20 execution terakhir setelah perbaikan: **0 error**.
- Detail riwayat: `docs/CHANGELOG.md`.
- Command operasional: `docs/RUNBOOK-telegram.md`.

## Fitur foto Telegram (19 Nov 2026)

- Foto struk HokBen dikirim ke bot dan diproses sampai selesai (execution 710, status success).
- Balasan bot: `Tercatat OUT-0067`, `Pengeluaran Rp40.000`, `2026-11-19 WIB`, `Makanan`.
- Sebelum perbaikan, workflow berhenti karena `Tentukan Niat` tidak dijalankan pada jalur foto; setelah itu OCR sempat membaca `EDC MANDIRI` sebagai dompet.
- Perbaikan: guard route Foto pada `Validasi Transaksi`, dompet foto memakai dompet utama, dan koreksi tahun tanggal OCR.
- Transaksi uji OUT-0066 dan OUT-0067 sudah dihapus setelah verifikasi.

## Elastic IP (19 Nov 2026)

- EIP `203.0.113.10` terasosiasi ke `i-EXAMPLE`.
- DuckDNS `pa-pro` dan `pa-pro-dashboard` -> `203.0.113.10`.
- `https://pa-pro-dashboard.duckdns.org/login` -> HTTP 200.
- `https://pa-pro.duckdns.org/workflow/fpfKoNTpvhXvOftJ` -> HTTP 200.
- `getWebhookInfo` -> `ip_address=203.0.113.10`; `/saldo` dibalas bot.
- IP publik lama `108.136.39.23` sudah tidak dipakai.

## Akses n8n publik (19 Nov 2026)

- `https://pa-pro.duckdns.org/workflow/fpfKoNTpvhXvOftJ` tanpa basic auth -> HTTP 401.
- Dengan basic auth `admin` -> HTTP 200.
- `https://pa-pro.duckdns.org/assistant` dengan basic auth -> HTTP 200.
- `https://pa-pro-dashboard.duckdns.org/login` -> HTTP 200.
- `POST /webhook/...` tanpa secret -> HTTP 403, bukan 401 (jalur webhook tetap publik).
- Kredensial basic auth hanya disimpan lokal di `tidak dipakai/n8n-basic-auth.txt`.


## Akses n8n tanpa basic auth (19 Nov 2026)

- GET https://pa-pro.duckdns.org/assistant tanpa auth -> HTTP 200.
- POST https://pa-pro.duckdns.org/rest/login dengan akun owner -> HTTP 200.
- Dashboard -> HTTP 200; webhook tanpa secret -> HTTP 403.
- Basic auth Caddy dihapus; kredensial login n8n hanya disimpan lokal.


## Dashboard light & budget alert (19 Nov 2026)

- Tema light live di dashboard: login, dashboard, transaksi, anggaran, dan log diperiksa.
- Log percakapan menampilkan teks penuh (tanpa line-clamp/elipsis).
- Uji anggaran: Transportasi limit Rp400.000, terpakai Rp100.000; transaksi uji Rp220.000 membuat pemakaian 80%.
- Balasan bot: NOTIFIKASI ANGGARAN, Transportasi sudah 80% dari batas, Terpakai Rp320.000 dari Rp400.000, Sisa Rp80.000.
- Transaksi uji OUT-0070 sudah dihapus; pemakaian kembali 25%.


## Export CSV (19 Nov 2026)

- GET /api/export/logs -> HTTP 200, Content-Disposition: attachment, file 13.669 bytes.
- GET /api/export/transactions?kind=Pengeluaran&q=bensin -> HTTP 200, file 2.426 bytes.
- Tombol Export CSV di dashboard berhasil memicu download di browser.
- CSV memakai header dan UTF-8 BOM; filter aktif ikut terbawa.


## Perbaikan intent & dompet (19 Nov 2026)

- Sebelum: `bayar mie ayam 15rb pakai gopay` diklasifikasi `ingatkan`; dompet `gopay` diekstrak tetapi jalur pengingat memanggil `catat_transaksi` tanpa `p_account`, sehingga masuk Utama. Jam `00:00` memicu pesan `Waktu pengingat sudah lewat`.
- Sesudah: guard mengubah aksi menjadi `catat`; OUT-0079 tercatat di Dompet Gopay, tanpa error pengingat. Transaksi uji dihapus.
- `Naik gojek bayar pakai gopay 22rb` tetap tercatat di Gopay.
- OUT-0074 dikoreksi ke Gopay.


## Rekap email bulanan (19 Nov 2026)

- Workflow `Rekap Email Bulanan` aktif, 1 Schedule Trigger (`0 7 1 * *`, Asia/Jakarta).
- Execution 888 sukses.
- Email diterima di `admin@example.com` dengan subjek `Rekap Pundaria — Oktober 2026`.
- Lampiran `pundaria-rekap-2026-10.csv` terunduh, 72 bytes (header saja karena Oktober kosong).
- SMTP credential: `SMTP account`, koneksi berhasil (Gmail SMTP 465/SSL).


## Rekap email di workflow Jadwal (19 Nov 2026)

- Branch email ada di `Expense Tracker - Jadwal`: `Jadwal Email Bulanan` + `Manual Email`.
- Workflow terpisah `Rekap Email Bulanan` sudah inactive.
- Uji execution 890 -> success; email `Rekap Pundaria — Oktober 2026` diterima lagi.
- Trigger count Jadwal: 5; chat ID Telegram lama tetap YOUR_TELEGRAM_CHAT_ID.


## CSV rekap Python (19 Nov 2026)

- `Susun CSV Email` -> `language: pythonNative`, menghasilkan `csv`, `body`, `bulan`, `bulanKey`.
- `Buat File CSV` -> Convert to File (`toText`, BOM, filename dari `bulanKey`).
- Execution 891 status success; email `Rekap Pundaria — Oktober 2026` diterima dengan lampiran.


## Hapus permanen pengingat (19 Nov 2026)

- `deleteReminder` -> RPC `ingatkan_hapus` (aktif=false) tetap dipakai untuk **Nonaktifkan**.
- `deleteReminderPermanent` -> `from('reminders').delete().eq('id', id)` untuk baris nonaktif.
- Dashboard di-rebuild dan live; halaman `/reminders` menampilkan tombol sesuai status.


## Dompet baru dari chat (19 Nov 2026)

- Uji `/dompet tambah Dompet Uji` -> balasan `Dompet Dompet Uji dibuat (id: dompet-uji).`
- `/dompet` menampilkan `Dompet Uji: Rp0` bersama BCA, Gopay, Utama.
- Dompet uji dihapus lagi lewat dashboard **Dompet**; daftar kembali BCA, Gopay, Utama.


## Aktifkan pengingat harian (19 Nov 2026)

- Uji `/ingatkan harian 23:58 tes aktifkan` -> aktif; Nonaktifkan -> muncul `Aktifkan | Hapus`; Aktifkan -> status Aktif dengan jadwal 19 Nov 2026, 23.58.
- Pengingat uji dihapus lagi (Nonaktifkan -> Hapus), daftar bersih.
- `minum obat` (harian, nonaktif) menampilkan `Aktifkan | Hapus`; `bayar listrik` (sekali, aktif) tetap `Nonaktifkan`.


## Logout dashboard (19 Nov 2026)

- Sebelum: `Location: https://0.0.0.0:3000/login` (error di browser).
- Sesudah: `HTTP/1.1 303 See Other`, `Location: /login`, `Set-Cookie: finance_session=; Expires=1970`.


## PWA, Bantuan, monitoring (19 Nov 2026)

- `/manifest.webmanifest` 200, `/sw.js` 200, ikon 192/512/maskable/apple 200.
- Service worker terdaftar dengan scope `/`; pengguna mengonfirmasi dashboard bisa di-install.
- `/help` 200 dengan sesi login dan tampil di sidebar.
- Monitoring: tes `DASH_URL=http://127.0.0.1:9` mengirim `Pundaria ALERT: dashboard tidak merespons.`; run normal mengirim `Pundaria pulih: dashboard dan n8n normal kembali.`
- Cron berjalan 16:20 UTC dan menulis `OK` ke `monitor/monitor.log`.


## Deck editable (20 Nov 2026)

- 11 slide, 16:9, speaker notes tersimpan.
- Google Slides copy: https://docs.google.com/presentation/d/1deoVfImHgea5FT0q_qDXxA0OerCgeiYvLv-VhnMBDfo/edit
- Cek: 11 total slide; transisi Fade tampil di slide 2, 8, 9, dan 11.
- File PPTX/PDF ditambahkan ke paket; logo tetap gambar, elemen lain native.


## Slide 4 SNLIK 2026 (20 Nov 2026)

- Sumber: OJK, LPS & BPS, siaran pers 11 Agustus 2026.
- Literasi 69,57%, inklusi 93,61%, belum melek 30,43%, kenaikan 2,93 pp dari 2025.
- Google Slides: judul, angka besar, legend, tren, kartu bawah, sumber, dan donut sudah diperbarui.


## Jadwal pagi (20 Nov 2026)

- Cron aktif `Jadwal Pagi`: `0 8 * * *`, timezone `Asia/Jakarta`.
- Tidak ada execution terjadwal setelah 14.46 UTC 19 Nov; trigger belum terdaftar.
- Restart n8n 00.39 UTC; execution 935 (`Jadwal Pengingat`) sukses 00.44 UTC.
- Jadwal pagi berikutnya 01.00 UTC / 08.00 WIB.


## Recheck penuh (20 Nov 2026, 09.30 WIB)

- `Jadwal Pagi` execution 939 sukses 01.00 UTC / 08.00 WIB; pesan Telegram terkirim (`message_id` 699).
- `Jadwal Pengingat` berjalan tiap 5 menit setelah restart; execution terakhir 957 sukses.
- Webhook Telegram: `pending_update_count` 0, tanpa error, IP 203.0.113.10.
- Uji chat: `/saldo`, `/dompet`, `/anggaran`, `/rekap` dibalas benar.
- Saldo: BCA Rp21.190.000, Gopay Rp600.000, Jago Rp0, Utama Rp28.428.900; total Rp50.218.900.
- `/rekap` November: 44 transaksi non-transfer, pemasukan Rp51.610.000, pengeluaran Rp2.941.100, selisih Rp48.668.900. Dua transfer tidak dihitung.
- Dashboard: semua halaman 200; export CSV 200; n8n `/healthz` 200; monitoring cron `OK`.


## Slide 12 alur end-to-end (20 Nov 2026)

- Google Slides `Pundaria - Presentasi Editable` sekarang 12 slide; slide 12 berada di paling akhir.
- Diagram native: 4 tahap utama, 4 cabang workflow, 3 output, dan bar audit `conversation_logs`.
- PPTX/PDF lokal juga 12 slide.


## Deck gabungan 15 slide (20 Nov 2026)

- Slide 12 dashboard: total saldo Rp50.218.900; pemasukan Rp51.610.000; pengeluaran Rp2.941.100; arus kas Rp48.668.900.
- Slide 13 hasil: ~5 detik, 3 kanal, 46 transaksi aktif, 168 log; 6 workflow, 898 eksekusi.
- Slide 14 roadmap: now/next/later.
- Slide 15 end-to-end: Telegram -> Caddy -> n8n -> Supabase -> output.
- Google Slides `Pundaria - Presentasi Gabungan` 15 slide.


## Lampiran screenshot (20 Nov 2026)

- 9 slide lampiran ditambahkan ke PPTX (total 24 slide).
- Screenshot diambil dari UI asli tanpa mengubah workflow/database/chat/aplikasi.
- Google Slides utama tetap 15 slide; file lampiran dapat diimpor lewat File > Import slides.


## Hitungan transaksi dashboard (20 Nov 2026)

- Dashboard menampilkan: 14 transaksi pemasukan, 36 transaksi pengeluaran, dan 50 transaksi non-transfer.
- `/rekap` menampilkan 50 transaksi; 3 transfer tidak dihitung.
- Tidak ada perubahan pada workflow n8n atau database.


## Workflow terbaru (20 Nov 2026)

- Enam workflow diekspor dari n8n live lalu dibandingkan dengan file paket: node count dan parameter sama.
- `Jadwal Pagi` tetap `0 8 * * *`; email bulanan `0 7 1 * *`.
- File paket tidak memuat chat ID atau email asli.
