# ADR-0002: Do Not Split Libraries By Audience Until Workflow Divergence Is Real

- Status: Accepted
- Date: 2026-04-23
- Deciders: Anarchitects maintainers

## Context

This repository publishes reusable 3-tier domain libraries intended for consumption by multiple host applications.

A recurring design question is whether features should be split into separate libraries based on audience, for example:

- public vs admin
- customer vs staff
- portal vs backoffice

A concrete example is `forms-angular`:

- `form` supports building and rendering forms
- `submission-list` and `submission-detail` support reading form submissions

In one host application, submission-reading surfaces may live behind an admin or staff guard.
In another host application, similar surfaces may be visible to end users, owners, or operators.

If the repository encodes a specific audience into package boundaries too early, it risks:

- coupling reusable capabilities to one deployment context
- reducing reuse across consuming apps
- turning access policy into a packaging concern
- creating premature package proliferation
- making migration and alignment with companion repos harder

## Decision

This repository will **not split libraries by audience as a default rule**.

Instead, libraries should be organized primarily by:

- domain capability
- layer responsibility
- orchestration/workflow surface
- reusable technical concern

Audience-specific packaging such as `*-admin`, `*-public`, or `*-backoffice` should be introduced **only when workflow divergence is real**, not merely because different routes or guards exist.

## What Counts As Real Workflow Divergence

A separate audience-specific library is justified when the admin or staff experience becomes a genuinely different capability surface, for example when it introduces one or more of the following:

- bulk operations
- moderation or review workflows
- audit or governance workflows
- internal-only commands or actions
- materially different state, data-access, or orchestration needs
- dashboards or operational workspaces that are not just guarded versions of the same reusable components

A separate audience-specific library is **not** justified when the difference is primarily:

- route location
- route guard or policy
- layout shell
- host-app composition
- whether a host app exposes the same capability to internal or external users

## Consequences

### Positive

- reusable domain capabilities stay broadly consumable
- access control remains a host-app composition concern
- package boundaries better reflect reusable behavior
- feature/UI libraries remain more portable across consuming apps
- the repo stays aligned with its capability-first architecture

### Trade-offs

- consumers must compose audience-specific pages and route protection themselves
- library naming must stay neutral and capability-focused
- docs must clearly state that access policy is not implied by the library name

## Guidance

### Preferred approach

Keep reusable capability artifacts in their domain library, for example within `forms-angular`:

- `ui/form`
- `ui/submission-list`
- `ui/submission-detail`
- `feature/form`
- `feature/submission-list`
- `feature/submission-detail`

Then let the consuming app decide whether these surfaces are:

- public
- authenticated
- staff-only
- admin-only
- owner-only

using:

- route composition
- route guards or policies
- page-level orchestration
- backend authorization

### Example

`submission-list` and `submission-detail` should remain generic submission-reading capabilities unless they evolve into a materially different admin workflow.

If a host app wants an admin page, it should usually compose one at the app level, for example:

- `AdminFormSubmissionsPage`
- `StaffSubmissionReviewPage`
- `MySubmissionsPage`

using the same reusable library capabilities underneath.

### Escalation path

Create a separate audience-specific library only when the consumer-facing and admin-facing workflow surfaces have diverged enough that sharing the same feature surface becomes confusing or constraining.

## Rule

**Do not split libraries by audience until workflow divergence is real.**

Package by capability first. Treat audience and access policy as composition concerns unless they create a genuinely distinct workflow surface.