import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const fileUrl = (p) => pathToFileURL(path.join(root, p)).href;

// Opens index.html straight from the disk (the way a shared copy is used) and collects page errors.
export async function openApp(options = {}) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1300, height: 1000 }, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(fileUrl('index.html'));
  await page.waitForFunction(() => window.__knock && window.__knock.cur);
  return { browser, page, errors };
}
