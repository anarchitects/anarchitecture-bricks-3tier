---
name: monitor-ci
description: troubleshoot ci, workflow, build, test, lint, contract-test, docs, or release failures in anarchitecture-bricks-3tier. use when a github action, nx target, package publish flow, openapi check, compodoc or storybook build, or example-app validation fails and the task is specifically about diagnosing and fixing that repo without changing its architectural rules.
---

# Overview
Use this skill when CI or repo automation is failing in `anarchitecture-bricks-3tier`.

Inspect these sources first when relevant:

- workflow logs and failed job output
- `AGENTS.md`
- `README.md`
- the affected package `README.md`
- `docs/adr/0002-do-not-split-libraries-by-audience-until-workflow-divergence-is-real.md` when the failure is tied to package boundaries or library placement

## Required workflow
1. Identify the failing workflow, job, and Nx target.
2. Reduce the failure to the smallest reproducible command.
3. Fix the root cause, not just the symptom.
4. Preserve repo architecture, release rules, and docs-generation conventions.
5. Summarize the root cause, touched files, validation commands, and any remaining risk.

## Repo-specific checks
- Use package-manager-prefixed Nx commands.
- Respect the docs-surface and release workflow rules already documented in the repo.
- Do not “fix” OpenAPI or docs failures by editing generated artifacts directly.
- Do not bypass module boundaries or simplify architecture just to make CI green.
- Do not move features into audience-specific libraries (`admin`, `public`, `backoffice`, etc.) as a quick fix unless there is genuine workflow divergence that justifies the split.
- If a failure is tied to cross-repo alignment with `anarchitecture-bricks-ddd`, mention that explicitly.

## Output expectations
When proposing or applying a fix, report:
- failing target(s)
- root cause
- fix implemented
- validation run or validation still needed
- whether the fix could have breaking or release implications
