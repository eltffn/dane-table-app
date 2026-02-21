// Clean, stable frontend for dane-table-app
// - Matches backend API that returns { success: true/false }
// - Table data stored in /api/data
// - Year stored separately in /api/year

let data = {};
let columns = [];
let originalOrder = [];
let filteredIndices = [];
let adminLoggedIn = false;
let adminToken = '';

const API_BASE = window.location.origin + '/api';
const DATA_URL = API_BASE + '/data';
const YEAR_URL = API_BASE + '/year';
const VERIFY_URL = API_BASE + '/verify';
const RESTORE_URL = API_BASE + '/restore';

// Save debounce to avoid concurrent writes/races
let saveTimeout = null;
const SAVE_DEBOUNCE_MS = 250;

function withErrorAlert(promise, message) {
  return promise.catch(err => { console.error(err); alert(message || 'Operation failed'); throw err; });
}

async function loadYearText() {
  try {
    const res = await fetch(YEAR_URL);
    const j = await res.json();
    if (j && j.success && j.year) {
      document.getElementById('yearText').textContent = j.year;
    } else {
      document.getElementById('yearText').textContent = 'Year: 1444';
    }
  } catch (e) {
    console.error('loadYearText error', e);
    document.getElementById('yearText').textContent = 'Year: 1444';
  }
}

async function loadData() {
  try {
    const res = await fetch(DATA_URL);
    const j = await res.json();
    if (j && j.success) {
      data = j.data || {};
    } else {
      console.error('Failed loading data', j && j.error);
      data = {};
    }
  } catch (e) {
    console.error('Failed to load data', e);
    data = {};
  }

  // Ensure yearText never becomes a displayed column
  columns = Object.keys(data).filter(col => col !== 'yearText');
  const rowCount = Math.max(...columns.map(c => (data[c] || []).length), 0);
  originalOrder = Array.from({ length: rowCount }, (_, i) => i);
  filteredIndices = [...originalOrder];

  buildTable();
  await loadYearText();
}

function buildTable() {
  const wrap = document.getElementById('tableWrap');
  wrap.innerHTML = '';
  const tbl = document.createElement('table');
  tbl.id = 'dataTable';

  // Header
  const thead = document.createElement('thead');
  const hrow = document.createElement('tr');
  const thRank = document.createElement('th');
  thRank.textContent = 'Rank';
  hrow.appendChild(thRank);

  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    hrow.appendChild(th);
  });

  const thActions = document.createElement('th');
  if (adminLoggedIn) {
  thActions.textContent = 'Actions';
  hrow.appendChild(thActions);
}
  hrow.appendChild(thActions);
  thead.appendChild(hrow);
  tbl.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  filteredIndices.forEach((r, displayIndex) => {
    const tr = document.createElement('tr');

    const tdRank = document.createElement('td');
    tdRank.className = 'rankingCell';
    tdRank.textContent = displayIndex + 1;
    tr.appendChild(tdRank);

    columns.forEach(col => {
      const td = document.createElement('td');
      const val = (data[col] && data[col][r] !== undefined) ? data[col][r] : '';

      if (col.toLowerCase() === 'tag') {
        const colorBox = document.createElement('div');
        colorBox.className = 'colorBox';
        colorBox.style.background = `#${String(val).trim()}`;
        const inp = document.createElement('input');
        inp.value = val;
        inp.dataset.row = r;
        inp.dataset.col = col;
        inp.disabled = !adminLoggedIn;
        inp.addEventListener('input', () => {
          if (!adminLoggedIn) return;
          colorBox.style.background = `#${inp.value}`;
          collectAndScheduleSave();
        });
        inp.className = 'cellInput';
        td.appendChild(colorBox);
        td.appendChild(inp);
      } else {
        const el = document.createElement('div');
        el.contentEditable = adminLoggedIn ? 'true' : 'false';
        el.className = 'cellEditable';
        el.dataset.col = col;
        el.dataset.row = r;
        el.textContent = val;
        el.style.opacity = adminLoggedIn ? '1' : '0.7';
        el.style.cursor = adminLoggedIn ? 'text' : 'default';

        if (!adminLoggedIn) {
          el.addEventListener('focus', (e) => { e.preventDefault(); e.target.blur(); });
        } else {
          el.addEventListener('blur', () => { collectAndScheduleSave(); });
        }

        td.appendChild(el);
      }
      tr.appendChild(td);
    });

    // Actions
    const tdAct = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.disabled = !adminLoggedIn;
    delBtn.addEventListener('click', () => {
      if (!adminLoggedIn) { alert('Login to admin panel to delete rows'); return; }
      deleteRow(r);
    });
    tdAct.appendChild(delBtn);
    tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  wrap.appendChild(tbl);
}

function collectTableState() {
  const out = {};
  columns.forEach(col => out[col] = []);

  const rows = document.querySelectorAll('#dataTable tbody tr');
  rows.forEach((tr, displayIdx) => {
    const r = filteredIndices[displayIdx];
    const tds = tr.querySelectorAll('td');
    let colIdx = 1; // skip rank
    columns.forEach(col => {
      const td = tds[colIdx];
      let val = '';
      if (col.toLowerCase() === 'tag') {
        const inp = td.querySelector('input');
        val = inp ? inp.value : '';
      } else {
        val = td.querySelector('.cellEditable')?.textContent || '';
      }
      out[col][r] = val;
      colIdx++;
    });
  });
  return out;
}

function collectAndScheduleSave() {
  // collect into `data` in-memory then schedule save
  const newData = collectTableState();
  data = newData;
  scheduleSaveData();
}

function scheduleSaveData() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => { doSaveData().catch(() => {}); }, SAVE_DEBOUNCE_MS);
}

