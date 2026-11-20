# Pundaria — Catatan Pembicara

Naskah presentasi formal untuk 19 slide terbaru.

## Slide 1 — Cover — Pundaria
**Tujuan:** Membuka presentasi, memperkenalkan Pundaria, dan menetapkan nada: masalah nyata, solusi yang sudah berjalan.

Selamat pagi, Bapak/Ibu. Saya [Nama], dan hari ini saya akan memperkenalkan Pundaria, asisten keuangan pribadi berbasis AI yang bekerja melalui Telegram.

Pundaria berangkat dari satu pengamatan sederhana: mencatat keuangan sering terasa seperti pekerjaan kedua. Kita tahu itu penting, tetapi prosesnya terlalu jauh dari kebiasaan sehari-hari. Pundaria mencoba menutup jarak itu dengan tiga hal: mencatat lewat chat, memproses foto struk dan pesan suara, lalu merapikan semuanya di satu dashboard.

Dalam presentasi ini, saya akan menunjukkan masalah yang kami lihat, solusi dan arsitektur teknisnya, serta bukti bahwa sistem ini sudah berjalan.

*Transisi: Mari kita mulai dengan alur presentasi.*

## Slide 2 — Agenda — Tiga bagian, satu alur
**Tujuan:** Memberi peta jalan presentasi agar audience tahu apa yang akan mereka lihat.

Presentasi ini saya bagi menjadi tiga bagian.

Bagian pertama adalah pembukaan dan problem statement: masalah apa yang sebenarnya ingin diselesaikan, dan mengapa pendekatan yang ada belum cukup.

Bagian kedua adalah solusi dan teknis: bagaimana Pundaria dirancang, bagaimana alurnya, dan bagaimana AI dijaga agar tetap aman dan dapat diaudit.

Bagian ketiga adalah hasil dan pengembangan selanjutnya: apa yang sudah berjalan, bukti pengujian, dan arah berikutnya. Bagian teknis akan menjadi porsi terbesar, karena di situlah nilai utama Pundaria berada.

*Transisi: Kita mulai dari masalah.*

## Slide 3 — Masalah — Mencatat masih terasa seperti pekerjaan kedua
**Tujuan:** Membuat audience mengenali pain point sebelum melihat data.

Ada tiga friksi utama yang membuat pencatatan keuangan berhenti di tengah jalan.

Pertama, friksi input. Membuka aplikasi, mengisi formulir, memilih kategori, lalu menyimpan terlalu banyak langkah untuk sesuatu yang terjadi puluhan kali dalam sebulan.

Kedua, data tersebar. Uang kita ada di bank, e-wallet, cash, dan mungkin spreadsheet. Tidak ada satu tempat yang benar-benar rapi.

Ketiga, angka ada tetapi insight tidak. Kita bisa menghitung total bulanan, tetapi sulit tahu ke mana uang pergi dan apa yang harus diubah.

Kutipan di slide ini merangkum semuanya: orang sudah tahu harus mencatat, tetapi prosesnya terasa seperti kerja tambahan. Yang dibutuhkan bukan aplikasi baru, melainkan cara mencatat yang sudah ada di kebiasaan mereka: chat.

*Transisi: Pertanyaannya, sebesar apa masalah ini sebenarnya?*

## Slide 4 — Data literasi finansial — SNLIK 2026
**Tujuan:** Menunjukkan bahwa masalah ini nyata dan berskala, bukan hanya pengalaman pribadi.

Data terbaru dari OJK, LPS, dan BPS pada SNLIK 2026 menunjukkan indeks literasi keuangan masyarakat Indonesia berada di 69,57 persen. Artinya, sekitar tujuh dari sepuluh orang sudah melek finansial. Indeks inklusi keuangan bahkan mencapai 93,61 persen.

Ini kabar baik. Namun angka itu juga memberi pesan penting: tantangannya bukan lagi sekadar tahu, tetapi konsisten mencatat dan mengambil keputusan. Literasi naik 2,93 poin persen dari 2025, tetapi kebiasaan mencatat belum tentu ikut naik.

Sekitar 30,43 persen masyarakat masih belum melek finansial. Jadi alat yang kita buat harus mengurangi friksi, bukan menambah beban. Itulah alasan Pundaria memilih chat sebagai antarmuka utama.

*Transisi: Dari data itu, kami merumuskan pendekatan yang lebih sederhana.*

## Slide 5 — Kenapa diotomasi — Dari friksi ke kebiasaan
**Tujuan:** Membandingkan proses manual dengan Pundaria secara konkret.

Di sisi kiri, proses manual membutuhkan sekitar satu sampai dua menit: buka aplikasi, isi formulir, pilih kategori, rekap manual, dan sering berhenti karena lupa atau lelah.

Di sisi kanan, Pundaria cukup menerima satu pesan seperti, “beli pulsa 10 ribu pakai Gopay.” AI membaca jenis transaksi, nominal, kategori, dan dompet. Nilainya divalidasi ke database sebelum disimpan. Saldo, anggaran, dan pengingat diperbarui otomatis.

