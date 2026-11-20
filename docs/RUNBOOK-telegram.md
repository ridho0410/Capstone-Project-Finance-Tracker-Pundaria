# Runbook Telegram - Pundaria

## Prinsip

- Bot Telegram terikat ke **token bot**, bukan ke server.
- Pindah server/domain tidak perlu mengganti akun Telegram atau chat ID.
- Caddy sekarang mengizinkan `POST /webhook/*` dan `/webhook-test/*`, jadi **ganti `webhookId` Router tidak perlu edit Caddy**.
- Setelah mengubah node Telegram Trigger, **Unpublish → Publish** Router di n8n agar n8n memanggil `setWebhook` ke Telegram.
- Perintah di bawah memakai paket ini (`compose.yaml` + `.env`). Di server lama yang memakai `compose.ec2.yaml` + `.env.ec2`, sesuaikan `-f` dan `--env-file`.

## Catat pengeluaran dari dompet tertentu

- Sebut nama dompet di pesan: `beli pulsa 10rb pakai gopay` atau `pengeluaran makan 25rb dompet bca`.
- Bot menyimpan transaksi ke dompet itu; saldo dompet = saldo awal + pemasukan - pengeluaran.
- Tanpa nama dompet, transaksi masuk ke dompet utama.
- Top up bukan pengeluaran: `/pindah 100000 BCA Gopay`.
- Nama dompet harus sama dengan yang ada di dashboard (tidak peka huruf besar/kecil). Kalau tidak dikenal, transaksi gagal dan tidak tersimpan.

## Dompet baru dari chat

```text
/dompet
/dompet tambah BCA
/dompet tambah Jago ewallet
```

Jenis dompet opsional: `bank` (default), `ewallet`, `cash`. Setelah dibuat, dompet langsung bisa dipakai mencatat transaksi. Dompet tetap juga bisa dibuat dari dashboard **Dompet**.

## Cek webhook Telegram (aman, token tidak masuk history)

```bash
read -rsp "Bot token: " TOKEN; echo
curl -s "https://api.telegram.org/bot$TOKEN/getWebhookInfo" | python3 -m json.tool
unset TOKEN
```

Yang dilihat:
- `url` harus `https://DOMAIN/webhook/<uuid>/webhook`
- `pending_update_count` harus 0
- `last_error_message` kosong / error lama

## Kalau webhookId Router berubah

Tidak ada command Caddy. Cukup:

1. Buka workflow **Expense Tracker - Router** di n8n.
2. **Unpublish → Publish**.
3. Kirim `/saldo` dari Telegram.

Kalau mau lewat server, restart Caddy tidak diperlukan.

## Kalau pindah domain / IP publik (server tetap)

```bash
cd /opt/finance-tracker
nano .env
# FINANCE_HOST=domain-baru.duckdns.org
# FINANCE_EDITOR_IP=<IP publik kamu sekarang>

curl -4 -s https://api.ipify.org   # cek IP publik
```

Recreate Caddy + n8n:

```bash
docker compose up -d --no-deps caddy n8n
```

Validasi + reload Caddy:

```bash
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

Lalu di n8n: **Router → Unpublish → Publish**.

Pastikan juga:
- A record DuckDNS → IP publik baru
- Port forwarding TCP 80/443 (kalau di rumah)
- `FINANCE_EDITOR_IP` = IP publik kamu (kalau berubah, editor bisa terkunci)

## Kalau pindah server baru

1. Copy folder project + `.env` + `compose.yaml` + `Caddyfile`.
2. **Jangan ganti `N8N_ENCRYPTION_KEY`** kalau ingin credential lama tetap bisa dibaca.
3. Backup database lama:

```bash
docker compose exec -T postgres pg_dump -U finance finance > finance-backup.sql
```

4. Restore di server baru:

```bash
cat finance-backup.sql | docker compose exec -T postgres psql -U finance finance
```

5. Jalankan stack:

```bash
docker compose up -d
```

6. Di n8n: **Router → Unpublish → Publish**.

## Cek Caddy

```bash
docker compose ps
docker compose logs --tail 50 caddy
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

## Arti error

| Gejala | Penyebab | Tindakan |
|---|---|---|
| Telegram 404 | URL webhook salah / Caddy masih config lama / belum publish | Cek `getWebhookInfo.url`, publish ulang Router |
| Telegram 403 | Secret token tidak cocok | Publish ulang Router; jangan set webhook manual dengan secret lain |
| Connection refused | Caddy mati / port 443 tertutup | `docker ps`, cek firewall/port forwarding |
| `pending_update_count` > 0 | Telegram belum berhasil kirim | Cek `last_error_message` dan log Caddy |

## Caddyfile yang dipakai

```caddyfile
{$FINANCE_HOST} {
  @telegram {
    method POST
    path /webhook/* /webhook-test/*
  }
  handle @telegram {
    reverse_proxy n8n:5678
  }
  @trustedEditor {
    remote_ip {$FINANCE_EDITOR_IP}
  }
  handle @trustedEditor {
    reverse_proxy n8n:5678
  }
  handle {
    respond 404
  }
}
```

Catatan keamanan: semua `POST /webhook/*` bisa mencapai n8n. Webhook baru di luar Telegram harus punya autentikasi sendiri.

## Dashboard

```bash
docker compose up -d --build dashboard
docker compose logs -f dashboard
docker compose restart dashboard
```

