# Deploy ke VPS

Panduan generik Ubuntu/Debian VPS. Untuk EC2, buka port 80/443 di Security Group.

## 1. Prasyarat server

- Ubuntu 22.04/24.04 (atau distro dengan Docker)
- IP publik statis
- Domain/DuckDNS mengarah ke IP server
- Port TCP 80 dan 443 terbuka

Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
newgrp docker
docker compose version
```

## 2. Copy project

```bash
sudo mkdir -p /opt/finance-tracker
sudo chown "$USER":"$USER" /opt/finance-tracker
# copy isi folder project ke /opt/finance-tracker
cd /opt/finance-tracker
```

## 3. Konfigurasi

```bash
cp .env.example .env
nano .env
```

Isi:

- `FINANCE_HOST` = domain
- `FINANCE_EDITOR_IP` = IP publik kamu (`curl -4 -s https://api.ipify.org`)
- `POSTGRES_PASSWORD` = password kuat
- `N8N_ENCRYPTION_KEY` = `openssl rand -hex 32`
- `N8N_RUNNERS_AUTH_TOKEN` = `openssl rand -hex 32`

## 4. Firewall dan DNS

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

A record domain → IP VPS. Kalau memakai DuckDNS dinamis:

```bash
docker compose --profile duckdns up -d
```

## 5. Jalankan

```bash
docker compose up -d
docker compose ps
docker compose logs --tail 50 caddy
```

Caddy akan mengambil sertifikat HTTPS otomatis. Cek:

```bash
curl -I https://DOMAIN/
```

Dari IP editor, responsnya halaman n8n. Dari IP lain, `404` adalah normal.

## 6. Editor n8n

Dari IP yang diizinkan:

```text
https://DOMAIN/
```

Alternatif aman tanpa membuka editor ke publik:

```bash
ssh -L 5678:127.0.0.1:5678 user@SERVER
# lalu buka http://localhost:5678
```

## 6b. Dashboard

- A record `DASHBOARD_HOST` → IP server yang sama.
- Isi `.env`: `DASHBOARD_HOST`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- Bangun dan jalankan:

```bash
docker compose up -d --build
docker compose logs -f dashboard
```

- Buka `https://DASHBOARD_HOST/login`.
- Jalankan `supabase/002-dashboard.sql` agar log percakapan dan RLS aktif.

## 7. Supabase dan workflow

Ikuti:

- `supabase/README.md`
- `workflows/README.md`
- `README.md` bagian Setup n8n

## 8. Update

```bash
cd /opt/finance-tracker
docker compose pull
docker compose up -d
```

## 9. Backup

```bash
docker compose exec -T postgres pg_dump -U finance finance > finance-backup.sql
```

Simpan juga `.env` (khususnya `N8N_ENCRYPTION_KEY`).

## 10. Pindah server

1. Copy project + `.env`.
2. Restore database.
3. Jangan ganti `N8N_ENCRYPTION_KEY`.
4. Arahkan DNS ke IP baru.
5. `docker compose up -d`.
6. Di n8n: **Router → Unpublish → Publish**.
7. Tes `/saldo`.

Bot/token/akun Telegram tetap sama; yang berubah hanya URL webhook.
