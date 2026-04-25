# ADR-0006: Common Mailer Is Transport Infrastructure Only

## Status

Accepted

## Context

`common-nest-mailer` provides shared mail functionality.

There is a risk of leaking business logic (password reset, contact handling, etc.) into a common layer.

## Decision

`common-nest-mailer` is strictly a transport layer.

## Responsibilities

- SMTP/Nodemailer wiring
- Mail transport configuration
- Generic MailerPort

## Not Responsible For

- password reset semantics
- contact email semantics
- booking confirmations
- domain-specific templates

## Pattern

Domains define intent:

```
SendPasswordResetEmail
SendBookingConfirmation
```

Common mailer executes transport.

## Consequences

- clean separation of concerns
- supports hexagonal architecture
