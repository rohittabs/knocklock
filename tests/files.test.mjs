// Checks that every file the website and the offline app refer to is in the repository,
// and that index.html was rebuilt after the last change to src/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { root } from './helpers.mjs';

const read = (p) => readFileSync(path.join(root, p), 'utf8');

test('every file the offline app saves exists', () => {
  const core = [...read('sw.js').matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1]).filter((f) => f !== './');
  assert.ok(core.length > 10);
  for (const f of core) assert.ok(existsSync(path.join(root, f)), f);
});

test('every picture, icon and font the pages use exists', () => {
  const refs = [];
  for (const page of ['about.html', 'tools/social-preview.html']) {
    const dir = path.dirname(page);
    for (const m of read(page).matchAll(/(?:src|href)="([^"#:]+)"|url\(([^)]+)\)/g)) {
      const ref = m[1] || m[2];
      if (ref && ref !== './') refs.push(path.join(dir, ref.replace(/['"]/g, '')));
    }
  }
  for (const icon of JSON.parse(read('manifest.webmanifest')).icons) refs.push(icon.src);
  assert.ok(refs.length > 10);
  for (const r of refs) assert.ok(existsSync(path.join(root, r)), r);
});

test('index.html is up to date with src/app.html', { skip: !existsSync(path.join(root, 'node_modules/vexflow')) && 'run npm install first' }, () => {
  const before = read('index.html');
  execFileSync('python3', ['build.py'], { cwd: root });
  assert.ok(read('index.html') === before, 'index.html changed: run python3 build.py and commit it');
});
