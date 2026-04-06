---
name: project-board-sync
description: Keep GitHub Project 15 board status synchronized while implementing issues. USE WHEN user asks to start implementation, work an issue, create sub-issues, move issue status, or keep Board current during coding.
---

# Project Board Sync

Use this skill during issue-driven implementation to keep the planning board aligned with actual execution.

## Target Project

- Project: https://github.com/orgs/anarchitects/projects/15
- Owner: anarchitects
- Number: 15
- Working view: Board
- Sprint field: Milestone
- Status options: Backlog, Todo, In Progress, In Review, Blocked, Done

## Required Workflow

1. At implementation start:

- Set active parent issue and active sub-issues to In Progress.

2. During execution:

- Set Blocked immediately when work cannot proceed.
- Keep active and inactive issues separated.
- Keep Milestone and Priority unchanged unless user asks to modify them.

3. Review handoff:

- Set issue to In Review when implementation is complete and awaiting human review, approval, or PR handling.
- If a PR is opened, keep the issue in In Review unless a human explicitly accepts or closes the work.

4. Completion:

- Set Done only after a human accepts the implementation, explicitly signs off, or merges the corresponding PR.

## Common Board Operations

1. Read fields:

- gh project field-list 15 --owner anarchitects --format json

2. Read project items:

- gh project item-list 15 --owner anarchitects --format json

3. Edit one field value on one item:

- gh project item-edit --id <item-id> --project-id <project-id> --field-id <field-id> --single-select-option-id <option-id>

4. Add issue to project:

- gh project item-add 15 --owner anarchitects --url https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/<issue-number>

## Status Mapping Guidance

- Backlog: prioritized but not selected for active execution.
- Todo: selected for active sprint but not started.
- In Progress: currently being implemented.
- In Review: implementation is finished by the agent and is awaiting human review, approval, or PR completion.
- Blocked: waiting for dependency, decision, or environment fix.
- Done: human-accepted and complete.

## Safety Rules

- Use non-interactive gh commands.
- Verify updates with a read-after-write query.
- Avoid bulk overwrites without issue number filters.
- Report changed issue numbers and resulting statuses in the final response.

## Human In The Loop Rules

- Treat board updates as AI-assisted planning operations under human supervision.
- Human developers review code, perform commits, create PRs, and merge PRs.
- AI coding agents may suggest commit messages, but commit execution remains human-owned.
- AI coding agents must not move an issue directly from active development to Done without explicit human acceptance.
- When implementation changes may be breaking, explicitly call that out in updates and summaries.
- When bug-fix impact suggests package deprecation on npm, explicitly call this out and require explicit human approval before any deprecation execution.
