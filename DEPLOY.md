# Deploy to Render.com (Free)

This is the easiest way to get your Budget Tracker online.

## Step 1: Push to GitHub

1. Create a new repository on GitHub (e.g., `budget-tracker`)
2. Push this project:

```bash
cd C:\Users\Moid\budget-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/budget-tracker.git
git push -u origin main
```

## Step 2: Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Blueprint"**

## Step 3: Deploy

1. Connect your GitHub repo
2. Render will detect `render.yaml` and create:
   - **PostgreSQL database** (free)
   - **Web service** (free tier)
3. Click **"Apply"**
4. Wait ~5 minutes for the build

## Step 4: First-Time Setup

After deployment, open the Render dashboard:
1. Go to your web service **"Shell"** tab
2. Run:
```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_defaults --email=your-email@example.com
```

## Step 5: Access Your App

Your app will be live at:
```
https://budget-tracker-XXXX.onrender.com
```

## Free Tier Limits

- **Web service:** Sleeps after 15 min of inactivity (wakes up in ~30s)
- **Database:** 1 GB storage, shared CPU
- **Custom domain:** Supported (add in Render dashboard)

## Updating Your App

Just push to GitHub — Render auto-deploys:
```bash
git add .
git commit -m "Update"
git push
```

## Troubleshooting

**Build fails:** Check the **"Logs"** tab in Render dashboard
**Database error:** Make sure migrations ran in the Shell tab
**Static files missing:** Run `python manage.py collectstatic --noinput` in Shell

## Alternative: Deploy to Railway

If Render doesn't work, Railway is another free option:
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repo
3. Add PostgreSQL plugin
4. Set environment variables
5. Deploy
