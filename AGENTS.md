<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Agents Instructions - Anarchitecture Bricks 3-Tier

## Role

You are an engineering assistant for an Nx monorepo containing reusable libraries and example applications.

## Allowed Work

- Create, refactor, or remove Nx libraries under `libs/`.
- Create and maintain Nx-managed example applications under `examples/`.
- Update docs (`README.md`, `CONTRIBUTING.md`, and library READMEs).
- Add and maintain TypeBox/Zod DTOs, models, validators, and builders.
- Maintain Nx targets for build/lint/test/docs/publish.
- Maintain OpenAPI generation from implementation under `tools/api-specs` and `docs/openapi`.
- Maintain Compodoc/Storybook docs integration.
- Add tests (unit, contract, e2e) and improve validation quality.

## Forbidden Work

- Do not create or modify any directory under `apps/`.
- Do not manually edit generated OpenAPI artifacts in `docs/openapi/`.
- Do not introduce external dependencies without purpose.
- Do not mix frontend and backend concerns in a single library layer.
- Do not break Nx module boundaries/import rules.
- Do not push directly to `main`.

## Architectural Principles

1. Shared schemas and domain models live in `libs/*/ts`.
2. API documentation is derived from Nest controllers and `@RouteSchema`.
3. Nest controllers must keep `@RouteSchema` pure Fastify schema fields only (`body`, `params`, `querystring`, `headers`, `response`).
4. OpenAPI metadata (`operationId`, `tags`) is assigned centrally in `tools/api-specs/route-metadata.ts` during spec generation.
5. Nest controllers must not define inline TypeBox route schemas; route schemas must be imported from domain TS DTO libraries (`libs/<domain>/ts/src/dtos`).
6. Storybook is the default UI docs experience; Compodoc enriches technical API docs.
7. Keep typed configuration centralized (`registerAs`, injection tokens, provider functions).
8. Keep environment access out of domain logic.
9. Keep dependency direction strict:

- Angular: `ui <- feature -> state -> data-access` | `config`, `util`: available to all layers
- Nest: `presentation -> application <- infrastructure` | `config`, `util`: available to all layers

10. Use subpath exports per layer.
11. Treat example apps as integration and contract validation surfaces, not publishable bricks.
12. For Nest publishable libraries, provide a root "easy mode" facade module for full-stack consumption while preserving layer-specific secondary entry points.
13. Prefer documenting and using root facade modules (`@anarchitects/<domain>-nest`) in quick starts; use secondary entry points for advanced composition/overrides.
14. Configure shared infrastructure transports once at app root (for example mail transport via `CommonMailerModule`) and keep domain infrastructure modules adapter-only wrappers over shared implementations (for example `CommonNodeMailerModule`).
15. When domain infrastructure is optional, expose facade-level feature flags (for example `features.mailer`) and provide safe no-op behavior for disabled features.
16. Keep this repo aligned with `anarchitects/anarchitecture-bricks-ddd` at the domain and capability level, while preserving the 3-tier implementation style in this repo.
17. Treat migration from 3-tier structure to DDD structure as a supported evolution path.

## Library API Paradigm (Maximum Flexibility + Ease of Use)

- Apply this paradigm to all publishable libraries, not only a single domain.
- Provide an easy mode and an advanced mode simultaneously:
  - Easy mode: a root facade module/entry point for minimal host wiring.
  - Advanced mode: secondary entry points with composable modules/services for targeted overrides.
- For configurable Nest modules, prefer dual initialization APIs:
  - `forRoot(options)`: explicit, deterministic, and environment-agnostic.
  - `forRootFromConfig(overrides?)`: environment/config-driven via `registerAs` in the config entry point.
- Keep configuration centralized in the `config` secondary entry point:
  - own `registerAs` namespace and typed config export.
  - expose config-to-options mappers used by module composition.
- Use consistent precedence when resolving options:
  - explicit overrides > config-derived values > hardcoded defaults.
- Keep infrastructure wrappers thin and adapter-focused; shared infrastructure transports should be configured once at app root.
- Ensure docs and tests cover both consumption paths:
  - quick start via facade/easy mode.
  - advanced composition via secondary entry points.
  - deterministic behavior checks for both `forRoot` and `forRootFromConfig`.

## Cross-Repo Alignment Standards

For alignment with the DDD companion repo and migration expectations, follow:

