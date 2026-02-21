# Pre-Deployment Checklist ✅

Before deploying to Railway/Netlify/Heroku, verify everything below:

## Files Present

- [ ] `index.html` - Main UI file
- [ ] `app.js` - Frontend JavaScript (429 lines)
- [ ] `styles.css` - Professional styling
- [ ] `server_py.py` - Python backend
- [ ] `dane.json` - Countries data
- [ ] `year.txt` - Year/date text
- [ ] `map.png` - Map image file
- [ ] `.gitignore` - Git configuration
- [ ] `netlify.toml` - Netlify configuration
- [ ] `package.json` - Metadata (optional)

## Local Testing

- [ ] Python 3.7+ installed
- [ ] Can start server: `python server_py.py`
- [ ] App loads at `http://localhost:8000`
- [ ] Map view shows map.png ✅
- [ ] Map view shows year text ✅
- [ ] Data view shows table ✅
- [ ] Search works (type in search box) ✅
- [ ] Sort works (select column, click direction) ✅
- [ ] Admin Panel login works with password "changeme" ✅
- [ ] Can edit cells after login ✅
- [ ] Can delete rows after login ✅
- [ ] Edit JSON button works ✅
- [ ] Edit Year button works ✅
- [ ] Changes persist after page refresh ✅
- [ ] No console errors (F12 → Console) ✅

## Code Quality

- [ ] No console errors
- [ ] No console warnings (ignore npm warnings)
- [ ] All links and relative paths correct
- [ ] dane.json valid JSON (can parse)
- [ ] year.txt has content (not empty)
- [ ] map.png file is readable
- [ ] No hardcoded passwords in code ✅ (using env vars)

## Git Setup (if deploying from GitHub)

- [ ] Git installed: `git --version`
- [ ] GitHub account created
- [ ] Repository created on GitHub.com
- [ ] Local repo initialized: `git init`
- [ ] All files added: `git add .`
- [ ] First commit created: `git commit -m "Initial"`
- [ ] Remote added: `git remote add origin https://...`
- [ ] Code pushed: `git push -u origin main`

## Deployment Service Setup

### If using Railway:
- [ ] Railway account created (railway.app)
- [ ] Connected GitHub (or ready to upload)
- [ ] Project created in Railway
- [ ] Environment variables set:
  - [ ] `PORT` = 8000
  - [ ] `EDIT_PASSWORD` = your secure password (NOT "changeme")
- [ ] Deploy button clicked
- [ ] Deployment succeeded (check dashboard)
- [ ] Railway URL obtained (e.g., https://xxx.railway.app)

### If using Netlify:
- [ ] Netlify account created (netlify.com)
- [ ] Site created (manual drag/drop or Git)
- [ ] Files uploaded successfully
- [ ] Build completed without errors
- [ ] Deployment live (Netlify URL obtained)
- [ ] If backend separate: API URL configured

### If using Heroku:
- [ ] Heroku account created (heroku.com)
- [ ] App created
- [ ] Config vars set:
  - [ ] `PORT` = 8000
  - [ ] `EDIT_PASSWORD` = secure password
- [ ] Deploy triggered
- [ ] Heroku URL obtained

## Post-Deployment Testing

### Open your live URL and verify:

- [ ] Page loads (not 404 error)
- [ ] Hamburger menu appears
- [ ] Map view loads and shows map.png
- [ ] Year text displays below map
- [ ] Data view loads with table
- [ ] Table has all your countries
- [ ] Search works
- [ ] Sort works
- [ ] Admin Panel button clickable
- [ ] Admin password login works
- [ ] Edit JSON button appears after login
- [ ] Edit Year button appears after login
- [ ] Can edit a cell and save
- [ ] Changed data persists on refresh
- [ ] Can delete a row (shows confirm dialog)
- [ ] Deleted row gone after refresh
- [ ] No console errors (F12)
- [ ] All buttons responsive on mobile

## Data Backup

- [ ] Downloaded backup of dane.json
- [ ] Downloaded backup of year.txt
- [ ] Stored safely (not on same server)
- [ ] Know how to restore if needed

## Documentation

- [ ] README.md reviewed
- [ ] QUICK_START.md bookmarked
- [ ] ARCHITECTURE.md saved
- [ ] Share deployment URL with intended users

## Team Communication

- [ ] Users know the live URL
- [ ] Users know admin password (if needed)
- [ ] Users know how to access admin panel
- [ ] Users know password is case-sensitive
- [ ] Provided documentation links

## Security Check

- [ ] No passwords in code (using env vars) ✅
- [ ] No sensitive info in dane.json
- [ ] EDIT_PASSWORD is secure (not "changeme")
- [ ] map.png doesn't contain sensitive data
- [ ] year.txt doesn't contain sensitive data
- [ ] git push didn't leak any secrets

## Performance Verification

- [ ] Page loads in < 3 seconds
- [ ] Table renders smoothly
- [ ] Search response is instant
- [ ] No lag when editing cells
- [ ] Save operations complete in < 1 second

## Edge Cases Tested

- [ ] Delete last row works
- [ ] Search with no results works
- [ ] Sort ascending then descending works
- [ ] Edit cell with special characters works
- [ ] Edit cell with quotes works
- [ ] Rapid edits don't conflict
- [ ] Page refresh during edit handled
- [ ] Admin logout and login works

## Done! 🎉

If all boxes are checked:
✅ Your app is ready for production
✅ Users can access and use it
✅ Data is safe and backed up
✅ You can update it anytime

---

## If Something Fails

| Symptom | Check |
|---------|-------|
| Page won't load | Check deployment status in hosting dashboard |
| API errors | Check server logs in hosting dashboard |
| Data not saving | Check EDIT_PASSWORD variable matches code |
| Map not showing | Is map.png in the uploaded files? |
| Styling broken | Check styles.css uploaded correctly |
| Table blank | Check dane.json has valid data |

## Troubleshooting Commands

```bash
# Test locally again
python server_py.py
# Open http://localhost:8000

# Check git status
git status

# View git log
git log --oneline -5

# Verify JSON validity
python -m json.tool dane.json

# Check file sizes
ls -lh *.json *.txt *.png
```

---

**Deployment Status:** Ready ✅

**Next Step:** Go to [railway.app](https://railway.app) or [netlify.com](https://netlify.com) and deploy!
