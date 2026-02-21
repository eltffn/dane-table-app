# 🚀 Quick Start: Deploy Your App

Your app is **ready to deploy**! Choose your method below.

## ⭐ Recommended: Railway (5 minutes)

Railway is the easiest and fastest way to deploy your entire app.

### 1️⃣ Create GitHub Account (if needed)
- Go to [github.com/signup](https://github.com/signup)
- Sign up with email
- Verify email

### 2️⃣ Create GitHub Repository
- Go to [github.com/new](https://github.com/new)
- Name: `dane-table-app`
- Description: "Alternative history data management app"
- Click **Create repository**

### 3️⃣ Push Your Code to GitHub

Open Terminal/PowerShell in your project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/dane-table-app.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### 4️⃣ Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click **Start a New Project**
3. Select **Deploy from GitHub**
4. Authorize GitHub and select `dane-table-app`
5. Click **Deploy**
6. Once deployed, Railway shows your URL (e.g., `https://dane-table-app-production.up.railway.app`)

### 5️⃣ Set Admin Password
1. In Railway, go to **Variables** tab
2. Add two variables:
   - `EDIT_PASSWORD` = your secure admin password (NOT "changeme")
   - `PORT` = `8000`
3. Save

### 6️⃣ Your App is Live! 🎉
- Share the URL with others
- Admins can login with your `EDIT_PASSWORD`

---

## Alternative: Netlify + Railway

If you want frontend on Netlify and backend on Railway:

### Part 1: Deploy Backend to Railway
- Follow steps 1-5 above, but SKIP step 6
- Copy your Railway URL

### Part 2: Deploy Frontend to Netlify

1. Go to [netlify.com](https://netlify.com)
2. **"Add new site"** → **"Deploy manually"**
3. Drag and drop your project folder
4. Sites → Select your deployment → **"Site settings"**
5. Go to **"Deploy & Build"** → **"Environment"**
6. Add environment variable: `VITE_API_URL` = your Railway URL
7. Redeploy

---

## Without Git (Drag & Drop)

### Railway Direct Upload
1. Go to [railway.app](https://railway.app)
2. **New Project** → **"Upload"**
3. Select your folder
4. Continue from step 5 above

### Netlify Drag & Drop
1. Go to [netlify.com](https://netlify.com)
2. **"Add new site"** → **"Deploy manually"**
3. Drag and drop your project folder
4. Done!

---

## Testing Your Deployment

After your app is live:

1. **Open your live URL** in browser
2. **Click Map** - should show your map and year text
3. **Click Data** - should show your table from dane.json
4. **Click Admin Panel** - enter your `EDIT_PASSWORD`
5. **Edit JSON** or **Edit Year** - make a test change
6. **Refresh page** - change should still be there

✅ If all works - you're done!

---

## Troubleshooting Deployment

### "Git is not installed"
```bash
# Install Git from: https://git-scm.com/download/win
```

### "Permission denied when pushing to GitHub"
- Generate SSH key: [github.com/settings/keys](https://github.com/settings/keys)
- Add to your GitHub account

### "Page loads but says API not found"
- Check Railway backend is running (go to Railway dashboard)
- Open browser Console (F12) to see exact error
- Make sure `server_py.py` is in your project root

### "Admin password not working"
- Check Railway Variables match what you entered
- Password is case-sensitive
- Refresh browser page (Ctrl+F5)

---

## After Deployment: How to Update

### With Git:
```bash
# Make changes locally
git add .
git commit -m "Description of changes"
git push
```
Railway auto-deploys within seconds!

### Without Git:
- Redeploy from Railway/Netlify dashboard
- Upload your updated files

---

## File Reference

| File | Purpose |
|------|---------|
| `index.html` | Main interface (hamburger menu, map, data, admin) |
| `app.js` | Frontend logic (search, sort, modals, API calls) |
| `styles.css` | Professional styling (gradients, shadows, responsive) |
| `server_py.py` | Python backend (API endpoints, password auth) |
| `dane.json` | Your countries data (edited via Admin/table) |
| `year.txt` | Year text displayed on map |
| `map.png` | Your map image |
| `netlify.toml` | Netlify configuration |

---

## Support Links

- **Railway Help**: [docs.railway.app](https://docs.railway.app)
- **Netlify Help**: [docs.netlify.com](https://docs.netlify.com)
- **GitHub Help**: [docs.github.com](https://docs.github.com)

---

## Summary

✅ Files ready: YES
✅ Code working locally: YES
✅ Deployment options: Railway (easiest), Netlify, Heroku
✅ Setup time: 5-10 minutes
✅ Cost: FREE (Railway has $5 credit/month)

**Next step:** Go to [railway.app](https://railway.app) and deploy! 🚀
