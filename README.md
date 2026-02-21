# Awzanajom's Alternative History Countries Data

A professional web application for managing and displaying countries data with a map view and interactive data table.

## Features

- 🗺️ **Map View**: Display a large, centered map image with customizable year text
- 📊 **Data Table**: Interactive table with search, sorting, and filtering capabilities
- 🔐 **Admin Panel**: Password-protected editing with:
  - JSON editor for bulk data updates
  - Year text editor for map caption
  - Row deletion capability
- 📱 **Responsive Design**: Clean, modern interface that works on all devices
- 💾 **Auto-Save**: Changes automatically save to `dane.json`

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # Professional styling
├── app.js              # Frontend JavaScript logic
├── server_py.py        # Python backend server
├── dane.json           # Countries data (JSON format)
├── year.txt            # Year/date text displayed on map
├── map.png             # Map image file
├── netlify.toml        # Netlify deployment config
└── README.md           # This file
```

## Local Development

### Requirements
- Python 3.7+
- map.png (place in the same directory)

### Running Locally

```bash
cd path/to/dane-table-app
python server_py.py
```

Then open **http://localhost:8000** in your browser.

### Default Credentials
- **Admin Password**: `changeme` (set via `EDIT_PASSWORD` environment variable)

## Deployment

### Deploy to Railway (Recommended - Free Tier)

Railway is the simplest deployment option - it handles both frontend and backend.

1. **Prepare your code:**
   - Ensure all files are ready (index.html, app.js, styles.css, server_py.py, dane.json, year.txt, map.png)

2. **Go to [Railway.app](https://railway.app) and sign up**

3. **Create New Project → GitHub Repository:**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Connect your GitHub account and select your `dane-table-app` repository
   - OR upload files manually

4. **Configure Environment Variables:**
   - In Railway dashboard, go to site → "Variables"
   - Add: `EDIT_PASSWORD` = your admin password
   - Add: `PORT` = 8000

5. **Deploy:**
   - Railway automatically detects Python and runs `server_py.py`
   - Your app will be live at: `https://yourusername-dane-table-app.railway.app`

6. **Update API URL (if needed):**
   - If your Railway URL differs from expected, edit `app.js` line 8:
   ```javascript
   const API_URL = 'https://yourdeployedurl.railway.app/api/data';
   ```

### Alternative: Netlify (Frontend) + Railway (Backend)

1. **Deploy backend to Railway** (see above)
2. **Deploy frontend to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "Add new site" → "Deploy manually" or "Connect Git"
   - Upload your project folder (or connect GitHub)
   - Set publish directory to `.` (root)
3. **Update API URL in app.js to point to your Railway backend URL**
4. Current setup expects Railway base URL

## API Endpoints

All endpoints require `x-edit-password` header for mutations.

### GET `/api/data`
Get all countries data
```javascript
fetch('/api/data')
```

### POST `/api/data`
Update countries data
```javascript
fetch('/api/data', {
  method: 'POST',
  headers: { 'x-edit-password': 'yourpassword' },
  body: JSON.stringify(data)
})
```

### POST `/api/data?action=verify`
Verify admin password
```javascript
fetch('/api/data?action=verify', {
  method: 'POST',
  headers: { 'x-edit-password': 'yourpassword' },
  body: JSON.stringify({})
})
```

### GET `/api/data?action=getYear`
Get year text
```javascript
fetch('/api/data?action=getYear')
```

### POST `/api/data?action=setYear`
Update year text
```javascript
fetch('/api/data?action=setYear', {
  method: 'POST',
  headers: { 'x-edit-password': 'yourpassword' },
  body: JSON.stringify({ year: 'Year: 1444' })
})
```

## Customization

### Changing the Map Image
1. Replace `map.png` with your own map image
2. The image will automatically scale to fit the view

### Changing the Year Text
1. Use the **Admin Panel** → **"Edit Year Text"** button
2. Or edit `year.txt` directly
3. Or make a POST request to `/api/data?action=setYear`

### Changing the Admin Password  
Set the `EDIT_PASSWORD` environment variable:
```bash
# Local
export EDIT_PASSWORD="my_secure_password"
python server_py.py

# Railway/Netlify
Add as environment variable in dashboard
```

### Editing the dane.json Data
1. Direct file edit: Open `dane.json` with any text editor
2. Admin Panel: Click **"Admin Panel"** → Enter password → Click **"Edit JSON"**
3. Table editing: In Data view, click cells to edit (requires admin login)

## Data Format (dane.json)

```json
{
  "Name": ["Country1", "Country2"],
  "TAG": ["FF0000", "00FF00"],
  "Army": ["10000", "5000"],
  "Stability": ["100", "50"],
  "Government": ["Monarchy", "Republic"]
}
```

Each key is a column, and array values correspond to rows.

## Use the Admin Panel

**To access admin controls:**
1. Click **"Admin Panel"** button in the hamburger menu
2. Enter admin password (default: `changeme`)
3. Click **"Login"**
4. You'll now see **"Edit JSON"** and **"Edit Year"** buttons
5. Table cells become editable (click to edit)
6. Delete buttons become available on each row

**Edit Options:**
- **Edit JSON**: Opens a modal to edit the entire dane.json file
- **Edit Year**: Opens a modal to edit the year.txt file  
- **Table Cells**: Click any cell to edit inline
- **Delete Row**: Click the red "Delete" button on any row

## Troubleshooting

### "Cannot connect to server" / API errors
- Make sure your backend is running (locally: `python server_py.py`)
- For deployed version, check Railway/Heroku dashboard for server status
- Verify the API URL in `app.js` matches your deployment URL

### "Admin password is incorrect"
- Password is case-sensitive
- Default is `changeme`
- For deployed version, check environment variables on Railway/Heroku dashboard

### "Data not saving"
- Check that backend server is running
- Open browser console (F12 → Console) and look for fetch errors
- Verify you have admin login active (you should see editable cells)

### "Drop-down menus not working"
- This is browser-specific. Use arrow keys to navigate dropdown or click to select

### Port 8000 already in use
- Another app is using port 8000
- Either close the other app or edit `server_py.py` to use a different port

## License

Created by Nicola Zalewski for Awzanajom's Alternative History project.

## Support

For issues, check:
1. Browser console (F12 → Console tab)
2. Server logs (terminal where `server_py.py` is running)
3. Deployment logs (Railway/Heroku dashboard)


