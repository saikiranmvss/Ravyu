# Ravyu — Deployment (GitHub Actions only)

Same server as chatex. Global stack (nginx, MySQL, Node, `deploy` user) is already provisioned.

## GitHub Secrets (this repo)

| Secret | Value |
|--------|--------|
| `SERVER_HOST` | Droplet IP |
| `SERVER_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | Same key as chatex |
| `DB_PASSWORD` | MySQL password for user `ravyu` |
| `ENV_FILE` | See below |

**ENV_FILE example:**

```env
NODE_ENV=production
PORT=5200
DATABASE_URL=mysql://ravyu:YOUR_DB_PASSWORD@127.0.0.1:3306/ravyu
JWT_ACCESS_SECRET=random-64-chars
JWT_REFRESH_SECRET=random-64-chars
```

`MIGRATE_ON_DEPLOY` defaults to `true` in the workflow (runs `scripts/apply-migrations.mjs`).

## Deploy

1. Add secrets in the **Ravyu** repo.
2. Push to `main` or run workflow manually.

## Verify

```text
http://YOUR_IP/ravyu/
http://YOUR_IP/ravyu/api/healthz
```

On the server:

```bash
curl -fsS http://127.0.0.1:5200/api/healthz
systemctl status ravyu-api.service
```

## Stack notes

- pnpm monorepo; `FULL_PNPM_INSTALL=true` in `scripts/lib/app.conf` (needed for migrations).
- Frontend uses `BASE_PATH=/ravyu/` and `setBaseUrl` in `App.tsx`.
- API port **5200**, systemd unit **ravyu-api**.

Scripts and workflow match the chatex deployment fixes (systemd `envsubst`, script path handling, CI logs).
