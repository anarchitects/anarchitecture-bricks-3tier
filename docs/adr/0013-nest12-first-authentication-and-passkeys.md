# ADR-0013: Migrate Auth Toward Nest 12 Authentication and Independent Passkeys

- Status: Proposed
- Date: 2026-10-12
- Owners: Architecture maintainers
- Governing: [Meta Nest-first ADR](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0010-nest-first-runtime-and-dependency-policy.md) and [Auth safety ADR](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0011-nest12-authn-authz-contracts-and-compatibility.md)

## Context

`@anarchitects/auth-nest` currently encapsulates Better Auth as the canonical engine, with a custom TypeORM adapter, plugin passkeys, JWT, cookie sessions, password hashing and Angular contracts. Anarchitects has chosen **A2**, with Nest 12 Authentication as target and a lightweight `@simplewebauthn/server` verifier rather than a second full authentication engine. Existing `AuthEnginePort`, `AuthPasskeyService`, `PasskeyEntity`, browser-native `WebAuthnClient` and shared DTOs provide migration seams but not guaranteed persistence/credential compatibility.

## Decision

1. Target `@nestjs/authentication` as the **single** core session/authentication system in the Nest 12 line; no parallel authoritative Better Auth session store in the final architecture.
2. Keep `@anarchitects/auth-nest` public facade, optional capabilities, application ports, `@anarchitects/auth-ts` contracts and Angular APIs. Introduce a Nest-native engine adapter behind `AuthEnginePort`, not a direct dependency from public contracts.
3. Prefer `@simplewebauthn/server` for cryptographic WebAuthn verification only. Implement challenge generation/persistence, single-use verification with expiry, RP/origin/trust checks, allowed credentials and account binding, atomic sign counters and session issuance through the proven Nest Authentication extension mechanism. Retain or adapt existing TypeORM `PasskeyEntity`; verify serialized public-key/credential-ID compatibility using genuine persisted-format fixtures.
4. Keep Angular `WebAuthnClient` using browser-native WebAuthn APIs; no additional browser dependency required by default.
5. Inventory existing register/login/logout/session/email verification/password reset/social login/JWT/passkey flows, policies, cookies, migrations, security headers, password hash formats and JWT revocation. Preserve semantics or document breaking migrations explicitly. Avoid unverified claims that `@nestjs/authentication` natively supports WebAuthn.
6. Better Auth and related transitive dependencies are removable **only after** complete security, data, credential, active-session/forced-reauth, clean-consumer and rollback evidence. Enforce no password downgrade and no mandatory re-enrolment unless the migration design explicitly documents a justified exception.
7. Nest 11 is **patch-only**; no new authentication architecture is backported automatically. Respect [ADR-0011](0011-verify-nest-runtime-support-independently-of-tooling.md) and release-line separation.

## Required verification

- Registration and verification ceremonies, replay/race/expiry, RP binding, UV, malformed credential, counter update and existing passkey sign-in.
- Login, cookie flags, session rotation/revocation, signed-in enrollment, lost credential/recovery, email flows and rate limits.
- Data migrations forward/back and explicit operator communication for session cutover.
- Public facade + advanced entry points, Angular 21/22, CJS/ESM where supported, Nest 12 packed installs.

## Alternatives

- Retain Better Auth indefinitely: reasonable fallback while native feature parity is incomplete, but not the target architecture.
- Reimplement WebAuthn cryptography: rejected due high security and maintenance risk.
