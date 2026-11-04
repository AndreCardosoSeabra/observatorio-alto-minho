const COLORS = ['#4a78b0','#3a8458','#e6c565','#ef9a93','#2f4468','#b7d3ee','#bfe0c7','#a87c10','#c4564d','#667790','#f7e3a3','#f2b0aa'];
const drop = document.getElementById('drop');
const fileInput = document.getElementById('file');
const msg = document.getElementById('msg');
const content = document.getElementById('content');
const clearBtn = document.getElementById('clear');
let charts = [];
let lastRows = null;

drop.addEventListener('click', () => fileInput.click());
['dragover','dragenter'].forEach(e => drop.addEventListener(e, ev => { ev.preventDefault(); drop.classList.add('over'); }));
['dragleave','drop'].forEach(e => drop.addEventListener(e, ev => { ev.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', ev => { if (ev.dataTransfer.files[0]) load(ev.dataTransfer.files[0]); });
fileInput.addEventListener('change', () => { if (fileInput.files[0]) load(fileInput.files[0]); });
const terrSel = document.getElementById('territory-select');
if (terrSel) terrSel.addEventListener('change', () => lastRows && safeRenderForms(lastRows));
clearBtn.addEventListener('click', () => {
  destroy(); content.innerHTML = ''; msg.textContent = ''; lastRows = null; fileInput.value = ''; clearBtn.style.display = 'none';
  try { localStorage.removeItem(STORE); } catch {}
});

// Provisório: os dados carregados pelo admin ficam guardados neste browser, para o modo utilizador os ver.
const STORE = 'observatorio-metas';
function saveRows(rows) { try { localStorage.setItem(STORE, JSON.stringify(rows)); } catch {} }
function restoreRows() {
  try { const r = JSON.parse(localStorage.getItem(STORE) || 'null'); if (Array.isArray(r) && r.length) { lastRows = r; safeRenderForms(r); return; } } catch {}
  msg.className = ''; msg.textContent = 'Ainda não há metas carregadas.';
}

function safeRenderForms(r) { try { renderForms(r); } catch (e) { msg.className = 'err'; msg.textContent = 'Erro: ' + e.message; } }
function destroy() { charts.forEach(c => c.destroy()); charts = []; }

function load(file) {
  msg.className = ''; msg.textContent = 'A ler ' + file.name + '...';
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) throw new Error('Ficheiro sem respostas.');
      lastRows = rows;
      saveRows(rows);
      renderForms(rows);
    } catch (err) {
      destroy(); content.innerHTML = ''; lastRows = null; clearBtn.style.display = 'none';
      msg.className = 'err'; msg.textContent = 'Erro: ' + err.message;
    }
  };
  reader.readAsArrayBuffer(file);
}

function isEmpty(v) { return v === '' || v === null || v === undefined || String(v).trim() === ''; }
function isTimestamp(col) { return /carimbo|timestamp|data\/hora/i.test(col); }

function renderForms(rows) {
  destroy(); content.innerHTML = '';
  const cols = Object.keys(rows[0]).filter(c => !isTimestamp(c));
  const act = detectActivities(rows, cols);
  if (!act) throw new Error('Formato inválido. O ficheiro deve ter uma coluna "Município" e, no mínimo, 2 colunas de metas com respostas Sim/Não (1 linha por município).');
  renderActivities(rows, act);
}

function addDonut(parent, title, labels, data, info, colors) {
  const card = document.createElement('div'); card.className = 'card';
  card.innerHTML = `<h3></h3><div class="big">${info}</div><div class="box"><canvas></canvas></div>`;
  card.querySelector('h3').textContent = title;
  parent.appendChild(card);
  const chart = new Chart(card.querySelector('canvas'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors || labels.map((_, i) => COLORS[i % COLORS.length]), borderColor: '#fff', borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#26364d', boxWidth: 12 } },
        tooltip: { callbacks: { label: c => {
          const sum = c.dataset.data.reduce((a, b) => a + b, 0);
          return ` ${c.label}: ${c.parsed} (${(c.parsed / sum * 100).toFixed(0)}%)`;
        } } }
      }
    }
  });
  charts.push(chart);
}

