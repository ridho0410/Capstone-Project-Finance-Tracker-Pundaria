# Troubleshooting

## Cek cepat

```bash
docker compose ps
docker compose logs --tail 100 n8n
docker compose logs --tail 100 caddy
```

## Telegram tidak membalas

### 1. Cek webhook

```bash
read -rsp "Bot token: " TOKEN; echo
curl -s "https://api.telegram.org/bot$TOKEN/getWebhookInfo" | python3 -m json.tool
unset TOKEN
```

Yang harus benar:

- `url` = `https://DOMAIN/webhook/<uuid>/webhook`
- `pending_update_count` = 0
- `last_error_message` kosong / error lama

Jika `url` kosong atau salah:

- Buka Router di n8n.
- **Unpublish → Publish**.
- Cek lagi.

Jangan set webhook manual dengan secret sendiri; n8n yang mengatur secret.

### 2. Cek Caddy

```bash
docker compose logs --tail 100 caddy
```

Caddy harus jalan dan punya sertifikat untuk domain. Dari luar:

```bash
curl -I https://DOMAIN/
```

- `200`/`404` dengan sertifikat valid = Caddy hidup.
- `connection refused` = Caddy mati/port tertutup.

### 3. Cek chat ID

Di Router → Telegram Trigger → Additional Fields → **Chat IDs** harus sama dengan chat ID kamu. Kalau tidak cocok, Telegram tetap mengirim update tetapi n8n mengabaikannya (tidak ada execution).

### 4. Cek execution

Di n8n → **Executions**. Kalau tidak ada execution sama sekali, masalahnya di webhook/Caddy/chat ID. Kalau ada execution error, buka node yang merah.

## Error umum

| Error | Arti | Solusi |
|---|---|---|
| `404 Not Found` dari Telegram | URL webhook salah / Router belum publish / Caddy belum jalan | Publish Router, cek `getWebhookInfo`, cek Caddy |
| `403 Forbidden` | Secret token tidak cocok | Unpublish → Publish Router; jangan set manual |
| `Connection refused` | Caddy mati / 443 tertutup | `docker compose up -d`, cek firewall/port forwarding |
| `Bad Request: chat_id is empty` | Node balasan tidak mendapat chat ID | Pastikan memakai `$('Execute Workflow Trigger').first().json.chatId` |
| Credential merah | Credential belum dipilih | Pilih credential di node |
| `password authentication failed` | Password Supabase salah | Perbaiki credential `Supabase Finance` |
| `ECONNREFUSED` ke Supabase | Host/port salah atau IPv6 | Pakai Session pooler Supabase |
| Node Python error | Task runner tidak jalan | `docker compose logs task-runners`; pastikan `N8N_RUNNERS_AUTH_TOKEN` sama |
| Editor tidak bisa dibuka | IP editor tidak cocok | `curl -4 -s https://api.ipify.org`, update `.env` |

## Editor terkunci

Caddy hanya mengizinkan `FINANCE_EDITOR_IP`.

```bash
curl -4 -s https://api.ipify.org
```

Update `.env`:

```dotenv
FINANCE_EDITOR_IP=IP_BARU
```

Lalu:

```bash
docker compose up -d --no-deps caddy
```

Alternatif: SSH tunnel.

```bash
ssh -L 5678:127.0.0.1:5678 user@SERVER
# buka http://localhost:5678
```

## WebhookId berubah

Caddy mengizinkan `POST /webhook/*`, jadi tidak perlu edit Caddy. Cukup:

1. Router → **Unpublish**.
2. **Publish**.
3. Tes `/saldo`.

## Ganti domain / pindah server

Lihat `docs/RUNBOOK-telegram.md`.

## Restart dan reload

```bash
docker compose restart n8n
docker compose up -d --no-deps caddy n8n
```

Validasi Caddy:

```bash
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

## Logs yang berguna

```bash
docker compose logs -f n8n
docker compose logs -f task-runners
docker compose logs -f caddy
```

## Dashboard

| Gejala | Solusi |
|---|---|
| 502 Bad Gateway | `docker compose ps`; pastikan `dashboard` jalan; cek `docker compose logs dashboard` |
| Login gagal | Cek `ADMIN_EMAIL`/`ADMIN_PASSWORD`; `docker compose up -d dashboard` |
| Cookie tidak tersimpan | Akses lewat HTTPS; cookie `Secure` tidak dipakai di HTTP |
| Log percakapan kosong | Jalankan `002-dashboard.sql`; cek node `Log Masuk`/`Log Keluar` |
| Tanggal selisih | `formatDate` memakai `Asia/Jakarta`; container boleh UTC |
| Dashboard 404 | Caddy `DASHBOARD_HOST` harus mengarah ke service `dashboard:3000` |

## Masih gagal?

Kumpulkan:

- `getWebhookInfo`
- `docker compose ps`
- log Caddy 50 baris
- execution ID dan node yang error
- screenshot error n8n

Jangan kirim token bot, password database, atau isi `.env`.
