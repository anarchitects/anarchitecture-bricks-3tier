import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const major = process.argv[2];
if (!['21', '22'].includes(major)) {
  throw new Error('Expected Angular major 21 or 22');
}

const tailwindRegistryVersion =
  process.env.ANARCHITECTS_TAILWIND_VERSION?.trim() || null;
if (
  tailwindRegistryVersion &&
  !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tailwindRegistryVersion)
) {
  throw new Error(
    `Invalid ANARCHITECTS_TAILWIND_VERSION "${tailwindRegistryVersion}"`,
  );
}

const root = process.cwd();
const temporaryRoot = mkdtempSync(
  join(tmpdir(), `anarchitects-angular-${major}-`),
);
const isolatedEnvironment = {
  ...process.env,
  npm_config_cache: join(temporaryRoot, 'npm-cache'),
};
const packageRoots = [
  ...(tailwindRegistryVersion ? [] : ['dist/libs/common/tailwind']),
  'dist/libs/common/angular/design',
  'dist/libs/common/angular/ui-composition',
  'dist/libs/common/angular/ui-layouts',
  'dist/libs/common/angular/ui-primitives',
  'dist/libs/forms/ts',
  'dist/libs/forms/angular',
  'dist/libs/auth/ts',
  'dist/libs/auth/angular',
];

function run(command, args, cwd = temporaryRoot) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: isolatedEnvironment,
  });
}

try {
  const localPackages = {};
  for (const relativeRoot of packageRoots) {
    const packageRoot = resolve(root, relativeRoot);
    const manifest = JSON.parse(
      readFileSync(join(packageRoot, 'package.json'), 'utf8'),
    );
    const angularPeer = manifest.peerDependencies?.['@angular/core'];
    const claimsMajor = !angularPeer || angularPeer.includes(`^${major}.`);
    console.log(
      `${claimsMajor ? 'SUPPORTED' : 'SKIPPED'} ${manifest.name}: ${angularPeer ?? 'framework-neutral'}`,
    );
    if (!claimsMajor) {
      continue;
    }
    const output = execFileSync(
      'npm',
      ['pack', packageRoot, '--pack-destination', temporaryRoot],
      {
        cwd: root,
        encoding: 'utf8',
        env: isolatedEnvironment,
      },
    )
      .trim()
      .split('\n')
      .at(-1);
    localPackages[manifest.name] = `file:${join(temporaryRoot, output)}`;
  }

  if (tailwindRegistryVersion) {
    console.log(
      `REGISTRY @anarchitects/tailwind@${tailwindRegistryVersion}: installed artifact`,
    );
  }

  const consumers = [
    localPackages['@anarchitects/forms-angular'] && 'forms-angular-example',
    localPackages['@anarchitects/auth-angular'] && 'auth-angular-example',
  ].filter(Boolean);

  const angularVersion = major === '21' ? '21.2.4' : '22.0.8';
  const buildVersion = major === '21' ? '21.2.4' : '22.0.9';
  const packageJson = {
    name: `anarchitects-angular-${major}-consumer`,
    private: true,
    scripts: {
      build: consumers.map((project) => `ng build ${project}`).join(' && '),
    },
    dependencies: {
      ...localPackages,
      ...(tailwindRegistryVersion
        ? { '@anarchitects/tailwind': tailwindRegistryVersion }
        : {}),
      '@angular/common': angularVersion,
      '@angular/compiler': angularVersion,
      '@angular/core': angularVersion,
      '@angular/forms': angularVersion,
      '@angular/platform-browser': angularVersion,
      '@angular/router': angularVersion,
      '@casl/ability': '^6.7.3',
      '@ngrx/operators': major === '21' ? '^21.1.0' : '^22.0.0',
      '@ngrx/signals': major === '21' ? '^21.1.0' : '^22.0.0',
      '@sinclair/typebox': '^0.34.41',
      'jwt-decode': '^4.0.0',
      rxjs: '~7.8.0',
      tailwindcss: '^4.3.3',
      tslib: '^2.3.0',
    },
    devDependencies: {
      '@angular/build': buildVersion,
      '@angular/cli': buildVersion,
      '@angular/compiler-cli': angularVersion,
      '@tailwindcss/postcss': '^4.3.3',
      postcss: '^8.4.5',
      typescript: major === '21' ? '5.9.3' : '6.0.3',
    },
  };
  writeFileSync(
    join(temporaryRoot, 'package.json'),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );

  for (const project of consumers) {
    cpSync(
      resolve(root, 'examples', project, 'src'),
      join(temporaryRoot, project, 'src'),
      {
        recursive: true,
        filter: (source) =>
          !source.includes('/contract/') &&
          !source.endsWith('.spec.ts') &&
          !source.endsWith('test-setup.ts'),
      },
    );
    cpSync(
      resolve(root, 'examples', project, 'public'),
      join(temporaryRoot, project, 'public'),
      { recursive: true },
    );
    cpSync(
      resolve(root, 'examples', project, '.postcssrc.json'),
      join(temporaryRoot, project, '.postcssrc.json'),
    );
    const consumerStylesPath = join(
      temporaryRoot,
      project,
      'src',
      'styles.css',
    );
    const consumerStyles = readFileSync(consumerStylesPath, 'utf8').replace(
      /(?:@source '\.\.\/\.\.\/\.\.\/libs\/(?:auth|forms)\/angular';\n)+/g,
      "@source '../../node_modules/@anarchitects';\n",
    );
    writeFileSync(consumerStylesPath, consumerStyles);
    writeFileSync(
      join(temporaryRoot, project, 'tsconfig.app.json'),
      `${JSON.stringify({ compilerOptions: { outDir: '../out-tsc', target: 'ES2022', module: 'preserve', moduleResolution: 'bundler', strict: true, experimentalDecorators: true, useDefineForClassFields: false, isolatedModules: true }, angularCompilerOptions: { strictInjectionParameters: true, strictInputAccessModifiers: true, strictTemplates: true }, files: ['src/main.ts'], include: ['src/**/*.d.ts'] }, null, 2)}\n`,
    );
  }

  const projects = Object.fromEntries(
    consumers.map((project) => [
      project,
      {
        projectType: 'application',
        root: project,
        sourceRoot: `${project}/src`,
        architect: {
          build: {
            builder: '@angular/build:application',
            options: {
              outputPath: `dist/${project}`,
              browser: `${project}/src/main.ts`,
              tsConfig: `${project}/tsconfig.app.json`,
              assets: [{ glob: '**/*', input: `${project}/public` }],
              styles: [`${project}/src/styles.css`],
            },
          },
        },
      },
    ]),
  );
  writeFileSync(
    join(temporaryRoot, 'angular.json'),
    `${JSON.stringify({ version: 1, newProjectRoot: 'projects', projects }, null, 2)}\n`,
  );

  run('npm', ['install', '--strict-peer-deps', '--ignore-scripts']);
  if (consumers.length > 0) {
    run('npm', ['run', 'build']);
  }
  console.log(`Angular ${major} packaged-consumer compatibility passed.`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
