# TrueNAS Scale Deployment Instructions

## Prerequisites
- TrueNAS Scale with Docker/Apps enabled
- SSH access to TrueNAS (or use the Web UI Shell)

## Step 1: Upload Files

1. Copy the entire `budget-app` folder to your TrueNAS
   - Recommended location: `/mnt/tank/apps/budget-app/`
   - Or use SMB share to copy from Windows

## Step 2: Edit Environment Variables

1. Open `/mnt/tank/apps/budget-app/truenas-deploy/.env`
2. Change at minimum:
   - `SECRET_KEY` — generate a long random string
   - `DB_PASSWORD` — set a strong database password
   - `ALLOWED_HOSTS` — add your TrueNAS IP (e.g., `10.10.10.2`)
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` — your login credentials

## Step 3: Deploy via Docker Compose

Open TrueNAS Shell (or SSH) and run:

```bash
cd /mnt/tank/apps/budget-app/truenas-deploy
docker-compose up -d
```

This will:
- Download PostgreSQL, Python, and Nginx images
- Build the Django backend
- Start all 3 containers

## Step 4: First-Time Setup

Run migrations and create your admin user:

```bash
cd /mnt/tank/apps/budget-app/truenas-deploy
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py seed_defaults --email=your-email@example.com
```

## Step 5: Access the App

Open your browser and go to:
```
http://10.10.10.2:8080
```

Login with the credentials you set in `.env`.

## Step 6: Auto-Start on Boot (Optional)

Create a TrueNAS Init Script:
1. Go to **System Settings > Init/Shutdown Scripts**
2. Add a new script:
   - **Type:** Command
   - **Command:** `cd /mnt/tank/apps/budget-app/truenas-deploy && docker-compose up -d`
   - **When:** POSTINIT

## Updating the App

To update after code changes:
```bash
cd /mnt/tank/apps/budget-app/truenas-deploy
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

## Troubleshooting

**Containers won't start:**
```bash
docker-compose logs
```

**Database connection error:**
- Make sure PostgreSQL container is healthy: `docker-compose ps`
- Check `.env` DB_PASSWORD matches

**Static files not loading:**
```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

## Data Backup

Your data is stored in:
- `/mnt/tank/apps/budget-app/truenas-deploy/postgres_data/` — PostgreSQL database
- `/mnt/tank/apps/budget-app/truenas-deploy/media/` — Uploaded files

To backup:
```bash
cd /mnt/tank/apps/budget-app/truenas-deploy
docker-compose exec db pg_dump -U budget_user budget_db > backup.sql
```

To restore:
```bash
docker-compose exec -T db psql -U budget_user budget_db < backup.sql
```
