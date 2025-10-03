# 📄 `CONTRIBUTING.md`

````markdown
# Contributing – Anarchitecture Bricks 3Tier

Thank you for contributing! 🚀  
This repository contains **only libraries** and follows a **contracts-first** approach.

---

## 📐 Core Rules

1. **Contracts-first**

   - All changes start in `contracts/openapi.yaml` (and optionally `asyncapi.yaml`).
   - Run `yarn contracts:lint` to validate the spec.
   - Regenerate schemas and clients with `yarn contracts:gen:*`.

2. **No apps**

   - This repo only contains **libraries**.
   - No Angular apps, no NestJS apps, no Rails or Laravel apps.
   - Consumers live in separate repos.

3. **3-tier pattern**

   - **Frontend libraries:**
     - `ui` = dumb/presentational
     - `feature` = smart orchestration
     - `data-access` = facades + generated clients
   - **Backend libraries:**
     - `controllers` = controller interfaces
     - `services` = business logic
     - `infrastructure` = adapters (DB, mail, external APIs)
   - **Common:** DTOs, models, validators, events.

4. **Polyglot discipline**
   - Contracts apply across all stacks.
   - TS, Rails, and Laravel implementations must comply with the same contracts.
   - If a stack is not yet implemented → create stubs.

---

## 🛠 Workflow

```bash
# install dependencies
yarn install

# lint contract
yarn contracts:lint

# generate schemas & clients
yarn contracts:gen:schemas
yarn contracts:gen:ts-web

# run contract tests
yarn test:contracts
```
````

⸻

## ✅ Commits & Pull Requests

- Use Conventional Commits:
  - feat(scope): ..., fix(scope): ..., chore(scope): ...
- Scope = library or slice (e.g., ts-web-data-access, rails-infrastructure, laravel-services).
- PR description should explain:
- What changed
- Why it was needed
- Whether contracts were impacted (breaking / non-breaking)

⸻

## 🧪 Testing

- Unit tests per library
- Contract tests (tools/contract-tests/) validate payloads against JSON Schemas
- No E2E tests here – those happen in consumer apps.

⸻

## 🔧 Nx and Plugins

For now we use yarn scripts for contracts and codegen.
Later these will be replaced by Nx plugins (@anarchitects/nx-contracts, @anarchitects/nx-openapi) using inferred tasks-first.
→ You won’t need to write project.json files manually.

⸻

## 💡 Tips

- Keep common clean and minimal.
- Respect boundaries (ui must not import feature, controllers must not import infrastructure directly).
- Export only reusable and framework-agnostic code.
- Always keep libraries app-agnostic.

**Happy contributing! 🙌**
