import { join, parse, sep } from 'node:path';
import { resolveTemplateDir } from './resolve-template-dir';

const root = parse(process.cwd()).root;
const cwd = join(root, 'runtime');
const baseDir = join(root, 'deployment');

describe('resolveTemplateDir', () => {
  beforeEach(() => {
    jest.spyOn(process, 'cwd').mockReturnValue(cwd);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves relative template paths against an explicit base independent of cwd', () => {
    expect(resolveTemplateDir('templates', baseDir)).toBe(
      join(baseDir, 'templates'),
    );
  });

  it('falls back to cwd when the base is omitted', () => {
    expect(resolveTemplateDir('templates')).toBe(join(cwd, 'templates'));
  });

  it.each([undefined, ''])('falls back to cwd when the base is %p', (base) => {
    expect(resolveTemplateDir('templates', base)).toBe(join(cwd, 'templates'));
  });

  it.each([undefined, '', baseDir])(
    'preserves absolute paths verbatim with base %p',
    (base) => {
      const absoluteDir = `${baseDir}${sep}unused${sep}..${sep}templates${sep}`;

      expect(resolveTemplateDir(absoluteDir, base)).toBe(absoluteDir);
    },
  );

  it('normalizes dot segments in relative template paths', () => {
    expect(resolveTemplateDir('./assets/../templates', baseDir)).toBe(
      join(baseDir, 'templates'),
    );
  });

  it('resolves a relative base against cwd using Node path semantics', () => {
    // Node's path resolver uses the real process cwd, outside Jest's process mock.
    jest.restoreAllMocks();

    expect(resolveTemplateDir('templates', 'deployment')).toBe(
      join(process.cwd(), 'deployment', 'templates'),
    );
  });

  it('treats whitespace as a non-empty directory name', () => {
    jest.restoreAllMocks();

    expect(resolveTemplateDir('templates', ' ')).toBe(
      join(process.cwd(), ' ', 'templates'),
    );
  });
});
