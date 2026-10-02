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
  cream: "#F3F4EC", blush: "#FFE3DA", ink: "#10211D", muted: "#61716C", white: "#FFFFFF", pale: "#DDECEF"
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

function textbox(text, x, y, width, height, size = 18, color = C.ink, weight = "normal", family = "Segoe UI", alignment = "left") {
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
          horizontalTextAlignment: alignment
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

function card(measureName, x, y, width, height, options = {}) {
  const name = hex();
  const background = options.background ?? C.white;
  const valueColor = options.valueColor ?? C.ink;
  const labelColor = options.labelColor ?? C.muted;
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
          value: [{ properties: { show: lit("true"), fontSize: lit(`${options.valueSize ?? 24}D`), fontFamily: lit(`'${options.valueFamily ?? "Segoe UI"}'`), fontColor: { solid: { color: lit(`'${valueColor}'`) } }, bold: lit(options.valueBold ? "true" : "false"), horizontalAlignment: lit(`'${options.align ?? "left"}'`), labelDisplayUnits: lit("1D") }, selector: { id: "default" } }],
          label: [{ properties: { show: lit(options.labelShow === false ? "false" : "true"), fontSize: lit(`${options.labelSize ?? 10}D`), fontColor: { solid: { color: lit(`'${labelColor}'`) } }, horizontalAlignment: lit(`'${options.labelAlign ?? options.align ?? "left"}'`), ...(options.labelText ? { text: lit(`'${options.labelText}'`) } : {}) }, selector: { id: "default" } }],
          padding: [{ properties: { paddingUniform: lit(`${options.padding ?? 8}D`) }, selector: { id: "default" } }],
          layout: [{ properties: { paddingUniform: lit("0D"), backgroundShow: lit("false"), backgroundTransparency: lit("100D") }, selector: { id: "default" } }],
          cardCalloutArea: [{ properties: { show: lit("false"), backgroundTransparency: lit("100D"), paddingUniform: lit("0D") } }],
          fillCustom: [{ properties: { show: lit("false"), transparency: lit("100D") }, selector: { id: "default" } }]
        },
        visualContainerObjects: {
          background: [{ properties: { show: lit(options.transparent ? "false" : "true"), color: { solid: { color: lit(`'${background}'`) } }, transparency: lit("0D") } }],
          border: [{ properties: { show: lit(options.border === false ? "false" : "true"), color: { solid: { color: lit("'#D6DFDB'") } }, radius: lit("10D"), width: lit("1D") } }],
          padding: [{ properties: { top: lit("8D"), bottom: lit("8D"), left: lit("10D"), right: lit("10D") } }]
        }
      }
    }
  };
}

function imageVisual(resourceName, x, y, width, height) {
  const name = hex();
  return {
    name,
    json: {
      $schema: visualSchema,
      name,
      position: position(x, y, width, height, 4000, 4000),
      visual: {
        visualType: "image",
        objects: { general: [{ properties: { imageUrl: { expr: { ResourcePackageItem: { PackageName: "RegisteredResources", PackageType: 1, ItemName: resourceName } } } } }] },
        visualContainerObjects: {
          background: [{ properties: { show: lit("false") } }],
          border: [{ properties: { show: lit("false") } }],
          padding: [{ properties: { top: lit("0D"), bottom: lit("0D"), left: lit("0D"), right: lit("0D") } }]
        }
      }
    }
  };
}

function slicer(property, label, x, y, width, options = {}) {
  const name = hex();
  const background = options.background ?? C.white;
  const transparent = options.transparent ?? false;
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
          background: [{ properties: { show: lit(transparent ? "false" : "true"), color: { solid: { color: lit(`'${background}'`) } }, transparency: lit("0D") } }],
          border: [{ properties: { show: lit(options.border === false ? "false" : "true"), color: { solid: { color: lit("'#D6DFDB'") } }, radius: lit("8D"), width: lit("1D") } }],
          padding: [{ properties: { top: lit("8D"), bottom: lit("8D"), left: lit("8D"), right: lit("8D") } }]
        }
      }
    }
  };
}

