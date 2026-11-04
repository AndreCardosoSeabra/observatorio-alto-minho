// Página inicial: o Retrato usa a lógica de municipio.js (adapta caminhos à raiz).
// Aqui: faixa "Alto Minho em números" (carregado depois de municipio.js).
(function () {
  const strip = document.getElementById("kpi-strip");
  if (!strip) return;
  const REGIAO = "Alto Minho";
  const f = (n, d = 0) => Number(n).toLocaleString("pt-PT", { minimumFractionDigits: d, maximumFractionDigits: d });
  // [rótulo, indicador, casas decimais, unidade, descrição]
  const specs = [
    ["População residente", "População residente: total 2015 a 2025", 0, "hab.", "Pessoas a viver no Alto Minho"],
    ["Rendimento médio mensal", "Rendimento médio", 0, "€", "Ganho médio dos trabalhadores por conta de outrem"],
    ["Retenção e desistência no secundário", "Taxa de retenção e desistência no ensino secundário: total, por modalidade de ensino e ano de escolaridade", 1, "%", "Educação · ensino secundário (total)"],
    ["Índice de envelhecimento", "Índice de envelhecimento", 1, "idosos", "Pessoas com 65+ anos por 100 jovens"]
  ];
  strip.innerHTML = specs.map(([label, key, d, unit, desc]) => {
    const ds = indicatorValuesByName[key];
    if (!ds || ds.values[REGIAO] == null) return "";
    return `<article class="mun-card"><div><span class="l">${label}</span><span class="y">${ds.year}</span></div><div class="v"><b>${f(ds.values[REGIAO], d)}</b><small>${unit}</small></div><div class="c">${desc}</div></article>`;
  }).join("");
})();