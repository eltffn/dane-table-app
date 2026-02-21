const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const EDIT_TOKEN = process.env.EDIT_TOKEN || 'changeme';

console.log("EDIT_TOKEN loaded:", process.env.EDIT_TOKEN ? "YES" : "NO (using default)");

const DATA_FILE = path.join(__dirname, 'dane.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));


// =============================
// GET DATA
// =============================
app.get('/api/data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data);
  } catch (err) {
    console.error('Error reading dane.json:', err);
    res.status(500).json({ error: 'Failed to read data' });
  }
});


// =============================
// VERIFY PASSWORD
// =============================
app.post('/api/verify', (req, res) => {
  const token = req.get('x-api-key');

  if (token === EDIT_TOKEN) {
    return res.json({ authorized: true });
  } else {
    return res.json({ authorized: false });
  }
});


// =============================
// SAVE DATA
// =============================
app.post('/api/data', (req, res) => {
  const token = req.get('x-api-key');

  if (token !== EDIT_TOKEN) {
    console.warn('[unauthorized] save attempt from', req.ip);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const data = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('[autosave]', new Date().toISOString(), '- dane.json updated');
    res.json({ success: true });
  } catch (err) {
    console.error('Error writing dane.json:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});


// =============================
// START SERVER
// =============================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});