function comparisonBar(x, y, width, height) {
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
            Category: { projections: [projection(column("Município"), "Indicadores.Município", "Município", true)] },
            Y: { projections: [projection(measure("Valor municipal selecionado"), "Indicadores.Valor municipal selecionado", "Valor municipal selecionado")] }
          },
          sortDefinition: { sort: [{ field: measure("Valor municipal selecionado"), direction: "Descending" }] }
        },
        objects: {
          categoryAxis: [{ properties: { show: lit("true"), fontSize: lit("12D"), innerPadding: lit("42L"), labelColor: { solid: { color: lit(`'${C.ink}'`) } } } }],
          valueAxis: [{ properties: { show: lit("false") } }],
          labels: [{ properties: { show: lit("true"), fontSize: lit("11D"), color: { solid: { color: lit(`'${C.ink}'`) } }, labelPosition: lit("'OutsideEnd'") } }],
          dataPoint: [{ properties: { fill: { solid: { color: lit(`'${C.coral}'`) } } } }]
        },
        visualContainerObjects: {
          background: [{ properties: { show: lit("false") } }],
          border: [{ properties: { show: lit("false") } }],
          visualHeader: [{ properties: { show: lit("false") } }],
          padding: [{ properties: { top: lit("0D"), bottom: lit("0D"), left: lit("0D"), right: lit("0D") } }]
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

function table(fields, x, y, width, height, options = {}) {
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
          columnHeaders: [{ properties: { columnAdjustment: lit("'growToFit'"), autoSizeColumnWidth: lit("true"), backColor: { solid: { color: lit(`'${options.headerBackground ?? C.green}'`) } }, fontColor: { solid: { color: lit(`'${options.headerColor ?? C.white}'`) } } } }],
          values: [{ properties: { backColorPrimary: { solid: { color: lit(`'${options.rowPrimary ?? C.white}'`) } }, backColorSecondary: { solid: { color: lit(`'${options.rowSecondary ?? "#EEF3F0"}'`) } }, fontColorPrimary: { solid: { color: lit(`'${C.ink}'`) } }, fontColorSecondary: { solid: { color: lit(`'${C.ink}'`) } } } }]
        },
        visualContainerObjects: {
          background: [{ properties: { show: lit(options.transparent ? "false" : "true"), color: { solid: { color: lit(`'${C.white}'`) } }, transparency: lit("0D") } }],
          border: [{ properties: { show: lit(options.border === false ? "false" : "true"), color: { solid: { color: lit("'#D6DFDB'") } }, radius: lit("10D"), width: lit("1D") } }]
        }
      }
    }
  };
}

