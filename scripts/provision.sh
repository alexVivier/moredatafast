#!/usr/bin/env bash
# =============================================================================
# DataFast Dashboard — VPS bootstrap script
#
# Runs once on a fresh Ubuntu 24.04 LTS droplet as root:
#   ssh root@<droplet-ip> bash -s < scripts/provision.sh
#
# Sets up:
#   - OS updates + swap
#   - non-root `deploy` user (SSH key inherited from root)
#   - SSH hardening (root login + password auth disabled)
#   - UFW firewall (22, 80, 443)
#   - Docker + compose plugin
#   - /opt/datafast directory for the app
# =============================================================================
set -euo pipefail

log() { echo -e "\n\033[1;34m[provision]\033[0m $*"; }

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root (use: ssh root@ip bash -s < scripts/provision.sh)"
  exit 1
fi

# -----------------------------------------------------------------------------
log "updating apt and installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  ca-certificates curl gnupg \
  ufw fail2ban \
  unattended-upgrades \
  htop vim

# -----------------------------------------------------------------------------
log "creating 2G swap file"
if [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.d/99-swappiness.conf
else
  log "swapfile already exists — skipping"
fi

# -----------------------------------------------------------------------------
log "creating non-root user 'deploy' with sudo + docker access"
if ! id -u deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
  usermod -aG sudo deploy
  # Passwordless sudo for the deploy user (SSH-key-only authentication).
  echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
  chmod 440 /etc/sudoers.d/deploy
  # Copy root's authorized_keys so the same key works for deploy.
  mkdir -p /home/deploy/.ssh
  if [[ -f /root/.ssh/authorized_keys ]]; then
    cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
  fi
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
else
  log "user 'deploy' already exists — skipping"
fi

# -----------------------------------------------------------------------------
log "hardening SSH (disable root login + password auth)"
SSHD=/etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' $SSHD
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' $SSHD
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' $SSHD
systemctl restart ssh

# -----------------------------------------------------------------------------
log "enabling UFW (22, 80, 443)"
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# -----------------------------------------------------------------------------
log "enabling unattended security upgrades"
dpkg-reconfigure -plow unattended-upgrades || true
systemctl enable --now unattended-upgrades

# -----------------------------------------------------------------------------
log "installing Docker engine + compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker deploy
  systemctl enable --now docker
else
  log "docker already installed — skipping"
fi

# -----------------------------------------------------------------------------
log "creating /opt/datafast (owned by deploy)"
mkdir -p /opt/datafast
chown -R deploy:deploy /opt/datafast

# -----------------------------------------------------------------------------
cat <<EOF

\033[1;32m[provision] complete.\033[0m

Next steps (run locally or from your laptop):

1. SSH in as the new user to confirm it works:
     ssh deploy@<droplet-ip>

2. Point your domain's DNS A record to <droplet-ip> (TTL 300).

3. Copy the deployment files to /opt/datafast:
     scp docker-compose.yml Caddyfile deploy@<droplet-ip>:/opt/datafast/
     scp .env.production.example deploy@<droplet-ip>:/opt/datafast/.env.production

4. SSH in, edit .env.production with real values, then:
     docker login ghcr.io -u <github-user> -p <PAT-with-read:packages>
     docker compose --env-file .env.production up -d

5. Verify:
     curl -I https://<your-domain>/api/health

See README-deploy.md for the full runbook.
EOF
