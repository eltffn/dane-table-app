let data = {};
let columns = [];
let originalOrder = [];
let filteredIndices = [];
let adminLoggedIn = false;
let adminPassword = '';
let adminToken = '';
const API_URL = window.location.origin + '/api/data';

// Load year text from local storage or file
async function loadYearText() {
  try {
    const res = await fetch(API_URL + '?action=getYear');
    if (res.ok) {
      const result = await res.json();
      document.getElementById('yearText').textContent = result.year || 'Year: 1444';
    }
  } catch (e) {
    document.getElementById('yearText').textContent = 'Year: 1444';
  }
}

async function loadData() {
  try {
    const res = await fetch(API_URL);
    if (res.ok) {
      data = await res.json();
      console.log('✓ Data loaded');
    }
  } catch (e) {
    console.error('Failed to load data', e);
    data = {};
  }
  
  columns = Object.keys(data);
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
  thActions.textContent = 'Actions';
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
          // Collect and autosave
          collectAndSave();
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
          el.addEventListener('focus', (e) => {
            e.preventDefault();
            e.target.blur();
          });
        } else {
          el.addEventListener('blur', () => {
            collectAndSave();
          });
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
      if (!adminLoggedIn) {
        alert('Login to admin panel to delete rows');
        return;
      }
      deleteRow(r);
    });
    tdAct.appendChild(delBtn);
    tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  wrap.appendChild(tbl);
}

function collectAndSave() {
  const out = {};
  columns.forEach(col => out[col] = []);
  const rows = document.querySelectorAll('#dataTable tbody tr');
  rows.forEach((tr, displayIdx) => {
    const r = filteredIndices[displayIdx];
    const tds = tr.querySelectorAll('td');
    let colIdx = 1; // Skip rank column
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
  data = out;
}

function deleteRow(index) {
  columns.forEach(col => {
    if (data[col] && data[col].length > index) {
      data[col].splice(index, 1);
    }
  });
  originalOrder = originalOrder.filter(i => i !== index).map(i => i > index ? i - 1 : i);
  filteredIndices = filteredIndices.filter(i => i !== index).map(i => i > index ? i - 1 : i);
  collectAndSave();
  buildTable();
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
  
  if (!sortCol) {
    buildTable();
    return;
  }

  const values = data[sortCol] || [];
  filteredIndices.sort((a, b) => {
    const valA = String(values[a] || '').toLowerCase().trim();
    const valB = String(values[b] || '').toLowerCase().trim();
    
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return sortDir === 'asc' ? numA - numB : numB - numA;
    }
    
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
  navigator.clipboard.writeText(json).then(() => {
    alert('JSON copied to clipboard!');
  });
}

// Hamburger menu
function setupHamburger() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('backdrop');
  
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    sidebar.classList.toggle('active');
    backdrop.classList.toggle('active');
  });
  
  backdrop.addEventListener('click', () => {
    hamburger.classList.remove('active');
    sidebar.classList.remove('active');
    backdrop.classList.remove('active');
  });
  
  document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      showView(view);
      hamburger.classList.remove('active');
      sidebar.classList.remove('active');
      backdrop.classList.remove('active');
    });
  });
}

function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  
  if (viewName === 'map') {
    document.getElementById('mapView').classList.add('active');
  } else if (viewName === 'data') {
    document.getElementById('dataView').classList.add('active');
  } else if (viewName === 'admin') {
    document.getElementById('adminView').classList.add('active');
  }
}

// Admin panel
function setupAdminPanel() {
  const adminBtn = document.getElementById('adminPanel');
  const adminLogin = document.getElementById('adminLogin');
  const logoutBtn = document.getElementById('logoutAdmin');
  const editJsonBtn = document.getElementById('editJSON');
  const editYearBtn = document.getElementById('editYear');

  adminBtn.addEventListener('click', () => {
    showView('admin');
  });

  // LOGIN
  adminLogin.addEventListener('click', () => {
    const password = document.getElementById('adminPassword').value;
    if (!password) {
      alert('Enter password');
      return;
    }

    fetch('/api/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': password
      }
    })
    .then(res => res.json())
    .then(result => {
      const msgEl = document.getElementById('adminMessage');

      if (result.authorized) {
        adminLoggedIn = true;
        adminToken = password;

        msgEl.textContent = 'Password was Successful';
        msgEl.classList.remove('error');
        msgEl.classList.add('success');

        const passwordBox = document.getElementById('passwordBox');
if (passwordBox) passwordBox.style.display = 'none';
        document.getElementById('adminPassword').value = '';
        const adminContent = document.getElementById('adminContent');
if (adminContent) adminContent.style.display = 'block';

        buildTable();
      } else {
        msgEl.textContent = 'Password was Unsuccessful';
        msgEl.classList.remove('success');
        msgEl.classList.add('error');
      }
    })
    .catch(err => {
      console.error(err);
      alert('Error verifying password');
    });
  });

  // LOGOUT
  logoutBtn.addEventListener('click', () => {
    adminLoggedIn = false;
    adminToken = '';

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

  document.getElementById('closeJSON').addEventListener('click', () => {
    document.getElementById('jsonEditorModal').classList.remove('show');
  });

  document.getElementById('cancelJSON').addEventListener('click', () => {
    document.getElementById('jsonEditorModal').classList.remove('show');
  });

  document.getElementById('saveJSON').addEventListener('click', () => {
    try {
      const newData = JSON.parse(document.getElementById('jsonContent').value);

      fetch('/api/data', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': adminToken
        },
        body: JSON.stringify(newData)
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          alert('JSON saved!');
          document.getElementById('jsonEditorModal').classList.remove('show');
          location.reload();
        } else {
          alert('Error: ' + result.error);
        }
      });

    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  });

  // YEAR EDIT
  editYearBtn.addEventListener('click', () => {
    document.getElementById('yearEditorModal').classList.add('show');
    document.getElementById('yearInput').value =
      document.getElementById('yearText').textContent;
  });

  document.getElementById('closeYear').addEventListener('click', () => {
    document.getElementById('yearEditorModal').classList.remove('show');
  });

  document.getElementById('cancelYear').addEventListener('click', () => {
    document.getElementById('yearEditorModal').classList.remove('show');
  });

  document.getElementById('saveYear').addEventListener('click', () => {
    const yearText = document.getElementById('yearInput').value;

    fetch('/api/data', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': adminToken
      },
      body: JSON.stringify({ year: yearText })
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        document.getElementById('yearText').textContent = yearText;
        document.getElementById('yearEditorModal').classList.remove('show');
        alert('Year text saved!');
      }
    });
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
  document.querySelectorAll('input[name="sortDir"]').forEach(radio => {
    radio.addEventListener('change', applySort);
  });
  document.getElementById('clearSort').addEventListener('click', () => {
    document.getElementById('sortColumn').value = '';
    filteredIndices = [...originalOrder];
    document.getElementById('search').value = '';
    buildTable();
  });
  
  loadData();
});
