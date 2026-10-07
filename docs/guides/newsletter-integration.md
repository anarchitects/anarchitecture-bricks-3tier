# Newsletter integration

## Architecture and ownership

Newsletter consists of three independently packaged libraries: `@anarchitects/newsletter-ts` owns transport contracts and domain models, `@anarchitects/newsletter-nest` owns application orchestration and optional adapters, and `@anarchitects/newsletter-angular` owns reusable signup composition. Nest follows `presentation -> application <- infrastructure`; Angular follows `ui <- feature -> state -> data-access`. Secondary entry points allow advanced composition without copying domain logic.

The host owns consent wording/version, privacy links, publication branding, legal decisions, retention/access policy, deployment secrets, database migrations, SMTP and provider accounts, rate-limit storage and trusted-proxy policy. The example wording is a demonstration, not a production policy. A consent grant records a request and does not prove provider delivery, activation, or successful double opt-in.

## Runnable examples

From this workspace, with dependencies installed and Docker available:

```sh
# PostgreSQL for the example; stop/remove this named container when finished.
docker run --name newsletter-example-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=newsletter -p 5432:5432 -d postgres:16-alpine
# In one terminal, configure a native backend:
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/newsletter
export RUN_MIGRATIONS=true
export NEWSLETTER_PROVIDER=native
export SMTP_URL=smtp://localhost:1025
export MAIL_FROM=newsletter@example.test
export NEWSLETTER_CONFIRMATION_URL=https://your-development-host.example/confirm
export NEWSLETTER_UNSUBSCRIBE_URL=https://your-development-host.example/unsubscribe
yarn nx serve newsletter-nest-example
# In another terminal:
yarn nx serve newsletter-angular-example
```

Supply an SMTP capture service at port 1025. Native mail links require HTTPS; put the Angular host behind your trusted development HTTPS proxy and configure those real URLs. The browser signup itself works on the Angular development server, whose `/api/**` proxy targets `127.0.0.1:3333`. The contract test uses captured mail and local navigation instead, so it needs neither SMTP nor external credentials.

To exercise the alternative provider, restart the backend with `NEWSLETTER_PROVIDER=mailerlite` and set `MAILERLITE_API_KEY`, numeric `MAILERLITE_GROUP_ID`, numeric `MAILERLITE_ACCOUNT_ID`, and `MAILERLITE_WEBHOOK_SECRET`. Keep `DATABASE_URL`; MailerLite still requires durable consent evidence. The example enables the webhook for this mode. The package facade allows it to be disabled independently. Native confirmation/unsubscribe routes are absent in MailerLite mode; the provider owns that lifecycle.

The source hosts are `examples/newsletter-nest-example` and `examples/newsletter-angular-example`. They are integration surfaces, not publishable packages. Never place provider keys, SMTP credentials, or database URLs in the Angular application.

## Nest facade and configuration

The example's `createNewsletterApp` composes `NewsletterModule.forRoot` with an initialized host `DataSource`, explicit consent policy, and a provider selection. Native mode binds the host's `MailerPort` using `mailer: { useExisting: MailerPort }`. Configure `CommonMailerModule.forRootAsync` once at the app root and expose its Node adapter through `CommonMailerModule.forRoot({ provider: 'node' })`; Newsletter does not create another transport.

`forRoot(options)` is deterministic and environment-agnostic. `forRootFromConfig(overrides)` uses the `newsletter` configuration namespace from the `/config` entry point, with precedence **explicit overrides > config-derived values > defaults**. Host database and mail provider bindings remain explicit in either path. See the Nest package README for the environment variable matrix and complete advanced composition examples. Environment reads belong to host bootstrap/configuration, never domain services.

Advanced consumers can compose `/application`, `/presentation`, `/infrastructure-persistence`, `/infrastructure-native`, and `/infrastructure-mailerlite` entry points. Custom persistence must implement the durable consent port; it is not an in-memory production fallback. Facade native mode requires TypeORM persistence; custom native repositories belong in advanced composition.

## Persistence and consent evidence

Register `NewsletterConsentEntity`, `NewsletterNativeSubscriberEntity`, and `NewsletterNativeTokenEntity` with the host DataSource. Register `CreateNewsletterConsentEvents1791244800000` followed by `CreateNewsletterNativeSubscribers1791288000000`. Use PostgreSQL, `synchronize: false`, and reviewed deployment migrations. `RUN_MIGRATIONS=true` is an explicit example startup convenience, not a production migration strategy.

Consent evidence is append-only and separate from mutable native subscriber/token state. The server records its authoritative policy text and version; the submitted version must match. Do not substitute provider membership for evidence or invent consent while importing a mailing list. Withdrawals use durable source/deduplication identities. Retention, authorized audit access, and erasure procedures belong to the host.

There are no cross-domain TypeORM entity relations. If the host needs a database foreign key into another domain, use integration-only migration schemas with scalar runtime keys.

## Native lifecycle and mail

A valid signup persists the grant and requests a pending native subscription, then sends confirmation mail through the shared Common Mailer. The message contains confirmation and unsubscribe links. Tokens are purpose-bound, expiring, generation-bound bearer secrets; only hashes are persisted. Cooldown and replay protections prevent repeated requests from resetting active subscriptions or reusing consumed lifecycle links. A failed delivery does not roll back committed evidence or subscriber state.

