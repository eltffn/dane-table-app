const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'dane.json');

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(__dirname));

// GET /api/data - return current dane.json
app.get('/api/data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data);
  } catch (err) {
    console.error('Error reading dane.json:', err);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// POST /api/data - accept a JSON body and save it, then broadcast
app.post('/api/data', (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('[live-autosave]', new Date().toISOString(), '- dane.json updated');
    broadcastUpdate(data);
    res.json({ success: true, message: 'Data saved' });
  } catch (err) {
    console.error('Error writing dane.json:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// create HTTP server and upgrade to WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  // send current file immediately
  try {
    const current = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    ws.send(JSON.stringify({ type: 'init', data: current }));
  } catch (err) {}

  ws.on('close', () => console.log('WebSocket client disconnected'));
});

function broadcastUpdate(data){
  const msg = JSON.stringify({ type: 'update', data });
  wss.clients.forEach(client => {
    if(client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

// Watch the file system for external edits and broadcast changes
fs.watchFile(DATA_FILE, { interval: 1000 }, (curr, prev) => {
  if(curr.mtimeMs === prev.mtimeMs) return;
  try {
    const updated = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log('[watch] dane.json changed, broadcasting');
    broadcastUpdate(updated);
  } catch (err) {
    console.error('Error parsing changed dane.json:', err);
  }
});

server.listen(PORT, () => {
  console.log(`Live server running on http://localhost:${PORT}`);
  console.log(`WebSocket listening on same port`);
});
