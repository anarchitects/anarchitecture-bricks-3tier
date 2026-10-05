import 'reflect-metadata';
import { mkdtemp, mkdir, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Module, { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { GenericContainer, Wait } from 'testcontainers';

const root = fileURLToPath(new URL('../../', import.meta.url));

/** Public package consumer with real migrations/adapter/verifier; owned by the browser-test fixture. */
export async function startPasskeyContractHost() {
  const temporary = await mkdtemp(path.join(tmpdir(), 'passkey-contract-'));
  const modules = path.join(temporary, 'node_modules');
  const scope = path.join(modules, '@anarchitects');
  const previousNodePath = process.env.NODE_PATH;
  let container;
  let app;
  const close = async () => {
    try {
      await app?.close();
    } finally {
      try {
        await container?.stop();
      } finally {
        if (previousNodePath === undefined) delete process.env.NODE_PATH;
        else process.env.NODE_PATH = previousNodePath;
        Module._initPaths();
        await rm(temporary, { recursive: true, force: true });
      }
    }
  };
  try {
    await mkdir(scope, { recursive: true });
    for (const [name, folder] of [
      ['auth-nest', 'auth/nest'],
      ['auth-ts', 'auth/ts'],
      ['auth-declarations', 'auth/declarations'],
      ['common-nest-mailer', 'common/nest/mailer'],
    ])
      await symlink(
        path.join(root, 'dist/libs', folder),
        path.join(scope, name),
        'junction',
      );
    process.env.NODE_PATH = [modules, previousNodePath]
      .filter(Boolean)
      .join(path.delimiter);
    Module._initPaths();
    const require = createRequire(import.meta.url);
    const { AuthModule } = require('@anarchitects/auth-nest');
    const {
      CreateAuthSchema1720200000000,
      CreateBetterAuthPasskeysTable1760200001000,
      AddBetterAuthAccountIssuer1788275931000,
      ExpandPasskeyCredentialStorage1790899200000,
    } = require('@anarchitects/auth-nest/infrastructure-persistence');
    console.info('Passkey contract: starting disposable PostgreSQL.');
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_DB: 'passkey_contract',
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(
        Wait.forLogMessage(/database system is ready to accept connections/, 2),
      )
      .start();
    console.info(
      'Passkey contract: PostgreSQL ready; composing the public auth facade.',
    );
    const port = Number(process.env.PASSKEY_CONTRACT_PORT ?? 4318);
    const origin = `http://localhost:${port}`;
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getMappedPort(5432),
          username: 'postgres',
          password: 'postgres',
          database: 'passkey_contract',
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: true,
          migrations: [
            CreateAuthSchema1720200000000,
            CreateBetterAuthPasskeysTable1760200001000,
            AddBetterAuthAccountIssuer1788275931000,
            ExpandPasskeyCredentialStorage1790899200000,
          ],
        }),
        AuthModule.forRoot({
          mailer: { provider: 'noop' },
          presentation: {
            application: {
              betterAuth: {
                baseUrl: `${origin}/api/auth`,
                secret: 'passkey-contract-only-secret-at-least-32-characters',
                callbackUrls: {
                  verifyEmail: `${origin}/verify-email`,
                  resetPassword: `${origin}/reset-password`,
                },
              },
              encryption: {
                algorithm: 'bcrypt',
                key: 'passkey-contract-encryption',
              },
              plugins: {
                passkeys: {
                  enabled: true,
                  rpID: 'localhost',
                  rpName: 'Passkey contract',
                  origin,
                },
              },
            },
          },
        }),
      ],
    }).compile();
    app = module.createNestApplication(new FastifyAdapter({ logger: false }));
    app.useLogger(false);
    app.setGlobalPrefix('api');
    // Serve the production-built consumer from the same origin as the API.
    const browserRoot = path.join(
      root,
      'dist/examples/auth-angular-example/browser',
    );
    const mime = {
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.ico': 'image/x-icon',
    };
    app
      .getHttpAdapter()
      .getInstance()
      .get('/*', async (request, reply) => {
        const pathname = new URL(request.url, origin).pathname;
        if (pathname.startsWith('/api/')) return reply.code(404).send();
        const filename = path.resolve(
          browserRoot,
          `.${decodeURIComponent(pathname)}`,
        );
        if (
          !filename.startsWith(`${browserRoot}${path.sep}`) &&
          filename !== browserRoot
        )
          return reply.code(404).send();
        const extension = path.extname(filename);
        const target = extension
          ? filename
          : path.join(browserRoot, 'index.html');
        try {
          return reply
            .type(mime[path.extname(target)] ?? 'application/octet-stream')
            .send(await readFile(target));
        } catch {
          return reply.code(404).send();
        }
      });
    await app.listen(port, '127.0.0.1');
    console.info(`Passkey contract: host ready at ${origin}.`);
    return { origin, close };
  } catch (error) {
    await close();
    throw error;
  }
}
