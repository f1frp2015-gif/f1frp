#!/usr/bin/env bash
# Issue/renew the f1frp.com Let's Encrypt certificate and deploy it to the
# certificate paths already referenced by the production Nginx config.

set -Eeuo pipefail

readonly DOMAIN="f1frp.com"
readonly ALT_DOMAIN="www.f1frp.com"
readonly CONTACT_EMAIL="f1frp2015@gmail.com"
readonly CERT_NAME="f1frp.com"
readonly LIVE_DIR="/etc/letsencrypt/live/${CERT_NAME}"
readonly NGINX_CERT="/etc/nginx/ssl/f1frp.com.pem"
readonly NGINX_KEY="/etc/nginx/ssl/f1frp.com.key"
readonly INSTALLED_SCRIPT="/usr/local/sbin/f1frp-ensure-tls"
readonly SOURCE_SCRIPT="$(readlink -f "${BASH_SOURCE[0]}")"
readonly SOURCE_DIR="$(dirname "${SOURCE_SCRIPT}")"

log() {
  printf '[f1frp-tls] %s\n' "$*"
}

if [[ ${EUID} -ne 0 ]]; then
  log "ERROR: run as root."
  exit 1
fi

mkdir -p /run/lock
exec 9>/run/lock/f1frp-tls.lock
if ! flock -n 9; then
  log "Another certificate job is already running; exiting cleanly."
  exit 0
fi

# Always leave Nginx running, including when ACME validation fails after the
# standalone plugin has stopped it.
restore_nginx() {
  if ! systemctl is-active --quiet nginx; then
    log "Nginx is not active; starting it."
    systemctl start nginx
  fi
}
trap restore_nginx EXIT

install_certbot() {
  if command -v certbot >/dev/null 2>&1; then
    return
  fi

  log "Installing Certbot."
  if ! dnf install -y certbot; then
    log "Certbot is not in the enabled repositories; enabling EPEL."
    dnf install -y epel-release
    dnf install -y certbot
  fi
}

install_automation() {
  if [[ "${SOURCE_SCRIPT}" != "${INSTALLED_SCRIPT}" ]]; then
    install -m 0750 "${SOURCE_SCRIPT}" "${INSTALLED_SCRIPT}"
  fi

  if [[ -f "${SOURCE_DIR}/systemd/f1frp-tls-renew.service" && \
        -f "${SOURCE_DIR}/systemd/f1frp-tls-renew.timer" ]]; then
    install -m 0644 \
      "${SOURCE_DIR}/systemd/f1frp-tls-renew.service" \
      /etc/systemd/system/f1frp-tls-renew.service
    install -m 0644 \
      "${SOURCE_DIR}/systemd/f1frp-tls-renew.timer" \
      /etc/systemd/system/f1frp-tls-renew.timer
    systemctl daemon-reload
    systemctl enable --now f1frp-tls-renew.timer
  fi
}

validate_certificate_pair() {
  local cert_pubkey key_pubkey

  openssl x509 -in "${LIVE_DIR}/fullchain.pem" -noout -checkend 604800
  openssl x509 -in "${LIVE_DIR}/fullchain.pem" -noout -checkhost "${DOMAIN}"
  openssl x509 -in "${LIVE_DIR}/fullchain.pem" -noout -checkhost "${ALT_DOMAIN}"

  cert_pubkey=$(openssl x509 -in "${LIVE_DIR}/fullchain.pem" -pubkey -noout \
    | openssl pkey -pubin -outform DER \
    | sha256sum | awk '{print $1}')
  key_pubkey=$(openssl pkey -in "${LIVE_DIR}/privkey.pem" -pubout -outform DER \
    | sha256sum | awk '{print $1}')

  if [[ "${cert_pubkey}" != "${key_pubkey}" ]]; then
    log "ERROR: renewed certificate and private key do not match."
    exit 1
  fi
}

deploy_certificate() {
  local backup_dir cert_tmp key_tmp

  if [[ -f "${NGINX_CERT}" ]] && cmp -s "${LIVE_DIR}/fullchain.pem" "${NGINX_CERT}"; then
    log "Nginx already has the current Let's Encrypt certificate."
    return
  fi

  mkdir -p /etc/nginx/ssl
  backup_dir="/etc/nginx/ssl/archive/$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir -p "${backup_dir}"
  [[ -f "${NGINX_CERT}" ]] && cp -a "${NGINX_CERT}" "${backup_dir}/"
  [[ -f "${NGINX_KEY}" ]] && cp -a "${NGINX_KEY}" "${backup_dir}/"

  cert_tmp="${NGINX_CERT}.new"
  key_tmp="${NGINX_KEY}.new"
  install -m 0644 "${LIVE_DIR}/fullchain.pem" "${cert_tmp}"
  install -m 0600 "${LIVE_DIR}/privkey.pem" "${key_tmp}"
  mv -f "${cert_tmp}" "${NGINX_CERT}"
  mv -f "${key_tmp}" "${NGINX_KEY}"

  if ! nginx -t; then
    log "ERROR: Nginx rejected the renewed certificate; restoring the backup."
    [[ -f "${backup_dir}/f1frp.com.pem" ]] && \
      cp -a "${backup_dir}/f1frp.com.pem" "${NGINX_CERT}"
    [[ -f "${backup_dir}/f1frp.com.key" ]] && \
      cp -a "${backup_dir}/f1frp.com.key" "${NGINX_KEY}"
    exit 1
  fi

  systemctl reload nginx
  log "Nginx reloaded with the renewed certificate."
}

install_certbot
install_automation

log "Requesting or renewing the certificate for ${DOMAIN} and ${ALT_DOMAIN}."
certbot certonly \
  --standalone \
  --cert-name "${CERT_NAME}" \
  --domain "${DOMAIN}" \
  --domain "${ALT_DOMAIN}" \
  --preferred-challenges http \
  --non-interactive \
  --agree-tos \
  --no-eff-email \
  --email "${CONTACT_EMAIL}" \
  --keep-until-expiring \
  --pre-hook "/usr/bin/systemctl stop nginx" \
  --post-hook "/usr/bin/systemctl start nginx"

validate_certificate_pair
deploy_certificate

openssl x509 -in "${NGINX_CERT}" -noout -subject -issuer -dates
systemctl status f1frp-tls-renew.timer --no-pager
log "TLS certificate and automatic renewal are healthy."
