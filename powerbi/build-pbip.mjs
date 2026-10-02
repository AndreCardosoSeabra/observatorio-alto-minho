import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve("powerbi/ObservatorioAltoMinho");
const reportDir = path.join(root, "ObservatorioAltoMinho.Report");
const reportDef = path.join(reportDir, "definition");
const pagesDir = path.join(reportDef, "pages");
const modelDir = path.join(root, "ObservatorioAltoMinho.SemanticModel");
const modelDef = path.join(modelDir, "definition");
const tablesDir = path.join(modelDef, "tables");
const registered = path.join(reportDir, "StaticResources", "RegisteredResources");

const pageSchema = "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json";
const visualSchema = "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json";
const pagesSchema = "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.1.0/schema.json";

const C = {
  green: "#0F453A", coral: "#EF735D", blue: "#78B8C9", lime: "#C8FF5A",
  cream: "#F3F4EC", ink: "#10211D", muted: "#61716C", white: "#FFFFFF", pale: "#DDECEF"
};

const lit = value => ({ expr: { Literal: { Value: value } } });
const hex = () => crypto.randomBytes(10).toString("hex");
const pageId = () => crypto.randomBytes(10).toString("hex");
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
};
const column = property => ({
  Column: { Expression: { SourceRef: { Entity: "Indicadores" } }, Property: property }
});
const measure = property => ({
  Measure: { Expression: { SourceRef: { Entity: "Indicadores" } }, Property: property }
});
const projection = (field, queryRef, nativeQueryRef, active) => ({
  field, queryRef, nativeQueryRef, ...(active === undefined ? {} : { active })
});

function position(x, y, width, height, z, tabOrder = z) {
  return { x, y, z, height, width, tabOrder };
}

function textbox(text, x, y, width, height, size = 18, color = C.ink, weight = "normal", family = "Segoe UI") {
  const name = hex();
  return {
    name,
    json: {
      $schema: visualSchema,
      name,
      position: position(x, y, width, height, 20000 + Number.parseInt(name.slice(0, 3), 16), 0),
      visual: {
        visualType: "textbox",
        objects: { general: [{ properties: { paragraphs: [{
          textRuns: [{ value: text, textStyle: { fontFamily: family, fontSize: `${size}px`, fontWeight: weight, color } }],
          horizontalTextAlignment: "left"
        }] } }] },
        visualContainerObjects: {
          background: [{ properties: { show: lit("false") } }],
          border: [{ properties: { show: lit("false") } }],
          padding: [{ properties: { top: lit("0D"), bottom: lit("0D"), left: lit("0D"), right: lit("0D") } }]
        }
      }
    }
  };
}

function shape(x, y, width, height, color, z = 0, radius = 0) {
  const name = hex();
  const json = {
    $schema: visualSchema,
    name,
    position: position(x, y, width, height, z, z),
    visual: {
      visualType: "shape",
      objects: {
        shape: [{ properties: { tileShape: lit("'rectangle'") } }],
        fill: [{ properties: { fillColor: { solid: { color: lit(`'${color}'`) } }, transparency: lit("0D") }, selector: { id: "default" } }],
        outline: [{ properties: { show: lit("false") }, selector: { id: "default" } }]
      },
      visualContainerObjects: {
        background: [{ properties: { show: lit("false") } }],
        border: [{ properties: { show: lit("false") } }],
        padding: [{ properties: { top: lit("0D"), bottom: lit("0D"), left: lit("0D"), right: lit("0D") } }]
      }
    }
  };
  if (radius) json.visual.objects.shape[0].properties.roundEdge = lit(`${radius}D`);
  return { name, json };
}

function card(measureName, x, y, width, height) {
  const name = hex();
  return {
    name,
    json: {
      $schema: visualSchema,
      name,
      position: position(x, y, width, height, 5000, 5000),
      visual: {
        visualType: "cardVisual",
        query: { queryState: { Data: { projections: [projection(measure(measureName), `Indicadores.${measureName}`, measureName)] } } },
        objects: {
          value: [{ properties: { fontSize: lit("24D") }, selector: { id: "default" } }],
          label: [{ properties: { fontSize: lit("10D") }, selector: { id: "default" } }],
          padding: [{ properties: { paddingUniform: lit("8D") }, selector: { id: "default" } }],
          layout: [{ properties: { paddingUniform: lit("0D") }, selector: { id: "default" } }]
        },
        visualContainerObjects: {
          background: [{ properties: { show: lit("true"), color: { solid: { color: lit(`'${C.white}'`) } }, transparency: lit("0D") } }],
          border: [{ properties: { show: lit("true"), color: { solid: { color: lit("'#D6DFDB'") } }, radius: lit("10D"), width: lit("1D") } }],
          padding: [{ properties: { top: lit("8D"), bottom: lit("8D"), left: lit("10D"), right: lit("10D") } }]
        }
      }
    }
  };
}

