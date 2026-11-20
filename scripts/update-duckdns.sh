#!/bin/sh
set -eu

case "$DUCKDNS_SUBDOMAIN" in
  ''|*[!a-z0-9-]*) echo 'Subdomain DuckDNS tidak valid.' >&2; exit 1 ;;
esac
case "$DUCKDNS_TOKEN" in
  ''|*[!0-9a-fA-F-]*) echo 'Format token DuckDNS tidak valid.' >&2; exit 1 ;;
esac

while :; do
  # Kirim konfigurasi melalui stdin agar token tidak masuk argumen proses curl.
  if result=$(printf '%s\n' \
      'url = "https://www.duckdns.org/update"' \
      'get' \
      "data-urlencode = \"domains=$DUCKDNS_SUBDOMAIN\"" \
      "data-urlencode = \"token=$DUCKDNS_TOKEN\"" \
      'data-urlencode = "ip="' |
      curl --disable --ipv4 --fail --silent --show-error --max-time 20 --config -) && [ "$result" = OK ]; then
    echo 'DuckDNS OK'
  else
    echo 'Update DuckDNS gagal. Periksa koneksi, subdomain, dan token.' >&2
  fi
  sleep 300
done
