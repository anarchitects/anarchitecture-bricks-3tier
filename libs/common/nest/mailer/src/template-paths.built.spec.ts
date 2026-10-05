import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

// Nx builds the package before this suite. The subprocess loads only its copied
// CommonJS entry point; NODE_PATH supplies installed peers without a registry install.
const workspaceRoot = resolve(__dirname, '../../../../..');
const builtPackage = join(workspaceRoot, 'dist/libs/common/nest/mailer');
const fixture = join(__dirname, '../tests/fixtures/mailer-consumer.cjs');

describe('built mailer consumer template paths', () => {
  let temporary: string;
  let consumer: string;
  let otherCwd: string;

  beforeEach(() => {
    temporary = realpathSync(mkdtempSync(join(tmpdir(), 'mailer-consumer-')));
    consumer = join(temporary, 'original-app');
    otherCwd = join(temporary, 'service-working-directory');
    mkdirSync(otherCwd);
    cpSync(builtPackage, packageDirectory(), { recursive: true });
    cpSync(fixture, join(consumer, 'main.cjs'));
    mkdirSync(join(consumer, 'templates'));
    writeFileSync(
      join(consumer, 'templates/hello.hbs'),
      '<p>Hello {{name}}</p>',
    );
  });

  afterEach(() => {
    rmSync(temporary, { recursive: true, force: true });
  });

  function packageDirectory() {
    return join(consumer, 'node_modules/@anarchitects/common-nest-mailer');
  }

  function runConsumer(
    cwd: string,
    options: {
      artifactBase?: boolean;
      templateDir?: string;
      emptyBase?: boolean;
    } = {},
  ) {
    const env = { ...process.env };
    for (const key of Object.keys(env)) {
      if (key.startsWith('MAILER_')) delete env[key];
    }
    // Nx can set conflicting color flags; keep subprocess diagnostics deterministic.
    delete env['FORCE_COLOR'];
    delete env['NO_COLOR'];
    env['NODE_PATH'] = join(workspaceRoot, 'node_modules');
    env['MAILER_TEMPLATE_DIR'] = options.templateDir ?? 'templates';
    if (options.emptyBase) env['MAILER_TEMPLATE_BASE_DIR'] = '';

    return spawnSync(
      process.execPath,
      [
        join(consumer, 'main.cjs'),
        options.artifactBase ? 'artifact-base' : 'cwd-base',
      ],
      { cwd, env, encoding: 'utf8', timeout: 15_000 },
    );
  }

  function expectSuccess(
    result: ReturnType<typeof runConsumer>,
    cwd: string,
    dir = join(consumer, 'templates'),
  ) {
    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      cwd,
      entry: join(packageDirectory(), 'src/index.js'),
      dir,
      html: expect.stringContaining('<p>Hello portable consumer</p>'),
    });
  }

  it.each([false, true])(
    'uses the real consumer cwd when the base is omitted or empty (empty=%s)',
    (emptyBase) => {
      expectSuccess(runConsumer(consumer, { emptyBase }), consumer);
    },
    30_000,
  );

  it('uses the application base when launched from a different cwd', () => {
    expectSuccess(runConsumer(otherCwd, { artifactBase: true }), otherCwd);
  }, 30_000);

  it('preserves an absolute template path from a different cwd', () => {
    mkdirSync(join(consumer, 'unused'));
    const templateDir = `${consumer}${sep}unused${sep}..${sep}templates${sep}`;

    expectSuccess(
      runConsumer(otherCwd, { templateDir }),
      otherCwd,
      templateDir,
    );
  }, 30_000);

  it('boots and renders after relocating the entire consumer artifact', () => {
    expectSuccess(runConsumer(otherCwd, { artifactBase: true }), otherCwd);

    const relocated = join(temporary, 'relocated-app');
    renameSync(consumer, relocated);
    consumer = relocated;

    expectSuccess(runConsumer(otherCwd, { artifactBase: true }), otherCwd);
  }, 30_000);

  it.each(['missing', 'file'])(
    'fails bootstrap for a %s template directory in the built consumer',
    (kind) => {
      const templateDir = 'invalid-templates';
      if (kind === 'file') writeFileSync(join(consumer, templateDir), 'file');

      const result = runConsumer(otherCwd, { artifactBase: true, templateDir });

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toBe(
        `Invalid mailer template directory "${join(consumer, templateDir)}": ${
          kind === 'file'
            ? 'path is not a directory.'
            : 'path does not exist or cannot be accessed.'
        }`,
      );
    },
    30_000,
  );
});
