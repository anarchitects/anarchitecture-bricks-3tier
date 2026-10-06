import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { ESLint } from 'eslint';

const root = resolve(import.meta.dirname, '../..');
const eslint = new ESLint({ cwd: root });

async function messages(file, code) {
  const [result] = await eslint.lintText(code, {
    filePath: resolve(root, file),
  });
  assert.ok(
    !result.messages.some(({ fatal }) => fatal),
    JSON.stringify(result.messages),
  );
  return result.messages.filter(
    ({ ruleId }) =>
      ruleId === 'newsletter/layers' ||
      ruleId === '@nx/enforce-module-boundaries',
  );
}

test('Newsletter rejects reversed layers, facade escapes and technology leaks', async () => {
  for (const [file, code] of [
    [
      'nest/src/application/use-case.ts',
      "import '../infrastructure-native/index';",
    ],
    [
      'nest/src/infrastructure-native/adapter.ts',
      "import '../infrastructure-mailerlite/index';",
    ],
    [
      'nest/src/infrastructure-native/adapter.ts',
      "import '../infrastructure-persistence/index';",
    ],
    [
      'nest/src/infrastructure-native/adapter.ts',
      "import '../presentation/index';",
    ],
    [
      'nest/src/application/use-case.ts',
      "import '@anarchitects/newsletter-nest/infrastructure-persistence';",
    ],
    [
      'nest/src/application/use-case.ts',
      "export * from '../presentation/index';",
    ],
    [
      'nest/src/application/use-case.ts',
      "import('@anarchitects/newsletter-nest');",
    ],
    [
      'nest/src/presentation/controller.ts',
      "import '../infrastructure-mailerlite/index';",
    ],
    [
      'nest/src/infrastructure-persistence/repository.ts',
      "import '../presentation/index';",
    ],
    [
      'angular/feature/src/feature.ts',
      "import '@anarchitects/newsletter-angular/data-access';",
    ],
    ['angular/state/src/store.ts', "export * from '../../feature/src/index';"],
    [
      'angular/ui/src/ui.ts',
      "import('@anarchitects/newsletter-angular/state');",
    ],
    ['angular/data-access/src/api.ts', "import '../../state/src/index';"],
    ['angular/config/src/config.ts', "import '../../state/src/index';"],
    [
      'angular/ui/src/ui.ts',
      "import '@anarchitects/newsletter-nest/application';",
    ],
    ['ts/src/model.ts', "import '@angular/core';"],
    ['ts/src/model.ts', "import 'typeorm';"],
    ['nest/src/application/use-case.ts', "import '@anarchitects/blog-ts';"],
    ['nest/src/application/use-case.ts', "import '@anarchitects/auth-nest';"],
  ]) {
    const found = await messages(`libs/newsletter/${file}`, code);
    assert.ok(found.length > 0, `${file}: expected rejection for ${code}`);
  }
});

test('Newsletter permits intended layer direction and root composition', async () => {
  for (const [file, code] of [
    [
      'nest/src/infrastructure-native/adapter.ts',
      "import '../application/index';",
    ],
    ['nest/src/infrastructure-native/adapter.ts', "import '../config/index';"],
    [
      'nest/src/application/use-case.ts',
      "import '@anarchitects/newsletter-ts';",
    ],
    ['nest/src/presentation/controller.ts', "import '../application/index';"],
    [
      'nest/src/infrastructure-mailerlite/adapter.ts',
      "import '../application/index';",
    ],
    ['nest/src/index.ts', "export * from './infrastructure-mailerlite/index';"],
    [
      'angular/feature/src/feature.ts',
      "import '@anarchitects/newsletter-angular/state';",
    ],
    [
      'angular/state/src/store.ts',
      "import '@anarchitects/newsletter-angular/data-access';",
    ],
    [
      'angular/ui/src/ui.ts',
      "import '@anarchitects/newsletter-angular/config';",
    ],
    ['angular/data-access/src/api.ts', "import '@anarchitects/newsletter-ts';"],
  ]) {
    assert.deepEqual(
      await messages(`libs/newsletter/${file}`, code),
      [],
      `${file}: ${code}`,
    );
  }
});

test('Existing domains and Common cannot import Newsletter', async () => {
  for (const file of [
    'libs/forms/ts/src/newsletter.ts',
    'libs/auth/ts/src/newsletter.ts',
    'libs/identity/ts/src/newsletter.ts',
    'libs/common/nest/mailer/src/newsletter.ts',
  ]) {
    const source = file;
    assert.ok(
      (await messages(source, "import '@anarchitects/newsletter-ts';")).length >
        0,
      source,
    );
  }
});

test('Newsletter reuses only the Forms renderer and its UI contract types', async () => {
  for (const entry of [
    'forms-angular/ui',
    'forms-ts/models',
    'forms-ts/dtos',
  ]) {
    assert.deepEqual(
      await messages(
        'libs/newsletter/angular/ui/src/ui.ts',
        `import '@anarchitects/${entry}';`,
      ),
      [],
    );
  }
  for (const [file, entry] of [
    ['angular/feature/src/feature.ts', '@anarchitects/forms-angular/ui'],
    ['angular/state/src/store.ts', '@anarchitects/forms-angular/state'],
    ['angular/ui/src/ui.ts', '@anarchitects/forms-angular'],
    ['angular/ui/src/ui.ts', '@anarchitects/forms-angular/data-access'],
    ['angular/ui/src/ui.ts', '@anarchitects/forms-angular/ui/src/form'],
    ['angular/ui/src/ui.ts', '../../../../forms/angular/ui/src/index'],
    ['ts/src/model.ts', '@anarchitects/forms-ts/models'],
    ['nest/src/application/service.ts', '@anarchitects/forms-nest'],
  ]) {
    assert.ok(
      (await messages(`libs/newsletter/${file}`, `import '${entry}';`)).length >
        0,
      `${file}: ${entry}`,
    );
  }
});