- `docs/guides/alignment-with-bricks-ddd.md`
- `docs/guides/migration-to-bricks-ddd.md`
- `docs/adr/0001-align-with-bricks-ddd-and-support-migration.md`

## Preferred Commands

- `nx run <project>:lint`
- `nx run <project>:test`
- `nx run <project>:build`
- `nx run api-specs:generate|lint|verify|diff|mock`
- `nx run angular-docs:generate`
- `nx run forms-nest-example:contract-test`
- `nx run forms-angular-example:contract-test`

## Expected Output Quality

- Production-ready code and docs.
- Deterministic, reproducible targets.
- Passing lint/build/test for affected scope.
- Consistent architecture boundaries and naming.

## Project Planning And Board Sync

When executing work tied to GitHub issues in this repository, keep the planning board synchronized as part of the implementation workflow.

- Planning project: https://github.com/orgs/anarchitects/projects/15
- Working view: Board
- Sprint field: Milestone
- Status field values: Backlog, Todo, In Progress, In Review, Blocked, Done

### Required Behavior During Issue Work

- Before coding starts on an issue, set the issue Status to In Progress.
- If work is intentionally queued or deferred, set Status to Backlog.
- If work is ready and selected for active execution but not started, set Status to Todo.
- If blocked by dependency, environment, or decision gate, set Status to Blocked.
- When implementation is complete and awaiting human review, approval, or PR handling, set Status to In Review.
- When a PR is opened for the issue, keep or move Status to In Review.
- Set Status to Done only after human acceptance, explicit signoff, or merge confirms the work is complete.

### Scope Rules

- Apply board status updates to parent issues and sub-issues involved in the current implementation.
- Keep Priority and Milestone values intact unless user explicitly asks to change them.
- When creating new implementation sub-issues, assign Milestone based on sprint plan and add to project 15.
- Prefer non-interactive gh commands and confirm updates by querying project items after bulk changes.

## Human In The Loop Governance

For all implementation work, keep humans as the control point for code acceptance and release actions.

### Ownership Rules

- AI coding agents may analyze, edit files, run validation, and suggest commit messages.
- Human developers review all code changes.
- Human developers perform git commit, pull request creation, and pull request merge.
- AI coding agents must never finalize commits or merge PRs as a replacement for human review.
- AI coding agents must not mark issue work as Done based only on local implementation and validation; the correct handoff state is In Review until a human accepts the work.

### Breaking Change And Deprecation Disclosure

- AI coding agents must explicitly call out potential breaking changes in every implementation summary when applicable.
- AI coding agents must explicitly call out when a bug fix may warrant npm package deprecation of existing published versions.
- AI coding agents may propose and prepare deprecation actions, but execution requires explicit human approval.
- Until human approval is provided, deprecation operations must remain proposed-only.

### Commit Guidance

- AI coding agents should always suggest one or more clear commit message options.
- Human developers execute the final commit command.

## Release Workflow Rules

- Release ownership is CI-based via GitHub Actions, not local developer machines.
- Trigger releases using `.github/workflows/release.yml` (`Release (Manual)`), selecting exactly one domain group (`forms`, `auth`, or `common`).
- The release workflow runs full `nx release --groups=<domain> --yes` (versioning, changelog/release notes, git commit/tag/push, GitHub release, publish).
- Use `.github/workflows/publish.yml` (`Publish Packages (Recovery)`) only for manual publish retries after a failed release run.
- Do not run routine local `nx release` before merging PRs.

## New Domain Onboarding Rule

- Whenever a new domain is introduced under `libs/<domain>`, update `nx.json` release groups to add that domain group before or in the same change.
- Ensure the new group uses the established release model (domain-scoped and explicit targeting).
- Update `tools/release/validate-domain-tags.mjs` so folder-to-domain-tag validation includes the new domain mapping.
- Keep release docs (`README.md`, `CONTRIBUTING.md`) aligned with any new release group additions.

## TypeORM Cross-Domain Relationship Convention

Domain libraries **must not define TypeORM relations across domain boundaries**.

### Core Rule

If an entity references an entity from another domain:

- Use a **scalar foreign key field only**
- Do **not import the other domain's entity**
- Do **not define `@ManyToOne`, `@OneToMany`, etc. across domains**
- Do **not extend another domain’s entity class**

### Example

Correct:

```ts
@Entity({ schema: BLOG_SCHEMA, name: 'posts' })
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'author_id' })
  authorId!: string;

  @Column()
  title!: string;

  @Column()
  body!: string;
}
```

