import 'reflect-metadata';
import { CommonMailerModule } from '@anarchitects/common-nest-mailer';
import { createNewsletterApp } from './app/create-app';
import { createNewsletterDataSource } from './app/data-source';

function required(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing host configuration: ${name}`);
  return value;
}
async function bootstrap() {
  const provider = process.env['NEWSLETTER_PROVIDER'] ?? 'native';
  if (provider !== 'native' && provider !== 'mailerlite')
    throw new Error('Unsupported NEWSLETTER_PROVIDER');
  const subscriber =
    provider === 'native'
      ? {
          mode: 'native' as const,
          options: { scope: 'example-newsletter' },
          mail: {
            publicationName: 'Example newsletter',
            confirmationUrl: required('NEWSLETTER_CONFIRMATION_URL'),
            unsubscribeUrl: required('NEWSLETTER_UNSUBSCRIBE_URL'),
            message: { from: required('MAIL_FROM') },
          },
        }
      : {
          mode: 'mailerlite' as const,
          options: {
            apiKey: required('MAILERLITE_API_KEY'),
            groupId: required('MAILERLITE_GROUP_ID'),
          },
        };
  const webhook =
    provider === 'mailerlite'
      ? {
          accountId: required('MAILERLITE_ACCOUNT_ID'),
          webhookSecret: required('MAILERLITE_WEBHOOK_SECRET'),
        }
      : false;
  // Configure the shared SMTP transport once, at the application root.
  const smtpUrl = provider === 'native' ? required('SMTP_URL') : undefined;
  const mailerModule = smtpUrl
    ? {
        ...CommonMailerModule.forRoot({ provider: 'node' }),
        imports: [
          CommonMailerModule.forRootAsync({
            useFactory: () => ({ transport: smtpUrl }),
          }),
        ],
      }
    : undefined;
  const dataSource = await createNewsletterDataSource(
    required('DATABASE_URL'),
  ).initialize();
  try {
    // An explicit development convenience; production migrations belong to deployment tooling.
    if (process.env['RUN_MIGRATIONS'] === 'true')
      await dataSource.runMigrations({ transaction: 'all' });
    const app = await createNewsletterApp({
      dataSource,
      subscriber,
      mailerModule,
      webhook,
    });
    let closing = false;
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
      process.once(signal, () => {
        if (closing) return;
        closing = true;
        void app
          .close()
          .finally(() => dataSource.destroy())
          .catch(() => {
            process.exitCode = 1;
          });
      });
    }
    await app.listen(Number(process.env['PORT'] ?? 3333), '127.0.0.1');
    console.log(`Newsletter example listening on ${await app.getUrl()}/api`);
  } catch (error) {
    await dataSource.destroy();
    throw error;
  }
}
void bootstrap().catch(() => {
  console.error(
    'Newsletter example startup failed. Check host configuration and database connectivity.',
  );
  process.exitCode = 1;
});
