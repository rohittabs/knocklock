// Prints an About page to a PDF, one slide per 1280 x 720 page.
// Usage: node tools/make-about-pdf.mjs <page.html> <out.pdf>
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const [src, out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, colorScheme: 'light' });
await page.goto(pathToFileURL(path.resolve(src)).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => [...document.images].every((i) => i.complete));
await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log(out);