Incorrect:

```ts
@ManyToOne(() => UserEntity)
author!: UserEntity;
```

Or:

```ts
export class BlogUserEntity extends UserEntity {
  @OneToMany(() => PostEntity, (post) => post.author)
  posts!: PostEntity[];
}
```

### Why This Rule Exists

Cross-domain relations:

- leak persistence internals across domains
- create circular dependencies
- break modular publishing of domain packages
- blur schema ownership
- cause unstable TypeORM migration generation

### Allowed Relationships

TypeORM relations **are allowed within the same domain**.

Examples:

- `UserEntity ↔ RoleEntity`
- `RoleEntity ↔ PermissionEntity`

### Cross-Domain Foreign Keys in the Database

The database **may still enforce foreign keys across domains**, for example:

```text
blog.posts.author_id → auth.users.id
```

However, these **must not be defined in domain entities**.

Instead use the **two-datasource pattern**.

### Two-Datasource Pattern

#### Runtime DataSource

Used by the application.

Characteristics:

- uses domain entities only
- contains no cross-domain relations
- used by repositories and services

Example:

```text
tools/typeorm/datasource.runtime.ts
```

#### Migrations DataSource

Used only for generating migrations.

Characteristics:

- uses integration schemas
- defines cross-domain foreign keys
- prevents TypeORM from dropping foreign keys during migration generation

Example:

```text
tools/typeorm/datasource.migrations.ts
```

### Integration Schemas

Cross-domain relationships must be defined in **integration-only `EntitySchema` definitions**.

Recommended location:

```text
tools/typeorm/schemas/
```

Example:

```ts
export const BlogPostSchema = new EntitySchema({
  name: 'Post',
  tableName: 'posts',
  schema: 'blog',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    authorId: { type: 'uuid', name: 'author_id' },
    title: { type: String },
    body: { type: String },
  },
  relations: {
    author: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'author_id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
  },
});
```

### Reading Across Domains

When a use case needs data from multiple domains, use one of these approaches:

- application service composition
- query builder joins
- integration views or read models

Do **not** introduce cross-domain relations in entities.

### Summary

| Situation             | Rule                             |
| --------------------- | -------------------------------- |
| Same-domain relation  | Allowed                          |
| Cross-domain relation | Use scalar FK                    |
| Database FK           | Define in integration schemas    |
| Reads across domains  | Use joins or service composition |

## Angular signalStore State Scoping Convention

Domain state stores must **not be globally registered automatically**.

### Core Rule

Signal stores **must not use**:

```ts
providedIn: 'root';
```

Instead stores must be **explicitly provided via provider helpers**.

### Correct Pattern

Store definition:

```ts
@Injectable()
export class FormsStore {}
```

Provider helper:

```ts
export function provideFormsState(): Provider[] {
  return [FormsStore];
}
```

Application usage:

```ts
bootstrapApplication(AppComponent, {
  providers: [...provideFormsState()],
});
```

### Why This Rule Exists

Using `providedIn: 'root'` creates **implicit global singleton state**.

Problems:

- accidental cross-feature state sharing
- hidden coupling between domains
- harder testing and isolation
- reduced control over state lifecycle

Explicit providers ensure:

- predictable state scope
- feature-level isolation
- composable architecture

### Recommended Scope Locations

Stores should be provided in one of these scopes:

| Scope             | Where                     |
| ----------------- | ------------------------- |
| Component subtree | component providers       |
| Feature route     | route providers           |
| Feature module    | feature provider function |
| App-wide          | application bootstrap     |

Example route-scoped state:

```ts
{
  path: '',
  providers: [...provideFormsState()],
  loadComponent: () => import('./page.component')
}
```

### Feature-Level Composition

Features should provide their state and dependencies together.

Example:

```ts
export function provideFormsFeature(): Provider[] {
  return [...provideFormsState(), provideFormsApi()];
}
```

### Forbidden Pattern

```ts
@Injectable({ providedIn: 'root' })
export class FormsStore {}
```

Domain libraries **must never implicitly create global singleton state**.

### Summary

| Situation          | Rule                                   |
| ------------------ | -------------------------------------- |
| Domain store       | No `providedIn: 'root'`                |
| Store registration | Use provider helpers                   |
| App-wide state     | Register in app providers              |
| Feature state      | Register in route or feature providers |