function slicer(property, label, x, y, width) {
  const name = hex();
  return {
    name,
    json: {
      $schema: visualSchema,
      name,
      position: position(x, y, width, 80, 6000, 6000),
      visual: {
        visualType: "slicer",
        query: { queryState: { Values: { projections: [projection(column(property), `Indicadores.${property}`, property)] } } },
        objects: {
          data: [{ properties: { mode: lit("'Dropdown'") } }],
          header: [{ properties: { show: lit("true"), text: lit(`'${label}'`) } }]
        },
        visualContainerObjects: {
          background: [{ properties: { show: lit("true"), color: { solid: { color: lit(`'${C.white}'`) } }, transparency: lit("0D") } }],
          border: [{ properties: { show: lit("true"), color: { solid: { color: lit("'#D6DFDB'") } }, radius: lit("8D"), width: lit("1D") } }],
          padding: [{ properties: { top: lit("8D"), bottom: lit("8D"), left: lit("8D"), right: lit("8D") } }]
        }
      }
    }
  };
}

function bar(categoryProperty, measureName, x, y, width, height) {
  const name = hex();
  return {
    name,
    json: {
      $schema: visualSchema,
      name,
      position: position(x, y, width, height, 7000, 7000),
      visual: {
        visualType: "clusteredBarChart",
        query: {
          queryState: {
            Category: { projections: [projection(column(categoryProperty), `Indicadores.${categoryProperty}`, categoryProperty, true)] },
            Y: { projections: [projection(measure(measureName), `Indicadores.${measureName}`, measureName)] }
          },
          sortDefinition: { sort: [{ field: measure(measureName), direction: "Descending" }] }
        },
        objects: {
          categoryAxis: [{ properties: { show: lit("true"), fontSize: lit("10D") } }],
          valueAxis: [{ properties: { show: lit("true") } }],
          labels: [{ properties: { show: lit("true"), fontSize: lit("9D"), color: { solid: { color: lit(`'${C.ink}'`) } } } }],
          dataPoint: [{ properties: { fill: { solid: { color: { expr: { ThemeDataColor: { ColorId: 0, Percent: 0 } } } } } } }]
        },
        visualContainerObjects: {
          background: [{ properties: { show: lit("true"), color: { solid: { color: lit(`'${C.white}'`) } }, transparency: lit("0D") } }],
          border: [{ properties: { show: lit("true"), color: { solid: { color: lit("'#D6DFDB'") } }, radius: lit("10D"), width: lit("1D") } }]
        }
      }
    }
  };
}

function azureMap(categoryProperty, measureName, x, y, width, height) {
  const name = hex();
  return {
    name,
    json: {
      $schema: visualSchema,
      name,
      position: position(x, y, width, height, 7000, 7000),
      visual: {
        visualType: "azureMap",
        query: { queryState: {
          Category: { projections: [projection(column(categoryProperty), `Indicadores.${categoryProperty}`, categoryProperty, true)] },
          Size: { projections: [projection(measure(measureName), `Indicadores.${measureName}`, measureName, true)] }
        } },
        objects: { bubbleLayer: [{ properties: { show: lit("true"), sizeByValue: lit("true"), clusteringEnabled: lit("false") } }] },
        visualContainerObjects: {
          background: [{ properties: { show: lit("true"), color: { solid: { color: lit(`'${C.white}'`) } }, transparency: lit("0D") } }],
          border: [{ properties: { show: lit("true"), color: { solid: { color: lit("'#D6DFDB'") } }, radius: lit("10D"), width: lit("1D") } }]
        }
      }
    }
  };
}

