# TS Contracts Guide

## Intent

This guide is the canonical source for contract ownership in Anarchitecture Bricks. It defines where DTOs, schema contracts, and domain models live, and how Angular and Nest libraries consume them.

For shared design/runtime UI contracts, see [Design/UI Systems Guide](/guides/design-ui-systems.html).

## Contract Ownership Model

- Contract source of truth is the domain TS packages: `@anarchitects/forms-ts` and `@anarchitects/auth-ts`.
- Angular and Nest packages consume contracts; they do not own contract definitions.
- OpenAPI generation must be derived from controller route schemas that import from TS contract packages.
- Contract changes should be introduced in TS first, then propagated to Nest/Angular consumers in the same change-set.

## Domain Contract Matrix

| Domain | Canonical TS Contract Package | Angular Consumer | Nest Consumer |
| --- | --- | --- | --- |
| Forms | `@anarchitects/forms-ts` | `@anarchitects/forms-angular` | `@anarchitects/forms-nest` |
| Auth | `@anarchitects/auth-ts` | `@anarchitects/auth-angular` | `@anarchitects/auth-nest` |

## Forms TS Contracts

Use `@anarchitects/forms-ts` for:

- form definition DTOs and schema fields used by dynamic rendering
- form submission payloads and validation response contracts
- domain-level model shapes that both frontend and backend depend on

Do not redefine Forms contracts inside `@anarchitects/forms-angular` or `@anarchitects/forms-nest`.

## Auth TS Contracts

Use `@anarchitects/auth-ts` for:

- auth lifecycle DTOs (register, login, refresh, activate, reset flows)
- session/token response shapes and policy-relevant flags
- shared auth model types that must stay stable across frontend/backend

Do not redefine Auth contracts inside `@anarchitects/auth-angular` or `@anarchitects/auth-nest`.

## Consumer Mapping (Angular and Nest)

- Angular (`@anarchitects/forms-angular`, `@anarchitects/auth-angular`):
  consume TS contracts in data-access/state adapters and keep UI/feature layers contract-safe.
- Nest (`@anarchitects/forms-nest`, `@anarchitects/auth-nest`):
  import TS contracts in presentation/application layers and keep controller route schemas aligned.
- Design/UI behavior depends on stable contracts:
  keep DTO evolution coordinated with frontend runtime layout and composition expectations.

## Contract Change Workflow

1. Update contract types/schemas in `@anarchitects/forms-ts` or `@anarchitects/auth-ts`.
2. Update Nest route schema imports and application mappings.
3. Regenerate OpenAPI artifacts and inspect for breaking changes.
4. Update Angular data-access/state adapters and feature orchestration.
5. Run contract and docs validation before merge.

## Compatibility Rules

- Prefer additive changes first (new optional fields).
- Deprecate before remove, and document migration windows.
- Keep endpoint behavior stable while introducing new capabilities.
- Avoid renaming/removing contract keys without synchronized consumer updates.
- When a breaking change is unavoidable, coordinate TS, Nest, Angular, and docs in one planned release change.

## Verification Checklist

- TS contracts updated in canonical package (`@anarchitects/forms-ts` or `@anarchitects/auth-ts`).
- Nest route schemas import canonical contracts (no inline schema drift).
- OpenAPI regenerated and reviewed for compatibility impact.
- Angular contract consumers updated and tested.
- Docs refreshed and validated:
  `yarn nx run docs-hub:validate-content`,
  `yarn nx run docs-hub:build`,
  `yarn nx run docs-hub:verify`.
