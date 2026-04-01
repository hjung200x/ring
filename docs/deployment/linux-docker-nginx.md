# Linux Docker + Nginx Deployment

## Overview
- Run `api` and `web` with Docker Compose.
- Expose only the `web` container on `127.0.0.1:8088`.
- Let the host Nginx proxy `/ring` to `127.0.0.1:8088`.

## Files
- `Dockerfile.api`
- `Dockerfile.web`
- `docker-compose.yml`
- `deploy/nginx/ring-web.conf`
- `deploy/nginx/ring-docker-proxy.conf`
- `deploy/ring.docker.env.example`

## Runtime paths
- SQLite: `/app/apps/api/prisma/dev.db`
- Storage: `/app/apps/api/storage`
- Logs: `/app/log`

## Host setup
1. Install Docker Engine and Compose plugin.
2. Copy `deploy/ring.docker.env.example` to a private env file and fill secrets.
3. Run:
   - `docker compose build`
   - `docker compose up -d`
4. Add `deploy/nginx/ring-docker-proxy.conf` to the existing server block for `snupcb.snu.ac.kr`.
5. Reload Nginx.

## Verify
- `docker compose ps`
- `curl http://127.0.0.1:8088/ring/`
- `curl http://127.0.0.1:8088/ring/api/health`
