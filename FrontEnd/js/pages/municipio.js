// Funcionalidades específicas do Retrato e das páginas de município.
(function () {
  const page = document.body.dataset.page;
  const slug = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const MUNS = territoryNames.filter(n => n !== "Alto Minho");
  const DS = n => indicatorValuesByName[n];
  const f = (n, d = 0) => Number(n).toLocaleString("pt-PT", { minimumFractionDigits: d, maximumFractionDigits: d });
  const inRoot = !location.pathname.includes("/FrontEnd/html/");
  const munUrl = n => (inRoot ? "./FrontEnd/html/" : "./") + "municipio.html?m=" + slug(n);
  const homeUrl = inRoot ? "./index.html" : "../../index.html";
  const POP = "População residente: total 2015 a 2025", DEN = "Densidade populacional";

  // ---------- Retrato: cartão do município + chips ----------
  function updateSel() {
    const name = selectedTerritory, set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set("sel-name", name);
    set("sel-pop", f(DS(POP).values[name]));
    set("sel-dens", f(DS(DEN).values[name], 1));
    const a = document.getElementById("sel-link");
    if (a) { const mun = name !== "Alto Minho"; a.href = mun ? munUrl(name) : "./FrontEnd/html/indicadores.html"; a.firstChild.textContent = mun ? "Abrir página do município " : "Ver indicadores "; }
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.t === name));
  }
  const chips = document.getElementById("chips");
  if (chips) {
    chips.innerHTML = MUNS.map(n => `<button type="button" class="chip" data-t="${n}">${n}</button>`).join("");
    chips.addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) location.href = munUrl(b.dataset.t); });
  }

  // Clicar (ou Enter/Espaço) num município do mapa abre a respetiva página.
  document.querySelectorAll(".municipality-node").forEach(g => {
    const go = () => { location.href = munUrl(g.dataset.territory); };
    g.addEventListener("click", go);
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") go(); });
  });

  // ---------- Página de município ----------
  const PAL = {
    "arcos-de-valdevez": ["mountain", 60, ["#a7d3ea", "#f3efd6", "#7ea58c", "#4c8466", "#2b5d45", "#fff6cf", 1080, 200]],
    "caminha": ["coast", 0, ["#f2b88f", "#fbe6c6", "#8aa38b", "#6b8f73", "#d9c08c", "#fff1c1", 300, 330], "#5b8fb0"],
    "melgaco": ["mountain", -80, ["#b9c9d6", "#e9e4d4", "#6d8a83", "#3f6b5c", "#20473b", "#ffffff", 360, 180]],
    "moncao": ["fortress", -40, ["#c9d9e4", "#f1ead6", "#8aa68d", "#587d5c", "#34563a", "#fff6d8", 1160, 220], "#7aa8b5", "#7d6f5d"],
    "paredes-de-coura": ["mountain", 140, ["#cfe3d0", "#f3f1d9", "#6f9a73", "#3d7a52", "#1f5236", "#fffbe0", 760, 170]],
    "ponte-da-barca": ["bridge", 0, ["#b7d6e6", "#f2e5c8", "#86a07a", "#5c8559", "#355f3d", "#fff1c8", 1180, 250], "#7bb0b6", "#7a6b58"],
    "ponte-de-lima": ["bridge", 0, ["#9fd0e8", "#eaf3d8", "#7fa58f", "#4f7d68", "#2f5f4c", "#f7f0b8", 300, 230], "#6fa9b8", "#6b6a5e"],
    "valenca": ["fortress", 0, ["#9cc8e3", "#f7ecd1", "#9aab86", "#6e8a63", "#405f43", "#fff3c9", 1200, 210], "#6fa4b7", "#8c7f6b"],
    "viana-do-castelo": ["coast", 0, ["#8ec5e6", "#f6e6cf", "#5f8e86", "#3f7168", "#e6d3a6", "#fff1c1", 480, 220], "#4f9fbd", "#e9e3d3", true],
    "vila-nova-de-cerveira": ["fortress", 70, ["#f0c89a", "#f9e8cd", "#8c9f84", "#5c7f5d", "#365a3f", "#fff0c4", 320, 300], "#6498ae", "#7b6e5c"]
  };
  function scene(s, id) {
    const [kind, sh, c, water, deck, hill] = PAL[s], [s1, s2, far, mid, near, sun, sx, sy] = c;
    let g = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient></defs><rect width="1440" height="900" fill="url(#${id})"/><circle cx="${sx}" cy="${sy}" r="74" fill="${sun}" opacity=".85"/>`;
    if (kind === "mountain") g += `<g transform="translate(${sh} 0)"><path d="M-300 640L0 400 220 540 480 300 760 540 1020 360 1260 520 1500 410 1800 640Z" fill="${far}"/><path d="M-300 760L80 520 340 670 640 470 920 690 1180 540 1500 700 1800 760Z" fill="${mid}"/></g><path d="M0 900V770Q360 690 720 770T1440 750V900Z" fill="${near}"/>`;
    if (kind === "coast") g += `<path d="M0 580V470Q220 420 430 520L540 580Z" fill="${far}"/><rect y="570" width="1440" height="330" fill="${water}"/><path d="M0 900V800Q420 730 900 810T1440 780V900Z" fill="${near}"/>` + (hill ? `<path d="M880 600Q1040 330 1200 420 1330 470 1440 600Z" fill="${mid}"/><rect x="1090" y="372" width="70" height="46" fill="${deck}"/><path d="M1086 372Q1125 322 1164 372Z" fill="${deck}"/>` : "");
    if (kind === "bridge") { g += `<path d="M-200 640Q200 440 600 560T1300 520 1700 640Z" fill="${far}"/><rect y="650" width="1440" height="250" fill="${water}"/><rect x="260" y="582" width="920" height="28" fill="${deck}"/><rect x="260" y="610" width="920" height="118" fill="${deck}"/>`; for (let x = 275; x < 1100; x += 130) g += `<path d="M${x} 728A55 74 0 0 1 ${x + 110} 728Z" fill="${water}"/>`; g += `<path d="M0 900V820Q300 770 620 830T1440 800V900Z" fill="${near}"/>`; }
    if (kind === "fortress") g += `<path d="M-200 600Q260 420 700 520T1700 560V700H-200Z" fill="${far}"/><g transform="translate(${sh} 0)"><path d="M-100 790L300 590 760 540 1200 590 1540 790Z" fill="${mid}"/><rect x="380" y="478" width="680" height="96" fill="${deck}"/><rect x="380" y="392" width="76" height="182" fill="${deck}"/><rect x="984" y="392" width="76" height="182" fill="${deck}"/></g><rect y="770" width="1440" height="130" fill="${water}"/><path d="M0 900V840Q360 790 760 850T1440 830V900Z" fill="${near}"/>`;
    return g;
  }
  function firstYear(ds, t) { return Object.keys(ds.history || {}).filter(y => ds.history[y][t] != null).sort()[0]; }

  // ---------- Imagens dos municípios ----------
  const imagensMunicipios = {
    "arcos-de-valdevez": "ArcosDeValdevez.jpg",
    "caminha": "Caminha.jpg",
    "melgaco": "Melgaco.jpg",
    "moncao": "Moncao.jpg",
    "paredes-de-coura": "ParedesDeCoura.jpg",
    "ponte-da-barca": "PonteDaBarca.jpg",
    "ponte-de-lima": "PonteDeLima.jpg",
    "valenca": "Valenca.jpg",
    "viana-do-castelo": "VianaDoCastelo.jpg",
    "vila-nova-de-cerveira": "VilaNovaCerveira.jpg"
  };

  const pastaImagens = "../imgs/municipios/";

  function obterImagemMunicipio(nome) {
    const ficheiro = imagensMunicipios[slug(nome)];
    return ficheiro ? pastaImagens + ficheiro : "";
  }

  function renderMun() {
    const root = document.getElementById("mun-root"); if (!root) return;
    const q = new URLSearchParams(location.search).get("m");
    let name = MUNS.find(n => slug(n) === q) || (MUNS.includes(selectedTerritory) ? selectedTerritory : "Ponte de Lima");
    const s = slug(name);

    const imagemMunicipio = obterImagemMunicipio(name);

    if (select) select.value = name;
    document.title = name + " | Observatório Alto Minho";

    
    const SN = "Saldo Natural", SM = "Saldo Migratório";
    const specs = [
      { label: "População residente", ds: DS(POP), v: DS(POP).values[name], d: 0, unit: "hab." },
      { label: "Taxa bruta de natalidade", ds: DS("Taxa bruta de natalidade"), v: DS("Taxa bruta de natalidade").values[name], d: 1, unit: "‰" },
      { label: "Saldo total", ds: DS("Saldo Total") || DS(SN), v: DS("Saldo Total") ? DS("Saldo Total").values[name] : DS(SN).values[name] + DS(SM).values[name], d: 0, unit: "pessoas", sign: true },
      { label: "Poder de compra per capita", ds: DS("Poder de compra per capita"), v: DS("Poder de compra per capita").values[name], d: 1, unit: "%" },
      { label: "Crimes registados", ds: DS("Crimes registados pelas polícias por mil habitantes"), v: DS("Crimes registados pelas polícias por mil habitantes").values[name], d: 1, unit: "‰ habitantes" },
      { label: "Habitantes por médico", ds: DS("Habitantes por médico e farmacêutico"), v: DS("Habitantes por médico e farmacêutico").values[name], d: 1, unit: "hab. por médico" }
    ];
    const cards = specs.map(({ label, ds, v, d, unit, sign }) => `<article class="mun-card"><div><span class="l">${label}</span><span class="y">${ds.year}</span></div><div class="v"><b>${sign && v > 0 ? "+" : ""}${f(v, d)}</b><small>${unit}</small></div></article>`).join("");
    root.innerHTML = `<svg class="mun-scene" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${scene(s, "sky1")}</svg><img class="mun-bg" src="${imagemMunicipio}" alt="" onerror="this.remove()"><div class="mun-shade"></div>
      <div class="mun-body"><a class="mun-back" href="${homeUrl}"><span aria-hidden="true">←</span>Voltar ao mapa</a>
      <header class="mun-head"><p class="overline">Município · Alto Minho</p><h1 class="${name.length > 16 ? "long" : ""}">${name}</h1><p>Retrato estatístico do município no contexto da NUTS III Alto Minho: população, natalidade, poder de compra, segurança e saúde.</p></header>
      <section class="mun-grid"><div class="mun-cards">${cards}</div></section>
      <p class="mun-note">Fonte: PORDATA · INE.</p></div>`;
  }

  // ---------- Ligação ao território ativo ----------
  const orig = window.setTerritory;
  window.setTerritory = function (n) {
    orig(n);
    if (page === "municipio") { if (n === "Alto Minho") location.href = homeUrl; else history.replaceState(null, "", "?m=" + slug(n)), renderMun(); }
    else updateSel();
  };
  if (page === "municipio") renderMun(); else updateSel();
})();