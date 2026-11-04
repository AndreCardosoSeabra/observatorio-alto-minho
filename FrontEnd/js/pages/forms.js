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
document.getElementById('split').addEventListener('change', () => lastRows && render(lastRows));
document.getElementById('maxopts').addEventListener('change', () => lastRows && render(lastRows));
clearBtn.addEventListener('click', () => {
  destroy(); content.innerHTML = ''; msg.textContent = ''; lastRows = null; fileInput.value = ''; clearBtn.style.display = 'none';
});

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
      render(rows);
    } catch (err) {
      msg.className = 'err'; msg.textContent = 'Erro: ' + err.message;
    }
  };
  reader.readAsArrayBuffer(file);
}

function isEmpty(v) { return v === '' || v === null || v === undefined || String(v).trim() === ''; }
function isTimestamp(col) { return /carimbo|timestamp|data\/hora/i.test(col); }

function render(rows) {
  destroy(); content.innerHTML = '';
  const split = document.getElementById('split').checked;
  const maxOpts = parseInt(document.getElementById('maxopts').value) || 12;
  const cols = Object.keys(rows[0]).filter(c => !isTimestamp(c));
  const total = rows.length;

  // Modo atividades: 1 linha por município, 1 coluna por atividade (Sim/Não)
  const act = detectActivities(rows, cols);
  if (act) { renderActivities(rows, act); return; }

  const grid = document.createElement('div'); grid.className = 'grid';
  content.appendChild(grid);

  const complete = rows.filter(r => cols.every(c => !isEmpty(r[c]))).length;
  addDonut(grid, 'Respostas completas', ['Completas', 'Incompletas'], [complete, total - complete],
    `<b>${complete}</b> de <b>${total}</b> completas`, ['#3a8458', '#ef9a93']);

  const skipped = [];
  cols.forEach(col => {
    const counts = {};
    let answered = 0;
    rows.forEach(r => {
      const v = r[col];
      if (isEmpty(v)) return;
      answered++;
      const parts = split ? String(v).split(',').map(s => s.trim()).filter(Boolean) : [String(v).trim()];
      parts.forEach(p => counts[p] = (counts[p] || 0) + 1);
    });
    const labels = Object.keys(counts);
    if (!labels.length || labels.length > maxOpts) { skipped.push(col); return; }
    labels.sort((a, b) => counts[b] - counts[a]);
    addDonut(grid, col, labels, labels.map(l => counts[l]), `<b>${answered}</b> de <b>${total}</b> responderam`);
  });

  if (skipped.length) {
    const s = document.createElement('div'); s.className = 'skipped';
    s.textContent = 'Ignoradas (texto livre ou demasiadas opções): ' + skipped.join(' • ');
    content.appendChild(s);
  }
  msg.className = ''; msg.textContent = `${total} respostas, ${cols.length} perguntas.`;
  clearBtn.style.display = 'inline-block';
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

/* ---------- Modo atividades por município ---------- */
const YES = /^(sim|s|yes|y|feito|feita|concluido|concluida|realizado|realizada|ok|x|1|true|✔|✓)$/;
const NO = /^(nao|n|no|por fazer|pendente|nao feito|nao feita|em curso|0|false|✘|✗)$/;
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
  const doneOf = m => acts.filter(a => isYes(byMun.get(m)[a])).length;
  const all = muns.length * acts.length;
  const done = muns.reduce((t, m) => t + doneOf(m), 0);

  const grid = document.createElement('div'); grid.className = 'grid';
  content.appendChild(grid);
  addDonut(grid, 'Total de atividades feitas', ['Feitas', 'Por fazer'], [done, all - done],
    `<b>${done}</b> de <b>${all}</b> feitas`, ['#3a8458', '#ef9a93']);
  muns.forEach(m => {
    const d = doneOf(m);
    addDonut(grid, m, ['Feitas', 'Por fazer'], [d, acts.length - d],
      `<b>${d}</b> de <b>${acts.length}</b> atividades`, ['#3a8458', '#ef9a93']);
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
  addRow(['Município', ...acts, 'Total'], 'th');
  muns.forEach(m => {
    const r = byMun.get(m);
    const ys = acts.map(a => isYes(r[a]));
    addRow([m, ...ys.map(y => y ? '✔' : '✘'), `${doneOf(m)}/${acts.length}`], 'td', ['', ...ys.map(y => y ? 'yes' : 'no')]);
  });
  addRow(['Total', ...acts.map(a => `${muns.filter(m => isYes(byMun.get(m)[a])).length}/${muns.length}`), `${done}/${all}`], 'td');
  wrap.appendChild(table);
  content.appendChild(wrap);

  msg.className = ''; msg.textContent = `${muns.length} municípios, ${acts.length} atividades.`;
  clearBtn.style.display = 'inline-block';
}