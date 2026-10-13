# Legacy Public API Baseline — #487

## Scope and provenance

This is the frozen **legacy implementation baseline**, not a canonical contract
or an endorsement of every observed behavior. It supplies the 3-tier evidence for
[Contracts #3 / SI-1.2](https://github.com/anarchitects/anarchitecture-contracts/issues/3)
and [3-tier #487](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/487),
under [epic #485](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/485).

- Source revision: [`ecda1b6e0d9bc39c66373452a92dce91e06abee0`](https://github.com/anarchitects/anarchitecture-bricks-3tier/tree/ecda1b6e0d9bc39c66373452a92dce91e06abee0), including merged #486 governance.
- Audit and registry observation: **2026-10-13**.
- Architecture preflight: all 15 Meta ADRs at `e2f34553c6e2492d0ab6f80ac795de44fc592a70` and all 19 repository ADRs, including historical/proposed records. Applicable accepted decisions: Meta ADR-0012 and local ADR-0016 contract ownership; ADR-0011–0015 compatibility, presentation, auth/policy and infrastructure; domain ADRs 0005–0010 and historical auth decisions as amended. Proposals do not override accepted decisions.
- Relevant engineering constraints: TS contracts, Nest release validation, auth/passkeys, newsletter integration, cross-repository alignment, and Angular guide/application/topic guidance for interpreting consumers. This audit changes no Angular or runtime code.
- Resolution of ownership conflict: local TypeBox DTOs, metadata and generated OpenAPI remain historical evidence. Contracts owns subsequent Zod-first wire schemas and operations. Domain models, application ports and `auth-ts` policy semantics remain local. Preserve Fastify, adapters, package exports and current behavior until separately reviewed adoption; Nest 11 is patch-only and native Nest 12 modernization follows contracts-first adoption.

The [machine-readable evidence directory](https://github.com/anarchitects/anarchitecture-bricks-3tier/tree/main/docs/audits/487-legacy-api)
contains these files (use the eventual reviewed audit commit to pin this handoff):

| File                     | Contents and evidence boundary                                                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `legacy-inventory.json`  | Immutable source URLs and SHA-256 hashes, every domain TS source export/barrel, TypeBox imports, controller schema bindings/imports, default routes, generated operation schemas/statuses/IDs, Angular imports and HTTP calls, tests and package manifests. |
| `validation-probes.json` | 35 deterministic input/status/body observations from actual Fastify injection with frozen schemas; default AJV versus newsletter's TypeBox compiler. Synthetic routes isolate validation/serialization, not application behavior.                           |
| `registry.json`          | npm public registry versions, dist-tags, tarball integrity and available gitHead values for all 13 domain packages. Observation only; never a moving dependency pin.                                                                                        |

The inventory records **871 source files, 94 non-test domain TS source files,
104 Angular/client consumer files, 29 controller routes and 26 generated operations**.
The TS list includes models, builders, mappers and barrels, not just wire DTOs;
extraction must classify them before moving ownership. Angular entries include
unit tests and Storybook handlers; they are not all production consumers.

## Endpoint, status and operation map

These are controller-default paths without a host global prefix. Examples add
`/api`; newsletter can override its base path and enable/disable native and webhook
routes. JWT/passkeys require their feature/plugin composition. The generator
mounts selected controllers directly and is not a capability manifest.

| Method and default path                            | Declared success | Generated operationId            |
| -------------------------------------------------- | ---------------- | -------------------------------- |
| `GET /auth/me`                                     | 200              | `getLoggedInUserInfo`            |
| `GET /forms/{formId}`                              | 200              | `getFormDefinition`              |
| `GET /forms/submissions`                           | 200              | `getSubmissions`                 |
| `GET /forms/submissions/{submissionId}`            | 200              | `getSubmission`                  |
| `GET /identity/profiles/{profileId}`               | 200              | `getUserProfileById`             |
| `GET /identity/profiles/by-auth-user/{authUserId}` | 200              | `getUserProfileByAuthUserId`     |
| `PATCH /auth/activate`                             | 200              | `activateUser`                   |
| `PATCH /auth/change-password/{userId}`             | 200              | `changePassword`                 |
| `PATCH /auth/update-email/{userId}`                | 200              | `updateEmail`                    |
| `PATCH /identity/profiles/{profileId}`             | 200              | `updateUserProfile`              |
| `POST /auth/forgot-password`                       | 200              | `forgotPassword`                 |
| `POST /auth/jwt/login`                             | 200              | **Absent** (optional JWT plugin) |
| `POST /auth/jwt/logout`                            | 200              | **Absent** (optional JWT plugin) |
| `POST /auth/jwt/refresh`                           | 200              | **Absent** (optional JWT plugin) |
| `POST /auth/login`                                 | 200              | `login`                          |
| `POST /auth/logout`                                | 200              | `logout`                         |
| `POST /auth/passkeys/authentication/begin`         | 200              | `beginAuthentication`            |
| `POST /auth/passkeys/authentication/finish`        | 200              | `finishAuthentication`           |
| `POST /auth/passkeys/registration/begin`           | 200              | `beginRegistration`              |
| `POST /auth/passkeys/registration/finish`          | 200              | `finishRegistration`             |
| `POST /auth/register`                              | 200              | `registerUser`                   |
| `POST /auth/reset-password`                        | 200              | `resetPassword`                  |
| `POST /auth/verify-email`                          | 200              | `verifyEmail`                    |
| `POST /forms/submit`                               | 200              | `submitForm`                     |
| `POST /identity/profiles`                          | 200              | `createUserProfile`              |
| `POST /newsletter/confirm`                         | 202              | `confirmNewsletterSubscription`  |
| `POST /newsletter/subscribe`                       | 202              | `subscribeToNewsletter`          |
| `POST /newsletter/unsubscribe`                     | 202              | `unsubscribeFromNewsletter`      |
| `POST /newsletter/webhook`                         | 200              | `receiveNewsletterWebhook`       |

Each inventory `routes[]` entry links the controller, handler, source line,
`@RouteSchema` expression and imported DTO source. Each `openapi.operations[]`
entry includes its full parameters/request/response schemas, JSON pointer and
operation hash. This joins the endpoint/status/schema/operationId map without
copying TypeBox source into a new schema authority. Response codes above are the
success contract; they do not enumerate runtime failures.

## Generator and runtime discrepancies requiring review

| ID  | Evidence                                                                                                                                                                                                                                                                                                | Consequence for extraction                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L01 | Three `/auth/jwt/*` controller routes and their Angular consumer are absent from `generate.ts` and OpenAPI.                                                                                                                                                                                             | Inventory optional JWT explicitly; do not silently remove working routes or invent operation IDs.                                                                             |
| L02 | `route-metadata.ts` still maps `POST /auth/refresh-tokens/{userId}` to `refreshTokens`, but no such current controller route exists.                                                                                                                                                                    | Treat this as stale metadata, not an endpoint to implement. Current JWT refresh accepts a body at `/auth/jwt/refresh`.                                                        |
| L03 | Generated operations contain only success responses and no security schemes, security requirements, cookie/header contracts or documented errors.                                                                                                                                                       | Add reviewed evidence for sessions, authorization denials, JWT, rate limits and webhook signatures when authoring canonical operations. Absence does not imply public access. |
| L04 | The generator mounts direct controllers with service stubs; it omits production guards and newsletter module hooks. Auth login/logout/me stubs still return old shapes rather than the current service `{body, headers}` envelope; the passkey stub is empty and submission read methods are absent.    | Generation succeeds because it does not call these handlers. Do not use its app as a runtime conformance host.                                                                |
| L05 | Newsletter production uses `Value.Check`, rejects extra properties and avoids coercion. Default Fastify AJV coerces consent/token types and removes unknown properties for these schemas. The generator does not install the newsletter compiler/honeypot hook.                                         | Schema equality alone cannot establish validation parity; preserve the strict production path and neutral honeypot behavior.                                                  |
| L06 | Identity's nullable string union permits null structurally, but default AJV turns submitted `displayName: null` into `""`; number `42` becomes `"42"`.                                                                                                                                                  | Review explicitly before switching to a validator that preserves null or rejects numbers. Stored nulls still serialize as null.                                               |
| L07 | Auth and Forms default validation accepts/coerces some values and preserves unknown properties. Forms' submission envelope accepts arbitrary payload records. The submission service loads the definition, persists and sends mail without validating payload against the returned dynamic form schema. | Do not assume that the generated form-definition schema is enforced on submission. Tightening validation or stripping data requires a reviewed compatibility decision.        |
| L08 | `verify.ts` snapshots paths/methods/operation IDs and checks required paths and controller metadata purity; it does not compare complete schemas, errors, security or headers to HTTP. `info.version` is `1.0.0`, not a domain release version.                                                         | Retain existing checks, but do not present a passing snapshot as full contract conformance.                                                                                   |

All differences are recorded, not repaired here. Neither the implementation nor
the generated document is automatically the intended future behavior.

## Validation and serialization fixtures

The probe uses workspace Nest **11.1.6**, Fastify **5.4.0**, TypeBox **0.34.41**
and Node **24.21.0**, with the baseline dependency lockfile. These versions describe
the isolated probe; the packed host suites use their own checked-in fixture locks.

| Concern              | Frozen observation / interpretation                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required and formats | Default auth login rejects empty password (minimum 6); registration rejects malformed email. Forms rejects version 0 and null payload. These are structural checks, not successful authentication/registration.                                           |
| Refinements          | Structurally valid registration with mismatched confirmation passes schema validation. Application invariants must be reviewed separately; never infer password equality from the DTO type.                                                               |
| Coercion             | Numeric login password becomes a string; Forms body/query version `"1"`/`"2"` becomes an integer; invalid integer query is 400.                                                                                                                           |
| Optional/default     | Identity empty patch is structurally accepted. Empty submissions query stays `{}`. Form-definition version fallback to 1 is controller/application behavior, not a default inserted into every DTO.                                                       |
| Nullable             | Identity `displayName: null` becomes an empty string under default AJV; object values fail. Preserve omission, null and empty-string distinctions in the migration decision.                                                                              |
| Unknown fields       | Auth login, Forms envelope/payload and Identity patch retain tested extras. Newsletter strict routes reject extras; default AJV would remove them. Do not apply one global Zod unknown-key policy.                                                        |
| Newsletter tokens    | Strict validation accepts empty strings, rejects numeric and over-128-character tokens. Operational invalid/expired/replayed tokens return neutral 202; syntactic invalidity is 400.                                                                      |
| Serialization        | Submission response removes an undeclared top-level internal field, retains payload members and serializes Date values as ISO date-time strings. Response serializer behavior differs from request validation.                                            |
| Error shape          | Isolated raw Fastify validation has `statusCode`, `code: FST_ERR_VALIDATION`, `error` and `message`. Nest and newsletter controller exception wrapping are separate host evidence; do not publish the raw probe envelope as their universal error schema. |

Auth profiles can change required fields and lengths. The inventory includes
`auth-contracts.factory.ts`, profile configuration, DTO exports and frontend
payload shaping. Default schemas alone do not freeze every supported profile.
`auth-ts` policy parsing rejects malformed rule members and retains transport-neutral
semantics; the HTTP representation and frontend `/me` parser must preserve those meanings.

## Actual HTTP and security evidence

The existing packed-host suites ran successfully against this source baseline on
2026-10-13. They install locally packed candidates into locked, external Nest 11
hosts, check CJS/ESM declarations and exercise real HTTP and PostgreSQL through
Docker. They are stronger evidence than mocked generator responses, but are not
a complete request matrix for every endpoint or configuration.

| Surface                      | Reproducible fixtures and observed checks                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth/session/authorization   | `tools/testing/auth-nest-hosts/run-consumer.mjs`: explicit/config/advanced composition, global guards, invalid registration 400, unauthenticated 401, login 200 with session cookie, own/foreign policy cases, permission denial 403, missing resource 404, session persistence across restart and logout invalidation. Login/me bodies are user/RBAC; cookies carry sessions. JWT is a separate optional API with token bodies and refresh/logout behavior. |
| Passkeys                     | Same host plus `tools/testing/auth-nest-passkeys.test.mjs` and passkey host fixtures: enrollment/authentication, fresh session requirements, restart, replay/counter checks, uniqueness and credential deletion cascade. Four operation schemas do not imply a working unconfigured passkey service.                                                                                                                                                         |
| Forms/Identity               | `tools/testing/forms-identity-nest-hosts/consumer.mts`: HTTP validation, DTO responses, 400/404 cases, query filtering, persistence/migrations, profile uniqueness, facade/config/override/advanced composition, mail integration and null response fields.                                                                                                                                                                                                  |
| Newsletter native            | `tools/testing/newsletter-nest-hosts/run-consumer.mjs`: native subscribe/confirm/withdrawal, mail capture, persisted token consumption, restart/replay neutrality, configured/disabled routes and error handling. Controller native actions set `Cache-Control: no-store` and `Referrer-Policy: no-referrer`.                                                                                                                                                |
| Newsletter validation/limits | Subscription's module pre-validation hook returns `{accepted:true}`/202 for a nonempty string honeypot before validation, limiting and side effects—even for malformed other fields. Invalid genuine request 400, rate limit 429 with `Retry-After`, unavailable infrastructure 503. Isolated probes deliberately omit this hook; their honeypot 400 is not the production response.                                                                         |
| Newsletter webhook           | Host fixtures and `mailerlite-webhook.adapter.spec.ts`: exact signed raw bytes and `signature` header, bad/missing signature 401, invalid payload 400, oversize payload 413, missing raw-body capture 503, valid acknowledgement 200 with `recorded`/`duplicates`, concurrent/restart idempotency. Re-serializing signed JSON changes its signature. The route intentionally has no ordinary request-body schema before signature verification.              |

Host-wide middleware/guards can add policies and headers. `@Public` inventory is
metadata, not proof of access; absence of it on Forms/Identity/Newsletter is not
proof that an auth guard is installed. Likewise the newsletter test host adds
response headers globally: distinguish that host policy from the native action
controller's own headers. Provider transport uses a fake MailerLite service and
mail capture; these runs do not call production accounts or prove provider availability.

## Angular and published-package consumers

The inventory records import bindings, source lines and direct HTTP calls:

- `AuthApi`: session routes and local `auth-ts/dtos`; `/me` explicitly parses policy rules. `JwtAuthApi` uses `auth-ts/dtos/jwt` and the three routes missing from generated OpenAPI. Passkey data access uses its own DTO subpath and four operations.
- `FormsApi`: definition, submission create/list/read and local TS DTOs/models. Dynamic form builders and frontend validation consume config/schema output; that does not prove identical server payload enforcement.
- `IdentityApi`: read-by-auth-user and patch, with URL-encoded IDs and shared TS types. The backend also exposes create/read-by-profile operations not wrapped by this client.
- `NewsletterApi`: configurable subscription URL and subscription DTO, with example-level native action POSTs. It does not expose the provider webhook as a browser feature.
- `libs/ts/frontend/data-access`: shared/generated client material is included as evidence, not treated as the primary implementation of every domain client.

Static extraction is not a whole-program call graph: indirect clients, computed
route composition, interceptors, cookies and frontend payload shaping require the
referenced source/tests. Browser end-to-end behavior was not rerun for this audit.

Registry observation and source manifests agree on these latest versions:

| Domain     | Published package suffixes audited      | Version |
| ---------- | --------------------------------------- | ------- |
| Auth       | `angular`, `declarations`, `nest`, `ts` | 0.12.0  |
| Forms      | `angular`, `nest`, `ts`                 | 0.11.0  |
| Identity   | `angular`, `nest`, `ts`                 | 0.2.0   |
| Newsletter | `angular`, `nest`, `ts`                 | 0.1.0   |

All names use `@anarchitects/<domain>-<suffix>`. `registry.json` records immutable
tarball integrity and historical version lists. These are **registry metadata
observations**, not proof that published tarballs equal this Git revision. The
runtime tests pack local candidates; they do not download and compare every exact
published domain tarball. Earlier release-planning prose can predate publication;
use this dated registry observation rather than inferring publication from plans.

## Reproduction and validation

Use a full checkout containing the pinned source commit, Node 24, Yarn 4.18.0 and
the baseline lockfile. The collector reads Git objects, not mutable working files.
The validation probe rejects changes to audited domain libraries or the dependency
manifest/lockfile. Run the following from the repository root:

```bash
yarn nx run api-specs:audit-legacy-verify
yarn nx run api-specs:audit-legacy-lint
```

The verify target regenerates inventory and probes under `dist/api-audit`, then
compares all JSON evidence with the frozen fixtures (only Node version provenance
is excluded from equality). It does not query mutable registry metadata or rewrite
accepted evidence. A later migration must run these tools in a separate baseline
checkout and establish its own candidate comparison; do not refresh this freeze
in place to make changed semantics pass.

Additional checks executed successfully for this audit:

```bash
yarn nx run api-specs:generate
yarn nx run api-specs:verify
yarn nx run api-specs:lint
yarn nx run-many -t test -p auth-ts,forms-ts,identity-ts,newsletter-ts,forms-nest,identity-nest,newsletter-nest --parallel=3 --skipNxCache
yarn nx run auth-nest:test --skipNxCache
yarn nx run release-tools:test-forms-identity-nest-compatibility:nest11
yarn nx run auth-nest:test-nest-compatibility:nest11
yarn nx run newsletter-nest:test-nest-compatibility:nest11
```

The packed-host commands require Docker/PostgreSQL and npm network access. Their
checked-in fixture manifests/locks and harness sources are hashed in the inventory.
OpenAPI regeneration left `docs/openapi` unchanged. No Nest 12 runtime, alternative
HTTP adapter, browser suite, all-profile matrix or canonical conformance was
claimed by these runs. The separate [packed validation guide](/guides/nest-release-validation.html)
explains the broader supported-host release gate.

## Contracts handoff and acceptance

Contracts #3 can pin the reviewed commit containing this directory, retain the
source revision/hashes and registry integrity, and reference the endpoint map,
L01–L08 review decisions, validator fixtures and executable HTTP/security cases.
This delivers 3-tier's audit input; it does not complete Contracts #3 or author its
canonical schemas. Subsequent Contracts #4–#7 and 3-tier adoption must:

1. Classify each artifact as wire contract, local domain/policy semantics or adapter behavior; author canonical Zod schemas and operations only in Contracts.
2. Resolve missing JWT operations, stale metadata, error/status/header/security gaps and each validation difference explicitly. Preserve behavior unless an approved versioned change says otherwise.
3. Expand representative fixtures into endpoint/profile/capability coverage, including authenticated denials, cookie behavior, passkey replay and byte-exact webhooks. Preserve request and response semantics independently.
4. Compare canonical output and real candidate HTTP against this frozen evidence, test actual published consumers, and retain the working generator until replacement checks pass.

This audit introduces no wire, package export or runtime behavior changes and
requires no package deprecation. Any future tightening of coercion, unknown fields,
null handling, Forms payload validation or security requirements may be breaking
and needs its own human-reviewed compatibility decision. Human review, commit and
PR creation remain required; issue status is **In Review**, not Done, at handoff.
