# Canonical HTTP conformance and release gates

## Intent

Contracts owns public HTTP schemas and operations. Bricks consumes immutable
published packages, tests its adapters and records implementation evidence.
Generated `docs/openapi` describes the documentation fixture and is never a
replacement canonical contract or a deployed host's security profile.

## Supported inputs and capability limits

| Domain     | Exact canonical dependency                 | Implementation evidence                                                                         | Remaining approval                                                                |
| ---------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Auth       | `@anarchitects/auth-contracts@0.1.0`       | Default/configured validation, session cookies, JWT and passkey integration fixtures            | Exact host configuration, security bindings and configured OpenAPI profile review |
| Forms      | `@anarchitects/forms-contracts@0.2.0`      | Dynamic validation before storage/mail; safe public definition DTO; positive/negative HTTP      | D05/D08 exact-host evidence, access policy and exposed-secret rotation            |
| Identity   | `@anarchitects/identity-contracts@0.0.1`   | Profile CRUD, coercion, nullable fields and serialized HTTP responses                           | Exact host authentication/resource authorization evidence                         |
| Newsletter | `@anarchitects/newsletter-contracts@0.1.0` | Native lifecycle, strict input, honeypot order, raw signed webhooks, limits and replay fixtures | Exact host/provider/security configuration and deployment compliance              |

These versions are pinned in the root and domain TS manifests. They are not Bricks
package versions. Full deployment capability approval is not implied by a passing
fixture. Published manifests intentionally contain unresolved host obligations;
protected operations may be absent from canonical OpenAPI `paths` but remain in
its published inventory. Forms 0.2.0 makes the safe public definition envelope normative. HTTP checks use
the published `getFormDefinition` response directly, with no local schema override.
This resolves the upstream D08 operation discrepancy; D05 dynamic validation and
D08 access, serialization and secret-rotation evidence remain separate host gates.

The existing Nest 11/12 and Angular consumer support ranges remain unchanged.
Nest 11 maintenance remains patch-only; this work does not introduce native Nest
12 authentication, authorization or a different HTTP adapter. See the
[packed Nest matrix](nest-release-validation.md) and each package's runtime peers.

## Local and CI checks

Use the repository tooling Node version, immutable Yarn install, Docker and npm
registry access for the packed tests:

```sh
yarn install --immutable
yarn nx run-many -p api-specs -t lint,verify,diff,test --parallel=1
yarn nx run api-specs:conformance-http
yarn nx run release-tools:test
```

`generate` boots the actual controllers, including optional JWT routes, and
collects their Fastify schemas. IDs and tags derive from all four canonical
operation arrays. `verify` checks artifact hashes, exact dependency versions,
all 29 inventory routes, success statuses and controller schema purity.
It writes `dist/api-conformance/openapi-comparison.json`, including structural
request/parameter/response/security differences and unresolved obligations.
Structural differences are diagnostic; route verification is not schema equality
or proof of host protection. Canonical Zod semantics remain required.

`conformance-http` packs Auth, Forms/Identity and Newsletter into fresh locked
Nest 11 hosts outside the workspace. Their existing application/database tests
now send TCP requests to ephemeral loopback ports and parse response bodies and
present headers with the installed canonical operation schemas. Repeated
`Set-Cookie` values are checked separately. Explicit disabled-capability and
unsupported-method cases assert 404 separately, without claiming operation
support. Custom route prefixes are mapped explicitly. No production account is
called. Existing service/persistence, passkey verifier/browser and broader runtime
matrix checks remain required; the command requires a successful response for all 29 operation IDs and negative
responses in every domain. Ten Auth recovery/passkey outcomes use explicitly
labelled adapter-only service doubles, alongside the real session/guard/verifier
flows; they do not prove recovery-token or WebAuthn verification. Not every error
outcome is exercised, and absent headers need host-specific security tests.

The HTTP runner holds the same parent Ryuk session as the packed compatibility
matrix across all three child processes. Each child still owns its PostgreSQL
container and cleanup. This prevents the idle interval during the next host's
install/compile from letting Ryuk shut down before that host reconnects. Failures
remain fatal; there is no retry, disabled Reaper or skipped conformance assertion.
Both Nest configurations retain the packed artifact prerequisite and run uncached.

The target enables the `testcontainers` debug namespace (runtime discovery,
Reaper IDs, connection endpoints and socket errors), excluding container/exec log
namespaces. Structured diagnostics at host boundaries record localhost resolution,
DNS order, explicit host override, and the Docker CLI's Ryuk status/port bindings.
On failure they also collect bounded Ryuk logs. Docker probes are read-only,
time-limited and best-effort; they do not replace the original failure. Application
container environments and Docker credentials are not included in these probes.
Keep the runner's host resolution default unless the recorded addresses and socket
errors demonstrate a need for an environment-specific override.

The PR workflows run these checks unconditionally and retain comparison/HTTP
logs with the documentation preview. The separate packed runtime matrix reuses
the same response assertions on its supported lanes. CI evidence is tied to the
reviewed commit; a local run does not certify a Linux runner or deployed host.

## Compatibility and releases

`diff` compares implementation wire descriptions against `GITHUB_BASE_SHA`, then
`NX_BASE`, then an explicit positional base or `origin/main`. It keeps OpenAPI
3.1 semantics, resolves local references and rejects unresolved/external refs.
It conservatively requires review for changes to existing operations, including
request/response constraints, statuses, headers and security. New documentation
must reference a published canonical operation. Prose alone is not a wire change.
The retired editable operation snapshot cannot make a changed API pass.

For a legitimate wire change, inspect `dist/api-conformance/compatibility.json`,
review the canonical version/profile and prepare `tools/api-specs/compatibility-review.json`.
It must contain `status: approved`, the comparison's SHA-256 fingerprint from the
failure, `owner`, an Anarchitects GitHub `decision` URL, `migration` and `rollback`.
A human must approve that exact comparison. The fingerprint includes both wire
surfaces and the canonical artifact versions/hashes; stale approval fails.
A local record does not grant permission to author a new canonical wire contract.

Before release mutation, the domain runner asks Nx for a dry-run version result
and compares each selected public package against its own current release tag.
A canonical dependency change or changed domain wire description requires the
actual proposed next minor for 0.x, or next major for 1.x and later. Patch/manual
bump overrides cannot bypass this floor. Missing published history fails closed.
This conservative floor may require a reviewed wider bump; it never silently
interprets `fix` as compatibility approval. The release workflow also runs fresh
canonical artifact and packed HTTP checks before versioning.

Use exact Nx project scopes, for example `ci(api-specs): ...` and
`fix(release-tools): ...`; release groups such as `auth` or `newsletter` are not
project scopes. CI validates types and scopes for commits and the PR squash title.
Unscoped subjects are reserved for genuinely repository-wide work. Existing
published history is unchanged. Humans still own code acceptance and release;
no local `nx release`, publish, tag rewrite or deprecation is part of this work.

## Evidence and unresolved work

See [#490's audit](../audits/490-canonical-conformance.md),
[Auth/Identity adoption](../audits/488-canonical-adoption.md) and
[Forms/Newsletter adoption](../audits/489-canonical-adoption.md).
The Forms operation/profile correction is published in Contracts 0.2.0. Reviewed
D05/D08 host and deployment evidence remains required before claiming full stable
capability conformance.
