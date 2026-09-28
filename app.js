const territoryNames = ["Alto Minho", "Arcos de Valdevez", "Caminha", "Melgaço", "Monção", "Paredes de Coura", "Ponte da Barca", "Ponte de Lima", "Valença", "Viana do Castelo", "Vila Nova de Cerveira"];

const mapLabels = {
  "Vila Nova de Cerveira": ["V. N.", "Cerveira"], "Paredes de Coura": ["Paredes", "de Coura"],
  "Arcos de Valdevez": ["Arcos de", "Valdevez"], "Ponte da Barca": ["Ponte da", "Barca"],
  "Ponte de Lima": ["Ponte", "de Lima"], "Viana do Castelo": ["Viana do", "Castelo"]
};

const catalogOverrides = {
  "População residente: total 2015 a 2025": { name:"População residente", description:"Número de pessoas com residência habitual no território." },
  "Índice de envelhecimento": { description:"Relação entre a população idosa e a população jovem, por cada 100 jovens." },
  "Saldo Migratório": { name:"Saldo migratório", description:"Diferença anual entre o número de entradas e saídas por migração no território." },
  "Índice de dependência idosos": { name:"Índice de dependência de idosos" },
  "Índice de Longividade": { name:"Índice de longevidade" },
  "Nº de índividuos em idade ativa por idoso": { name:"Pessoas em idade ativa por pessoa idosa" },
  "Preço médio m²": { name:"Preço médio por m²", description:"Valor mediano de venda por metro quadrado no mercado habitacional." },
  "Rendimento médio": { description:"Ganho médio mensal dos trabalhadores por conta de outrem." },
  "Pop. Estrangeira c/ estatuto residente": { name:"População estrangeira residente" },
  "% famílias monoparentais": { name:"Núcleos familiares monoparentais", description:"Número de núcleos familiares monoparentais registados nos Censos 2021." },
  "Proporção de pop. residente em movimentos pendulares": { name:"Movimentos pendulares" },
  "Obitos por algumas causas de morte (%)": { name:"Óbitos por algumas causas de morte (%)" },
  "Obitos por residentes total e por grupo etário": { name:"Óbitos de residentes" }
};

const catalog = indicatorCatalog.map((item, index) => {
  const dataset = indicatorValuesByName[item.name];
  const context = [item.theme, item.category].filter(Boolean).join(" · ");
  const base = { key:`catalog-${index + 1}`, rawName:item.name, name:item.name, area:item.domain, source:item.source,
    sourceUrl:item.url, description:context ? `${context}. Indicador integrado na matriz intermunicipal.` : "Indicador integrado na matriz intermunicipal.", ...dataset };
  return { ...base, ...(catalogOverrides[item.name] || {}) };
});

const legacyNames = {
  population:"População residente: total 2015 a 2025", ageing:"Índice de envelhecimento", housing:"Preço médio m²",
  migration:"Saldo Migratório", unemployment:"Desempregados inscritos nos centros de emprego e de formação profissional no total da população residente com 15 a 64 anos (%)",
  income:"Rendimento médio", illiteracy:"Taxa de analfabetismo", doctors:"Profissionais de saúde: médicos, dentistas, enfermeiros e farmacêuticos",
  rsi:"Beneficiários do Rendimento Mínimo Garantido e Rendimento Social de Inserção da Segurança Social: total e por grupo etário",
  foreign:"População estrangeira com estatuto legal de residente: total e por algumas nacionalidades", youth:"Índice de dependência de jovens",
  elderly:"Índice de dependência idosos", commuting:"Proporção de pop. residente em movimentos pendulares"
};

const byRawName = name => catalog.find(item => item.rawName === name);
const metric = (legacyKey, territory) => byRawName(legacyNames[legacyKey])?.values?.[territory];
const dataFor = territory => Object.fromEntries(Object.keys(legacyNames).map(key => [key, metric(key, territory)]));
const card = (value, label, rawName) => [value, label, rawName];

