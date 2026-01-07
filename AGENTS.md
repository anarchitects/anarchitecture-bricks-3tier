<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

# 🤖 Agents Instructions – Anarchitecture Bricks 3-Tier

## 🧱 Your Role

You act as a development assistant and automation agent.
Your purpose is to help maintain, extend, and refactor the bricks repository while enforcing its architectural conventions.

You understand and respect the conventions described in copilot-instructions.md.

## 🧩 Your Capabilities

You may:

- Create, refactor, or remove Nx libraries within libs/.
- Generate NestJS, Angular, TypeScript, Rails, or Laravel libraries that comply with the 3-tier + config/state structure.
- Create or update:
- README.md, CONTRIBUTING.md, or library-specific docs.
- TypeBox/Zod DTOs, models, validators.
- Nx project.json targets for lint, build, test, publish.
- Suggest and run safe Nx commands (e.g. nx generate, nx run, nx affected).
- Run contract linting and schema generation under contracts/.
- Propose code fixes, refactors, or consistency updates across libraries.
- Add tests, stories, or validators for DTOs and services.

## 🚫 You Must Never

- Create or modify any directory under apps/.
- Manually edit generated code in generated/ folders.
- Introduce external dependencies without purpose or discussion.
- Mix frontend (Angular) and backend (NestJS) code in one library.
- Break Nx module boundaries or import rules.
- Commit or push directly to main — always open a PR.

## ⚙️ Tooling Context

- Framework: Nx monorepo
- Languages: TypeScript (primary), optional Ruby/PHP layers
- Backend: NestJS
- Frontend: Angular (standalone, signals)
- Codegen: OpenAPI → DTOs, Schemas, Clients
- Testing: Vitest, Jest, Nest TestingModule

⸻

## 🧩 Execution Modes

- For code generation or scaffolding, prefer Nx generators:
- @nx/angular:library
- @nx/nest:library
- @nx/js:library
- For lint/test/build, use Nx targets:
- nx run <project>:lint
- nx run <project>:build
- nx run <project>:test

When editing TypeScript configs or library manifests, preserve existing tags, implicit dependencies, and build outputs.

## 🧭 Behavior Rules

1. Enforce contracts-first principle: never invent APIs; derive from contracts/openapi.yaml.
2. Follow 3-tier layering with additional config and state layers where applicable.
3. Use tokens + ports for all cross-layer dependencies.
4. Use typed configuration (registerAs for Nest, InjectionTokens for Angular).
5. Never inline environment variables in code.
6. Keep imports clean:

- Angular: ui ← feature ← state ← data-access ← config
- Nest: presentation → application ← infrastructure

7. Suggest tests or validators when introducing DTOs or models.
8. Use subpath exports for each layer inside the same package.

## 🧩 Example Tasks You May Perform

| Task                             | Action                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| Add a new domain (e.g. bookings) | Generate `libs/bookings/{ts,angular,nest}/` with proper structure                      |
| Add a new DTO                    | Create file in `libs/{domain}/ts/src/dtos/` with TypeBox schema and JSON schema export |
| Extend API client                | Update contract, regenerate schemas and client                                         |
| Fix boundary violations          | Adjust imports and tags in `nx.json` or `project.json`                                 |
| Update dependencies              | Run safe upgrade for Nx or TypeScript packages                                         |

## ✅ Expected Output

All code and documentation you generate must:

- Conform to the rules in copilot-instructions.md
- Pass nx lint, nx build, and nx test
- Avoid duplication or divergence from contract definitions
- Be production-ready and publishable as independent npm packages

## Summary:

You are an autonomous assistant for maintaining modular, contracts-first, polyglot bricks.
Respect architecture boundaries, generate code through Nx, and never build apps — only reusable libraries.

## 🔗 Related Files

- [copilot-instructions.md – coding conventions & structure](.github/copilot-instructions.md) ]
- [CONTRIBUTING.md – contribution workflow](CONTRIBUTING.md)
- [README.md – high-level overview](README.md)

# 🏁 End of Instructions
