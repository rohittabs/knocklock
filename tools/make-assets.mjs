// Makes the PNG app icons, the example pictures on the About page and the social preview image.
// Every example is drawn by KnockLock itself, so the pictures always match the app.
// Run after `python3 build.py`:  npm run assets   (needs Playwright's Chromium)
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = (p) => pathToFileURL(path.join(root, p)).href;
const save = (p, dataUrl) => {
  mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
  writeFileSync(path.join(root, p), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(p);
};

const browser = await chromium.launch();

// 1. PNG icons from the SVG icons
{
  const page = await browser.newPage();
  const icons = [
    ['assets/icons/icon.svg', 'assets/icons/icon-512.png', 512],
    ['assets/icons/icon.svg', 'assets/icons/icon-192.png', 192],
    ['assets/icons/icon-maskable.svg', 'assets/icons/icon-maskable-512.png', 512],
    ['assets/icons/icon-maskable.svg', 'assets/icons/apple-touch-icon.png', 180],
    ['assets/icons/favicon.svg', 'assets/icons/favicon-32.png', 32],
  ];
  for (const [src, out, size] of icons) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<body style="margin:0;background:transparent"><img src="${url(src)}" width="${size}" height="${size}" style="display:block"></body>`);
    await page.waitForFunction(() => document.images[0].complete);
    save(out, 'data:image/png;base64,' + (await page.screenshot({ omitBackground: true })).toString('base64'));
  }
  await page.close();
}

// 2. Example pictures for the About page, drawn by the app
const page = await browser.newPage({ viewport: { width: 1300, height: 1000 }, colorScheme: 'light' });
await page.goto(url('index.html'));
await page.waitForFunction(() => window.__knock && window.__knock.cur);
await page.evaluate(() => document.fonts.ready);

async function poster(opts) {
  return page.evaluate(async (o) => {
    const $ = (id) => document.getElementById(id);
    document.querySelector(`[data-preset="${o.preset || 'easy'}"]`).click();
    if (o.add) for (const id of o.add) { const i = document.querySelector(`.tile input[value="${id}"]`); if (i && !i.checked) i.click(); }
    for (const k of ['ts', 'paper', 'theme', 'feel', 'syl']) { $(k).value = o[k] || { ts: '4/4', paper: 'a4p', theme: 'mono', feel: 'straight', syl: 'count' }[k]; }
    $('room').value = o.room || '';
    if (o.penalty) { $('penSel').value = o.penalty; }
    // Look at 400 password numbers from o.seed and keep the busiest rhythm, so each picture shows the idea well.
    const score = (cur) => (o.has && !cur.bars[0].some((c) => o.has.includes(c.id)) ? -99 : 0) + Math.min(...cur.bars.map((b) => b.length)) * 10 + cur.bars[0].length;
    let best = o.seed, bestScore = -Infinity;
    for (let n = 0, seed = o.seed; n < 400; n++, seed = 1000 + ((seed - 1000 + 1) % 9000)) {
      window.__knock.build(seed);
      const sc = score(window.__knock.cur);
      if (sc > bestScore) { best = seed; bestScore = sc; }
    }
    window.__knock.build(best);
    await new Promise((r) => setTimeout(r, 150));
    const c = $('poster');
    const [x, y, w, h] = (o.crop || [0, 0, 1, 1]).map((v, i) => Math.round(v * (i % 2 ? c.height : c.width)));
    const scale = (o.width || 900) / w;
    const out = document.createElement('canvas');
    out.width = Math.round(w * scale); out.height = Math.round(h * scale);
    const g = out.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(c, x, y, w, h, 0, 0, out.width, out.height);
    return out.toDataURL('image/png');
  }, opts);
}

const ex = 'assets/examples/';
const ROW = [0.04, 0.19, 0.92, 0.115]; // the first line of music, with its counting
save(ex + 'poster.png', await poster({ preset: 'hard', seed: 4821, width: 900 }));
save(ex + 'poster-navy-landscape.png', await poster({ preset: 'hard', seed: 3170, paper: 'a4l', theme: 'navy', width: 900 }));
save(ex + 'counting.png', await poster({ preset: 'hard', seed: 2604, crop: ROW, width: 1000 }));
save(ex + 'compound.png', await poster({ preset: 'all', ts: '6/8', seed: 1508, crop: ROW, width: 1000 }));
save(ex + 'seven-eight.png', await poster({ preset: 'all', ts: '7/8', seed: 7311, crop: ROW, width: 1000 }));
save(ex + 'swing.png', await poster({ preset: 'mid', feel: 's8', seed: 5562, crop: [0.04, 0.162, 0.92, 0.17], has: ['88'], width: 1000 }));
save(ex + 'how-to-enter.png', await poster({ preset: 'mid', seed: 4821, crop: [0.04, 0.745, 0.92, 0.19], width: 1000 }));

// Settings panel, top part: the presets, the notes and the first note groups
const panel = await page.locator('aside .panel').first().boundingBox();
const tiles = await page.screenshot({ type: 'png', clip: { x: panel.x, y: panel.y, width: panel.width, height: Math.min(panel.height, 560) } });
save(ex + 'note-values.png', 'data:image/png;base64,' + tiles.toString('base64'));
await page.close();

// 3. Social preview (1280 x 640), shown when a link to KnockLock is shared
{
  const p = await browser.newPage({ viewport: { width: 1280, height: 640 } });
  await p.goto(url('tools/social-preview.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => [...document.images].every((i) => i.complete));
  save('assets/social-preview.png', 'data:image/png;base64,' + (await p.screenshot()).toString('base64'));
}
await browser.close();