- URL: `https://DASHBOARD_HOST/login`
- Login: `ADMIN_EMAIL` / `ADMIN_PASSWORD` di `.env`
- Kalau 502: pastikan container `dashboard` jalan dan berada di network yang sama dengan Caddy.
- Kalau login gagal: cek env, lalu `docker compose up -d dashboard`.
- Kalau log kosong: jalankan `supabase/002-dashboard.sql` dan cek node `Log Masuk`/`Log Keluar`.

## Webhook host setelah pindah IP

`N8N_WEBHOOK_URL` memakai `https://DASHBOARD_HOST/`. Setelah IP server berubah:

1. Update DuckDNS `FINANCE_HOST` dan `DASHBOARD_HOST` ke IP baru.
2. `docker compose up -d --no-deps caddy n8n dashboard`.
3. Cek `getWebhookInfo`; kalau masih IP lama, set webhook ulang ke `https://DASHBOARD_HOST/webhook/<webhookId>/webhook` dengan secret dari n8n.
4. Kirim `/saldo`.

Host dashboard juga menerima `/webhook/*`, jadi webhook tidak bergantung pada cache DNS `FINANCE_HOST`.

## Elastic IP dan pergantian IP

Instance live memakai Elastic IP `203.0.113.10`. EIP tetap sama saat instance stop/start.

Kalau mengganti EIP:

1. AWS Console -> EC2 -> Elastic IPs -> Allocate Elastic IP address.
2. Associate ke instance `i-EXAMPLE`.
3. Update DuckDNS:

```bash
curl "https://www.duckdns.org/update?domains=pa-pro,pa-pro-dashboard&token=$DUCKDNS_TOKEN&ip=$NEW_IP"
```

4. Paksa Telegram resolve ulang:

```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook?drop_pending_updates=false"
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  --data-urlencode "url=https://pa-pro-dashboard.duckdns.org/webhook/00080e30-be54-487c-82dc-77b8cac70347/webhook" \
  --data-urlencode "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
  --data-urlencode 'allowed_updates=["message","callback_query"]'
```

5. Cek `getWebhookInfo`; `ip_address` harus IP baru.
6. Cek dashboard, n8n editor, dan `/saldo`.

Kalau IP publik klien berubah, update `FINANCE_EDITOR_IP` di `.env.ec2`, lalu recreate Caddy:

```bash
docker compose --env-file .env.ec2 -f compose.ec2.yaml -f compose.dashboard.yaml --profile public up -d --no-deps caddy
```

## Editor n8n publik (login n8n)

Server live `pa-pro.duckdns.org` terbuka untuk editor n8n dari perangkat/WiFi mana pun, tanpa basic auth Caddy. Gerbangnya adalah login n8n (email/password).

- Basic auth Caddy sudah dihapus.
- `/webhook/*` tetap publik untuk Telegram dan dilindungi secret token.
- Pastikan password n8n kuat dan tidak dibagikan.
- Kalau browser masih menampilkan dialog basic auth lama, klik **Cancel** atau tekan **Esc**, lalu reload.
- SSH tetap dibatasi Security Group; untuk SSH dari mana saja gunakan Tailscale.


## Rekap email bulanan

- Workflow: `Expense Tracker - Jadwal`, branch `Jadwal Email Bulanan` / `Manual Email`.
- Cron: `0 7 1 * *` (tanggal 1, 07.00 WIB).
- Credential: `SMTP account` (Gmail SMTP `smtp.gmail.com:465`, SSL/TLS).
- Pengirim/penerima: `admin@example.com`.
- Lampiran: `pundaria-rekap-YYYY-MM.csv`.
- Tes manual: buka workflow Jadwal -> node **Manual Email** -> **Execute workflow**.
- Kalau gagal: cek execution n8n, credential SMTP, dan App Password Gmail.


## Monitoring uptime

- Script: `/home/ubuntu/finance-tracker/scripts/monitor.sh`
- Cron tiap 5 menit: `*/5 * * * *`
- Log: `/home/ubuntu/finance-tracker/monitor/monitor.log`
- Yang dicek: dashboard `/login` dan n8n `/healthz` (HTTP 200).
- Saat down: alert Telegram, maksimal sekali per 30 menit.
- Saat pulih: pesan "Pundaria pulih" sekali.
- Token bot disimpan di `scripts/monitor.env` (chmod 600). Jangan commit atau masukkan ke ZIP.
- Tes: `DASH_URL=http://127.0.0.1:9 bash scripts/monitor.sh` lalu jalankan normal untuk menguji pesan pulih.

## PWA dan halaman Bantuan

- Dashboard bisa dipasang lewat ikon **Install** di Chrome/Edge, atau **Add to Home Screen** di HP.
- Manifest: `/manifest.webmanifest`; service worker: `/sw.js`; ikon: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`.
- Halaman Bantuan: `/help` (ada di sidebar).
- Service worker sengaja tanpa cache supaya dashboard selalu menampilkan data terbaru.


## Setelah mengubah jadwal / publish workflow

n8n 2.x kadang belum mendaftarkan ulang Schedule Trigger setelah import/publish lewat CLI atau UI. Gejalanya: workflow `active`, tetapi tidak ada execution sama sekali.

Langkah aman:

1. Publish workflow di editor n8n.
2. Restart container n8n:
   ```bash
   sudo docker restart finance-tracker-n8n-1
   ```
3. Tunggu 1–5 menit, lalu cek **Executions**.
4. Untuk `Jadwal Pagi`, cek execution sekitar jam 08.00 WIB.
