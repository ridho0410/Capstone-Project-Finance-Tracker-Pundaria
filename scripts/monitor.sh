#!/usr/bin/env bash
set -u

BASE_DIR="${BASE_DIR:-/home/ubuntu/finance-tracker}"
ENV_FILE="$BASE_DIR/scripts/monitor.env"
STATE_FILE="$BASE_DIR/monitor/down"
DASH_URL="${DASH_URL:-https://pa-pro-dashboard.duckdns.org/login}"
N8N_URL="${N8N_URL:-https://pa-pro.duckdns.org/healthz}"

mkdir -p "$BASE_DIR/monitor"
# shellcheck disable=SC1090
source "$ENV_FILE"

send() {
  curl -fsS --max-time 15 \
    -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    --data-urlencode "text=$1" >/dev/null 2>&1
}

check() {
  curl -fsS -o /dev/null --max-time 15 "$1" >/dev/null 2>&1
}

problems=()
check "$DASH_URL" || problems+=("dashboard")
check "$N8N_URL" || problems+=("n8n")

if [ ${#problems[@]} -eq 0 ]; then
  if [ -f "$STATE_FILE" ]; then
    send "Pundaria pulih: dashboard dan n8n normal kembali."
    rm -f "$STATE_FILE"
  fi
  echo "$(date -Is) OK"
  exit 0
fi

msg="Pundaria ALERT: ${problems[*]} tidak merespons."
now=$(date +%s)
last=0
if [ -f "$STATE_FILE" ]; then
  last=$(cat "$STATE_FILE" 2>/dev/null || echo 0)
fi
if [ $((now - last)) -ge 1800 ]; then
  send "$msg"
  echo "$now" > "$STATE_FILE"
  echo "$(date -Is) ALERT ${problems[*]}"
else
  echo "$(date -Is) still down (alert suppressed)"
fi
