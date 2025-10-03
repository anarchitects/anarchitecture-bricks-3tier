# Anarchitecture Bricks – 3Tier (Libraries Only)

> **Purpose:** A contract-driven set of reusable libraries, organized with a classic **3-tier pattern**.  
> **No apps in this repo.** Only **libraries** under `libs/`.  
> **Polyglot-ready**: supports TypeScript/Angular/NestJS, Ruby/Rails, and PHP/Laravel.

---

## 🌍 Principles

1. **Contracts-first**

   - The **source of truth** is `contracts/openapi.yaml` (plus optional `asyncapi.yaml`).
   - JSON Schemas live in `contracts/schemas/` (generated).
   - All clients, DTOs, and validators are derived from these contracts.

2. **Libraries-only**

   - This repo contains **no apps**.
   - Consumers (frontends, backends, services) live in separate repositories and consume these libraries.

3. **3-tier approach**

   - **Frontend:** `ui` (dumb) → `feature` (smart) → `data-access` (facades + generated clients).
   - **Backend:** `controllers` → `services` → `infrastructure` (ORM, mail, adapters).
   - **Common:** shared DTOs, models, validators, events.

4. **Polyglot**

   - **TypeScript/Angular/NestJS**
   - **Ruby/Rails**
   - **PHP/Laravel**
   - All stacks follow the same contracts.

5. **Migration path**
   - Start with 3-tier libraries.
   - When complexity grows, migrate to or complement with a **DDD/Hexagonal** setup (`anarchitecture-bricks-ddd-hex`).

---

## 📦 Repository Structure

```
contracts/
  openapi.yaml        # sync API (source of truth)
  asyncapi.yaml       # optional, async events
  schemas/            # generated JSON Schemas
libs/
  common/             # DTOs, models, validators
  ts/                 # TypeScript libs
    web/
      ui/
      feature/
      data-access/    # generated clients here
    api/
      controllers/
      services/
      infrastructure/
  angular/            # Angular-specific UI/feature/data-access
  nest/               # NestJS-specific helpers/adapters
  ruby/               # Ruby generic libs
  rails/              # Rails-specific infra/services
  php/                # PHP generic libs
  laravel/            # Laravel-specific infra/services
tools/
  contract-tests/     # contract tests and schema validation
```

---

## 🚀 Quickstart

```bash
# install dependencies
yarn install

# lint contracts with Spectral
yarn contracts:lint

# generate JSON Schemas
yarn contracts:gen:schemas

# generate TypeScript client
yarn contracts:gen:ts-web
```

Output will be generated at:
`libs/ts/web/data-access/src/generated/api.types.ts`

⸻

## 🔧 Current Tasks (temporary via scripts)

- contracts:lint → Lint contracts/openapi.yaml
- contracts:gen:schemas → Generate JSON Schemas
- contracts:gen:ts-web → Generate TypeScript client
- test:contracts → Run minimal contract tests

These scripts will later be replaced by Nx plugins (inferred tasks-first) from anarchitecture-nx-plugins.

⸻

## 🧩 Roadmap

- ✅ Contracts-first structure
- ✅ 3-tier libraries-only skeleton
- ⏳ Nx plugins for contracts and OpenAPI generation
- ⏳ Extended contract tests (Schemathesis, golden path validation)
- ⏳ Rails & Laravel stub generation
- ⏳ Publish as npm packages / gems / composer packages

⸻

## 📜 License

MIT © Anarchitects
