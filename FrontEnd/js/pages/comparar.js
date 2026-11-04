// Filtro "Ano inicial / Ano final / Aplicar" do gráfico de evolução (página Comparar).
(function () {
  const form = document.getElementById("year-filter"), from = document.getElementById("year-from"), to = document.getElementById("year-to");
  if (!form || !compareSelect) return;
  const munis = territoryNames.slice(1), original = window.renderYearComparison;
  let key = null, range = null;
  const itemNow = () => catalog.find(e => e.key === compareSelect.value) || catalog[0];
  const seriesOf = item => ({ ...item.history, [item.year]: item.values });
  const yearsOf = item => { const s = seriesOf(item); return Object.keys(s).filter(y => munis.some(n => s[y]?.[n] != null)).sort((a, b) => a - b); };

  function fill(item) {
    const ys = yearsOf(item);
    if (key !== item.key) { key = item.key; range = null; }
    from.innerHTML = to.innerHTML = ys.map(y => `<option>${y}</option>`).join("");
    from.value = range ? range[0] : ys[0]; to.value = range ? range[1] : ys[ys.length - 1];
    [from, to, form.querySelector("button")].forEach(e => { e.disabled = ys.length < 2; });
  }
  window.renderYearComparison = function () {
    const item = itemNow(); fill(item);
    if (!range) return original();
    const s = seriesOf(item), [a, b] = range, backup = { history: item.history, year: item.year, values: item.values };
    item.history = Object.fromEntries(Object.keys(s).filter(y => +y >= +a && +y < +b).map(y => [y, s[y]]));
    item.year = b; item.values = s[b];
    try { original(); } finally { Object.assign(item, backup); }
  };
  form.addEventListener("submit", e => {
    e.preventDefault();
    let a = +from.value, b = +to.value; if (a > b) [a, b] = [b, a];
    range = [String(a), String(b)]; window.renderYearComparison();
  });
  window.renderYearComparison();
})();