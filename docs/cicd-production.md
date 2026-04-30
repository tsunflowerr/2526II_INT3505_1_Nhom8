# CI/CD deploy to production server

Flow:

1. Push code to `main`/`master`
2. GitHub Actions runs unit test + coverage gate
3. Pipeline builds and pushes images to GHCR
4. Pipeline SSHes into server and runs `docker compose pull && docker compose up -d`

## 1) GitHub repository secrets

Set these secrets in `Settings -> Secrets and variables -> Actions`:

- `DEPLOY_HOST`: `172.16.3.128`
- `DEPLOY_PORT`: SSH port (usually `22`)
- `DEPLOY_USER`: SSH user on server (for example `thienqd`)
- `DEPLOY_SSH_KEY`: private key content used by GitHub Actions to SSH
- `DEPLOY_PATH`: deploy directory on server (for example `/opt/ticketrush`)
- `GHCR_USERNAME`: GitHub username (or bot account) that can read GHCR packages
- `GHCR_TOKEN`: personal access token with at least `read:packages`
- `PROD_ENV_FILE`: full content of production `.env` file (multi-line secret)

`PROD_ENV_FILE` should include at least:

```env
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=...
POSTGRES_PORT=5432
POSTGRES_SSLMODE=disable
POSTGRES_MAX_OPEN_CONNS=25
POSTGRES_MAX_IDLE_CONNS=5
POSTGRES_CONN_MAX_LIFETIME=300

LOG_LEVEL=info

EVENT_SERVICE_PORT=8080
BOOKING_API_PORT=8081
USER_API_PORT=8082
WEB_PORT=3000

JWT_SECRET=...
JWT_ALGORITHM=HS256
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_SECONDS=604800

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...

RATE_LIMIT_STORAGE_URL=redis://redis:6379/0
REDIS_URL=redis://redis:6379/0

VITE_USER_API_URL=/user-api
VITE_GOOGLE_CLIENT_ID=...
VITE_FACEBOOK_APP_ID=...
```

## 2) Server prerequisites

Install Docker + Docker Compose plugin on `172.16.3.128`.

The deploy user must be able to run Docker commands.

```bash
sudo usermod -aG docker thienqd
```

Create deploy directory once:

```bash
sudo mkdir -p /opt/ticketrush
sudo chown -R thienqd:thienqd /opt/ticketrush
```

## 3) Image naming

The pipeline publishes images:

- `ghcr.io/<owner>/ticketrush-booking_api:<tag>`
- `ghcr.io/<owner>/ticketrush-event_service:<tag>`
- `ghcr.io/<owner>/ticketrush-migration_services:<tag>`
- `ghcr.io/<owner>/ticketrush-user_api:<tag>`
- `ghcr.io/<owner>/ticketrush-web:<tag>`

Tags:

- commit SHA for every push
- `latest` for default branch

## 4) Deploy behavior

Pipeline copies `deploy/docker-compose.prod.yaml` to `${DEPLOY_PATH}` and rewrites `${DEPLOY_PATH}/.env` from `PROD_ENV_FILE`, then executes:

```bash
docker compose -f docker-compose.prod.yaml pull
docker compose -f docker-compose.prod.yaml up -d --remove-orphans
```

## 5) Manual rollback

On server:

```bash
cd /opt/ticketrush
export REGISTRY_NAMESPACE=<github_owner_lowercase>
export IMAGE_TAG=<old_commit_sha>
docker compose -f docker-compose.prod.yaml up -d --remove-orphans
```
