# Quick Deploy Checklist

## Before You Start
- [ ] Git installed (`git --version` works)
- [ ] GitHub account created
- [ ] Render.com account created (Sign up with GitHub)

---

## Part 1: Push to GitHub (10 minutes)

1. **Create repo on GitHub:**
   - Go to https://github.com/new
   - Name: `budget-tracker`
   - Public, NO README, NO .gitignore
   - Click Create

2. **Push code from your PC:**
   ```cmd
   cd C:\Users\Moid\budget-app
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/budget-tracker.git
   git push -u origin main
   ```

3. **Verify:** Refresh GitHub page, see your files

---

## Part 2: Deploy to Render (5 minutes)

4. **Go to Render:** https://dashboard.render.com

5. **Click "New +" → "Blueprint"**

6. **Select your `budget-tracker` repo**

7. **Click "Apply"**

8. **Wait for build to finish** (watch the progress bar)

---

## Part 3: Setup Database (3 minutes)

9. **Click your Web Service**

10. **Go to "Shell" tab**

11. **Run:**
    ```bash
    cd backend
    python manage.py migrate
    python manage.py createsuperuser
    python manage.py seed_defaults --email=Diomalf@gmail.com
    exit
    ```

---

## Part 4: Use Your App

12. **Click the URL** at the top of your Web Service page

13. **Log in** with your credentials

14. **Bookmark the URL** on your phone

---

## Your App URL Will Look Like
```
https://budget-tracker-xxxxx.onrender.com
```

Save this URL. That's your live app.
