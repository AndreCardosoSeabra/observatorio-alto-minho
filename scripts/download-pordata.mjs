import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const sources = JSON.parse(await readFile("data/pordata-sources.json", "utf8"));
const auxiliaryUrls = ["https://www.pordata.pt/portugal/evolucao+do+salario+minimo+nacional-74"];
const allUrls = [...new Set([...Object.values(sources), ...auxiliaryUrls])];
const urls = process.env.PORDATA_ONLY_ID
  ? allUrls.filter((url) => url.endsWith(`-${process.env.PORDATA_ONLY_ID}`))
  : allUrls;
const outputDirectory = ".cache/pordata";
const debugDirectory = ".cache/pordata-debug";
await mkdir(outputDirectory, { recursive: true });
await mkdir(debugDirectory, { recursive: true });

const TERRITORIES = [
  "Alto Minho", "Arcos de Valdevez", "Caminha", "Melgaço", "Monção", "Paredes de Coura",
  "Ponte da Barca", "Ponte de Lima", "Valença", "Viana do Castelo", "Vila Nova de Cerveira",
];

async function rejectCookies(page) {
  await page.getByRole("button", { name: /rejeitar/i }).first().click({ timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(500);
}

// Na página "tabela completa" (ambiente de consulta): todos os anos + só Alto Minho e os 10 municípios.
// Usa cliques reais (como um utilizador), um de cada vez, a esperar pelo servidor entre passos.
async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function configureQuery(page, id) {
  page.on("pageerror", (error) => console.warn(`  [erro página] ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 400) console.warn(`  [HTTP ${response.status()}] ${response.url()}`); });

  // abrir o painel Territórios e desselecionar todos
  await page.locator("span.Heading1_withoutborderbottom", { hasText: /^Territórios$/ }).first().click();
  await page.waitForTimeout(800);
  const block = page.locator('[id$="wtHierarquicalSearch_block_wtTR_Selector"]');
  await page.locator('img[title="Desseleccionar Todos"]').nth(1).click().catch(async () => {
    await page.locator('img[title="Desseleccionar Todos"]').first().click();
  });
  await page.waitForTimeout(800);
  for (const name of TERRITORIES) {
    await block.locator(`td[geotextcontent="${name}"] input[type="checkbox"]`).first().check({ timeout: 10_000 });
  }
  // Anos: abrir o painel se estiver fechado e clicar em "Seleccionar Todos"
  const yearSelectAll = page.locator('[id*="wtYearSearch_block"] img[title="Seleccionar Todos"]').first();
  if (!(await yearSelectAll.isVisible())) {
    await page.locator("span.Heading1_withoutborderbottom", { hasText: /^Anos$/ }).first().click();
    await page.waitForTimeout(800);
  }
  await yearSelectAll.click();
  await page.waitForTimeout(800);
  const count = (await page.locator('[id$="wtTerritoriesCountLabel"]').first().innerText()).trim();
  const years = (await page.locator('[id$="wtYearsCountLabel"]').first().innerText()).trim();
  console.log(`  ${id}: territórios ${count}, anos ${years}`);
  const [yearsSelected, yearsTotal] = years.replace(/[()]/g, "").split("/");
  if (yearsSelected !== yearsTotal) throw new Error(`${id}: nem todos os anos selecionados ${years}`);
  if (!count.startsWith(`(${TERRITORIES.length}/`)) throw new Error(`${id}: seleção de territórios incorreta ${count}`);

  // Actualizar (clique real) e esperar que Portugal/Continente desapareçam da tabela
  await page.locator("input.Menu_Workspace_UpdateButton").click();
  await settle(page);
  await page.waitForFunction(
    () => ![...document.querySelectorAll("td.ano")].some((td) => /^\s*(Portugal|Continente)\s*$/.test(td.textContent.replace(/\u00a0/g, " "))),
    null, { timeout: 90_000 },
  );
}

async function exportExcel(page, id) {
  const link = page.locator("a", { hasText: "Exportar para Excel" }).first();
  await link.waitFor({ state: "attached", timeout: 30_000 });
  const href = await link.getAttribute("href");
  const target = href?.match(/__doPostBack\('([^']+)'/)?.[1];
  if (!target) throw new Error(`Botão Excel não encontrado (${id})`);
  const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
  await page.evaluate((eventTarget) => window.__doPostBack(eventTarget, ""), target);
  const download = await downloadPromise;
  await download.saveAs(`${outputDirectory}/${id}.xlsx`);
}

const installedChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  || (process.platform === "win32" && existsSync(installedChrome) ? installedChrome : undefined);
const browser = await chromium.launch({ headless: true, executablePath });

try {
  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    const id = url.match(/-(\d+)$/)?.[1];
    if (!id) throw new Error(`Endereço Pordata sem identificador: ${url}`);
    const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1400, height: 1000 } });
    try {
      console.log(`[Pordata ${index + 1}/${urls.length}] ${id}`);
      if (url.includes("/municipios/")) {
        await page.goto(`https://www.pordata.pt/db/municipios/ambiente+de+consulta/tabela/?microid=${id}`, { waitUntil: "networkidle", timeout: 90_000 });
        await rejectCookies(page);
        await configureQuery(page, id);
      } else {
        await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
        await rejectCookies(page);
      }
      await exportExcel(page, id);
    } catch (error) {
      await writeFile(`${debugDirectory}/${id}.html`, await page.content()).catch(() => {});
      await page.screenshot({ path: `${debugDirectory}/${id}.png`, fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}

console.log(`Pordata: ${urls.length} ficheiros descarregados.`);
