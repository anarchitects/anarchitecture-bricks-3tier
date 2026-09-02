# ADR-0006: Forms Must Not Replace Typed Domain APIs

## Status

Accepted

## Context

Forms submissions use dynamic payloads:

```
payload: Record<string, unknown>
```

This is flexible but unsuitable for core domain commands.

## Decision

Forms are strictly for configurable intake, not domain command APIs.

## Allowed

```
POST /forms/submit
{
  formId: "contact",
  payload: {...}
}
```

## Not Allowed

```
POST /bookings
{
  unitId,
  startDate,
  endDate
}
```

## Rule

```
Forms handle variability.
Domains handle correctness and lifecycle.
```

## Consequences

- Domain APIs remain strongly typed
- Prevents dynamic data from replacing domain models