function buildPage(id, displayName, visuals, background = C.cream) {
  const dir = path.join(pagesDir, id);
  fs.rmSync(path.join(dir, "visuals"), { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "visuals"), { recursive: true });
  writeJson(path.join(dir, "page.json"), {
    $schema: pageSchema, name: id, displayName, displayOption: "FitToPage", height: 720, width: 1600,
    objects: {
      background: [{ properties: { color: { solid: { color: lit(`'${background}'`) } }, transparency: lit("0D") } }],
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

const mapResourceName = "alto-minho-municipios.svg";
const mapSource = fs.readFileSync(path.resolve("map-data.js"), "utf8");
const mapShapes = JSON.parse(mapSource.slice(mapSource.indexOf("[")).replace(/;\s*$/, ""));
const mapSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 390" role="img" aria-label="Mapa dos municípios do Alto Minho">
  <rect width="520" height="390" fill="#DDECEF"/>
  <g>${mapShapes.map(item => `<path d="${item.path}" fill="#245B4C" stroke="#DDECEF" stroke-width="2"/><text x="${item.label[0]}" y="${item.label[1]}" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="9" font-weight="600" text-anchor="middle" paint-order="stroke" stroke="#153B32" stroke-width="2">${item.name.replaceAll("&", "&amp;")}</text>`).join("")}</g>
</svg>`;
fs.writeFileSync(path.join(registered, mapResourceName), mapSvg, "utf8");

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

\t/// Indicador escolhido no seletor; usa população residente quando ainda não existe uma seleção única.
\tmeasure 'Indicador em análise' = SELECTEDVALUE('Indicadores'[Indicador], "População residente: total 2015 a 2025")
\t\tdisplayFolder: Medidas dinâmicas

\t/// Valor municipal do indicador escolhido no ano mais recente comum disponível.
\tmeasure 'Valor municipal selecionado' = \`\`\`
\t\tVAR _Indicador = [Indicador em análise]
\t\tVAR _AnoMaisRecente =
\t\t\tCALCULATE(
\t\t\t\tMAX('Indicadores'[Ano]),
\t\t\t\tREMOVEFILTERS('Indicadores'[Indicador], 'Indicadores'[Ano], 'Indicadores'[Território], 'Indicadores'[Município]),
\t\t\t\t'Indicadores'[Indicador] = _Indicador,
\t\t\t\t'Indicadores'[Tipo de território] = "Município"
\t\t\t)
\t\tRETURN
\t\t\tCALCULATE(
\t\t\t\tMAX('Indicadores'[Valor]),
\t\t\t\tREMOVEFILTERS('Indicadores'[Indicador], 'Indicadores'[Ano]),
\t\t\t\t'Indicadores'[Indicador] = _Indicador,
\t\t\t\t'Indicadores'[Ano] = _AnoMaisRecente,
\t\t\t\t'Indicadores'[Tipo de território] = "Município"
\t\t\t)
\t\t\`\`\`
\t\tformatString: #,##0.##
\t\tdisplayFolder: Comparação

\t/// Valor do indicador escolhido para o Alto Minho no respetivo ano mais recente.
\tmeasure 'Valor do catálogo' = \`\`\`
\t\tVAR _Indicador = [Indicador em análise]
\t\tVAR _Ano = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = _Indicador, 'Indicadores'[Território] = "Alto Minho")
\t\tRETURN CALCULATE(MAX('Indicadores'[Valor]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = _Indicador, 'Indicadores'[Território] = "Alto Minho", 'Indicadores'[Ano] = _Ano)
\t\t\`\`\`
\t\tformatString: #,##0.##
\t\tdisplayFolder: Catálogo

\tmeasure 'Ano do catálogo' = \`\`\`
\t\tVAR _Indicador = [Indicador em análise]
\t\tRETURN CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = _Indicador, 'Indicadores'[Território] = "Alto Minho")
\t\t\`\`\`
\t\tformatString: 0
\t\tdisplayFolder: Catálogo

\tmeasure 'Área do catálogo' = \`\`\`
\t\tVAR _Indicador = [Indicador em análise]
\t\tRETURN CALCULATE(SELECTEDVALUE('Indicadores'[Domínio]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = _Indicador)
\t\t\`\`\`
\t\tdisplayFolder: Catálogo

\tmeasure 'Fonte do catálogo' = \`\`\`
\t\tVAR _Indicador = [Indicador em análise]
\t\tRETURN CALCULATE(SELECTEDVALUE('Indicadores'[Fonte]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = _Indicador)
\t\t\`\`\`
\t\tdisplayFolder: Catálogo

\tmeasure 'Leitura do catálogo' = \`\`\`
\t\tVAR _Indicador = [Indicador em análise]
\t\tRETURN CALCULATE(SELECTEDVALUE('Indicadores'[Dimensão]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = _Indicador)
\t\t\`\`\`
\t\tdisplayFolder: Catálogo

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

\tmeasure 'Ano população residente' = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "População residente: total 2015 a 2025", 'Indicadores'[Território] = "Alto Minho")
\t\tformatString: 0
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

\tmeasure 'Ano índice de envelhecimento' = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Índice de envelhecimento", 'Indicadores'[Território] = "Alto Minho")
\t\tformatString: 0
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

\tmeasure 'Ano preço médio por m²' = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Preço médio m²", 'Indicadores'[Território] = "Alto Minho")
\t\tformatString: 0
\t\tdisplayFolder: Retrato territorial

\t/// Saldo migratório do Alto Minho no ano mais recente disponível.
\tmeasure 'Saldo migratório' = \`\`\`
\t\tVAR _Ano = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Saldo Migratório", 'Indicadores'[Território] = "Alto Minho")
\t\tRETURN CALCULATE(MAX('Indicadores'[Valor]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Saldo Migratório", 'Indicadores'[Território] = "Alto Minho", 'Indicadores'[Ano] = _Ano)
\t\t\`\`\`
\t\tformatString: #,##0
\t\tdisplayFolder: Retrato territorial

\tmeasure 'Ano saldo migratório' = CALCULATE(MAX('Indicadores'[Ano]), REMOVEFILTERS('Indicadores'), 'Indicadores'[Indicador] = "Saldo Migratório", 'Indicadores'[Território] = "Alto Minho")
\t\tformatString: 0
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
report.resourcePackages.push({ name: "RegisteredResources", type: "RegisteredResources", items: [
  { name: themeName, path: themeName, type: "CustomTheme" },
  { name: mapResourceName, path: mapResourceName, type: "Image" }
] });
writeJson(path.join(reportDef, "report.json"), report);

const p1 = "76f7c1e691fd43c485ec";
for (const entry of fs.readdirSync(pagesDir, { withFileTypes: true })) {
  if (entry.isDirectory() && entry.name !== p1) fs.rmSync(path.join(pagesDir, entry.name), { recursive: true, force: true });
}
const p2 = pageId();
const p3 = pageId();
const p4 = pageId();

buildPage(p1, "01 Retrato territorial", [
  textbox("CIM ALTO MINHO · RETRATO TERRITORIAL", 72, 50, 650, 24, 13, C.green, "bold"),
  textbox("Conhecer o território.", 72, 82, 900, 82, 52, C.ink, "normal", "Georgia"),
  textbox("Decidir com contexto.", 72, 150, 900, 82, 52, "#245B4C", "normal", "Georgia"),
  shape(1112, 91, 4, 118, C.lime, 100),
  slicer("Território", "Território em análise", 1148, 94, 370, { transparent: true, border: false }),
  textbox("10 municípios · NUTS III Alto Minho", 1148, 178, 360, 24, 13, C.muted),
  shape(72, 255, 1446, 1, "#D4DDD7", 100),
  textbox("Território selecionado", 72, 276, 250, 22, 12, C.muted),
  textbox("Alto Minho", 72, 304, 380, 60, 38, C.ink, "normal", "Georgia"),
  textbox("●  Matriz de indicadores do projeto · fontes INE e Pordata", 1000, 322, 518, 22, 12, C.muted),
  shape(72, 382, 655, 290, C.pale, 100),
  textbox("Mapa municipal", 100, 408, 220, 36, 23, C.ink, "normal", "Georgia"),
  textbox("Selecione um município para explorar os seus indicadores.", 465, 409, 220, 48, 12, "#557178"),
  imageVisual(mapResourceName, 100, 458, 598, 190),
  textbox("●  Município ativo     Limites: CAOP · DGT", 100, 646, 430, 20, 11, "#557178"),
  shape(727, 382, 791, 290, C.green, 100),
  textbox("Indicadores de síntese", 765, 410, 350, 40, 25, C.white, "normal", "Georgia"),
  textbox("Último ano disponível", 1305, 416, 175, 24, 12, "#9DB8AE"),
  shape(765, 458, 715, 1, "#4E7067", 110),
  card("Ano população residente", 765, 468, 88, 38, { transparent: true, border: false, labelShow: false, valueColor: C.lime, valueSize: 10, valueBold: true, padding: 0 }),
  card("População residente", 870, 464, 275, 44, { transparent: true, border: false, labelShow: false, valueColor: C.white, valueSize: 27, valueFamily: "Georgia", padding: 0 }),
  textbox("População residente", 1180, 477, 300, 24, 12, "#D5E1DC", "normal", "Segoe UI", "right"),
  shape(765, 511, 715, 1, "#4E7067", 110),
  card("Ano índice de envelhecimento", 765, 520, 88, 38, { transparent: true, border: false, labelShow: false, valueColor: C.lime, valueSize: 10, valueBold: true, padding: 0 }),
  card("Índice de envelhecimento", 870, 516, 275, 44, { transparent: true, border: false, labelShow: false, valueColor: C.white, valueSize: 27, valueFamily: "Georgia", padding: 0 }),
  textbox("Índice de envelhecimento", 1180, 529, 300, 24, 12, "#D5E1DC", "normal", "Segoe UI", "right"),
  shape(765, 563, 715, 1, "#4E7067", 110),
  card("Ano preço médio por m²", 765, 572, 88, 38, { transparent: true, border: false, labelShow: false, valueColor: C.lime, valueSize: 10, valueBold: true, padding: 0 }),
  card("Preço médio por m²", 870, 568, 275, 44, { transparent: true, border: false, labelShow: false, valueColor: C.white, valueSize: 27, valueFamily: "Georgia", padding: 0 }),
  textbox("Preço médio por m²", 1180, 581, 300, 24, 12, "#D5E1DC", "normal", "Segoe UI", "right"),
  shape(765, 615, 715, 1, "#4E7067", 110),
  card("Ano saldo migratório", 765, 624, 88, 38, { transparent: true, border: false, labelShow: false, valueColor: C.lime, valueSize: 10, valueBold: true, padding: 0 }),
  card("Saldo migratório", 870, 620, 275, 44, { transparent: true, border: false, labelShow: false, valueColor: C.white, valueSize: 27, valueFamily: "Georgia", padding: 0 }),
  textbox("Saldo migratório", 1180, 633, 300, 24, 12, "#D5E1DC", "normal", "Segoe UI", "right"),
  shape(765, 667, 715, 1, "#4E7067", 110)
]);

buildPage(p2, "02 Comparação municipal", [
  textbox("02", 60, 98, 76, 75, 48, C.coral, "normal", "Georgia"),
  textbox("BENCHMARKING MUNICIPAL", 154, 100, 380, 24, 13, C.green, "bold"),
  textbox("Dez municípios,", 154, 136, 720, 69, 44, C.ink, "normal", "Georgia"),
  textbox("uma escala comum", 154, 198, 720, 69, 44, C.ink, "normal", "Georgia"),
  slicer("Indicador", "Indicador a comparar", 1110, 165, 360, { transparent: true, border: false }),
  comparisonBar(150, 292, 1330, 376)
], C.blush);

buildPage(p3, "03 Catálogo de indicadores", [
  textbox("03", 72, 60, 76, 75, 48, C.coral, "normal", "Georgia"),
  textbox("CATÁLOGO · 50 INDICADORES", 160, 68, 380, 24, 13, C.green, "bold"),
  textbox("Encontrar um indicador", 160, 105, 720, 66, 42, C.ink, "normal", "Georgia"),
  slicer("Indicador", "Pesquisar por nome ou área", 1110, 84, 408, { transparent: true, border: false }),
  shape(72, 198, 1446, 242, C.pale, 100),
  shape(72, 198, 6, 242, C.blue, 101),
  card("Indicador em análise", 104, 220, 790, 92, { transparent: true, border: false, valueColor: C.ink, labelColor: C.green, valueSize: 25, valueFamily: "Georgia", labelSize: 11, labelText: "INDICADOR SELECIONADO", padding: 0 }),
  textbox("Número ou valor oficial para o território e período selecionados.", 114, 320, 730, 34, 13, "#557178"),
  card("Valor do catálogo", 1100, 224, 374, 106, { transparent: true, border: false, valueColor: C.green, labelColor: "#557178", valueSize: 38, valueFamily: "Georgia", labelSize: 11, labelText: "Alto Minho", padding: 0 }),
  card("Área do catálogo", 104, 366, 270, 58, { transparent: true, border: false, valueColor: C.green, labelColor: "#557178", valueSize: 14, labelSize: 9, labelText: "ÁREA", padding: 0 }),
  card("Ano do catálogo", 390, 366, 210, 58, { transparent: true, border: false, valueColor: C.green, labelColor: "#557178", valueSize: 14, labelSize: 9, labelText: "ANO", padding: 0 }),
  card("Leitura do catálogo", 616, 366, 270, 58, { transparent: true, border: false, valueColor: C.green, labelColor: "#557178", valueSize: 14, labelSize: 9, labelText: "LEITURA", padding: 0 }),
  card("Fonte do catálogo", 902, 366, 270, 58, { transparent: true, border: false, valueColor: C.green, labelColor: "#557178", valueSize: 14, labelSize: 9, labelText: "FONTE", padding: 0 }),
  textbox("Comparar municípios  ↓", 1272, 382, 205, 26, 13, C.green, "bold"),
  shape(72, 474, 1446, 2, C.ink, 100),
  table([{name:"Indicador"},{name:"Domínio"},{name:"Ano"},{name:"Fonte"}], 72, 486, 1446, 190, { transparent: true, border: false, headerBackground: C.cream, headerColor: C.muted, rowPrimary: C.cream, rowSecondary: "#F8F8F3" })
]);

buildPage(p4, "04 Metodologia", [
  textbox("04", 72, 64, 76, 75, 48, C.coral, "normal", "Georgia"),
  textbox("METODOLOGIA", 72, 160, 300, 24, 13, C.lime, "bold"),
  textbox("Dados comparáveis,", 72, 200, 620, 66, 42, C.white, "normal", "Georgia"),
  textbox("decisões mais claras.", 72, 258, 620, 66, 42, C.white, "normal", "Georgia"),
  textbox("O observatório organiza a informação estatística do Alto Minho com regras comuns de fonte, período e território.", 72, 350, 520, 76, 15, "#B7CBC4"),
  shape(760, 80, 760, 1, "#67877E", 100),
  textbox("Fontes documentadas", 760, 112, 245, 30, 16, C.lime, "bold"),
  textbox("Cada indicador identifica a sua origem no INE, nos Censos ou na Pordata.", 1040, 112, 455, 52, 14, "#C4D4CE"),
  shape(760, 184, 760, 1, "#52746B", 100),
  textbox("Atualização rastreável", 760, 216, 245, 30, 16, C.lime, "bold"),
  textbox("O sistema regista a série e o ano mais recente que foram validados.", 1040, 216, 455, 52, 14, "#C4D4CE"),
  shape(760, 288, 760, 1, "#52746B", 100),
  textbox("Escala territorial", 760, 320, 245, 30, 16, C.lime, "bold"),
  textbox("São apresentados os dez municípios e o Alto Minho enquanto NUTS III.", 1040, 320, 455, 52, 14, "#C4D4CE"),
  shape(760, 392, 760, 1, "#52746B", 100),
  textbox("Comparação homogénea", 760, 424, 245, 30, 16, C.lime, "bold"),
  textbox("A definição, unidade e período mantêm-se iguais entre territórios.", 1040, 424, 455, 52, 14, "#C4D4CE"),
  shape(72, 556, 1448, 1, "#52746B", 100),
  textbox("Protótipo funcional com valores da matriz do projeto, extraídos das bases de trabalho do INE e da Pordata.", 72, 586, 1000, 28, 12, "#91ABA1"),
  card("Indicadores disponíveis", 1160, 574, 170, 76),
  card("Último ano", 1348, 574, 170, 76)
], C.green);

writeJson(path.join(pagesDir, "pages.json"), { $schema: pagesSchema, pageOrder: [p1, p2, p3, p4], activePageName: p1 });

console.log(JSON.stringify({ root, pages: [p1, p2, p3, p4], theme: themeName }, null, 2));