function table(fields, x, y, width, height) {
  const name = hex();
  const projections = fields.map(f => projection(f.type === "measure" ? measure(f.name) : column(f.name), `Indicadores.${f.name}`, f.name));
  return {
    name,
    json: {
      $schema: visualSchema,
      name,
      position: position(x, y, width, height, 7000, 7000),
      visual: {
        visualType: "tableEx",
        query: { queryState: { Values: { projections } } },
        objects: {
          columnHeaders: [{ properties: { columnAdjustment: lit("'growToFit'"), autoSizeColumnWidth: lit("true"), backColor: { solid: { color: lit(`'${C.green}'`) } }, fontColor: { solid: { color: lit(`'${C.white}'`) } } } }],
          values: [{ properties: { backColorPrimary: { solid: { color: lit(`'${C.white}'`) } }, backColorSecondary: { solid: { color: lit("'#EEF3F0'") } }, fontColorPrimary: { solid: { color: lit(`'${C.ink}'`) } }, fontColorSecondary: { solid: { color: lit(`'${C.ink}'`) } } } }]
        },
        visualContainerObjects: {
          background: [{ properties: { show: lit("true"), color: { solid: { color: lit(`'${C.white}'`) } }, transparency: lit("0D") } }],
          border: [{ properties: { show: lit("true"), color: { solid: { color: lit("'#D6DFDB'") } }, radius: lit("10D"), width: lit("1D") } }]
        }
      }
    }
  };
}

function buildPage(id, displayName, visuals) {
  const dir = path.join(pagesDir, id);
  fs.rmSync(path.join(dir, "visuals"), { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "visuals"), { recursive: true });
  writeJson(path.join(dir, "page.json"), {
    $schema: pageSchema, name: id, displayName, displayOption: "FitToPage", height: 720, width: 1280,
    objects: {
      background: [{ properties: { color: { solid: { color: lit(`'${C.cream}'`) } }, transparency: lit("0D") } }],
      outspace: [{ properties: { color: { solid: { color: lit(`'${C.green}'`) } }, transparency: lit("0D") } }]
    }
  });
  for (const v of visuals) writeJson(path.join(dir, "visuals", v.name, "visual.json"), v.json);
}

function chrome(section, title, subtitle) {
  return [
    shape(0, 0, 218, 720, C.green, 0),
    shape(218, 0, 6, 720, C.lime, 1),
    textbox("ALTO MINHO", 30, 28, 160, 34, 21, C.white, "bold", "Georgia"),
    textbox("Observatório territorial", 30, 64, 165, 24, 12, "#B7D2CB"),
    textbox("01  Retrato territorial", 30, 150, 170, 26, 13, section === 1 ? C.lime : "#B7D2CB", section === 1 ? "bold" : "normal"),
    textbox("02  Comparação municipal", 30, 198, 175, 26, 13, section === 2 ? C.lime : "#B7D2CB", section === 2 ? "bold" : "normal"),
    textbox("03  Catálogo", 30, 246, 170, 26, 13, section === 3 ? C.lime : "#B7D2CB", section === 3 ? "bold" : "normal"),
    textbox("04  Metodologia", 30, 294, 170, 26, 13, section === 4 ? C.lime : "#B7D2CB", section === 4 ? "bold" : "normal"),
    textbox("FONTES", 30, 600, 170, 18, 10, "#82A79E", "bold"),
    textbox("INE · Pordata", 30, 625, 170, 24, 13, C.white, "bold"),
    textbox("Atualização automática", 30, 654, 170, 22, 11, "#B7D2CB"),
    textbox(title, 250, 24, 750, 70, 29, C.ink, "bold", "Georgia"),
    textbox(subtitle, 250, 96, 760, 28, 13, C.muted)
  ];
}

fs.mkdirSync(tablesDir, { recursive: true });
fs.mkdirSync(registered, { recursive: true });

writeJson(path.join(modelDir, "definition.pbism"), {
  $schema: "https://developer.microsoft.com/json-schemas/fabric/item/semanticModel/definitionProperties/1.0.0/schema.json",
  version: "4.2", settings: { qnaEnabled: true }
});

fs.writeFileSync(path.join(modelDef, "database.tmdl"), `database ObservatorioAltoMinho\n\tcompatibilityLevel: 1702\n\tcompatibilityMode: powerBI\n\tlanguage: 2070\n`, "utf8");
fs.writeFileSync(path.join(modelDef, "model.tmdl"), `model Model\n\tculture: pt-PT\n\tdefaultPowerBIDataSourceVersion: powerBI_V3\n\tsourceQueryCulture: pt-PT\n\tdiscourageImplicitMeasures\n\nref table Indicadores\n`, "utf8");

