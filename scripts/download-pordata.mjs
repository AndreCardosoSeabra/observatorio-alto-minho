import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const sources = JSON.parse(await readFile("data/pordata-sources.json", "utf8"));
const auxiliaryUrls = [
  "https://www.pordata.pt/portugal/evolucao+do+salario+minimo+nacional-74",
];
const allUrls = [...new Set([...Object.values(sources), ...auxiliaryUrls])];
const urls = process.env.PORDATA_ONLY_ID
  ? allUrls.filter((url) => url.endsWith(`-${process.env.PORDATA_ONLY_ID}`))
  : allUrls;
const outputDirectory = ".cache/pordata";
await mkdir(outputDirectory, { recursive: true });

const installedChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  || (process.platform === "win32" && existsSync(installedChrome) ? installedChrome : undefined);
const browser = await chromium.launch({ headless: true, executablePath });

try {
  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    const id = url.match(/-(\d+)$/)?.[1];
    if (!id) throw new Error(`Endereço Pordata sem identificador: ${url}`);
    const page = await browser.newPage({ acceptDownloads: true });
    try {
      console.log(`[Pordata ${index + 1}/${urls.length}] ${id}`);
      await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
      const link = page.locator("a", { hasText: "Exportar para Excel" }).first();
      await link.waitFor({ state: "visible", timeout: 30_000 });
      const href = await link.getAttribute("href");
      const target = href?.match(/__doPostBack\('([^']+)'/)?.[1];
      if (!target) throw new Error(`Botão Excel não encontrado em ${url}`);
      const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
      await page.evaluate((eventTarget) => window.__doPostBack(eventTarget, ""), target);
      const download = await downloadPromise;
      await download.saveAs(`${outputDirectory}/${id}.xlsx`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}

console.log(`Pordata: ${urls.length} ficheiros descarregados.`);
