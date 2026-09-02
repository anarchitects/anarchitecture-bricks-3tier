import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const cliPackageRoot = dirname(
  require.resolve('@tailwindcss/cli/package.json'),
);
const cliPath = join(cliPackageRoot, 'dist', 'index.mjs');

function compileFixture(name: 'easy' | 'advanced'): string {
  const outputDirectory = mkdtempSync(
    join(tmpdir(), `anarchitects-tailwind-${name}-`),
  );
  const outputPath = join(outputDirectory, 'output.css');

  try {
    execFileSync(
      process.execPath,
      [
        cliPath,
        '-i',
        join(projectRoot, 'tests', 'fixtures', `${name}.css`),
        '-o',
        outputPath,
        '--minify',
      ],
      {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      },
    );

    return readFileSync(outputPath, 'utf8');
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true });
  }
}

describe('@anarchitects/tailwind', () => {
  it('compiles the aggregate easy-mode entry point', () => {
    const css = compileFixture('easy');

    expect(css).toContain('.anx-stack');
    expect(css).toContain('.anx-control');
    expect(css).toContain('.anx-surface');
    expect(css).toContain('.bg-anx-accent');
    expect(css).toContain('.text-anx-on-accent');
    expect(css).toContain('[data-theme=dark]');
    expect(css).toContain('[data-density=compact]');
  });

  it('compiles advanced entry points and consumer token overrides', () => {
    const css = compileFixture('advanced');

    expect(css).toContain('.anx-cluster');
    expect(css).toContain('.anx-focus-ring');
    expect(css).toContain('.bg-anx-accent');
    expect(css).toContain('--color-anx-accent:oklch(72% .18 145)');
  });
});
