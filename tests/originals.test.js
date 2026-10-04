import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const sources = JSON.parse(await readFile(new URL('../original-sources.json', import.meta.url), 'utf8'));
for (const [tool, source] of Object.entries(sources)) {
  test(`${tool}: HTML, styles, and calculations match the original archived project`, async () => {
    for (const [file, expected] of Object.entries(source.sha256)) {
      const bytes = await readFile(new URL(`../public/${tool}/${file}`, import.meta.url));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, `${tool}/${file} differs from the original`);
    }
  });
}