Prinsip kami sederhana: catat dulu, rapikan otomatis, baru ambil insight. Jangan meminta pengguna mengubah kebiasaan; tempelkan pencatatan pada kebiasaan yang sudah ada, yaitu chat.

*Transisi: Dengan prinsip itu, kami menyusun pendekatan teknisnya.*

## Slide 6 — Pendekatan — Phase 2 + Phase 3
**Tujuan:** Menjelaskan pilihan arsitektur: otomasi yang bisa diaudit, bukan agent otonom penuh.

Pundaria tidak memakai agent otonom penuh. Kami memilih kombinasi Phase 2 dan Phase 3.

Phase 2 adalah automation and orchestration. n8n mengatur tools, workflow, jadwal, logging, dan integrasi ke Supabase. Bagian ini yang menjaga sistem tetap reliabel, dapat diaudit, dan murah.

Phase 3 adalah AI agent. AI dipakai untuk memahami bahasa: intent, ekstraksi transaksi, OCR struk, transkripsi suara, dan tanya-jawab dengan memori. AI memahami, n8n mengeksekusi, dan database menjadi sumber kebenaran.

Tiga prinsip yang kami pegang: reliable, auditable, dan cost-aware. Uang tidak boleh ditebak.

*Transisi: Berikutnya, saya akan menunjukkan bagaimana seluruh komponen ini terhubung.*

## Slide 7 — Arsitektur — Satu jalur data, dua antarmuka
**Tujuan:** Menjelaskan alur data dari Telegram sampai output.

Alurnya dimulai dari Telegram. Setiap update masuk melalui webhook yang dilindungi HTTPS dan reverse proxy Caddy, lalu diteruskan ke n8n.

n8n adalah orkestrator. Di sinilah pesan diklasifikasikan, diproses, dan diarahkan ke workflow yang tepat. Untuk kebutuhan pemahaman bahasa, n8n memanggil OpenAI: GPT-4o mini, vision, audio, dan agent dengan memori.

Hasil akhirnya disimpan di Supabase sebagai sumber kebenaran. Dashboard Next.js membaca data yang sama untuk ditampilkan, dikoreksi, dan diaudit. Ada tiga output utama: balasan Telegram, dashboard admin, dan email rekap bulanan.

Dari sisi keamanan, service role key hanya ada di server, RLS aktif, dashboard dilindungi JWT, dan webhook memakai secret.

*Transisi: Sekarang mari kita lihat pengalaman penggunanya.*

## Slide 8 — Mockup Telegram — Lima detik untuk mencatat
**Tujuan:** Memperlihatkan pengalaman mencatat lewat chat.

Di Telegram, tidak ada formulir. Pengguna cukup menulis seperti biasa, mengirim foto struk, atau mengirim pesan suara.

Contohnya, “beli pulsa 10 ribu pakai Gopay.” Bot akan membalas dengan ID transaksi, nominal, tanggal, dan dompet yang digunakan. Saldo Gopay langsung berkurang.

Pengguna juga bisa mengetik “/saldo” untuk melihat saldo tiap dompet, atau membuat pengingat dengan bahasa alami, misalnya “ingatkan bayar listrik jam 9.”

Rata-rata prosesnya sekitar lima detik. Satu langkah, tanpa formulir, dan transparan karena bot selalu menampilkan hasil pencatatannya.

*Transisi: Kalau bot dipakai untuk mencatat, dashboard dipakai untuk mengendalikan.*

## Slide 9 — Mockup Dashboard — Melihat, mengoreksi, mengaudit
**Tujuan:** Menunjukkan dashboard sebagai pusat kontrol, bukan sekadar tampilan.

Dashboard adalah tempat admin melihat gambaran utuh: total saldo, pemasukan, pengeluaran, dan arus kas bersih. Di bawahnya ada grafik arus kas dan pemakaian anggaran per kategori.

Dashboard ini bukan hanya untuk melihat. Admin bisa menambah, mengubah, dan menghapus transaksi, mengelola dompet dan anggaran, serta mengekspor data ke CSV. Ada juga log percakapan untuk audit dan halaman Bantuan untuk daftar perintah.

Karena dashboard bisa dipasang sebagai PWA, pengalaman di ponsel terasa seperti aplikasi, tanpa perlu install dari app store. Prinsipnya: bot untuk kecepatan, dashboard untuk kontrol.

*Transisi: Setelah melihat produknya, mari kita bicara tentang arah pengembangan.*

## Slide 10 — Roadmap — Dari asisten pribadi ke kebiasaan finansial
**Tujuan:** Menutup bagian produk dengan rencana berikutnya.

Saat ini Pundaria sudah memiliki Dashboard, tabel transaksi, dompet, anggaran, transaksi rutin, pengingat, log percakapan, dan perintah slash.

Prioritas berikutnya adalah memperdalam kemampuan finansial: utang dan piutang dengan jatuh tempo, target tabungan, dana darurat, serta aset dan investasi. Multi-user login dashboard kami tempatkan sebagai opsi jika nanti Pundaria digunakan lebih dari satu orang, bukan sebagai prioritas utama.

