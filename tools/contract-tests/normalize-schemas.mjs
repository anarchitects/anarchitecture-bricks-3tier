import { readdirSync, renameSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = join(__dirname, '..', '..');
const contractsDir = join(workspaceRoot, 'contracts');

const entries = readdirSync(contractsDir, { withFileTypes: true });

for (const entry of entries) {
  if (!entry.isFile()) {
    continue;
  }

  if (!entry.name.includes('\\')) {
    continue;
  }

  const segments = entry.name.split('\\');
  const [first, ...rest] = segments;
  if (!first) {
    continue;
  }
  const destinationDir = join(contractsDir, first);
  mkdirSync(destinationDir, { recursive: true });
  const destinationPath = join(destinationDir, ...rest);
  renameSync(join(contractsDir, entry.name), destinationPath);
}