const tableTmdl = `table Indicadores

\t/// Valor do indicador no ano mais recente disponível para o contexto selecionado.
\tmeasure 'Valor atual' = \`\`\`
\t\tVAR _AnoMaisRecente = MAX('Indicadores'[Ano])
\t\tRETURN CALCULATE(MAX('Indicadores'[Valor]), KEEPFILTERS('Indicadores'[Ano] = _AnoMaisRecente))
\t\t\`\`\`
\t\tformatString: #,##0.00
\t\tdisplayFolder: Medidas dinâmicas

\t/// Último ano com dados no contexto selecionado.
\tmeasure 'Último ano' = MAX('Indicadores'[Ano])
\t\tformatString: 0
\t\tdisplayFolder: Medidas dinâmicas

\t/// Número de indicadores distintos disponíveis no contexto selecionado.
\tmeasure 'Indicadores disponíveis' = DISTINCTCOUNT('Indicadores'[Indicador])
\t\tformatString: #,##0
\t\tdisplayFolder: Cobertura

\t/// Número de registos carregados no contexto selecionado.
\tmeasure 'Registos disponíveis' = COUNTROWS('Indicadores')
\t\tformatString: #,##0
\t\tdisplayFolder: Cobertura

\t/// Número de municípios com dados no contexto selecionado.
\tmeasure 'Municípios disponíveis' = CALCULATE(DISTINCTCOUNT('Indicadores'[Município]), 'Indicadores'[Tipo de território] = "Município")
\t\tformatString: #,##0
\t\tdisplayFolder: Cobertura

\t/// Valor do indicador selecionado para o Alto Minho.
\tmeasure 'Valor Alto Minho' = \`\`\`
\t\tVAR _AnoMaisRecente = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'[Território]), 'Indicadores'[Território] = "Alto Minho")
\t\tRETURN CALCULATE(MAX('Indicadores'[Valor]), REMOVEFILTERS('Indicadores'[Território]), 'Indicadores'[Território] = "Alto Minho", 'Indicadores'[Ano] = _AnoMaisRecente)
\t\t\`\`\`
\t\tformatString: #,##0.00
\t\tdisplayFolder: Comparação

\t/// Diferença percentual entre o município e o Alto Minho para o indicador selecionado.
\tmeasure 'Diferença face ao Alto Minho' = DIVIDE([Valor atual] - [Valor Alto Minho], [Valor Alto Minho])
\t\tformatString: 0.0%;-0.0%;0.0%
\t\tdisplayFolder: Comparação

\t/// População residente do Alto Minho no ano mais recente disponível.
\tmeasure 'População residente' = \`\`\`
\t\tVAR _Ano = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "População residente: total 2015 a 2025", 'Indicadores'[Território] = "Alto Minho")
\t\tRETURN CALCULATE(MAX('Indicadores'[Valor]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "População residente: total 2015 a 2025", 'Indicadores'[Território] = "Alto Minho", 'Indicadores'[Ano] = _Ano)
\t\t\`\`\`
\t\tformatString: #,##0
\t\tdisplayFolder: Retrato territorial

\t/// População residente por município, usada no mapa e no ranking municipal.
\tmeasure 'População municipal' = \`\`\`
\t\tVAR _Ano = CALCULATE(MAX('Indicadores'[Ano]), 'Indicadores'[Indicador] = "População residente: total 2015 a 2025")
\t\tRETURN IF(ISINSCOPE('Indicadores'[Município]), CALCULATE(MAX('Indicadores'[Valor]), 'Indicadores'[Indicador] = "População residente: total 2015 a 2025", 'Indicadores'[Ano] = _Ano))
\t\t\`\`\`
\t\tformatString: #,##0
\t\tdisplayFolder: Retrato territorial

\t/// Densidade populacional do Alto Minho no ano mais recente disponível.
\tmeasure 'Densidade populacional' = \`\`\`
\t\tVAR _Ano = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Densidade populacional", 'Indicadores'[Território] = "Alto Minho")
\t\tRETURN CALCULATE(MAX('Indicadores'[Valor]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Densidade populacional", 'Indicadores'[Território] = "Alto Minho", 'Indicadores'[Ano] = _Ano)
\t\t\`\`\`
\t\tformatString: #,##0.0
\t\tdisplayFolder: Retrato territorial

\t/// Índice de envelhecimento do Alto Minho no ano mais recente disponível.
\tmeasure 'Índice de envelhecimento' = \`\`\`
\t\tVAR _Ano = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Índice de envelhecimento", 'Indicadores'[Território] = "Alto Minho")
\t\tRETURN CALCULATE(MAX('Indicadores'[Valor]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Índice de envelhecimento", 'Indicadores'[Território] = "Alto Minho", 'Indicadores'[Ano] = _Ano)
\t\t\`\`\`
\t\tformatString: #,##0.0
\t\tdisplayFolder: Retrato territorial

\t/// Rendimento médio do Alto Minho no ano mais recente disponível.
\tmeasure 'Rendimento médio' = \`\`\`
\t\tVAR _Ano = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Rendimento médio", 'Indicadores'[Território] = "Alto Minho")
\t\tRETURN CALCULATE(MAX('Indicadores'[Valor]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Rendimento médio", 'Indicadores'[Território] = "Alto Minho", 'Indicadores'[Ano] = _Ano)
\t\t\`\`\`
\t\tformatString: #,##0.00
\t\tdisplayFolder: Retrato territorial

\t/// Preço mediano por metro quadrado no Alto Minho no ano mais recente disponível.
\tmeasure 'Preço médio por m²' = \`\`\`
\t\tVAR _Ano = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Preço médio m²", 'Indicadores'[Território] = "Alto Minho")
\t\tRETURN CALCULATE(MAX('Indicadores'[Valor]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Preço médio m²", 'Indicadores'[Território] = "Alto Minho", 'Indicadores'[Ano] = _Ano)
\t\t\`\`\`
\t\tformatString: € #,##0 /m²
\t\tdisplayFolder: Retrato territorial

\t/// Saldo migratório do Alto Minho no ano mais recente disponível.
\tmeasure 'Saldo migratório' = \`\`\`
\t\tVAR _Ano = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Saldo Migratório", 'Indicadores'[Território] = "Alto Minho")
\t\tRETURN CALCULATE(MAX('Indicadores'[Valor]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Saldo Migratório", 'Indicadores'[Território] = "Alto Minho", 'Indicadores'[Ano] = _Ano)
\t\t\`\`\`
\t\tformatString: #,##0
\t\tdisplayFolder: Retrato territorial

\t/// Nome do indicador estatístico.
\tcolumn Indicador
\t\tdataType: string
\t\tsourceColumn: Indicador

\t/// Território a que o valor se refere.
\tcolumn Território
\t\tdataType: string
\t\tsourceColumn: Territorio

\t/// Município, em branco para a linha agregada do Alto Minho.
\tcolumn Município
\t\tdataType: string
\t\tsourceColumn: Municipio
\t\tdataCategory: City

\t/// Localização completa usada pela geocodificação do mapa.
\tcolumn Localização
\t\tdataType: string
\t\tsourceColumn: Localizacao
\t\tdataCategory: City

\t/// Nível territorial do registo.
\tcolumn 'Tipo de território'
\t\tdataType: string
\t\tsourceColumn: TipoTerritorio

\t/// Ano de referência do valor.
\tcolumn Ano
\t\tdataType: int64
\t\tformatString: 0
\t\tsourceColumn: Ano
\t\tsummarizeBy: none

\t/// Valor numérico do indicador.
\tcolumn Valor
\t\tdataType: decimal
\t\tisHidden
\t\tsourceColumn: Valor

\t/// Unidade estatística do valor.
\tcolumn Unidade
\t\tdataType: string
\t\tsourceColumn: Unidade

\t/// Dimensão analítica do indicador.
\tcolumn Dimensão
\t\tdataType: string
\t\tsourceColumn: Dimensao

\t/// Domínio temático principal.
\tcolumn Domínio
\t\tdataType: string
\t\tsourceColumn: Dominio

\t/// Tema complementar do indicador.
\tcolumn Tema
\t\tdataType: string
\t\tsourceColumn: Tema

\t/// Categoria de organização do catálogo.
\tcolumn Categoria
\t\tdataType: string
\t\tsourceColumn: Categoria

\t/// Entidade que publica o indicador.
\tcolumn Fonte
\t\tdataType: string
\t\tsourceColumn: Fonte

\t/// Ligação para a página de origem do indicador.
\tcolumn 'URL da fonte'
\t\tdataType: string
\t\tsourceColumn: FonteURL
\t\tdataCategory: WebUrl

\tpartition Indicadores = m
\t\tmode: import
\t\tsource =
\t\t\t\tlet
\t\t\t\t    FonteWeb = Csv.Document(Web.Contents("https://sistemainformacaocimaltominho.pt/powerbi-data.csv"), [Delimiter=",", Columns=12, Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
\t\t\t\t    #"Promovidos cabeçalhos" = Table.PromoteHeaders(FonteWeb, [PromoteAllScalars=true]),
\t\t\t\t    #"Convertidos tipos" = Table.TransformColumnTypes(#"Promovidos cabeçalhos", {{"Indicador", type text}, {"Territorio", type text}, {"TipoTerritorio", type text}, {"Ano", Int64.Type}, {"Valor", type number}, {"Unidade", type text}, {"Dimensao", type text}, {"Dominio", type text}, {"Tema", type text}, {"Categoria", type text}, {"Fonte", type text}, {"FonteURL", type text}}, "en-US"),
\t\t\t\t    #"Adicionado município" = Table.AddColumn(#"Convertidos tipos", "Municipio", each if [TipoTerritorio] = "Município" then [Territorio] else null, type text),
\t\t\t\t    #"Adicionada localização" = Table.AddColumn(#"Adicionado município", "Localizacao", each if [TipoTerritorio] = "Município" then [Territorio] & ", Viana do Castelo, Portugal" else null, type text)
\t\t\t\tin
\t\t\t\t    #"Adicionada localização"
`;
fs.writeFileSync(path.join(tablesDir, "Indicadores.tmdl"), tableTmdl, "utf8");

