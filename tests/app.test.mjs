// Uses the page the way a teacher does: new rhythms, recalling a number, and downloading the PDF with no internet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openApp } from './helpers.mjs';

test('opens with no errors, and has no sound playback', async () => {
  const { browser, page, errors } = await openApp();
  try {
    assert.equal(await page.textContent('#gen'), 'New Rhythm');
    assert.equal(await page.locator('text=Play it').count(), 0);
    assert.equal(await page.evaluate(() => typeof AudioContext !== 'undefined' && !!window.__knock.schedule), false);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('New Rhythm and Recall a rhythm', async () => {
  const { browser, page, errors } = await openApp();
  try {
    const seen = new Set();
    for (let i = 0; i < 5; i++) { await page.click('#gen'); seen.add(await page.textContent('#codeOut')); }
    assert.ok(seen.size >= 4, 'New Rhythm should give new password numbers');
    const bars = () => page.evaluate(() => JSON.stringify(window.__knock.cur.bars.map((b) => b.map((c) => c.id))));
    await page.fill('#codeIn', '4821'); await page.click('#loadCode');
    const first = await bars();
    await page.click('#gen');
    await page.fill('#codeIn', '4821'); await page.click('#loadCode');
    assert.equal(await page.textContent('#codeOut'), '4821');
    assert.equal(await bars(), first);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('Download PDF works with no internet connection', async () => {
  const { browser, page, errors } = await openApp({ offline: true });
  try {
    for (const paper of ['a4p', 'ltl']) {
      await page.selectOption('#paper', paper);
      const [download] = await Promise.all([page.waitForEvent('download'), page.click('#pdf')]);
      assert.match(download.suggestedFilename(), /^rhythm-password-\d{4}\.pdf$/);
      const pdf = readFileSync(await download.path());
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
      assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length, 1, 'one page');
      assert.ok(pdf.length > 50_000);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