const themes = {
  "Demografia": { title:"Estrutura e dinâmica da população", description:"Leia a evolução demográfica e compare o território com o Alto Minho.", cards:d => [card(d.ageing,"Índice de envelhecimento",legacyNames.ageing),card(d.migration,"Saldo migratório",legacyNames.migration),card(d.youth,"Índice de dependência de jovens",legacyNames.youth),card(d.elderly,"Índice de dependência de idosos",legacyNames.elderly)] },
  "Habitação": { title:"Acesso e condições de habitação", description:"Acompanhe preços e dinâmica residencial no território.", cards:d => [card(d.housing,"Preço médio por m²",legacyNames.housing),card(d.population,"População residente",legacyNames.population),card(d.migration,"Saldo migratório",legacyNames.migration),card(d.income,"Ganho médio mensal",legacyNames.income)] },
  "Emprego": { title:"Trabalho, rendimento e atividade", description:"Compare emprego e rendimentos no contexto intermunicipal.", cards:d => [card(d.unemployment,"Desempregados na população ativa (%)",legacyNames.unemployment),card(d.income,"Ganho médio mensal",legacyNames.income),card(d.commuting,"Movimentos pendulares (%)",legacyNames.commuting),card(d.foreign,"População estrangeira residente",legacyNames.foreign)] },
  "Educação": { title:"Qualificações e sucesso educativo", description:"Observe escolaridade, analfabetismo e condições de qualificação.", cards:d => [card(d.illiteracy,"Taxa de analfabetismo (%)",legacyNames.illiteracy),card(byRawName("Taxa de retenção e desistência no ensino básico: total e por ano de escolaridade").values[selectedTerritory],"Retenção no ensino básico (%)","Taxa de retenção e desistência no ensino básico: total e por ano de escolaridade"),card(byRawName("Taxa de retenção e desistência no ensino secundário: total, por modalidade de ensino e ano de escolaridade").values[selectedTerritory],"Retenção no secundário (%)","Taxa de retenção e desistência no ensino secundário: total, por modalidade de ensino e ano de escolaridade"),card(byRawName("Estabelecimentos nos ensinos pré-escolar, básico e secundário: por nível de ensino").values[selectedTerritory],"Estabelecimentos de ensino","Estabelecimentos nos ensinos pré-escolar, básico e secundário: por nível de ensino")] },
  "Saúde": { title:"Acesso a cuidados de saúde", description:"Acompanhe a disponibilidade de profissionais e a pressão demográfica.", cards:d => [card(d.doctors,"Profissionais de saúde",legacyNames.doctors),card(byRawName("Habitantes por médico e farmacêutico").values[selectedTerritory],"Habitantes por médico","Habitantes por médico e farmacêutico"),card(byRawName("Habitantes por farmácia e posto farmacêutico móvel").values[selectedTerritory],"Habitantes por farmácia","Habitantes por farmácia e posto farmacêutico móvel"),card(d.elderly,"Dependência de idosos",legacyNames.elderly)] },
  "Coesão social": { title:"Proteção e inclusão social", description:"Identifique necessidades sociais e apoie a distribuição de recursos.", cards:d => [card(d.rsi,"Beneficiários de RSI",legacyNames.rsi),card(d.foreign,"População estrangeira residente",legacyNames.foreign),card(byRawName("Pensões: total, da Segurança Social e da Caixa Geral de Aposentações").values[selectedTerritory],"Pensões — total","Pensões: total, da Segurança Social e da Caixa Geral de Aposentações"),card(byRawName("Abono de família para crianças e jovens da Segurança Social").values[selectedTerritory],"Beneficiários de abono de família","Abono de família para crianças e jovens da Segurança Social")] }
};

const select = document.querySelector("#territory-select"), compareSelect = document.querySelector("#compare-indicator"), mapNodes = document.querySelector("#map-nodes");
let selectedTerritory = "Alto Minho", selectedTheme = "Demografia", selectedIndicatorKey = byRawName(legacyNames.population).key;
const format = value => value == null || value === "—" ? "—" : typeof value === "string" ? value : new Intl.NumberFormat("pt-PT", { maximumFractionDigits:2 }).format(value);
const formattedValue = (item, value) => `${item.prefix || ""}${format(value)}${item.suffix || ""}`;

