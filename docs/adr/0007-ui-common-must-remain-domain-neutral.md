# ADR-0007: UI Common Packages Must Remain Domain-Neutral

## Status

Accepted

## Context

Common UI packages provide reusable primitives and layout mechanisms.

Risk: leaking domain-specific behavior into shared UI libraries.

## Decision

UI common packages must remain strictly domain-neutral.

## Allowed

- Button
- Card
- Layout host
- Slot projection

## Not Allowed

- LoginForm
- SubmissionList (if business-specific)
- RolePicker

## Special Case: Layouts

Built-in layout types (form, list, detail) are treated as:

```
UI archetypes, not domain concepts
```

## Consequences

- prevents UI layer from becoming domain layer
- preserves reusability
