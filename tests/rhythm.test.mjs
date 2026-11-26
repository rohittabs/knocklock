// Checks the rhythm generator against the notation rules, for every time signature and many note choices.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

test('every generated rhythm fills its bars and follows the engraving rules', async () => {
  const { browser, page, errors } = await openApp();
  try {
    const r = await page.evaluate(() => {
      const problems = [];
      const K = window.__knock, VF = K.VF, ids = K.CELLS.map((c) => c.id), BY = Object.fromEntries(K.CELLS.map((c) => [c.id, c]));
      // each cell's notes add up to its length
      K.CELLS.forEach((c) => { if (c.id !== 'wr') { const t = c.n.reduce((a, x) => a + K.noteTicks(c, x), 0); if (Math.abs(t - c.len) > 1e-9) problems.push('cell length ' + c.id); } });
      const feasible = (sel, m) => { const memo = {}; const go = (gi) => { if (gi === m.groups.length) return true; if (gi in memo) return memo[gi]; let ok = false; for (const id of sel) { const n = K.placeSpan(BY[id], gi, m); if (n && go(gi + n)) { ok = true; break; } } return (memo[gi] = ok); }; return go(0); };
      const subsets = Object.values(K.PRESETS).map((p) => p.filter((i) => i !== 'tie'));
      for (const id of ids) subsets.push([id]);
      let s = 12345; const R = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
      for (let i = 0; i < 300; i++) subsets.push(ids.filter(() => R() < 0.3));
      const RES = VF.RESOLUTION, off = document.createElement('canvas');
      let checked = 0, drawn = 0;
      for (const sel of subsets) for (const ts of Object.keys(K.METERS)) for (const seed of [1000, 4821, 9999]) for (const ties of [false, true]) {
        const m = K.METERS[ts], res = K.makeRhythm(sel, ts, seed, { ties });
        const usable = sel.filter((id) => m.groups.some((g, gi) => K.placeSpan(BY[id], gi, m)));
        const feas = usable.some((id) => !BY[id].n.every((x) => x.r)) && feasible(usable, m);
        if (res.err) { if (feas) problems.push('refused a possible rhythm ' + ts + ' ' + sel); continue; }
        if (!feas) problems.push('made an impossible rhythm ' + ts + ' ' + sel);
        checked++;
        if (res.bars.length !== 4) problems.push('not 4 bars');
        res.bars.forEach((bar) => {
          let gi = 0;
          bar.forEach((c) => { if (!sel.includes(c.id)) problems.push('note value not chosen ' + c.id); const n = K.placeSpan(c, gi, m); if (!n) problems.push('misplaced ' + c.id + ' ' + ts); gi += n; });
          if (gi !== m.groups.length) problems.push('bar does not fill ' + ts);
          let t = 0; bar.forEach((c) => { if (c.id === 'wr') { t += (RES * m.num) / m.den; return; } K.buildNotes(c, null).notes.forEach((n) => (t += n.getTicks().value())); });
          if (Math.abs(t - (RES * m.num) / m.den) > 1) problems.push('notation length ' + ts + ' ' + bar.map((c) => c.id));
          const starts = [0]; m.groups.forEach((g) => starts.push(starts[starts.length - 1] + g));
          let pos = 0; bar.forEach((c) => { if (c.b && c.len <= 36 && !starts.includes(pos)) problems.push('beam starts off the beat ' + c.id); pos += c.id === 'wr' ? m.len : c.len; });
        });
        const ev = K.eventsOf({ bars: res.bars, ties: res.ties });
        if (!ties && res.ties.size) problems.push('ties when ties are off');
        ev.forEach((e, i) => { if (res.ties.has(e.bi + ':' + e.k)) { const nx = ev[i + 1]; if (!nx || e.x.r || nx.x.r) problems.push('tie to or from a rest'); } });
        if (drawn < 200) {
          try {
            K.drawPoster(off, null, { seed, ts, feel: ['straight', 's8', 's16'][drawn % 3], bars: res.bars, ties: res.ties, themeKey: ['mono', 'navy', 'gold', 'burgundy', 'forest'][drawn % 5], paper: ['a4p', 'a4l', 'ltp', 'ltl'][drawn % 4], syl: ['none', 'count'][drawn % 2], title: 'Rhythm Password', penalty: 'A penalty', room: '' });
            drawn++;
          } catch (e) { problems.push('drawing failed ' + e.message + ' ' + ts); }
        }
      }
      return { checked, drawn, problems: [...new Set(problems)].slice(0, 20) };
    });
    assert.deepEqual(r.problems, []);
    assert.ok(r.checked > 5000, `only ${r.checked} rhythms checked`);
    assert.equal(r.drawn, 200);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('the same password number gives the same rhythm', async () => {
  const { browser, page } = await openApp();
  try {
    const same = await page.evaluate(() => {
      const K = window.__knock, ids = K.PRESETS.hard.filter((i) => i !== 'tie');
      return ['4/4', '6/8', '7/8', '12/8'].every((ts) => {
        const a = K.makeRhythm(ids, ts, 4821, { ties: true }), b = K.makeRhythm(ids, ts, 4821, { ties: true });
        return JSON.stringify(a.bars.map((x) => x.map((c) => c.id))) === JSON.stringify(b.bars.map((x) => x.map((c) => c.id))) && [...a.ties].join() === [...b.ties].join();
      });
    });
    assert.ok(same);
  } finally { await browser.close(); }
});

test('counting and swing', async () => {
  const { browser, page } = await openApp();
  try {
    const r = await page.evaluate(() => {
      const K = window.__knock;
      return { s8: [0, 6, 12, 18].map((p) => K.swingPos(p, 's8', 0)), s16: [0, 6, 12].map((p) => K.swingPos(p, 's16', 0)) };
    });
    assert.deepEqual(r.s8.slice(0, 3), [0, r.s8[1], 16]); // the + of the beat lands two thirds of the way through
    assert.deepEqual(r.s16, [0, 8, 12]);
  } finally { await browser.close(); }
});
