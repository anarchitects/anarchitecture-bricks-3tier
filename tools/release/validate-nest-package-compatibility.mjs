import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  nestPackages,
  validateNestPackageContract,
} from './nest-package-contract.mjs';

export function validatePackedNestPackages(projects = nestPackages) {
  const root = resolve(import.meta.dirname, '../..');
  const temporary = mkdtempSync(join(tmpdir(), 'nest-package-validation-'));
  const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
  try {
    for (const project of projects) {
      const source = readJson(join(root, project.root, 'package.json'));
      const builtRoot = join(root, 'dist', project.root);
      const built = readJson(join(builtRoot, 'package.json'));
      const [pack] = JSON.parse(
        execFileSync(
          'npm',
          [
            'pack',
            builtRoot,
            '--pack-destination',
            temporary,
            '--json',
            '--ignore-scripts',
            '--cache',
            join(temporary, 'npm-cache'),
          ],
          { encoding: 'utf8' },
        ),
      );
      const packed = JSON.parse(
        execFileSync(
          'tar',
          ['-xOf', join(temporary, pack.filename), 'package/package.json'],
          { encoding: 'utf8' },
        ),
      );
      validateNestPackageContract(
        project,
        source,
        built,
        packed,
        pack.files.map((file) => file.path),
      );
      console.log(
        `${project.name}: source, dist, packed contract and exported files passed.`,
      );
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (process.argv.length !== 2) throw new Error('Expected no arguments');
  validatePackedNestPackages();
}
