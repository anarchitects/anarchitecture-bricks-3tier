# Migrate an app-local newsletter

## Scope and compatibility

This guide describes adopting the Newsletter bricks in a host such as FitOverForty. It does not change that downstream repository or assume its current implementation. Inventory the host first, then map actual behavior to the capabilities below. The initial Newsletter packages remain behind epic acceptance and the CI release gate; use the repository examples until published versions are available.

The Angular surface uses Angular 22, the Forms package, and explicit state providers. Native Nest persistence requires the supported TypeORM/PostgreSQL combination, and native mail uses Common Mailer's `sendMessage` API. Check package peer dependencies and align the host before replacing its implementation. Changing endpoint shapes, consent versions, database schemas, or confirmation URLs can be a breaking host migration even though these are new package APIs.

## Inventory and ownership

| Existing host responsibility      | Reusable capability                    | Keep in host                                          |
| --------------------------------- | -------------------------------------- | ----------------------------------------------------- |
| Signup DTO and request validation | Newsletter TS DTOs                     | API prefix and compatibility adapter                  |
| Signup controller/provider calls  | Newsletter Nest facade/application     | Auth/edge policy, secrets, deployment                 |
| App-local consent records         | Consent repository + migrations        | Historical evidence and retention policy              |
| Native pending/active/token state | Native lifecycle adapter               | Publication scope and delivery operations             |
| MailerLite API wrapper            | MailerLite adapter and webhook         | Account/group setup and double opt-in settings        |
| Signup form and submission state  | Newsletter Angular feature using Forms | Copy, layout, privacy link, localization              |
| Confirmation/unsubscribe pages    | Native POST contracts                  | Landing page routes, explicit action and safe headers |

List all callers, webhook subscriptions, scheduled jobs, existing subscriber states, templates, consent versions, and outstanding token links. Record the exact current consent wording and its effective dates. Do not treat an existing provider subscriber list as proof of consent.

## Migration sequence

1. Select native or MailerLite deliberately. Keep the initial rollout on the existing provider unless a separate provider/data migration is approved. Using the MailerLite adapter does not require moving native lifecycle state into your database.
2. Install compatible published Newsletter/Forms/Common packages once released. Wire deterministic `forRoot` options or centrally configured `forRootFromConfig` overrides. Keep transport configuration once at the app root.
3. Back up data, register entities, and review/run migrations with `synchronize: false`. Keep historical evidence intact. If importing evidence is justified, use a reviewed host migration preserving original timestamps, wording, provenance, and deduplication identity; ordinary signup replay would manufacture new grants and may send mail.
4. Match the Angular and server consent version/text. Any changed policy needs an intentional host rollout; stale clients should receive a recoverable failure rather than silently accepting a different policy.
5. Add compatibility routing if old clients depend on another endpoint or response shape. Avoid invoking the old and new provider paths for the same request: duplicate writes and mail are not a safe shadow rollout.
6. Replace app-local form logic with `NewsletterSignupFeature` and explicitly scoped providers. Retain host layout, translations, privacy links, success/error copy, and explicit source attribution. Remove implicit email query-string or analytics capture.
7. For native mode, keep old outstanding links valid through a bounded legacy handler or communicate a controlled expiration policy. New tokens are not interchangeable with old token formats or hashes. Require POST after a user action; GET/email scanners must remain inert.
8. For MailerLite mode, preserve provider double opt-in/suppression settings, enable raw-body handling, and switch the signed webhook only after durable withdrawal storage is verified. Replays must deduplicate. Keep the old endpoint during the provider cutover window if needed without creating duplicate evidence.
9. Run the host's contract/browser/database checks and a staged provider/SMTP test using designated test accounts. Roll out by a controlled route/provider switch, then remove obsolete code only after acceptance.

## Validation and rollback

Verify neutral 202 responses, malformed/stale consent, 429 plus retry guidance, provider/SMTP outages, and no membership disclosures. Check durable evidence before provider submission, exact stored host policy text, no automatic activation, and no duplicate withdrawal records. For native mode verify token expiry, replay, changed generations and unsubscribe behavior. Confirm both SSR/hydration and browser code keep private input out of rendered output and URLs.

Use the [integration guide](newsletter-integration.md) and the runnable example regression as a baseline; run downstream tests against the host's real global prefix, proxy setup and provider wiring. Compare built package imports against documented root and secondary exports. Do not copy test-only fake transports into a production configuration.

Prepare rollback as a route/configuration switch with a clear owner. Keep the new append-only evidence and migrations; do not drop consent data to roll back application code. Preserve withdrawal propagation across any old/new overlap, and never resubscribe suppressed users to make the previous path appear successful. Keep metrics aggregate and redact addresses, tokens, signatures and credentials from logs.

## FitOverForty handoff

Before downstream work, review its current issues and implementation with the host owner. Agree on the provider, consent wording/version, legal copy, retention policy, old-link window, deployment sequence and acceptance tests. Track host-specific changes there. This repository supplies reusable behavior and integration examples; it does not decide FitOverForty's policy or execute its migration.