territoryNames.forEach(name => { const option=document.createElement("option"); option.value=name; option.textContent=name; select.appendChild(option); });
catalog.forEach(item => { const option=document.createElement("option"); option.value=item.key; option.textContent=item.name; compareSelect.appendChild(option); });
compareSelect.value = selectedIndicatorKey;

municipalityMapShapes.forEach(({ name, path, label:[x,y] }) => {
  const ns="http://www.w3.org/2000/svg", g=document.createElementNS(ns,"g"), shape=document.createElementNS(ns,"path"), title=document.createElementNS(ns,"title"), label=document.createElementNS(ns,"text");
  g.classList.add("municipality-node"); g.dataset.territory=name; g.setAttribute("tabindex","0"); g.setAttribute("role","button"); g.setAttribute("aria-label",`Selecionar ${name}`);
  shape.setAttribute("d",path); shape.setAttribute("fill-rule","evenodd"); title.textContent=name;
  (mapLabels[name] || [name]).forEach((line,index,lines) => { const tspan=document.createElementNS(ns,"tspan"); tspan.setAttribute("x",x); tspan.setAttribute("y",Number(y)+(index-(lines.length-1)/2)*10); tspan.textContent=line; label.appendChild(tspan); });
  g.append(shape,title,label); mapNodes.appendChild(g); g.addEventListener("click",()=>setTerritory(name)); g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setTerritory(name);}});
});

function setTerritory(name){ selectedTerritory=name; select.value=name; document.querySelector("#territory-title").textContent=name; document.querySelectorAll(".municipality-node").forEach(n=>n.classList.toggle("active",n.dataset.territory===name)); render(); }

function renderKpis(data){
  const specs=[["population","População residente"],["ageing","Índice de envelhecimento"],["housing","Preço médio por m²"],["migration","Saldo migratório"]];
  document.querySelector("#kpi-grid").innerHTML=specs.map(([key,label])=>{const item=byRawName(legacyNames[key]);return `<article class="kpi"><div class="year">${item.year}</div><div class="value">${formattedValue(item,data[key])}</div><div class="label">${label}</div></article>`;}).join("");
}

function renderTheme(data){
  const theme=themes[selectedTheme]; document.querySelector("#theme-kicker").textContent=`Área de ${selectedTheme}`; document.querySelector("#theme-title").textContent=theme.title; document.querySelector("#theme-description").textContent=theme.description;
  document.querySelector("#indicator-cards").innerHTML=theme.cards(data).map(([value,label,rawName])=>{const item=byRawName(rawName);return `<article class="indicator"><strong>${formattedValue(item,value)}</strong><span>${label}</span><small>${item.year} · ${item.source}</small></article>`;}).join("");
}

function renderComparison(){
  const item=catalog.find(entry=>entry.key===compareSelect.value)||catalog[0];
  const rows=territoryNames.slice(1).map(name=>[name,item.values[name]]).sort((a,b)=>(b[1]??-Infinity)-(a[1]??-Infinity));
  const max=Math.max(...rows.map(([,value])=>Math.abs(value??0)),1); document.querySelector("#comparison-chart").setAttribute("aria-label",`${item.name}, ${item.year}, ${item.dimension}`);
  document.querySelector("#comparison-chart").innerHTML=rows.map(([name,value])=>`<div class="bar-row ${name===selectedTerritory?'selected':''}"><div class="bar-label" title="${name}">${name}</div><div class="bar-track"><div class="bar-fill${value<0?' negative':''}" style="--bar:${value==null?0:Math.max(2,Math.abs(value)/max*100)}%"></div></div><div class="bar-value">${formattedValue(item,value)}</div></div>`).join("");
}

