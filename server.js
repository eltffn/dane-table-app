const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const EDIT_TOKEN = process.env.EDIT_TOKEN || 'changeme';

const DATA_DIR = process.env.DATA_DIR || '/data';

const DATA_FILE = path.join(DATA_DIR, 'dane.json');
const DEFAULT_FILE = path.join(__dirname, 'default.json'); // default stays in repo
const YEAR_FILE = path.join(DATA_DIR, 'year.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Simple per-file promise-queue to avoid races
const locks = new Map();
function withLock(file, fn) {
  const prev = locks.get(file) || Promise.resolve();
  const next = prev.then(() => fn());
  // store and cleanup
  locks.set(file, next.finally(() => { if (locks.get(file) === next) locks.delete(file); }));
  return next;
}

async function readJsonSafe(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

async function writeJsonAtomic(file, obj) {
  const tmp = file + '.tmp';
  const data = JSON.stringify(obj, null, 2);
  await fs.writeFile(tmp, data, 'utf8');
  await fs.rename(tmp, file);
}

// Helper to respond with consistent structure
function success(res, payload = {}) { return res.json(Object.assign({ success: true }, payload)); }
function failure(res, code = 500, message = 'Error') { return res.status(code).json({ success: false, error: message }); }

// =============================
// GET table data
// =============================
app.get('/api/data', (req, res) => {
  return withLock(DATA_FILE, async () => {
    const data = await readJsonSafe(DATA_FILE) || {};
    // Ensure we never leak yearText as a column in table responses
    const cleaned = Object.assign({}, data);
    if (cleaned.hasOwnProperty('yearText')) delete cleaned.yearText;
    return success(res, { data: cleaned });
  }).catch(err => {
    console.error('GET /api/data error', err);
    return failure(res, 500, 'Failed to read data');
  });
});

// =============================
// POST table data (save)
// =============================
app.post('/api/data', (req, res) => {
  const token = req.get('x-api-key');
  if (token !== EDIT_TOKEN) return failure(res, 403, 'Unauthorized');

  const body = req.body;
  if (!body || typeof body !== 'object') return failure(res, 400, 'Invalid payload');

  // Never accept yearText in the table file -- separate storage
  const toSave = Object.assign({}, body);
  if (toSave.hasOwnProperty('yearText')) delete toSave.yearText;

  return withLock(DATA_FILE, async () => {
    await writeJsonAtomic(DATA_FILE, toSave);
    return success(res);
  }).catch(err => {
    console.error('POST /api/data error', err);
    return failure(res, 500, 'Failed to save data');
  });
});

// =============================
// GET year
// =============================
app.get('/api/year', (req, res) => {
  return withLock(YEAR_FILE, async () => {
    const y = await readJsonSafe(YEAR_FILE);
    const yearText = (y && (y.year || y.yearText)) || 'Year: 1444';
    return success(res, { year: yearText });
  }).catch(err => {
    console.error('GET /api/year error', err);
    return failure(res, 500, 'Failed to read year');
  });
});

// =============================
// POST year (save year text)
// =============================
app.post('/api/year', (req, res) => {
  const token = req.get('x-api-key');
  if (token !== EDIT_TOKEN) return failure(res, 403, 'Unauthorized');

  const year = (req.body && (req.body.year || req.body.yearText || req.body)) || '';
  const payload = { year: String(year) };

  return withLock(YEAR_FILE, async () => {
    await writeJsonAtomic(YEAR_FILE, payload);
    return success(res);
  }).catch(err => {
    console.error('POST /api/year error', err);
    return failure(res, 500, 'Failed to save year');
  });
});

// =============================
// VERIFY token
// =============================
app.post('/api/verify', (req, res) => {
  try {
    const token = req.get('x-api-key');
    const authorized = token === EDIT_TOKEN;
    return success(res, { authorized });
  } catch (err) {
    console.error('POST /api/verify error', err);
    return failure(res, 500, 'Verify error');
  }
});

// =============================
// RESTORE default data (only table)
// =============================
app.post('/api/restore', (req, res) => {
  const token = req.get('x-api-key');
  if (token !== EDIT_TOKEN) return failure(res, 403, 'Unauthorized');

  return withLock(DATA_FILE, async () => {
    const def = await readJsonSafe(DEFAULT_FILE);
    if (!def) throw new Error('default.json not found or invalid');
    // Ensure default.json doesn't contain yearText; ignore if present
    const toSave = Object.assign({}, def);
    if (toSave.hasOwnProperty('yearText')) delete toSave.yearText;
    await writeJsonAtomic(DATA_FILE, toSave);
    return success(res);
  }).catch(err => {
    console.error('POST /api/restore error', err);
    return failure(res, 500, 'Restore failed');
  });
});

// =============================
// Global error handler
// =============================
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  return failure(res, 500, 'Internal server error');
});
async function ensureFiles() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    const dataExists = await readJsonSafe(DATA_FILE);
    if (!dataExists) {
      const def = await readJsonSafe(DEFAULT_FILE) || {};
      await writeJsonAtomic(DATA_FILE, def);
    }

    const yearExists = await readJsonSafe(YEAR_FILE);
    if (!yearExists) {
      await writeJsonAtomic(YEAR_FILE, { year: "Year: 1444" });
    }

    console.log("Persistent storage ready.");
  } catch (err) {
    console.error("Failed initializing storage", err);
  }
}
ensureFiles().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});