const themeName = "AltoMinho-4f9c2a10.json";
const theme = {
  name: themeName,
  dataColors: [C.green, C.coral, C.blue, C.lime, "#739B86", "#E5B956", "#4E7C73", "#A7D3DE"],
  good: "#2C7A5B", neutral: "#E5B956", bad: "#C65342", maximum: C.green, center: "#E5B956", minimum: "#D9EFF5", null: C.coral,
  foreground: C.ink, background: C.cream, tableAccent: C.green,
  textClasses: {
    title: { fontFace: "Segoe UI Semibold", fontSize: 13, color: C.ink },
    header: { fontFace: "Segoe UI Semibold", fontSize: 11, color: C.ink },
    label: { fontFace: "Segoe UI", fontSize: 10, color: C.muted },
    callout: { fontFace: "Segoe UI Semibold", fontSize: 26, color: C.green }
  },
  visualStyles: {
    "*": { "*": {
      title: [{ show: false }], visualHeader: [{ show: true }],
      background: [{ show: true, color: { solid: { color: C.white } }, transparency: 0 }],
      border: [{ show: false }]
    } },
    tableEx: { "*": { columnHeaders: [{ autoSizeColumnWidth: true, columnAdjustment: "growToFit" }] } },
    pivotTable: { "*": { columnHeaders: [{ autoSizeColumnWidth: true, columnAdjustment: "growToFit" }] } }
  }
};
writeJson(path.join(registered, themeName), theme);

