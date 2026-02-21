// copy of app.js but connects to live server and receives broadcasts
let data = {};
let columns = [];
let originalOrder = [];
let filteredIndices = [];
let API_AVAILABLE = false;
let autoSaveTimeout = null;

const API_URL = 'http://localhost:3001/api/data';
const WS_URL = 'ws://localhost:3001';

const ws = new WebSocket(WS_URL);
ws.addEventListener('open', ()=> console.log('WebSocket connected to live server'));
ws.addEventListener('message', ev => {
  try{
    const msg = JSON.parse(ev.data);
    if(msg.type === 'init' || msg.type === 'update'){
      data = msg.data;
      columns = Object.keys(data);
      const rowCount = Math.max(...columns.map(c=> (data[c]||[]).length ));
      originalOrder = Array.from({length: rowCount}, (_, i) => i);
      filteredIndices = [...originalOrder];
      buildTable();
      console.log('Live data received');
    }
  }catch(err){ console.error('Bad WS message', err); }
});

ws.addEventListener('close', ()=> console.warn('WebSocket closed'));

// remaining functions are same as app.js but use API_URL

function getRanking(rowIndex){
  return rowIndex + 1;
}

function buildTable(){
  const wrap = document.getElementById('tableWrap');
  if(!wrap) return;
  wrap.innerHTML = '';
  const tbl = document.createElement('table');
  tbl.id = 'dataTable';

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

  const tbody = document.createElement('tbody');
  filteredIndices.forEach((r, displayIndex) => {
    const tr = document.createElement('tr');
    const tdRank = document.createElement('td');
    tdRank.className = 'rankingCell';
    tdRank.textContent = displayIndex + 1;
    tr.appendChild(tdRank);
    columns.forEach(col=>{
      const td = document.createElement('td');
      const val = (data[col] && data[col][r] !== undefined) ? data[col][r] : '';
      if(col.toLowerCase()==='tag'){
        const colorBox = document.createElement('div');
        colorBox.className = 'colorBox';
        colorBox.style.background = `#${String(val).trim()}`;
        const inp = document.createElement('input');
        inp.value = val;
        inp.dataset.row = r;
        inp.dataset.col = col;
        inp.addEventListener('input',()=>{
          colorBox.style.background = `#${inp.value}`;
          scheduleAutoSave();
        });
        inp.className='cellInput';
        td.appendChild(colorBox);
        td.appendChild(inp);
      }else{
        const el = document.createElement('div');
        el.contentEditable = 'true';
        el.className = 'cellEditable';
        el.dataset.col = col;
        el.dataset.row = r;
        el.textContent = val;
        el.addEventListener('blur', ()=> scheduleAutoSave());
        td.appendChild(el);
      }
      tr.appendChild(td);
    });
    const tdAct = document.createElement('td');
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.addEventListener('click',()=>{ deleteRow(r); });
    tdAct.appendChild(del);
    tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  wrap.appendChild(tbl);
}

function collectData(){
  const out = {};
  columns.forEach(col=> out[col]=[]);
  const rows = document.querySelectorAll('#dataTable tbody tr');
  rows.forEach((tr, displayIdx) => {
    const r = filteredIndices[displayIdx];
    const tds = tr.querySelectorAll('td');
    columns.forEach((col, ci)=>{
      const td = tds[ci + 1];
      if(col.toLowerCase()==='tag'){
        const inp = td.querySelector('input');
        out[col][r] = inp ? inp.value : '';
      }else{
        const editable = td.querySelector('.cellEditable');
        out[col][r] = editable ? editable.textContent.trim() : '';
      }
    });
  });
  return out;
}

async function autosave(){
  const out = collectData();
  try{
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(out)
    });
    if(res.ok){
      console.log('✓ Autosaved');
      data = out;
    }else console.error('Save failed:', res.status);
  }catch(err){ console.error('Autosave error:', err); }
}

function scheduleAutoSave(){
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(autosave, 1000);
}

function downloadJSON(){
  const out = collectData();
  const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dane-edited.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function copyJSON(){
  const out = collectData();
  navigator.clipboard.writeText(JSON.stringify(out, null, 2)).then(()=>{
    alert('JSON copied to clipboard');
  }).catch(err=>console.error(err));
}

function filterBySearch(){
  const query = document.getElementById('search').value.toLowerCase().trim();
  if(!query){ filteredIndices = [...originalOrder]; }
  else{
    filteredIndices = originalOrder.filter(r => {
      const name = (data.Name && data.Name[r] || '').toLowerCase();
      const tag = (data.TAG && data.TAG[r] || '').toLowerCase();
      return name.includes(query) || tag.includes(query);
    });
  }
  applySort();
}

function applySort(){
  const sortCol = document.getElementById('sortColumn').value;
  const sortDir = document.querySelector('input[name="sortDir"]:checked').value;
  if(!sortCol){ buildTable(); return; }
  const values = data[sortCol] || [];
  filteredIndices.sort((a, b) => {
    const valA = String(values[a] || '').toLowerCase().trim();
    const valB = String(values[b] || '').toLowerCase().trim();
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);
    if(!isNaN(numA) && !isNaN(numB)) return sortDir === 'asc' ? numA - numB : numB - numA;
    const cmp = valA.localeCompare(valB);
    return sortDir === 'asc' ? cmp : -cmp;
  });
  buildTable();
}

function addRow(){
  const rowCount = Math.max(...columns.map(c=> (data[c]||[]).length ));
  columns.forEach(col=>{ data[col] = data[col] || []; data[col].push(''); });
  originalOrder.push(rowCount);
  filteredIndices = [...originalOrder];
  buildTable();
  scheduleAutoSave();
}

function deleteRow(index){
  columns.forEach(col=>{ if(data[col] && data[col].length>index) data[col].splice(index,1); });
  originalOrder = originalOrder.filter(i => i !== index).map(i => i > index ? i - 1 : i);
  filteredIndices = filteredIndices.filter(i => i !== index).map(i => i > index ? i - 1 : i);
  buildTable();
  scheduleAutoSave();
}

window.addEventListener('load', ()=>{
  document.getElementById('addRow').addEventListener('click', addRow);
  document.getElementById('download').addEventListener('click', downloadJSON);
  document.getElementById('copy').addEventListener('click', copyJSON);
  document.getElementById('search').addEventListener('input', filterBySearch);
  document.getElementById('sortColumn').addEventListener('change', applySort);
  document.querySelectorAll('input[name="sortDir"]').forEach(radio => radio.addEventListener('change', applySort));
  document.getElementById('clearSort').addEventListener('click', ()=>{
    document.getElementById('sortColumn').value = '';
    filteredIndices = [...originalOrder];
    document.getElementById('search').value = '';
    buildTable();
  });
  // initial load will be provided via WebSocket 'init' message
});
