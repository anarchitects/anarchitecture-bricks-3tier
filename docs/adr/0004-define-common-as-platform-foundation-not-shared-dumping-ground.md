# ADR-0004: Define `libs/common` As Platform/Foundation, Not A Shared Dumping Ground

## Status

Accepted

## Context

The repository contains a `libs/common` area with reusable packages such as:

- `common-angular-design`
- `common-angular-ui-composition`
- `common-angular-ui-layouts`
- `common-angular-ui-primitives`
- `common-nest-mailer`

These packages are currently useful across multiple domains, especially `auth` and `forms`.

However, a `common` area can easily degrade into a shared dumping ground when reusable code is moved there merely because more than one package needs it. That weakens domain boundaries, obscures ownership, and makes future DDD alignment harder.

The 3-tier repository therefore treats `libs/common` as a deliberately governed platform/foundation area, not as a default location for shared code.

## Decision

`libs/common` is reserved for domain-neutral platform and foundation capabilities.

A package may live in `libs/common` only when it satisfies all of the following criteria:

1. It is domain-neutral.
2. It is useful to at least two current or clearly planned domains.
3. It is stable enough to be depended on by domain packages.
4. It is not named after a business concept.
5. It does not own business decisions, business lifecycle, or domain policies.
6. It is not a workaround for avoiding a new domain package.

The conceptual rule is:

```text
Common provides technical vocabulary.
Domains provide business vocabulary.
```

## Accepted Common Capabilities

The following categories are acceptable in `libs/common`:

- design tokens and semantic design hooks
- UI primitives such as buttons, badges, alerts, cards, field wrappers, and inputs
- UI composition mechanisms such as slots, template projection, and generic layout hosting
- technical infrastructure seams such as generic mail transport provider wiring
- framework-neutral utilities only when they are genuinely domain-neutral and stable

## Rejected Common Capabilities

The following must not be placed in `libs/common`:

- contact form semantics
- password reset semantics
- booking workflows
- submission approval workflows
- user profile or identity concepts
- role and permission business management
- business-specific email templates
- business-specific notification logic
- domain-specific DTOs, entities, or command models

If a concept has business language, lifecycle, ownership, policies, or workflows, it belongs in an existing domain package or a new domain package.

## Examples

| Candidate                      | Decision                | Rationale                                                          |
| ------------------------------ | ----------------------- | ------------------------------------------------------------------ |
| Button, badge, alert, card     | Common                  | Domain-neutral UI primitive                                        |
| Design tokens                  | Common                  | Cross-domain design foundation                                     |
| Slot/template directives       | Common                  | Domain-neutral UI composition                                      |
| Layout host                    | Common with constraints | Generic UI layout orchestration                                    |
| Mail transport setup           | Common                  | Technical infrastructure seam                                      |
| Contact message handling       | Not common              | Belongs to forms, site, contact, or support depending on semantics |
| Password reset email semantics | Not common              | Belongs to auth                                                    |
| Booking confirmation           | Not common              | Belongs to booking                                                 |
| Role management UI             | Not common              | Belongs to auth or a future IAM/access-control capability          |

## Consequences

### Positive

- Prevents `libs/common` from becoming an unowned shared dumping ground.
- Keeps domain language in domain packages.
- Preserves clean migration and alignment paths toward `anarchitecture-bricks-ddd`.
- Makes common packages more stable and reusable.
- Makes ownership and dependency rules easier for AI agents and humans to reason about.

### Negative

- Some reusable code may need a domain-specific home instead of being centralized immediately.
- New domain packages may need to be introduced earlier when shared business concepts emerge.
- Contributors must evaluate reuse against ownership and domain language, not just duplication.

## Enforcement Guidance

When proposing a new package or moving code into `libs/common`, reviewers and AI agents must ask:

1. Is this domain-neutral?
2. Would this concept still make sense outside the current business domain?
3. Is this a technical/platform concept or a business concept?
4. Does it introduce business words into common?
5. Could this belong to an existing domain or a new domain instead?
6. Would moving it to common make future DDD alignment harder?

If the answer is uncertain, keep the code in the domain package until the common abstraction is proven.
