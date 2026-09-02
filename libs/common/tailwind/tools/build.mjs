import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = resolve(projectRoot, '../../..');
const outputRoot = join(workspaceRoot, 'dist', 'libs', 'common', 'tailwind');
const files = ['index.css', 'theme.css', 'base.css', 'utilities.css'];

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });

for (const file of files) {
  copyFileSync(join(projectRoot, 'src', file), join(outputRoot, file));
}

copyFileSync(join(projectRoot, 'README.md'), join(outputRoot, 'README.md'));

const packageJson = JSON.parse(
  readFileSync(join(projectRoot, 'package.json'), 'utf8'),
);
writeFileSync(
  join(outputRoot, 'package.json'),
  `${JSON.stringify(packageJson, null, 2)}\n`,
);
