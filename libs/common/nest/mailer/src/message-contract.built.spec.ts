import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import ts from 'typescript';

describe('built Common Mailer declarations', () => {
  it('supports a strict consumer without workspace aliases or skipLibCheck', () => {
    const root = resolve(__dirname, '../../../../..');
    const temporary = mkdtempSync(join(tmpdir(), 'common-mailer-types-'));
    try {
      mkdirSync(join(temporary, 'node_modules/@anarchitects'), {
        recursive: true,
      });
      cpSync(
        join(root, 'dist/libs/common/nest/mailer'),
        join(temporary, 'node_modules/@anarchitects/common-nest-mailer'),
        { recursive: true },
      );
      for (const dependency of [
        '@nestjs',
        '@nestjs-modules',
        '@types',
        'rxjs',
        'reflect-metadata',
        'tslib',
      ]) {
        symlinkSync(
          join(root, 'node_modules', dependency),
          join(temporary, 'node_modules', dependency),
          'junction',
        );
      }
      const consumer = join(temporary, 'consumer.cts');
      writeFileSync(
        consumer,
        `
        import {MailerPort, type MailerMessage, NoopMailerAdapter, NodeMailerAdapter} from '@anarchitects/common-nest-mailer';
        const message: MailerMessage = {to:'reader@example.test',subject:'Subject',html:'<p>Hello</p>',text:'Hello',from:'sender@example.test',replyTo:'help@example.test',headers:{'X-Example':'value'}};
        const noop: MailerPort = new NoopMailerAdapter();
        const result: Promise<void> = noop.sendMessage(message);
        const textOnly: MailerMessage = {to:'reader@example.test',subject:'Subject',text:'Hello'};
        const htmlOnly: MailerMessage = {to:'reader@example.test',subject:'Subject',html:'<p>Hello</p>'};
        // @ts-expect-error A rendered message needs at least one body alternative.
        const noBody: MailerMessage = {to:'reader@example.test',subject:'Subject'};
        void [NodeMailerAdapter,result,textOnly,htmlOnly,noBody];
      `,
      );
      const program = ts.createProgram([consumer], {
        strict: true,
        noEmit: true,
        module: ts.ModuleKind.Node16,
        moduleResolution: ts.ModuleResolutionKind.Node16,
        target: ts.ScriptTarget.ES2022,
        types: ['node'],
        typeRoots: [join(temporary, 'node_modules/@types')],
      });
      const diagnostics = ts.getPreEmitDiagnostics(program);
      expect(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCanonicalFileName: (value) => value,
          getCurrentDirectory: () => temporary,
          getNewLine: () => '\n',
        }),
      ).toBe('');
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });
});