Host landing pages must require an explicit action before sending `POST /api/newsletter/confirm` or `POST /api/newsletter/unsubscribe` with `{ "token": "..." }`. Email scanners and GET navigation must not mutate state. The Angular example removes the token from the address bar after capturing it, uses `no-referrer`, and sends the POST only on the Continue button. Hosts must also redact query strings at their reverse proxy, avoid third-party scripts on these pages, and apply `Cache-Control: no-store` and `Referrer-Policy: no-referrer` at the HTTP edge.

The API returns `202 { "accepted": true }` for valid-shaped lifecycle requests, including invalid, expired, and replayed tokens. That response does not disclose membership or confirm a state transition. This capability does not implement campaign authoring, scheduling, or bulk newsletter delivery.

## MailerLite and webhook raw body

The MailerLite adapter submits `status: unconfirmed` and `resubscribe: false`; it does not force activation or revive suppressed addresses. Keep account-side double-opt-in settings and workflows under host control. Provider calls have bounded timeouts/retries and return generic failures without subscriber details.

Enable `webhook: { accountId, webhookSecret }` and bootstrap Fastify with `{ rawBody: true }`. The webhook endpoint is `POST /api/newsletter/webhook`. Forward the provider's `signature` header and exact unmodified request bytes; JSON parsing and reserialization before signature verification will break authentication. The adapter authenticates raw bytes before validating provider events and records unsubscribe/deletion withdrawals idempotently. Its aggregate acknowledgement is `{ recorded, duplicates }`. Missing raw-body configuration fails closed. Do not send these requests through a public signup form or a body-rewriting proxy.

## Public API and rate limiting

The generated OpenAPI includes all optional capabilities at the default `/newsletter` resource path, without the example's global `/api` prefix:

| Method/path                    | Availability              | Success                        |
| ------------------------------ | ------------------------- | ------------------------------ |
| POST `/newsletter/subscribe`   | Every configured provider | 202 `{ accepted: true }`       |
| POST `/newsletter/confirm`     | Native only               | 202 `{ accepted: true }`       |
| POST `/newsletter/unsubscribe` | Native only               | 202 `{ accepted: true }`       |
| POST `/newsletter/webhook`     | Explicit webhook opt-in   | 200 `{ recorded, duplicates }` |

Signup accepts `email`, `consent: true`, `consentVersion`, optional explicit `source`, and the optional `website` honeypot. It returns neutral acceptance; malformed/stale consent is 400, exhausted quota is 429 with `Retry-After`, and operational failure is a generic 503. Honeypot submissions are acknowledged without evidence/provider writes. There are no public membership lookup or list endpoints.

The example uses a process-local memory limit of 10 requests/minute per client key, shared across signup and native actions. For multiple replicas, supply a shared limiter or enforce a suitable edge policy. The example explicitly selects `request.ip` through `presentation.resolveClientKey`; rate limiting requires a host key resolver. This key is suitable only with correctly configured proxy trust; do not blindly trust arbitrary forwarded headers. Evidence IP collection is optional and explicit through host presentation context. Webhook authentication and edge limits are separate from the public signup quota.

## Angular and Forms composition

The example uses `NewsletterSignupFeature` from `/feature`, which reuses the published Forms renderer through `@anarchitects/forms-angular`; it does not introduce a parallel form implementation. Install `provideHttpClient()` at bootstrap and scope `provideNewsletterFeature({ apiBaseUrl: '/api', consent })` to the owning component or feature route. Stores are never registered implicitly in the root injector. Keep separate signup instances in separate provider scopes when they need independent state.

Pass an instance-specific `idPrefix`, host `NewsletterSignupPresentation`, and optional fixed `source`. Consent is initially unchecked, uses the exact host policy wording/version, and is reset if that policy changes. Success text must describe generic request acceptance. The component keeps email addresses in JSON POST bodies and does not collect attribution from location/query strings. The host owns loading, failure, accessibility copy, privacy navigation, localization, and any legal review.

Include Tailwind and both library source trees in this workspace's CSS source detection, as shown in the example `styles.css`. External consumers should follow the published Forms/Tailwind installation guide for their package layout.

## Verification and release gate

```sh
# Docker + Chromium; fake transports, no external provider calls or real email:
yarn playwright install --with-deps chromium
yarn nx run newsletter-nest-example:contract-test
# Isolated exports, SSR/privacy and real PostgreSQL regression:
yarn nx run-many -p newsletter-nest,newsletter-angular -t package-smoke --parallel=1
yarn nx run newsletter-angular:test-hydration
yarn nx run newsletter-nest:test-persistence
# Contracts and published docs:
yarn nx run api-specs:verify
yarn nx run api-specs:lint
yarn nx run docs-hub:validate-content
yarn nx run docs-hub:verify
```

The integration target builds both hosts and their library dependencies, then tests the production browser bundle against real Fastify and PostgreSQL. It checks server-authoritative consent, native token actions/replays, the real MailerLite adapter with a fake HTTP transport, provider failure mapping, rate limiting, raw-body signatures, and durable webhook deduplication. CI runs it on the GitHub runner with Chromium and Docker rather than distributed Nx agents.

The `newsletter` release group selects only `libs/newsletter/**` and builds `newsletter-ts`, `newsletter-nest`, and `newsletter-angular`; example apps are excluded. Package smoke tests verify built root/secondary exports. This issue prepares the initial release but does not authorize publication. Complete epic acceptance and use the CI-owned Release (Manual) workflow for a coordinated Newsletter release. Human developers review, commit, create the PR, and merge.

For app-local adoption, use the [migration guide](newsletter-migration.md).
