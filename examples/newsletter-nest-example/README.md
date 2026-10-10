# Newsletter Nest example

Fastify host for `@anarchitects/newsletter-nest`, with native and MailerLite provider modes, PostgreSQL consent storage, optional signed webhooks, and a shared Common Mailer SMTP transport for native mail.

See [Newsletter integration](../../docs/guides/newsletter-integration.md) for configuration and startup commands. The host listens on `127.0.0.1:3333`, prefixes API routes with `/api`, and enables `rawBody: true`. `RUN_MIGRATIONS=true` explicitly runs the supplied migrations for local development.

`yarn nx run newsletter-nest-example:contract-test` builds both examples and runs the browser-to-database regression. Docker and Playwright Chromium are required. It captures mail and provider HTTP calls locally; no provider credentials or external SMTP are used. `createNewsletterApp` is the same host composition used by startup and the regression.

This is an example application, excluded from package publication. Replace demonstration policy and configure production edge controls before deployment.

## Nest 11/12 verification (#467)

The normal workspace build/serve/browser contract targets use the locked Nest 11 toolchain. `newsletter-nest:test-nest-compatibility` copies this example's actual `src` files into isolated strict NodeNext consumers and boots `createNewsletterApp` against packed packages on Nest 11.1.6 (Config 4.0.2 or 12.0.1) and Nest 12.1.2 (Config 12.0.1). Run its `nest11`, `nest11-modern` and `nest12` configurations for PostgreSQL, native mail/token lifecycle, MailerLite and signed webhook checks. The native fixture uses Common Mailer 0.5, Mailer 3.0.2 and Nodemailer 8.0.5 with a captured transport; it never contacts SMTP or MailerLite.

The bootstrap keeps `rawBody: true`, captures the original signed bytes, and supplies a Nest `BadRequestException` schema error formatter for Nest 12's HTTP error classification. Keep those settings when adapting this example. The separate `nest11-optional` and `nest12-optional` package hosts verify custom persistence and provider composition without installing Common Mailer or TypeORM; this PostgreSQL example itself requires those integrations for native mode.

Compatibility results use Node 24.21.0 and TypeScript 6.0.3; minimum-Node/CI expansion remains #468. Newsletter's coordinated release policy under #428 is unchanged. #467 does not publish any package. See the [package compatibility contract](../../libs/newsletter/nest/README.md#nest-1112-compatibility-467) for peer ranges and upcoming-minor requirements.
