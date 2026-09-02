# ADR-0008: Forms Must Prefer Events Over Embedded Business Logic

## Status

Accepted

## Context

Forms currently support delivery configuration (email/webhooks).

Risk: forms evolving into a workflow engine.

## Decision

Forms must expose events, not business logic.

## Example

```
FormSubmittedEvent {
  submissionId
  formId
  payload
}
```

## Usage

- domains subscribe to events
- domains implement business logic

## Not Allowed

- forms deciding business outcomes
- forms owning workflows

## Consequences

- keeps forms generic
- enables extensibility
