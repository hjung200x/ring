# Linux + Nginx Deployment

RING is deployed as:

- Web: static files served by Nginx under `/ring`
- API: Fastify served by `systemd` on `127.0.0.1:3000`
- DB: SQLite at `/srv/ring/apps/api/prisma/dev.db`

Target URL:

- `http://snupcb.snu.ac.kr/ring`

## Prerequisites

- Linux host with `node`, `pnpm`, `python3`, and `nginx`
- Existing Nginx server block for `snupcb.snu.ac.kr`
- Writable install directory: `/srv/ring`

## Install / Update

```bash
cd /srv/ring
git pull
pnpm install
pnpm -C apps/api prisma:generate
pnpm -r build
```

## Environment

Copy the example env file:

```bash
sudo mkdir -p /etc/ring
sudo cp /srv/ring/deploy/ring.env.example /etc/ring/ring.env
sudo vi /etc/ring/ring.env
```

Required values to update:

- `COOKIE_SECRET`
- `OPENAI_API_KEY`
- `ADMIN_PASSWORD`

## systemd

Install the service file:

```bash
sudo cp /srv/ring/deploy/systemd/ring.service /etc/systemd/system/ring.service
sudo systemctl daemon-reload
sudo systemctl enable --now ring
sudo systemctl status ring
```

## Nginx

Merge the example snippet into the existing `snupcb.snu.ac.kr` server block:

```bash
sudo vi /etc/nginx/sites-available/snupcb.snu.ac.kr
```

Reference snippet:

- `/srv/ring/deploy/nginx/ring-subpath.conf`

After update:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Validation

API health:

```bash
curl http://127.0.0.1:3000/health
```

Web:

- Open `http://snupcb.snu.ac.kr/ring`
- Login and verify:
  - notifications page loads
  - search conditions page loads
  - schedule page saves correctly

## Notes

- Internal job routes are not exposed through Nginx in this setup.
- The web build uses `/ring/` as its production base path.
- The frontend calls the API through `/ring/api`.
