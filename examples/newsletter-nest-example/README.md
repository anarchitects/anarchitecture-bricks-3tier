# Newsletter Nest example

Fastify host for `@anarchitects/newsletter-nest`, with native and MailerLite provider modes, PostgreSQL consent storage, optional signed webhooks, and a shared Common Mailer SMTP transport for native mail.

See [Newsletter integration](../../docs/guides/newsletter-integration.md) for configuration and startup commands. The host listens on `127.0.0.1:3333`, prefixes API routes with `/api`, and enables `rawBody: true`. `RUN_MIGRATIONS=true` explicitly runs the supplied migrations for local development.

`yarn nx run newsletter-nest-example:contract-test` builds both examples and runs the browser-to-database regression. Docker and Playwright Chromium are required. It captures mail and provider HTTP calls locally; no provider credentials or external SMTP are used. `createNewsletterApp` is the same host composition used by startup and the regression.

This is an example application, excluded from package publication. Replace demonstration policy and configure production edge controls before deployment.
