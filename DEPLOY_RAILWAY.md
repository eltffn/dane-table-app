# Deploy to Railway in 5 Minutes

Railway is the easiest way to deploy this app for free. It handles both the frontend and Python backend.

## Steps

### 1. Prepare Your Code

Ensure you have these files in your project folder:
- `index.html` ✅
- `app.js` ✅
- `styles.css` ✅
- `server_py.py` ✅
- `dane.json` ✅
- `year.txt` ✅
- `map.png` ✅

### 2. Push to GitHub (or prepare folder)

**Option A: With Git/GitHub**
```bash
cd your-project-folder
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/dane-table-app.git
git push -u origin main
```

**Option B: Without Git (drag & drop)**
- Just keep your files in the folder ready to upload

### 3. Go to Railway.app

1. Visit [https://railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Choose:
   - **"Deploy from GitHub"** if you pushed to GitHub
   - **"Upload from Repo"** if you're using drag & drop
4. Select your repository (or upload the folder)

### 4. Set Environment Variables

In Railway, go to **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `EDIT_PASSWORD` | Your admin password (not "changeme"!) |
| `PORT` | `8000` |

### 5. Deploy

Click **Deploy** and wait 2-3 minutes. Your app will be live at:
```
https://yourusername-dane-table-app-production.up.railway.app
```

(The exact URL will be shown in Railway dashboard)

### 6. Done!

Your app is now live! Share the URL with others.

**To edit data:**
1. Use hamburger menu → **Admin Panel**
2. Enter your `EDIT_PASSWORD`
3. Click "Edit JSON" to modify data
4. Changes auto-save

---

## Common Issues

### "Python: command not found"
- Railway auto-detects Python. Make sure `server_py.py` is in root folder.

### "Port 8000 already in use"
- This happens locally. Railway uses its own port system (no conflict).

### "API calls failing after deployment"
- Update `app.js` line 8 with your Railway URL:
```javascript
const API_URL = 'https://[your-railway-url]/api/data';
```

### "Module not found" errors
- `server_py.py` uses stdlib only (no dependencies needed)
- If you see import errors, check Python 3.7+ is available

---

## Updating Your App

After making changes locally:

**With Git:**
```bash
git add .
git commit -m "Update description"
git push
```
Railway auto-deploys on git push.

**Without Git:**
- Redeploy from Railway dashboard
- No need to re-upload all files, just update changed ones