const report = JSON.parse(fs.readFileSync(path.join(reportDef, "report.json"), "utf8"));
report.themeCollection.customTheme = { name: themeName, reportVersionAtImport: { visual: "2.11.0", report: "3.4.0", page: "2.3.1" }, type: "RegisteredResources" };
report.resourcePackages = report.resourcePackages.filter(p => p.name !== "RegisteredResources");
report.resourcePackages.push({ name: "RegisteredResources", type: "RegisteredResources", items: [{ name: themeName, path: themeName, type: "CustomTheme" }] });
writeJson(path.join(reportDef, "report.json"), report);

const p1 = "76f7c1e691fd43c485ec";
for (const entry of fs.readdirSync(pagesDir, { withFileTypes: true })) {
  if (entry.isDirectory() && entry.name !== p1) fs.rmSync(path.join(pagesDir, entry.name), { recursive: true, force: true });
}
const p2 = pageId();
const p3 = pageId();
const p4 = pageId();

buildPage(p1, "01 Retrato territorial", [
  ...chrome(1, "Conhecer o território. Decidir com contexto.", "Dados oficiais do Alto Minho, organizados para apoiar a leitura e a decisão."),
  slicer("Território", "Território em análise", 1020, 24, 230),
  textbox("Indicadores de síntese", 250, 132, 300, 26, 16, C.ink, "bold"),
  textbox("Último ano disponível", 1050, 134, 200, 22, 11, C.muted),
  card("População residente", 250, 164, 225, 106),
  card("Índice de envelhecimento", 492, 164, 225, 106),
  card("Preço médio por m²", 734, 164, 225, 106),
  card("Saldo migratório", 976, 164, 275, 106),
  textbox("Mapa municipal", 250, 286, 250, 28, 17, C.ink, "bold"),
  textbox("Comparação municipal", 748, 286, 310, 28, 17, C.ink, "bold"),
  azureMap("Localização", "População municipal", 250, 318, 472, 370),
  bar("Município", "População municipal", 742, 318, 509, 370)
]);

