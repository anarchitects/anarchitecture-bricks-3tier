# ADR-0005: Define Forms As A Configurable Intake Domain

## Status

Accepted

## Context

The repository includes a `forms` domain providing:

- dynamic form configuration
- form rendering
- submission handling
- validation
- delivery (email/webhooks)

This introduces a risk that `forms` becomes a generic business workflow engine instead of a reusable capability.

## Decision

The `forms` domain is defined as a **configurable intake capability**, not a business domain.

Core rule:

```text
Forms owns capture.
Domains own meaning.
```

## Responsibilities of Forms

Forms owns:

- form definitions (`FormConfig`)
- dynamic rendering
- validation
- submission storage
- generic delivery (email/webhook)
- basic submission inspection

Forms does NOT own:

- business workflows
- domain decisions
- entity lifecycle
- approval, assignment, or state transitions

## Examples

| Scenario        | Forms Responsibility | Domain Responsibility |
| --------------- | -------------------- | --------------------- |
| Contact form    | Capture message      | Handle/support logic  |
| Booking form    | Capture extra fields | Booking lifecycle     |
| Job application | Capture answers      | Recruitment process   |

## Constraints

Forms must NOT:

- replace typed domain APIs
- model domain processes as generic forms
- own workflow logic
- introduce domain-specific behavior

## Consequences

### Positive

- High reuse
- Clear separation of concerns
- Alignment with DDD evolution

### Negative

- Requires discipline from consuming domains
