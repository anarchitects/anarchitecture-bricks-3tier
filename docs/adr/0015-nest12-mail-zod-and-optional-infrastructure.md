# ADR-0015: Native Nest Mail, Zod Contracts and Opt-in Reliability

- Status: Accepted
- Date: 2026-10-12
- Owners: Architecture maintainers
- Governing: [Meta Nest-first ADR](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0010-nest-first-runtime-and-dependency-policy.md)

## Decision — C1, D2, E1, F1

1. **Mail (C1):** target `@nestjs/mail` behind the existing `CommonMailerModule` and `MailerPort`. Preserve `node|noop` consumer configuration or provide an explicitly versioned mapping, sendMessage/send/sendTemplate, root transport setup, template path security and configuration precedence. Verify SMTP, retries, attachments as used, dynamic templates, escaping, error surfaces and Handlebars compatibility; remove `@nestjs-modules/mailer`, Nodemailer and Handlebars **only after** verified parity.
2. **Contracts (D2):** Zod is the target canonical schema technology for future and migrated Nest DTOs. Shared TS contract packages remain the canonical owner of wire schemas, inferred types and validation. Use Nest 12 Standard Schema and official Swagger/OpenAPI integration where exact released versions support it. Transition current TypeBox DTOs in stages with contract snapshots, validation parity, inferred type compatibility, client output and OpenAPI diffs. Do not maintain dual independent Zod/TypeBox definitions or silently change error semantics.
3. **Compatibility (E1):** Nest 12 is the sole active feature-development track. Nest 11 stays in a separate **patch-only** security/bugfix maintenance track with no new features. Respect accepted Nest-major and package-version compatibility obligations (especially [ADR-0011](0011-verify-nest-runtime-support-independently-of-tooling.md)); publicly describe which released artifact supports each combination.
4. **Reliability (F1):** first-party resilience, outbox, idempotency, locking and observability are opt-in modules/adapters behind existing domain/application ports. Never add them as mandatory transitive dependencies of all Bricks. Investigate atomic outbox/event semantics, error retries, duplicate delivery, idempotency scoping, resource isolation and observability portability before support claims.
5. No runtime migration, dependency removal, published compatibility change or version bump is authorized by adopting this ADR; each needs implementation PR(s), consumer tests and release approval.

## Evidence gates

- Clean-install packed consumers across the declared Nest/Node/module-format/Angular combinations.
- Negative contract tests for malformed DTOs and correct OpenAPI/spec output.
- Mail SMTP + template parity, optional disabled modes and deployment-path handling.
- Compatibility/release matrix with separate Nest 11 patch line and Nest 12 feature line.
