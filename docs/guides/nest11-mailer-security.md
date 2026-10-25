# Nest 11 mailer security maintenance (#512)

Review date: 2026-10-25. Implementation candidate, **not a published fix**.
Tracks [Bricks #512](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/512),
[FoF #143](https://github.com/anarchitects/fitoverforty/issues/143) and its consumer
adoption [#162](https://github.com/anarchitects/fitoverforty/issues/162).

## Architecture preflight and decision

The preflight enumerated all 20 local records in `docs/adr` (0001–0017,
106, 121 and Modern Angular) and all 17 records in the sibling Meta checkout
at `71c46b1`: both 0001 records, 0002–0007, both 0008 records, 0009–0014
and `ADR-0001`. No other repository ADR directory was found. Accepted decisions
apply; Meta's cooperative-governance and 0005–0007 proposals and the Newsletter
amendment do not override them. The relevant Nest, compatibility audit,
development strategy, release validation/plan, DDD alignment/migration guides
and Common Mailer README were reviewed. This work changes no Angular or HTTP API.

Applicable constraints: local 0004/0007 keep Common transport-only; 0011 requires
real packed hosts independently of workspace tooling; 0013–0016 and Meta 0010
keep Nest 11 patch-only and preserve current supported runtimes. Local 0015's
native Nest mail target is separate #505 work, not this security patch. Local
0017 and Meta 0013 retain CI versioning and human release acceptance. Meta 0014
requires manual dependency review. The public MailerPort, provider selection,
config precedence, SMTP ownership, template behavior and custom transports stay
intact. DDD capability alignment remains through the generic mail port; no DDD
implementation parity is asserted.

**Compatibility conflict:** replacing the existing Nodemailer 8 peer with 10 only
would remove an accepted host combination. The patch therefore adds `^10.2.1` to
the existing `^8.0.5` peer and updates Handlebars within its existing major to
`^4.7.10`. Workspace and active locked hosts use 10.2.1/4.7.10. A separate
`nest11-legacy` fixture retains 8.0.5 for compatibility only. It explicitly does
**not** run or claim the security suite. Retaining installation compatibility is
not a security endorsement: a host still resolving Nodemailer 8 is vulnerable.
This candidate enables an explicit host upgrade, not automatic remediation of
existing lockfiles. A future removal of the old peer needs a breaking release.

Nodemailer 10 supplies its own declarations. The old concrete adapter's
`send`/`sendTemplate` inferred `Promise<any>` and returned the provider result;
those declarations/results are intentionally retained to avoid changing either
MailerPort assignability or direct-adapter runtime behavior. `sendMessage`
continues returning void. No attachment API is added to MailerPort; attachments
are verified through the existing advanced MailerService composition.

## Advisory and dependency evidence

Registry metadata and upstream public advisories were queried on the review date.
[Nodemailer policy](https://github.com/nodemailer/nodemailer/security) supports
security fixes only on 10.x. The current registry version is
[10.2.1](https://registry.npmjs.org/nodemailer/10.2.1), with Node >=20;
[release notes](https://github.com/nodemailer/nodemailer/releases/tag/v10.2.1)
and [10.1 behavior changes](https://github.com/nodemailer/nodemailer/releases/tag/v10.1.0)
must be reviewed for host-specific pooling, timeout, TLS and stream use.
The latest advisory patch floor is 10.1.4, not the earlier bot PR's version.

| Upstream advisories                                           | Impact / patched version                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| GHSA-8c8m-p3m8-cjg8, GHSA-m943-m63m-w62w, GHSA-85x2-q946-cp5h | Address parsing can change recipients/senders; 10.1.4               |
| GHSA-4ffr-jq9g-5ffx, GHSA-g73g-hqqh-jr95                      | SMTP AUTH regex DoS and malformed recipient parsing; 10.0.13        |
| GHSA-39m8-27wv-hr27, GHSA-4g23-2xm8-66gc                      | DKIM unfolding / SMTP reply parsing DoS; 10.0.10                    |
| GHSA-g57g-f23g-4646                                           | Quoted local-part parsing; 10.0.9 (affects >=9.1.0)                 |
| GHSA-v53p-9fqp-m79j, GHSA-prgh-xp8r-p3m5                      | Address-parser complexity; 10.0.6 / 10.0.5 (latter affects >=9.1.0) |
| GHSA-6vj9-mwq6-2f5v, GHSA-8vvx-rff5-p5rq                      | DNS/TLS identity reuse and nested recipients; 10.0.2                |
| GHSA-8m3c-c648-2xjj                                           | Legacy resolveContent file/URL restrictions bypass; 9.1.1           |
| GHSA-2x7j-588g-ccc2, GHSA-cc9r-2j5m-2m83, GHSA-wmmp-3585-3rmp | Address-parser DoS / recipient-domain validation bypass; 9.1.0      |
| GHSA-p6gq-j5cr-w38f                                           | Raw-message file/URL restrictions bypass; 9.0.1                     |
| GHSA-wqvq-jvpq-h66f, GHSA-268h-hp4c-crq3                      | JSON transport restrictions bypass / List header injection; 8.0.9   |
| GHSA-r7g4-qg5f-qqm2                                           | OAuth2 TLS verification; 8.0.8                                      |
| GHSA-vvjj-xcjg-gr5g, GHSA-c7w3-x93f-qmm8                      | SMTP command injection; 8.0.5 / 8.0.4                               |
| GHSA-rcmh-qjqh-p98v, GHSA-mm7p-fcc7-pg87, GHSA-9h6g-pr28-7cqp | Earlier parser DoS / misdelivery; 7.0.11 / 7.0.7 / 6.9.9            |

Exact affected ranges and upstream reproductions are in the
[Nodemailer advisory collection](https://github.com/nodemailer/nodemailer/security/advisories).
This is a dated remediation inventory, not a claim of absence of future defects.
All listed fixes precede 10.2.1; many affect every 8.x version.

Handlebars 4.7.10 fixes
[AST type confusion](https://github.com/advisories/GHSA-8r5x-fm3f-whwj),
[own-property check bypass](https://github.com/advisories/GHSA-p8wg-vrv2-v86f) and
[unsafe precompiled-template embedding](https://github.com/advisories/GHSA-xw65-4hp5-5hc7).
The existing adapter reads trusted text templates, not user-supplied ASTs or
browser script embedding; update anyway and retain escaping. Custom helpers,
SafeString and triple braces remain host-owned trust boundaries.

[Mailer 3.0.2 metadata](https://registry.npmjs.org/@nestjs-modules/mailer/3.0.2)
admits Nest >=7.0.9, Nodemailer >=8.0.5 and Handlebars >=4.7.9. Retain that tested
mailer instead of adopting current 4.0.0's broader changes. Permissive upstream
peers alone are insufficient: the packed tests below verify the chosen versions.

## Consumers and maintenance lines

| Consumer / line                                 | Finding and disposition                                                                                                                                                                                                     |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Published Common 0.3.0–0.3.4                    | FoF's reported line; do not replace with main's facade as a patch. 0.3.0 registry peers: Nest ^11, Config ^4.0.2, Mailer ^2.0.2. Old artifacts require a separately tested backport or application mitigation.              |
| Published Common 0.4.0                          | Nest ^11, Config ^4.0.2, Mailer ^2.3.4 and Nodemailer types 7.0.11. No automatic migration to Mailer 3.                                                                                                                     |
| Published Common 0.5.0 / current source         | Registry `latest` on review date, dual Nest 11/12, Mailer 3, Nodemailer ^8.0.5. This candidate is intended for a reviewed 0.5.x patch, with explicit Nodemailer 10 host adoption. No version is reserved or published here. |
| Auth                                            | Mandatory Common dependency; auth engine consumes MailerPort; domain adapter re-exports Common.                                                                                                                             |
| Forms                                           | Mandatory Common dependency; submissions use MailerPort; domain adapter re-exports Common.                                                                                                                                  |
| Newsletter                                      | Optional Common peer; native mail uses MailerPort. Custom/MailerLite hosts may omit the mail stack.                                                                                                                         |
| Newsletter example / OpenAPI and consumer tools | Root composition and integration surfaces; locked Auth/Forms/Newsletter hosts must retain strict declaration compatibility.                                                                                                 |

The registry also lists historical 1.0.0/1.0.1/2.0.0 artifacts; they are not the
current `latest` and are not selected as maintenance targets here. Existing
README/release-plan descriptions calling 0.5.0 unreleased are historical #465/#469
evidence; the dated registry observation above supersedes that publication claim.

## Validation and limits

The Common hosts install the built tarball outside the repository with
`npm ci --strict-peer-deps --engine-strict`, no scripts, overrides, workspace
links or forced peers. Both CJS and ESM run after strict NodeNext compilation.
Source, built and packed manifests must agree. Committed registry integrities
remain pinned; tests never regenerate dependency locks.

| Host            | Nest / Config   | Nodemailer / Handlebars | Purpose                                                         |
| --------------- | --------------- | ----------------------- | --------------------------------------------------------------- |
| nest11          | 11.1.6 / 4.0.2  | 10.2.1 / 4.7.10         | Primary maintenance security consumer                           |
| nest11-config12 | 11.1.6 / 12.0.1 | 10.2.1 / 4.7.10         | Retained modern Config combination                              |
| nest12          | 12.1.2 / 12.0.1 | 10.2.1 / 4.7.10         | Preserve existing dual-major support                            |
| nest11-legacy   | 11.1.6 / 4.0.2  | 8.0.5 / 4.7.10          | Installation/API compatibility only; known vulnerable transport |

Tests exercise facade and advanced wiring, config overrides, noop without a
transport, HTML/text alternatives, sender/reply-to/headers, legacy methods,
templates/escaping, missing-template errors, buffer attachments, SMTP rejection,
empty recipients, and actual SMTP envelope regressions for the October 19
advisories. Loopback SMTP captures MIME bytes; a loopback HTTP sentinel confirms
that blocked URL input causes no request. Raw-message/attachment file and URL
sources must reject under transport restrictions even if a message tries to
turn them off. No real email is sent. TLS/auth/pooling behavior is not certified
by the plaintext sink: test the production provider in staging before rollout.

```sh
yarn nx run common-nest-mailer:test-nest-compatibility:nest11
yarn nx run common-nest-mailer:test-nest-compatibility:nest11-config12
yarn nx run common-nest-mailer:test-nest-compatibility:nest12
yarn nx run common-nest-mailer:test-nest-compatibility:nest11-legacy
yarn nx run-many -t lint test -p common-nest-mailer
yarn nx run release-tools:test
```

Fresh Linux packed compatibility CI and the consumer-runtime minimum matrix are
release gates. Historical green CI from #468 does not validate this change.

Local verification on 2026-10-25 (macOS arm64): the complete Nest 11 matrix
passed **10** packed hosts and the Nest 12 matrix passed **5** packed hosts on
Node **24.22.1**. These include Auth, Forms/Identity and Newsletter with real
PostgreSQL, plus optional-peer absence. The primary Common security host also
passed on **Node 20.19.0**, in both CJS and ESM. Common lint/unit tests,
release-tool lint/tests, source/build/packed contract checks and docs
content/build/verification passed. Downstream lock inspection confirmed that
only Common metadata, the two mail dependencies and their direct host pins
changed. This is local evidence; fresh Linux CI and host-specific SMTP/TLS
staging remain required before release/adoption.

## Upgrade, mitigation and rollback

After human acceptance and CI publication, record the **actual** patch version,
package tag/release URL, tarball integrity, source commit and passing CI URL in
FoF #143 and #162 before marking adoption unblocked. No such release exists for
this candidate yet; linking this guide does not satisfy that artifact gate.
For existing 0.5 hosts, install that exact reviewed patch together with
`@nestjs-modules/mailer@3.0.2`, `nodemailer@10.2.1`, and `handlebars@4.7.10`, then
freeze the lock and verify `npm ls --all` and actual contact mail delivery.
Never use forced peers. Do not apply this as a drop-in 0.3/0.4 upgrade without
reviewing their intervening API changes.

For public contact forms, keep recipient and sender server-controlled; accept
only a bounded, validated single mailbox for reply-to. Keep template names,
template files, helpers, transport settings and headers under application
control. Escape user text; do not pass request objects to `sendMail` or allow
user-provided template paths (including absolute paths, traversal and symlinks).
Use `forRootAsync` with `disableFileAccess: true` and `disableUrlAccess: true`
**inside transport options**; retain trusted template directory setup. These
flags protect Nodemailer content sources, not the template adapter's own file
reads or CSS processing. The pass-through custom transport contract is unchanged;
applications needing local/remote attachments must explicitly assess that access.

These input restrictions reduce exposure on legacy hosts but cannot repair every
old SMTP/DNS/parser defect. Until an accepted old-line backport or verified host
upgrade exists, the effective containment is to disable the public mail-sending
endpoint or bind a host-owned MailerPort using a separately verified patched
transport. Return an honest unavailable response or use an existing durable
submission workflow; do not use noop while telling users mail was delivered.
Do not claim that file/URL flags alone fix Nodemailer 8: several advisories bypass
them. FoF's current consumer remains blocked pending its own adoption evidence.

Before rollout save the previous deployment and lockfile. Roll back application
code only while retaining the verified patched transport where possible. If the
old artifact requires vulnerable peers, disable mail ingress during rollback;
restoring the old lock is not a security-safe rollback. No database migration is
required. Verify SMTP credentials/TLS, provider policies, templates, errors and
attachment workflows in staging, including timeout/retry behavior.

## Release handoff

Humans commit, create/review/merge PRs and authorize release. Versioning and
publication remain CI-owned; no local release or npm publication was performed.
`release.yml` still rejects non-main refs. [#500](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/500)
must establish reviewed maintenance branch, tag ancestry, old dependency contracts,
patch-only routing and explicit dist-tags before any old-line release. Do not
publish main's 0.5 source as a 0.3/0.4 patch. #505 is not a blocker for this work.

**Breaking-change disclosure:** the library candidate retains its API and old
peer combinations. Opting into Nodemailer 10 changes upstream parser, pooling,
timeout and stream behavior and must be tested by each host. MailerPort's already
published void contract remains unchanged. A move from FoF's 0.3 line to 0.5 is
an independent potentially breaking migration.

**Deprecation proposal only:** once a verified replacement/backport exists,
consider deprecating affected Common releases that cannot admit a patched host
stack, with exact versions and upgrade instructions. Deprecation requires human
approval; no package has been deprecated or unpublished here.
