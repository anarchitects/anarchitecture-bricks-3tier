import { deepStrictEqual } from 'node:assert';
import { readFileSync } from 'node:fs';

for (const file of ['legacy-inventory.json', 'validation-probes.json']) {
  const actual = JSON.parse(readFileSync(`dist/api-audit/${file}`, 'utf8'));
  const expected = JSON.parse(
    readFileSync(`docs/audits/487-legacy-api/${file}`, 'utf8'),
  );
  // Node versions are provenance, not wire semantics. Dependency versions
  // and every observed input, status and response must still match exactly.
  if (file === 'validation-probes.json') {
    delete actual.versions.node;
    delete expected.versions.node;
  }
  deepStrictEqual(actual, expected, `${file}: frozen legacy evidence differs`);
}
console.log('Frozen legacy inventory and validation observations match.');
