const { NestFactory } = require('@nestjs/core');
const { MAILER_OPTIONS, MailerService } = require('@nestjs-modules/mailer');
const { CommonMailerModule } = require('@anarchitects/common-nest-mailer');

// The consumer owns its deployment base; moving the artifact requires no path edits.
if (process.argv[2] === 'artifact-base') {
  process.env.MAILER_TEMPLATE_BASE_DIR = __dirname;
}

async function main() {
  const app = await NestFactory.createApplicationContext(
    CommonMailerModule.forRootFromConfig(),
    { logger: false, abortOnError: false },
  );
  try {
    const options = app.get(MAILER_OPTIONS);
    const mailer = app.get(MailerService);
    // Render through the real adapter, using an in-memory transport only.
    mailer.addTransporter('fixture', { jsonTransport: true });
    const result = await mailer.sendMail({
      transporterName: 'fixture',
      from: 'sender@example.test',
      to: 'recipient@example.test',
      subject: 'Template path regression',
      template: 'hello',
      context: { name: 'portable consumer' },
    });
    process.stdout.write(
      JSON.stringify({
        cwd: process.cwd(),
        entry: require.resolve('@anarchitects/common-nest-mailer'),
        dir: options.template.dir,
        html: JSON.parse(result.message.toString()).html,
      }),
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  process.stderr.write(error.message);
  process.exitCode = 1;
});
