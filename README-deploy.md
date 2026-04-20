# Deploying DataFast Dashboard to a DigitalOcean VPS

End-to-end runbook for going from "nothing exists" to a public, HTTPS-backed
multi-user SaaS on your own droplet, with automatic deploys on `git push main`.

---

## 1. Pre-flight checklist

Before starting, have these ready:

- [ ] **GitHub repo** hosting this code, with Actions + Packages enabled
- [ ] **DigitalOcean account** with a payment method
- [ ] **A domain name** with access to its DNS (a subdomain like `dash.example.com` is fine)
- [ ] **SSH keypair** — `ssh-keygen -t ed25519 -f ~/.ssh/datafast-deploy -C "datafast-deploy-ci"`
  - Public key will go on the droplet; private key goes to GitHub Secrets
- [ ] **3 secrets** generated with `openssl rand -base64 32`:
  - `POSTGRES_PASSWORD`
  - `BETTER_AUTH_SECRET`
  - `DASHBOARD_ENCRYPTION_KEY` **← losing this locks every stored DataFast API key forever. Back it up in a password manager.**
- [ ] **GitHub OAuth App** — https://github.com/settings/developers
  - Homepage URL: `https://dash.example.com`
  - Callback URL: `https://dash.example.com/api/auth/callback/github`
  - (Optional second app for `http://localhost:3000/api/auth/callback/github` during dev)
- [ ] **Google OAuth Client ID** — https://console.cloud.google.com → APIs & Services → Credentials
  - OAuth consent screen: External, add the `email` and `profile` scopes
  - Web application, Authorized redirect URI: `https://dash.example.com/api/auth/callback/google`
- [ ] **Resend account** — https://resend.com
  - Add your sender domain (e.g. `dash.example.com`), set the DKIM/SPF/DMARC DNS records
  - Wait for "Verified" status, then create an API key with **Sending access only**

---

## 2. Create the droplet

1. DigitalOcean → **Create → Droplets**
2. Region: pick one close to your users
3. Image: **Ubuntu 24.04 LTS**
4. Size: **Basic → Regular → $12/mo** (2 GB RAM / 1 vCPU / 50 GB SSD)
5. Authentication: **SSH key**, paste your public key at creation
6. Hostname: `datafast-prod`
7. Enable **weekly backups** (+20%)
8. Click **Create**

Note the droplet's IPv4 address. Add it to your password manager.

## 3. Point DNS at the droplet

In your registrar:

| Type  | Name                      | Value             | TTL |
| ----- | ------------------------- | ----------------- | --- |
| A     | `dash` (or `@` for apex)  | `<droplet-ipv4>`  | 300 |

If using **Cloudflare**, set the record to **DNS only (grey cloud)**, NOT proxied.
Caddy needs to see real traffic to get its own Let's Encrypt cert.

Wait for propagation: `dig +short dash.example.com` should return the droplet IP.

## 4. Bootstrap the droplet

From your laptop, once:

```bash
ssh root@<droplet-ip> bash -s < scripts/provision.sh
```

This installs Docker, creates a non-root `deploy` user, hardens SSH, opens 22/80/443
in UFW, and creates `/opt/datafast`. Takes ~2 minutes.

Verify you can SSH as the new user:

```bash
ssh deploy@<droplet-ip>
```

Root login is now disabled.

## 5. Copy deployment files

From your laptop, from the repo root:

```bash
scp docker-compose.yml Caddyfile deploy@<droplet-ip>:/opt/datafast/
scp .env.production.example deploy@<droplet-ip>:/opt/datafast/.env.production
```

SSH in and fill in the production secrets:

```bash
ssh deploy@<droplet-ip>
cd /opt/datafast
vim .env.production
```

Replace every `CHANGE_ME` with a real value. `APP_IMAGE` should point to
`ghcr.io/<your-gh-user>/datafast-dashboard:latest` (all lowercase).

## 6. First deploy

Still on the droplet:

```bash
# Log in to GHCR once. Create a PAT with `read:packages` scope.
docker login ghcr.io -u <your-gh-user> -p <PAT>

# Build the image via GitHub Actions first (push to main) OR build locally and
# push manually. Assuming the image exists on GHCR:
docker compose --env-file .env.production pull
docker compose --env-file .env.production up -d
```

On the first HTTPS request, Caddy will negotiate a Let's Encrypt cert for your
domain (takes 5–30 s). Verify:

```bash
# From your laptop
curl -I https://dash.example.com/api/health
# → 200 OK with a valid Let's Encrypt cert
```

Open `https://dash.example.com/signup`, create your first account. Check that
the verification email arrives in your real inbox.

---

## 7. Troubleshooting

### Caddy is stuck renewing a cert

```bash
docker compose --env-file .env.production logs caddy | tail -30
```

Common causes: DNS still propagating, Cloudflare proxy enabled (should be grey cloud),
UFW blocking 443, rate limit from Let's Encrypt (max ~5 certs/week for the same domain).

### App container unhealthy

```bash
docker compose --env-file .env.production logs app | tail -50
```

Most common: `DATABASE_URL` misconfigured, or `DASHBOARD_ENCRYPTION_KEY` missing
(app throws at startup in production mode).

### Migrations won't apply

```bash
docker compose --env-file .env.production exec app node scripts/migrate.mjs
```

If Postgres was bootstrapped with a different password than what's in
`DATABASE_URL`, the DB volume still holds the old one. Nuke and start over:

```bash
docker compose --env-file .env.production down -v   # wipes pgdata
docker compose --env-file .env.production up -d
```

### Emails not arriving

- Check Resend dashboard → Logs
- Test domain deliverability: https://www.mail-tester.com (paste their address into
  the DataFast signup form, then read the score)
- First few sends may land in spam until Resend warms your domain

---

## 8. Backups

**Included in the $12/mo tier:** weekly droplet snapshots if you enabled backups
at creation time. Restorable from the DO console.

**Better (daily Postgres dumps):** add a cron on the droplet:

```bash
# /etc/cron.daily/datafast-backup
#!/bin/bash
cd /opt/datafast
docker compose --env-file .env.production exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > /opt/backups/db-$(date +%F).sql.gz
find /opt/backups -name 'db-*.sql.gz' -mtime +14 -delete
```

Post-MVP: stream those backups to DO Spaces with `rclone`.

---

## 9. Rotating the encryption key

If `DASHBOARD_ENCRYPTION_KEY` is compromised or you want to rotate:

1. Currently **not supported in the app UI** — it would need a dual-key re-encrypt job.
2. Out-of-band procedure:
   - Export all `sites.api_key_encrypted` via a DB dump
   - Decrypt each with the old key
   - Re-encrypt with the new key
   - Swap the env var and restart the container

Treat this key like a root password.

---

## 10. Continuous deployment (Phase 5)

Once a human deploy succeeds, set up GitHub Actions to automate every
`git push main` — see `.github/workflows/deploy.yml` and configure these repo
secrets:

| Secret         | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| `SSH_HOST`     | the droplet's IP or DNS name                                 |
| `SSH_USER`     | `deploy`                                                     |
| `SSH_KEY`      | contents of `~/.ssh/datafast-deploy` (the private key)       |
| `GHCR_USER`    | your GitHub username                                         |
| `GHCR_TOKEN`   | a PAT with `read:packages` (for the droplet to pull images)  |

Don't forget to also add your CI public key to `/home/deploy/.ssh/authorized_keys`
on the droplet:

```bash
ssh-copy-id -i ~/.ssh/datafast-deploy.pub deploy@<droplet-ip>
```
