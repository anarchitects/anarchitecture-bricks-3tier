import test from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = join(__dirname, '../../');

const lintText = async (filePath, source) => {
  const eslint = new ESLint({ cwd: workspaceRoot });
  const [result] = await eslint.lintText(source, {
    filePath: join(workspaceRoot, filePath),
  });

  return result.messages.map((message) => ({
    ruleId: message.ruleId,
    message: message.message,
  }));
};

test('guardrail: forms Nest controllers may use auth declaration decorators', async () => {
  const messages = await lintText(
    'libs/forms/nest/src/presentation/controllers/auth-aware.controller.ts',
    `
      import { Controller, Get, Patch } from '@nestjs/common';
      import {
        AuthorizeResource,
        Policies,
        Public,
      } from '@anarchitects/auth-declarations';

      @Controller('forms-security-smoke')
      export class AuthAwareController {
        @Get('health')
        @Public()
        health() {
          return true;
        }

        @Patch(':formId')
        @Policies({ action: 'update', subject: 'Form' })
        @AuthorizeResource({
          action: 'update',
          subject: 'Form',
          idParam: 'formId',
        })
        update() {
          return true;
        }
      }
    `,
  );

  assert.deepEqual(
    messages,
    [],
    `Expected auth declaration imports to be allowed in Nest controllers, but found: ${JSON.stringify(messages, null, 2)}`,
  );
});

test('guardrail: Nest controllers may not compose auth runtime guards or modules', async () => {
  const messages = await lintText(
    'libs/forms/nest/src/presentation/controllers/runtime-import.controller.ts',
    `
      import { Controller } from '@nestjs/common';
      import { AuthModule, provideAuthRuntimeGuards } from '@anarchitects/auth-nest';

      @Controller('runtime-import')
      export class RuntimeImportController {
        runtime = [AuthModule, provideAuthRuntimeGuards];
      }
    `,
  );

  assert.ok(
    messages.some((message) => message.ruleId === 'no-restricted-imports'),
    `Expected controller runtime imports to be rejected, but found: ${JSON.stringify(messages, null, 2)}`,
  );
});

test('guardrail: Angular feature code may not import auth-nest runtime APIs', async () => {
  const messages = await lintText(
    'libs/forms/angular/feature/src/runtime-import.ts',
    `
      import { AuthModule } from '@anarchitects/auth-nest';

      export const runtime = AuthModule;
    `,
  );

  assert.ok(
    messages.some((message) => message.ruleId === 'no-restricted-imports'),
    `Expected Angular feature runtime imports to be rejected, but found: ${JSON.stringify(messages, null, 2)}`,
  );
});