async function doSaveData() {
  if (!adminLoggedIn || !adminToken) return;
  const payload = JSON.parse(JSON.stringify(data));
  if (payload.hasOwnProperty('yearText')) delete payload.yearText;

  try {
    const res = await fetch(DATA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': adminToken },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (!j || !j.success) {
      console.error('Autosave failed', j && j.error);
    } else {
      console.log('Autosaved');
    }
  } catch (e) {
    console.error('Autosave error', e);
  }
}

async function deleteRow(index) {
  if (!adminLoggedIn) return;

  // Remove from all columns
  columns.forEach(col => {
    if (data[col] && data[col].length > index) data[col].splice(index, 1);
  });

  originalOrder = originalOrder.filter(i => i !== index).map(i => i > index ? i - 1 : i);
  filteredIndices = filteredIndices.filter(i => i !== index).map(i => i > index ? i - 1 : i);

  // Save immediately and rebuild on success
  try {
    const payload = JSON.parse(JSON.stringify(data));
    if (payload.hasOwnProperty('yearText')) delete payload.yearText;
    const res = await fetch(DATA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': adminToken },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (j && j.success) {
      console.log('✓ Row deleted');
      buildTable();
    } else {
      alert('Delete failed: ' + (j && j.error));
    }
  } catch (e) {
    console.error('Delete error', e);
    alert('Delete failed');
  }
}

function filterBySearch() {
  const query = document.getElementById('search').value.toLowerCase();
  const nameCol = data['Name'] || [];
  const tagCol = data['TAG'] || [];
  filteredIndices = originalOrder.filter(r => {
    const name = String(nameCol[r] || '').toLowerCase();
    const tag = String(tagCol[r] || '').toLowerCase();
    return name.includes(query) || tag.includes(query);
  });
  buildTable();
}

function applySort() {
  const sortCol = document.getElementById('sortColumn').value;
  const sortDir = document.querySelector('input[name="sortDir"]:checked').value;
  if (!sortCol) { buildTable(); return; }
  const values = data[sortCol] || [];
  filteredIndices.sort((a, b) => {
    const valA = String(values[a] || '').toLowerCase().trim();
    const valB = String(values[b] || '').toLowerCase().trim();
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);
    if (!isNaN(numA) && !isNaN(numB)) return sortDir === 'asc' ? numA - numB : numB - numA;
    const cmp = valA.localeCompare(valB);
    return sortDir === 'asc' ? cmp : -cmp;
  });
  buildTable();
}

function downloadJSON() {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dane.json';
  a.click();
  URL.revokeObjectURL(url);
}

function copyJSON() {
  const json = JSON.stringify(data, null, 2);
  navigator.clipboard.writeText(json).then(() => alert('JSON copied to clipboard!'));
}

function setupHamburger() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('backdrop');
  hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); sidebar.classList.toggle('active'); backdrop.classList.toggle('active'); });
  backdrop.addEventListener('click', () => { hamburger.classList.remove('active'); sidebar.classList.remove('active'); backdrop.classList.remove('active'); });
  document.querySelectorAll('.sidebar a').forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); const view = link.dataset.view; showView(view); hamburger.classList.remove('active'); sidebar.classList.remove('active'); backdrop.classList.remove('active'); }); });
}

function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  if (viewName === 'map') document.getElementById('mapView').classList.add('active');
  else if (viewName === 'data') document.getElementById('dataView').classList.add('active');
  else if (viewName === 'admin') document.getElementById('adminView').classList.add('active');
}