Fokus kami tetap sama: keandalan data dulu, baru kedalaman fitur. Fitur sebagus apa pun tidak berarti kalau data tidak bisa dipercaya.

*Transisi: Sebelum menutup, saya ingin menunjukkan bukti teknisnya.*

## Slide 11 — Dokumentasi — Pembatas lampiran
**Tujuan:** Menandai bahwa slide berikutnya adalah lampiran teknis, bukan bagian utama presentasi.

Bagian ini adalah lampiran teknis. Saya tidak akan membacakan semuanya, tetapi saya siapkan agar kita bisa membahas detail implementasi jika ada pertanyaan.

[Jika waktu terbatas, slide ini dan enam slide workflow berikutnya dapat dilewati.]

*Transisi: Jika ada pertanyaan tentang alur teknis, kita bisa melihat workflow berikut.*

## Slide 12 — Lampiran — Workflow Router
**Tujuan:** Backup: menjelaskan pintu masuk semua pesan.

Workflow Router adalah pintu masuk semua update Telegram. Telegram Trigger menerima pesan, Normalisasi Pesan memvalidasi chat, teks, foto, dan suara, lalu Router mengarahkan ke jalur Pemrosesan, Perintah, atau Log. Setiap pesan masuk dan keluar dicatat ke database.

*Transisi: Workflow berikutnya menangani isi pesannya.*

## Slide 13 — Lampiran — Workflow Pemrosesan
**Tujuan:** Backup: menjelaskan pemrosesan teks, foto, dan suara.

Workflow Pemrosesan mengubah input menjadi transaksi. Teks diekstrak, foto dibaca dengan OCR, dan suara ditranskripsi. Hasilnya divalidasi, lalu disimpan ke Supabase melalui RPC. Setelah itu bot mengirim balasan konfirmasi ke Telegram.

*Transisi: Ada juga jalur khusus untuk pertanyaan.*

## Slide 14 — Lampiran — Workflow Tanya
**Tujuan:** Backup: menjelaskan agen tanya read-only.

Workflow Tanya adalah agen read-only. Ia membaca saldo, rekap, dan anggaran, tetapi tidak menulis atau mengubah data. Jawaban memakai konteks dan memori sesi, sehingga cocok untuk pertanyaan seperti “bulan ini makan berapa?”.

*Transisi: Untuk perintah eksplisit, ada jalur tersendiri.*

## Slide 15 — Lampiran — Workflow Perintah
**Tujuan:** Backup: menjelaskan perintah deterministik.

Workflow Perintah menangani perintah eksplisit seperti /saldo, /rekap, /anggaran, /pindah, /hapus, /undo, /rutin, dan /ingatkan. Argumen divalidasi sebelum SQL dijalankan, lalu hasilnya langsung dibalas ke Telegram.

*Transisi: Selain interaksi langsung, ada workflow terjadwal.*

## Slide 16 — Lampiran — Workflow Jadwal
**Tujuan:** Backup: menjelaskan lima Schedule Trigger.

Workflow Jadwal memakai lima Schedule Trigger: rekap pagi, laporan mingguan, transaksi rutin, pengingat waktu, dan email rekap bulanan. Branch email membuat CSV transaksi bulan sebelumnya dan mengirimkannya lewat SMTP.

*Transisi: Jika ada kegagalan, ada workflow khusus yang menanganinya.*

## Slide 17 — Lampiran — Error Handler
**Tujuan:** Backup: menjelaskan penanganan error.

Error Handler menangkap kegagalan dari workflow lain. Pesan error dikirim ke Telegram admin, sehingga masalah bisa diketahui tanpa mengecek server secara manual. Workflow ini tidak mengubah data transaksi.

*Transisi: Terakhir, ini adalah struktur datanya.*

## Slide 18 — Lampiran — Supabase Database
**Tujuan:** Backup: menjelaskan tabel utama.

Semua data bermuara di Supabase. Tabel accounts menyimpan dompet dan saldo awal. transactions menyimpan pemasukan, pengeluaran, dan transfer. conversation_logs menyimpan audit pesan masuk dan keluar. Ada juga budgets, recurring, dan reminders.

Satu sumber kebenaran, sehingga bot dan dashboard selalu membaca data yang sama.

*Transisi: Saya tutup dengan ringkasan.*

## Slide 19 — Closing — Dari Chat Menjadi Keputusan Bijak
**Tujuan:** Menutup presentasi dan membuka sesi tanya jawab.

Pundaria lahir dari satu keyakinan: keputusan finansial yang lebih baik dimulai dari kebiasaan mencatat yang lebih mudah. Dengan Telegram, foto struk, pesan suara, dan dashboard yang terhubung, kami mencoba menurunkan friksi itu sedekat mungkin dengan kehidupan sehari-hari.

Sistem ini sudah berjalan, sudah diuji, dan sudah dipakai. Ke depan, kami akan memperdalam fitur finansial seperti utang-piutang, target tabungan, dan aset, sambil menjaga keandalan data.

Terima kasih. Saya terbuka untuk pertanyaan dan masukan.
