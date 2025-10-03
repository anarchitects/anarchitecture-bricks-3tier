# Anarchitecture Bricks – 3Tier (Libraries Only)

> **Purpose:** A contract-driven set of reusable libraries, organized with a classic **3-tier pattern**.  
> **No apps in this repo.** Only **libraries** under `libs/`.  
> **Polyglot-ready**: supports TypeScript/Angular/NestJS, Ruby/Rails, and PHP/Laravel.  
> **Domain-first naming**: libraries are published as `@anarchitects/<domain>-<tech>-<layer>`.

---

## 🌍 Principles

1. **Contracts-first**

   - The **source of truth** is `contracts/openapi.yaml` (plus optional `asyncapi.yaml`).
   - JSON Schemas live in `contracts/schemas/` (generated).
   - All clients, DTOs, and validators are derived from these contracts.

2. **Libraries-only**

   - This repo contains **no apps**.
   - Consumers (frontends, backends, services) live in separate repositories and consume these libraries.

3. **Domain-first modularity**

   - Each domain (`contacts`, `bookings`, …) gets its own set of libraries.
   - Package naming:
     - `@anarchitects/<domain>-ts-frontend-data`
     - `@anarchitects/<domain>-angular-data-access`
     - `@anarchitects/<domain>-nest-services`
     - `@anarchitects/<domain>-nest-infrastructure`
   - Shared/generated types live in `@anarchitects/ts-contracts`.

4. **3-tier approach**

   - **Frontend:** `ui` (dumb) → `feature` (smart) → `data-access` (facades + generated clients).
   - **Backend:** `controllers` → `services` → `infrastructure` (ORM, mail, adapters).
   - **Common:** shared DTOs, models, validators, events.

5. **Polyglot**

   - **TypeScript/Angular/NestJS**
   - **Ruby/Rails**
   - **PHP/Laravel**
   - All stacks follow the same contracts.

6. **Migration path**
   - Start with modular 3-tier libraries.
   - When complexity grows, migrate to or complement with a **DDD/Hexagonal** setup (`anarchitecture-bricks-ddd-hex`).

---

## 📦 Repository Structure

```
contracts/
  openapi.yaml
  asyncapi.yaml
  schemas/

libs/
  shared/
    ts/
      contracts/                      # @anarchitects/ts-contracts  (gegenereerde types voor ALLE domeinen)

  contacts/
    ts/
      frontend-data/                  # @anarchitects/contacts-ts-frontend-data  (facades, gebruikt ts-contracts)
    nest/
        services/                     # @anarchitects/contacts-nest-services
        infrastructure/               # @anarchitects/contacts-nest-infrastructure
    angular/
      data-access/                    # @anarchitects/contacts-angular-data-access

  bookings/
    ts/
      frontend-data/                  # @anarchitects/bookings-ts-frontend-data
    angular/
      data-access/
```

---

## 🚀 Quickstart

```bash
# install dependencies
yarn install

# lint contracts with Spectral
nx run contracts:lint

# generate JSON Schemas
nx run contracts:gen-schemas

# generate TypeScript contracts (api.types.ts)
nx run ts-contracts:gen-client

# build a domain lib (example: contacts frontend data)
nx run contacts-ts-frontend-data:build
```

Generated types end up in:
`libs/ts/contracts/src/generated/api.types.ts`
Domain-specific facades (e.g. contacts) re-export and use these types.

⸻

## 🔧 Current Tasks (via Nx)

- contracts:lint → Lint openapi.yaml
- contracts:gen-schemas → Generate JSON Schemas
- ts-contracts:gen-client → Generate TypeScript API types
- contacts-ts-frontend-data:build → Build publishable frontend data lib

These targets will later be replaced or simplified using inferred Nx plugins from anarchitecture-nx-plugins.

⸻

## 🧩 Roadmap

- ✅ Contracts-first structure
- ✅ 3-tier, domain-first libraries-only skeleton
- ⏳ Nx plugins for contracts and OpenAPI generation
- ⏳ Extended contract tests (Schemathesis, golden path validation)
- ⏳ Rails & Laravel stub generation
- ⏳ Publish as npm packages / gems / composer packages

⸻

## 📜 License

MIT © Anarchitects