function setupAdminPanel() {
  const adminBtn = document.getElementById('adminPanel');
  const adminLogin = document.getElementById('adminLogin');
  const logoutBtn = document.getElementById('logoutAdmin');
  const editJsonBtn = document.getElementById('editJSON');
  const editYearBtn = document.getElementById('editYear');
  const restoreBtn = document.getElementById('restoreDefault');

  adminBtn.addEventListener('click', () => showView('admin'));

  restoreBtn.addEventListener('click', async () => {
    if (!adminLoggedIn) { alert('Login as admin first.'); return; }
    if (!confirm('Are you sure you want to restore default data? This will overwrite table data.')) return;
    try {
      const res = await fetch(RESTORE_URL, { method: 'POST', headers: { 'x-api-key': adminToken } });
      const j = await res.json();
      if (j && j.success) { alert('Default data restored successfully!'); location.reload(); }
      else alert('Restore failed: ' + (j && j.error));
    } catch (e) { console.error(e); alert('Restore error.'); }
  });

  // LOGIN
  adminLogin.addEventListener('click', async () => {
    const password = document.getElementById('adminPassword').value;
    if (!password) { alert('Enter password'); return; }
    try {
      const res = await fetch(VERIFY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': password } });
      const j = await res.json();
      const msgEl = document.getElementById('adminMessage');
      if (j && j.success && j.authorized) {
        adminLoggedIn = true; adminToken = password;
        msgEl.textContent = 'Password was Successful'; msgEl.classList.remove('error'); msgEl.classList.add('success');
        const passwordBox = document.getElementById('passwordBox'); if (passwordBox) passwordBox.style.display = 'none';
        document.getElementById('adminPassword').value = '';
        const adminContent = document.getElementById('adminContent'); if (adminContent) adminContent.style.display = 'block';
        buildTable();
      } else {
        msgEl.textContent = 'Password was Unsuccessful'; msgEl.classList.remove('success'); msgEl.classList.add('error');
      }
    } catch (e) { console.error(e); alert('Error verifying password'); }
  });

  // LOGOUT
  logoutBtn.addEventListener('click', () => {
    adminLoggedIn = false; adminToken = '';
    document.getElementById('adminContent').style.display = 'none';
    document.getElementById('adminMessage').textContent = '';
    document.getElementById('passwordBox').style.display = 'flex';
    document.getElementById('adminPassword').value = '';
    buildTable();
  });

  // JSON EDIT
  editJsonBtn.addEventListener('click', () => {
    document.getElementById('jsonEditorModal').classList.add('show');
    document.getElementById('jsonContent').value = JSON.stringify(data, null, 2);
  });

  document.getElementById('closeJSON').addEventListener('click', () => document.getElementById('jsonEditorModal').classList.remove('show'));
  document.getElementById('cancelJSON').addEventListener('click', () => document.getElementById('jsonEditorModal').classList.remove('show'));

  document.getElementById('saveJSON').addEventListener('click', async () => {
    try {
      const newData = JSON.parse(document.getElementById('jsonContent').value);
      if (newData.hasOwnProperty('yearText')) delete newData.yearText;
      const res = await fetch(DATA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': adminToken }, body: JSON.stringify(newData) });
      const j = await res.json();
      if (j && j.success) { alert('JSON saved!'); document.getElementById('jsonEditorModal').classList.remove('show'); location.reload(); }
      else alert('Error: ' + (j && j.error));
    } catch (e) { alert('Invalid JSON: ' + e.message); }
  });

  // YEAR EDIT
  editYearBtn.addEventListener('click', () => {
    document.getElementById('yearEditorModal').classList.add('show');
    document.getElementById('yearInput').value = document.getElementById('yearText').textContent;
  });

  document.getElementById('closeYear').addEventListener('click', () => document.getElementById('yearEditorModal').classList.remove('show'));
  document.getElementById('cancelYear').addEventListener('click', () => document.getElementById('yearEditorModal').classList.remove('show'));

  document.getElementById('saveYear').addEventListener('click', async () => {
    const yearText = document.getElementById('yearInput').value;
    try {
      const res = await fetch(YEAR_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': adminToken }, body: JSON.stringify({ year: yearText }) });
      const j = await res.json();
      if (j && j.success) {
        document.getElementById('yearText').textContent = yearText;
        document.getElementById('yearEditorModal').classList.remove('show');
        alert('Year saved permanently!');
      } else alert('Error saving year: ' + (j && j.error));
    } catch (e) { console.error(e); alert('Save failed'); }
  });
}

// Initialize
window.addEventListener('load', () => {
  setupHamburger();
  setupAdminPanel();
  document.getElementById('download').addEventListener('click', downloadJSON);
  document.getElementById('copy').addEventListener('click', copyJSON);
  document.getElementById('search').addEventListener('input', filterBySearch);
  document.getElementById('sortColumn').addEventListener('change', applySort);
  document.querySelectorAll('input[name="sortDir"]').forEach(radio => radio.addEventListener('change', applySort));
  document.getElementById('clearSort').addEventListener('click', () => { document.getElementById('sortColumn').value = ''; filteredIndices = [...originalOrder]; document.getElementById('search').value = ''; buildTable(); });
  loadData();
});
