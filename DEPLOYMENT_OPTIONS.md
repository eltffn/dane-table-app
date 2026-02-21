# Deployment Guide

Choose the deployment option that works best for your situation.

## Quick Comparison

| Service | Cost | Setup Time | Best For |
|---------|------|-----------|----------|
| **Railway** (Recommended) | Free ($5 credit/month) | 5 min | Full-stack Python app |
| **Netlify** (Frontend) + **Railway** (Backend) | Free | 10 min | Separation of concerns |
| **Heroku** | Free tier ending soon | 10 min | Alternative to Railway |
| **Vercel** | Free | 5 min | Frontend only |

---

## Option 1: Railway (RECOMMENDED) 🚀

**Best for:** Getting your app live in 5 minutes with both frontend and Python backend.

### Why Railway?
- ✅ Supports Python natively
- ✅ Free tier with $5 credit/month
- ✅ Auto-deploys from GitHub
- ✅ Easy environment variables
- ✅ One dashboard for everything

### Steps

1. **Go to [railway.app](https://railway.app)**

2. **Sign up with GitHub** (easier)

3. **Create new project → Deploy from GitHub**
   - (Or "Upload" if not using GitHub)

4. **Select your repository**

5. **Set environment variables:**
   - `EDIT_PASSWORD` = your admin password
   - `PORT` = 8000

6. **Hit Deploy**

7. **Get your URL** from Railway dashboard

**Your app is now live!** 🎉

### Updating Your Code

```bash
git add .
git commit -m "Your changes"
git push
```
Railway automatically redeploys.

---

## Option 2: Netlify (Frontend) + Railway (Backend)

**Best for:** Separating frontend and backend, or using multiple hosting providers.

### Steps

**Part 1: Deploy Backend to Railway**
- Follow Option 1 above
- Get your Railway URL (e.g., `https://myapp.railway.app`)

**Part 2: Deploy Frontend to Netlify**

1. **Go to [netlify.com](https://netlify.com)**

2. **"Add new site" → "Deploy manually"**

3. **Upload your files:**
   - Drag and drop your project folder
   - Or connect GitHub

4. **In Netlify, copy your URL** (e.g., `https://myapp.netlify.app`)

5. **Update app.js:**
   ```javascript
   // Line 8
   const API_URL = 'https://your-railway-url.railway.app/api/data';
   ```

6. **Deploy again** or push to GitHub

**Frontend is on Netlify, Backend is on Railway** ✅

---

## Option 3: Heroku (Backend Alternative)

**Note:** Heroku free tier ended, but free credits still available for new accounts.

### Steps (Similar to Railway)

1. **Go to [heroku.com](https://heroku.com)**
2. **Create new app**
3. **Connect your GitHub repo**
4. **Set environment variables** (same as Railway)
5. **Deploy**

---

## If You Don't Have Git

### Option A: GitHub Desktop
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Create a new repository
3. Add your files
4. Publish to GitHub
5. Use that repo with Railway/Heroku/Netlify

### Option B: Command Line (15 seconds)

```bash
# Windows
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

cd c:\Users\Nicola Zalewski\Desktop\dane-table-app

git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/dane-table-app.git
git push -u origin main
```

(First, create the empty repository on GitHub: github.com/new)

### Option C: No Git (Drag & Drop)

Some services support uploading without Git:
- **Railway:** "Upload from Repo"
- **Netlify:** Drag & drop in web interface

---

## Setting Admin Password

The default password is `changeme` - **change it for security!**

### Locally
```bash
set EDIT_PASSWORD=my_secure_password  # Windows
python server_py.py
```

### On Railway
1. Go to Railway Dashboard
2. Select your project
3. Click Variables
4. Set `EDIT_PASSWORD` to your password

### On Heroku
1. Go to Heroku Dashboard
2. Settings → Config Vars
3. Add `EDIT_PASSWORD` key

---

## Testing Your Deployment

After deploying:

1. **Open your live URL** (you'll get it from the hosting service)
2. **Click "Map" view** - should see your map.png
3. **Click "Data" view** - should see your dane.json table
4. **Click "Admin Panel"** - enter your password
5. **Make a test edit** - should save successfully
6. **Refresh page** - data should still be there

---

## Need Help?

### "API connection failed"
- Check that your backend is running (Railway/Heroku dashboard)
- Verify URL in `app.js` matches your deployment
- Check browser console (F12) for error messages

### "Changes not saving"
- Admin login correctly? (You should see editable cells)
- Backend service running?
- Check server logs on Railway/Heroku

### "Page loads but looks broken"
- CSS file isn't loading? Check browser console
- Map image not showing? Check map.png exists
- JavaScript errors? Press F12 to see console

---

## Recommended: Railway + GitHub

This is the fastest setup:

```
Your PC (code changes)
    ↓ (git push)
    ↓
GitHub (stores code)
    ↓ (auto-webhook)
    ↓
Railway (auto-deploys, runs server_py.py)
    ↓
Your live app URL
```

Zero downtime updates - just push to GitHub and Railway deploys instantly! ✨
