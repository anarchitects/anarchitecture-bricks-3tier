import 'reflect-metadata';
import { Module, type DynamicModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NewsletterModule } from '@anarchitects/newsletter-nest';
import type { NewsletterModuleOptions } from '@anarchitects/newsletter-nest/config';
import { MailerPort } from '@anarchitects/common-nest-mailer';
import { DataSource } from 'typeorm';

export const exampleConsent = {
  version: 'example/v1',
  text: 'I agree to receive the example newsletter. I can unsubscribe at any time.',
};

@Module({})
class HostDependenciesModule {}
@Module({})
class ExampleModule {}

/** The host owns the initialized database, transport, policy and deployment limits. */
export async function createNewsletterApp(options: {
  dataSource: DataSource;
  subscriber: NewsletterModuleOptions['subscriber'];
  mailerModule?: DynamicModule;
  webhook?: NewsletterModuleOptions['webhook'];
  rateLimit?: NewsletterModuleOptions['rateLimit'];
}): Promise<NestFastifyApplication> {
  const dependencies: DynamicModule = {
    module: HostDependenciesModule,
    imports: options.mailerModule ? [options.mailerModule] : [],
    providers: [{ provide: DataSource, useValue: options.dataSource }],
    exports: [
      DataSource,
      ...(options.mailerModule ? [options.mailerModule] : []),
    ],
  };
  const app = await NestFactory.create<NestFastifyApplication>(
    {
      module: ExampleModule,
      imports: [
        NewsletterModule.forRoot({
          imports: [dependencies],
          consent: exampleConsent,
          persistence: { mode: 'typeorm', dataSourceToken: DataSource },
          subscriber: options.subscriber,
          ...(options.mailerModule
            ? { mailer: { useExisting: MailerPort } }
            : {}),
          webhook: options.webhook,
          presentation: { resolveClientKey: (request) => request.ip },
          rateLimit: options.rateLimit ?? {
            mode: 'memory',
            limit: 10,
            windowMs: 60_000,
          },
        }),
      ],
    },
    new FastifyAdapter({ logger: false }),
    {
      rawBody: true,
      logger: false,
      abortOnError: false,
    },
  );
  app.setGlobalPrefix('api');
  // Tokens and email addresses must not enter access logs or referrers.
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', async (_request, reply, payload) => {
      reply.header('Cache-Control', 'no-store');
      reply.header('Referrer-Policy', 'no-referrer');
      return payload;
    });
  await app.init();
  return app;
}