function renderCatalog(query=""){
  const normalized=query.trim().toLocaleLowerCase("pt-PT"), matches=catalog.filter(item=>`${item.name} ${item.area} ${item.year} ${item.source} ${item.dimension}`.toLocaleLowerCase("pt-PT").includes(normalized));
  document.querySelector("#catalog-body").innerHTML=matches.map(item=>`<tr class="catalog-row ${item.key===selectedIndicatorKey?'active':''}" tabindex="0" role="button" data-indicator-key="${item.key}" aria-label="Ver ${item.name}"><td>${item.name}</td><td>${item.area}</td><td>${item.year}</td><td>${item.source}</td></tr>`).join(""); document.querySelector("#catalog-empty").hidden=matches.length>0;
  document.querySelectorAll(".catalog-row").forEach(row=>{const choose=()=>selectCatalogIndicator(row.dataset.indicatorKey);row.addEventListener("click",choose);row.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();choose();}});});
}

function renderCatalogDetail(){
  const item=catalog.find(entry=>entry.key===selectedIndicatorKey)||catalog[0]; document.querySelector("#detail-name").textContent=item.name; document.querySelector("#detail-description").textContent=item.description; document.querySelector("#detail-territory").textContent=selectedTerritory; document.querySelector("#detail-value").textContent=formattedValue(item,item.values[selectedTerritory]); document.querySelector("#detail-area").textContent=item.area; document.querySelector("#detail-year").textContent=item.year; document.querySelector("#detail-dimension").textContent=item.dimension; document.querySelector("#detail-source").textContent=item.source; document.querySelector("#detail-source-link").href=item.sourceUrl; document.querySelector("#indicator-compare-button").disabled=false;
}
function selectCatalogIndicator(key){if(!catalog.some(item=>item.key===key))return;selectedIndicatorKey=key;renderCatalogDetail();renderCatalog(document.querySelector("#indicator-search").value);}
function render(){const data=dataFor(selectedTerritory);renderKpis(data);renderTheme(data);renderComparison();renderCatalogDetail();}

select.addEventListener("change",e=>setTerritory(e.target.value));
document.querySelectorAll(".theme").forEach(button=>button.addEventListener("click",()=>{selectedTheme=button.dataset.theme;document.querySelectorAll(".theme").forEach(b=>{const active=b===button;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});renderTheme(dataFor(selectedTerritory));}));
document.querySelector("[data-open-source]").addEventListener("click",()=>document.querySelector("#indicadores").scrollIntoView({behavior:"smooth",block:"start"}));
compareSelect.addEventListener("change",renderComparison); document.querySelector("#indicator-search").addEventListener("input",e=>renderCatalog(e.target.value));
document.querySelector("#indicator-compare-button").addEventListener("click",()=>{compareSelect.value=selectedIndicatorKey;renderComparison();document.querySelector("#comparar").scrollIntoView({behavior:"smooth",block:"start"});});

if(document.modelContext?.registerTool){
  Promise.resolve(document.modelContext.registerTool({name:"select_territory",title:"Selecionar território",description:"Seleciona um município ou o Alto Minho e atualiza os indicadores visíveis.",inputSchema:{type:"object",properties:{territory:{type:"string",enum:territoryNames}},required:["territory"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!territoryNames.includes(input?.territory))throw new Error("Território inválido");setTerritory(input.territory);return{territory:selectedTerritory};}})).catch(()=>{});
  Promise.resolve(document.modelContext.registerTool({name:"show_theme",title:"Mostrar área temática",description:"Mostra os indicadores da área temática escolhida.",inputSchema:{type:"object",properties:{theme:{type:"string",enum:Object.keys(themes)}},required:["theme"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!themes[input?.theme])throw new Error("Área inválida");selectedTheme=input.theme;document.querySelectorAll(".theme").forEach(b=>{const active=b.dataset.theme===selectedTheme;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});renderTheme(dataFor(selectedTerritory));return{theme:selectedTheme,territory:selectedTerritory};}})).catch(()=>{});
}

renderCatalog(); setTerritory("Alto Minho");
