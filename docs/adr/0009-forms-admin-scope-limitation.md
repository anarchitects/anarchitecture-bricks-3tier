# ADR-0009: Forms Admin Features Must Remain Lightweight

## Status

Accepted

## Context

Forms currently provide submission list/detail UI.

Risk: evolving into workflow/backoffice system.

## Decision

Forms admin features are limited to:

- viewing submissions
- filtering
- basic inspection

## Not Included

- assignment
- workflow
- status transitions
- comments
- case management

## Future Direction

If required, introduce a new domain:

- inbox
- workflow
- case-management

## Consequences

- prevents domain creep
- keeps forms focused