buildPage(p2, "02 Comparação municipal", [
  ...chrome(2, "Dez municípios, uma escala comum.", "Selecione um indicador para comparar os municípios e a referência do Alto Minho."),
  slicer("Indicador", "Indicador a comparar", 250, 130, 525),
  slicer("Domínio", "Domínio", 795, 130, 215),
  slicer("Fonte", "Fonte", 1030, 130, 220),
  card("Valor Alto Minho", 250, 216, 230, 105),
  card("Último ano", 498, 216, 190, 105),
  card("Municípios disponíveis", 706, 216, 230, 105),
  card("Diferença face ao Alto Minho", 954, 216, 296, 105),
  textbox("Ranking municipal", 250, 334, 250, 28, 17, C.ink, "bold"),
  textbox("Detalhe dos valores", 858, 334, 250, 28, 17, C.ink, "bold"),
  bar("Município", "Valor atual", 250, 366, 586, 322),
  table([{name:"Município"},{name:"Ano"},{name:"Valor atual",type:"measure"},{name:"Unidade"},{name:"Fonte"}], 856, 366, 394, 322)
]);

buildPage(p3, "03 Catálogo de indicadores", [
  ...chrome(3, "Encontrar um indicador", "Explore os 50 indicadores e filtre por domínio, tema, categoria ou fonte."),
  slicer("Domínio", "Domínio", 250, 130, 240),
  slicer("Tema", "Tema", 510, 130, 240),
  slicer("Categoria", "Categoria", 770, 130, 240),
  slicer("Fonte", "Fonte", 1030, 130, 220),
  card("Indicadores disponíveis", 250, 216, 250, 105),
  card("Registos disponíveis", 520, 216, 250, 105),
  card("Último ano", 790, 216, 200, 105),
  card("Municípios disponíveis", 1010, 216, 240, 105),
  textbox("Matriz de dados", 250, 334, 300, 28, 17, C.ink, "bold"),
  table([{name:"Indicador"},{name:"Dimensão"},{name:"Domínio"},{name:"Tema"},{name:"Categoria"},{name:"Fonte"},{name:"Ano"},{name:"Unidade"}], 250, 366, 1000, 322)
]);

buildPage(p4, "04 Metodologia", [
  ...chrome(4, "Dados comparáveis, decisões mais claras.", "Regras comuns de fonte, período e território para assegurar leituras consistentes."),
  shape(250, 128, 470, 170, C.white, 2000),
  textbox("Atualização semanal", 278, 150, 390, 36, 20, C.green, "bold"),
  textbox("Todas as segundas-feiras, uma rotina automática consulta as fontes, valida os valores e publica um novo ficheiro para o site e para o Power BI.", 278, 193, 400, 82, 13, C.muted),
  shape(742, 128, 508, 170, C.white, 2000),
  textbox("Fontes e rastreabilidade", 770, 150, 410, 36, 20, C.green, "bold"),
  textbox("Cada indicador conserva a entidade de origem e a ligação para a respetiva página no INE ou na Pordata. O ano apresentado é sempre o último disponível.", 770, 193, 430, 82, 13, C.muted),
  card("Indicadores disponíveis", 250, 320, 250, 105),
  card("Registos disponíveis", 520, 320, 250, 105),
  card("Municípios disponíveis", 790, 320, 250, 105),
  card("Último ano", 1060, 320, 190, 105),
  textbox("Catálogo e ligações às fontes", 250, 444, 350, 28, 17, C.ink, "bold"),
  table([{name:"Fonte"},{name:"Indicador"},{name:"Ano"},{name:"URL da fonte"}], 250, 476, 1000, 212)
]);

writeJson(path.join(pagesDir, "pages.json"), { $schema: pagesSchema, pageOrder: [p1, p2, p3, p4], activePageName: p1 });

console.log(JSON.stringify({ root, pages: [p1, p2, p3, p4], theme: themeName }, null, 2));
