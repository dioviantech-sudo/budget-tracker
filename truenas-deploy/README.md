# Budget App - TrueNAS Deployment Package
# This folder contains everything needed to deploy on TrueNAS

## Quick Start (TrueNAS Scale with Docker)

1. Copy `docker-compose.yml`, `.env`, and the `nginx/` folder to your TrueNAS
2. Edit `.env` and set your values (see below)
3. Run: `docker-compose up -d`
4. Access at `http://your-truenas-ip:8080`

## Files in this package

- `docker-compose.yml` — Defines PostgreSQL, Django backend, and Nginx services
- `Dockerfile.backend` — Builds the Django app container
- `nginx/default.conf` — Reverse proxy config
- `.env` — Environment variables (database, secrets, hosts)
- `deploy.sh` — One-command setup script
- `truenas-scale-instructions.md` — Step-by-step for TrueNAS Scale Apps
- `truenas-core-instructions.md` — Step-by-step for TrueNAS Core VM

## Environment Variables (.env)

| Variable | Description | Example |
|---|---|---|
| `SECRET_KEY` | Django secret key | `change-me-in-production` |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated hosts | `10.10.10.2,localhost` |
| `DB_NAME` | PostgreSQL database name | `budget_db` |
| `DB_USER` | PostgreSQL user | `budget_user` |
| `DB_PASSWORD` | PostgreSQL password | `strong-password` |
| `DB_HOST` | PostgreSQL host | `db` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `CORS_ALLOWED_ORIGINS` | Frontend URLs | `http://10.10.10.2:8080` |
| `ADMIN_EMAIL` | Superuser email | `Diomalf@gmail.com` |
| `ADMIN_PASSWORD` | Superuser password | `Vivian031616` |

## Data Persistence

- PostgreSQL data: `./postgres_data/` (mounted volume)
- SQLite fallback: `./db.sqlite3` (only if PostgreSQL unavailable)

## Ports

- `8080` — Main app (Nginx serves frontend + proxies API)
- `8000` — Django API (internal, proxied by Nginx)
- `5432` — PostgreSQL (internal only)

## First Time Setup

After `docker-compose up -d`, run:
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py seed_defaults --email=Diomalf@gmail.com
```
