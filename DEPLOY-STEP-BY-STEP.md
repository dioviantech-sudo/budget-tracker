# Budget Tracker - Step by Step Deploy to Render.com (Free)

Follow these steps EXACTLY. No skipping.

---

## STEP 1: Install Git (if not installed)

1. Go to https://git-scm.com/download/win
2. Download and install Git for Windows
3. During install, keep all default options (just click Next Next Next)
4. Open a NEW Command Prompt window after install
5. Test: `git --version`
   - Should show something like `git version 2.43.0`

---

## STEP 2: Create a GitHub Account (if you don't have one)

1. Go to https://github.com
2. Click **"Sign up"**
3. Enter your email, create password, choose username
4. Verify your email (check inbox)

---

## STEP 3: Create a New Repository on GitHub

1. Go to https://github.com/new
2. **Repository name:** `budget-tracker`
3. **Description:** `Personal budget and debt tracker app`
4. Choose **"Public"** (free)
5. **DO NOT** check "Add a README"
6. **DO NOT** check "Add .gitignore"
7. Click **"Create repository"**

You'll see a page with commands. Keep this page open.

---

## STEP 4: Push Your Code to GitHub

Open Command Prompt and run these commands ONE BY ONE:

```cmd
cd C:\Users\Moid\budget-app
```

```cmd
git init
```

```cmd
git add .
```

```cmd
git commit -m "Initial commit"
```

```cmd
git branch -M main
```

```cmd
git remote add origin https://github.com/YOUR-USERNAME/budget-tracker.git
```
**Replace `YOUR-USERNAME` with your actual GitHub username**

```cmd
git push -u origin main
```

It will ask for your GitHub username and password.
- **Username:** Your GitHub username
- **Password:** Use a **Personal Access Token** (not your GitHub password)
  - Go to https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Check "repo" box
  - Click Generate
  - Copy the token and paste it as your password

After this, refresh your GitHub repo page. You should see all your files.

---

## STEP 5: Sign Up on Render.com

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Click **"Sign up with GitHub"**
4. Authorize Render to access your GitHub repos
5. Verify your email (check inbox)

---

## STEP 6: Deploy Using Blueprint

1. In Render dashboard, click the **blue "New +"** button (top right)
2. Select **"Blueprint"**
3. Find your `budget-tracker` repository
4. Click **"Connect"**
5. Render will read the `render.yaml` file and show:
   - 1 Web Service (Python)
   - 1 PostgreSQL Database
6. The name will be `budget-tracker` — you can keep it
7. Click **"Apply"** at the bottom

Wait for the build to complete (see progress in dashboard).
This takes about 3-5 minutes.

---

## STEP 7: First-Time Database Setup

After the build shows **"Live"** (green dot):

1. Click on your **Web Service** name
2. Click the **"Shell"** tab (next to Logs)
3. A terminal opens. Run these commands:

```bash
cd backend
python manage.py migrate
```

```bash
python manage.py createsuperuser
```
When it asks:
- Username: `diomalf`
- Email: `Diomalf@gmail.com`
- Password: `Vivian031616`
- Confirm: `Vivian031616`

```bash
python manage.py seed_defaults --email=Diomalf@gmail.com
```

Type `exit` to close the shell.

---

## STEP 8: Access Your App

1. Go back to your Web Service page
2. Click the **URL** at the top (looks like `https://budget-tracker-xxxxx.onrender.com`)
3. Your app opens in a new tab
4. Log in with:
   - Email: `Diomalf@gmail.com`
   - Password: `Vivian031616`

---

## STEP 9: Bookmark Your URL

Save the Render URL to your phone home screen or bookmarks.

---

## FREE TIER LIMITS (Important)

- **Sleeps after 15 minutes** of no activity
- **Wakes up in ~30 seconds** when you visit
- **1 GB database** storage
- **No custom domain** on free tier (use the render.com URL)

---

## HOW TO UPDATE YOUR APP

When you make changes locally and want to update the live site:

```cmd
cd C:\Users\Moid\budget-app
git add .
git commit -m "My update"
git push
```

Render will auto-detect the push and rebuild in ~3 minutes.

---

## TROUBLESHOOTING

**"Repository not found" on push:**
- Make sure you created the repo on GitHub first
- Check your username is correct in the git remote URL

**"fatal: Authentication failed":**
- Use a Personal Access Token, not your GitHub password

**Build fails on Render:**
- Go to Render dashboard → Logs tab
- Look for red error lines
- Common fix: `python manage.py collectstatic --noinput` in Shell tab

**"Database connection error":**
- Make sure you ran `python manage.py migrate` in the Shell tab

**App shows white screen:**
- Check browser console (F12) for errors
- Make sure you rebuilt the frontend: `cd frontend && npm run build`

---

## NEED HELP?

If you get stuck on any step, tell me:
1. Which step you're on
2. What error message you see
3. Screenshot if possible