/* ---------- Modo metas por município ---------- */
const YES = /^(sim|cumprida|cumprido|s|yes|y|feito|feita|concluido|concluida|realizado|realizada|ok|x|1|true|✔|✓)$/;
const NO = /^(nao|por cumprir|nao cumprida|nao cumprido|n|no|por fazer|pendente|nao feito|nao feita|em curso|0|false|✘|✗)$/;
function norm(v) { return String(v).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function isYes(v) { return YES.test(norm(v)); }
function isYesNo(v) { const n = norm(v); return YES.test(n) || NO.test(n); }

function detectActivities(rows, cols) {
  const mcol = cols.find(c => /munic[ií]pio|concelho/i.test(c));
  if (!mcol) return null;
  const acts = cols.filter(c => {
    if (c === mcol) return false;
    const vals = rows.map(r => r[c]).filter(v => !isEmpty(v));
    return vals.length && vals.filter(isYesNo).length / vals.length >= 0.7;
  });
  return acts.length >= 2 ? { mcol, acts } : null;
}

function renderActivities(rows, { mcol, acts }) {
  const byMun = new Map();
  rows.forEach(r => { const m = String(r[mcol]).trim(); if (m) byMun.set(m, r); }); // última resposta prevalece
  const muns = [...byMun.keys()].sort((a, b) => a.localeCompare(b, 'pt'));
  // Célula vazia = município sem esse evento (não conta); Sim = cumprida; Não = por cumprir
  const st = (m, a) => { const v = byMun.get(m)[a]; return isEmpty(v) ? null : (isYes(v) ? 'yes' : 'no'); };
  const appOf = m => acts.filter(a => st(m, a) !== null);
  const doneOf = m => acts.filter(a => st(m, a) === 'yes').length;
  const all = muns.reduce((t, m) => t + appOf(m).length, 0);
  const done = muns.reduce((t, m) => t + doneOf(m), 0);

  // Território em análise: um município filtra; "Alto Minho" mostra todos
  const nk = x => norm(x);
  const sel = muns.find(m => nk(m) === nk(selectedTerritory));
  const shown = sel ? [sel] : muns;

  const grid = document.createElement('div'); grid.className = 'grid';
  content.appendChild(grid);
  if (!sel) addDonut(grid, 'Total de metas cumpridas', ['Cumpridas', 'Por cumprir'], [done, all - done],
    `<b>${done}</b> de <b>${all}</b> cumpridas`, ['#3a8458', '#ef9a93']);
  shown.forEach(m => {
    const d = doneOf(m), n = appOf(m).length;
    addDonut(grid, m, ['Cumpridas', 'Por cumprir'], [d, n - d],
      `<b>${d}</b> de <b>${n}</b> metas`, ['#3a8458', '#ef9a93']);
  });

  const wrap = document.createElement('div'); wrap.className = 'table-wrap';
  const table = document.createElement('table'); table.className = 'matrix';
  const addRow = (cells, tag, cls) => {
    const tr = document.createElement('tr');
    cells.forEach((t, i) => {
      const c = document.createElement(tag); c.textContent = t;
      if (cls && cls[i]) c.className = cls[i];
      tr.appendChild(c);
    });
    table.appendChild(tr);
  };
  const sym = { yes: '✔', no: '✘', null: '–' };
  addRow(['Município', ...acts, 'Total'], 'th');
  shown.forEach(m => {
    const ss = acts.map(a => st(m, a));
    addRow([m, ...ss.map(s => sym[s]), `${doneOf(m)}/${appOf(m).length}`], 'td', ['', ...ss.map(s => s || 'na')]);
  });
  if (!sel) addRow(['Total', ...acts.map(a => `${muns.filter(m => st(m, a) === 'yes').length}/${muns.filter(m => st(m, a) !== null).length}`), `${done}/${all}`], 'td');
  wrap.appendChild(table);
  content.appendChild(wrap);

  msg.className = ''; msg.textContent = sel ? `${sel}: ${appOf(sel).length} de ${acts.length} metas.` : `${muns.length} municípios, ${acts.length} metas.`;
  clearBtn.style.display = 'inline-block';
}

restoreRows();