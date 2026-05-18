# GitHub Actions — auto-deploy to Aliyun ECS

This folder contains the workflow that auto-deploys f1frp.com (国内侧 / 阿里云
ECS) on every push to `main`. Without this, the Chinese-side domain falls
behind the overseas Vercel deploy every time we push — which is exactly what
happened on 2026-05-18 when the S2 product page (`/factories`) wasn't visible
on f1frp.com for ~24 hours after it shipped to getfrp.com.

## One-time setup (5 minutes)

### 1. Generate a dedicated SSH keypair for GitHub Actions

On your laptop:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/f1frp-gh-deploy -C github-actions -N ""
```

This produces two files:
- `~/.ssh/f1frp-gh-deploy`      ← private key (goes to GitHub Secrets)
- `~/.ssh/f1frp-gh-deploy.pub`  ← public key (goes to ECS authorized_keys)

### 2. Authorize the public key on ECS

```bash
ssh root@120.26.111.236
echo "<paste contents of f1frp-gh-deploy.pub here>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

(Or use `ssh-copy-id` if you prefer.)

### 3. Capture the ECS host fingerprint

On your laptop:

```bash
ssh-keyscan -H 120.26.111.236
```

Copy the entire output — those 2-3 lines are the `known_hosts` entries needed
to tell GitHub Actions "trust this host" without an interactive `yes/no` prompt.

### 4. Add GitHub Secrets

GitHub repo → Settings → Secrets and variables → Actions → **Secrets** tab → New
repository secret. Add these three:

| Secret name | Value |
|---|---|
| `ECS_HOST` | `root@120.26.111.236` (user@host) |
| `ECS_SSH_KEY` | Full content of `~/.ssh/f1frp-gh-deploy` (private key) |
| `ECS_SSH_KNOWN_HOSTS` | Output from step 3 (`ssh-keyscan -H ...`) |

Optional (only if your `build-llms-txt.ts` actually queries the DB at build
time; many builds don't need this):

| Secret name | Value |
|---|---|
| `DATABASE_URL` | The Neon Postgres URL (read-only role is fine) |

### 5. Add GitHub Variables (non-secret config)

Same page → **Variables** tab. Optional:

| Variable name | Default if unset | Purpose |
|---|---|---|
| `ECS_PATH` | `/var/www/f1frp` | target dir on server |
| `ECS_PORT` | `22` | SSH port |
| `NEXT_PUBLIC_ICP_BEIAN` | empty | ICP filing number for footer |

### 6. Verify ECS has runtime secrets

The workflow does NOT push runtime env vars — those live in
`/var/www/f1frp/.env.production.local` on the ECS itself (and are excluded
from rsync). Confirm that file has at minimum:

```
DATABASE_URL=postgres://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
DEEPSEEK_API_KEY=sk-...
```

If `.env.production.local` doesn't exist on ECS yet, copy
`deploy/.env.production.example` and fill it in.

### 7. Trigger a test deploy

Either push a trivial commit to main, or go to GitHub → Actions → **Deploy to
Aliyun ECS** → **Run workflow**. The job should complete in ~5-8 minutes (4
min pnpm install + build, 1-2 min rsync, 30s pm2 reload + healthcheck).

## What the workflow does

```
push to main
  │
  ├── pnpm install --frozen-lockfile
  ├── BUILD_TARGET=ecs pnpm build       ← standalone output
  ├── assemble deploy/dist/             ← .next + public + ecosystem.config
  ├── SSH key + known_hosts setup
  ├── rsync deploy/dist/ → ECS:/var/www/f1frp/    (preserves .env*.local)
  ├── ssh ECS "pm2 reload ecosystem.config.cjs"
  └── curl https://f1frp.com/api/healthz   ← deploy fails if not 200
```

Concurrency: only one ECS deploy can run at a time (set via `concurrency`
group). A second push while a deploy is in-flight queues until the first
finishes — it doesn't cancel.

## Path filters

Pushes that only touch the following don't trigger a deploy (CI minutes saver):
- `**/*.md`
- `Personal Vault/**`  (you have these files mirrored — they're never in repo
  anyway, but listing for paranoia)
- `docs/**`
- `.gitignore`
- `LICENSE`

To force a deploy on a path-only commit, use the **Run workflow** button.

## Failure modes & recovery

| Symptom | Likely cause | Fix |
|---|---|---|
| `Missing required GitHub Secrets` | Step 4 not done | Add the 3 secrets |
| `Permission denied (publickey)` | Step 2 not done or wrong public key | Re-add `f1frp-gh-deploy.pub` to ECS `authorized_keys` |
| `Host key verification failed` | Step 3 not done or stale | Re-run `ssh-keyscan` and update `ECS_SSH_KNOWN_HOSTS` |
| `Healthcheck never returned 200` | Build deployed but server is crashlooping | `ssh ECS 'pm2 logs f1frp --lines 100'` to read the error |
| `Cannot find module 'X'` in pm2 logs | New dep added but standalone tracing missed it | Add to `outputFileTracingIncludes` in `next.config.ts` and redeploy |

## Coexistence with manual `./deploy/deploy.sh`

The local script and this workflow target the same paths and do the same
operations. If you run `./deploy/deploy.sh` from your laptop while a GH
Action is in-flight (or vice versa), the two `pm2 reload`s race and you can
end up with a half-applied deploy. Pick one workflow:

- **Recommended**: let GH Actions handle every push, and use the manual
  script only for emergency rollbacks (`./deploy/deploy.sh` from a known-good
  commit checked out locally).
- **Alternative**: disable this workflow via Actions UI when shipping
  manually, re-enable when done.
