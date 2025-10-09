# 🧱 Anarchitecture Bricks – 3-Tier (Libraries Only)

> **Purpose:** Modular, **contracts-first**, reusable libraries for scalable software architectures.  
> **No apps.** Only **publishable libraries** under `libs/`.  
> **Polyglot-ready:** supports **TypeScript**, **Angular**, **NestJS**, **Rails**, and **Laravel**.  
> **Domain-first design:** one package per domain per tech stack, organized into clear tiers.

## 🌍 Core Principles

1. **Contracts-first**
   - The **source of truth** is `contracts/openapi.yaml` (and optional `asyncapi.yaml`).
   - JSON Schemas are generated under `contracts/schemas/`.
   - All DTOs, validators, and clients are **derived from the contracts**, never hand-written.

2. **Libraries-only**
   - This repository contains **no apps or bootstraps**.
   - Apps (frontend, backend, mobile, etc.) consume these packages via npm/gem/composer.

3. **Domain-first modularity**
   - Each **domain** (`contacts`, `bookings`, …) has one package per tech stack:
     ```
     @anarchitects/<domain>-ts
     @anarchitects/<domain>-angular
     @anarchitects/<domain>-nest
     ```
   - Each package uses **subpath exports** for its layers (e.g. `/application`, `/feature`, `/config`, …).

4. **3-Tier + Config/State pattern**
   - A lightweight, conventional structure that keeps logic layered yet practical.
   - Angular → `ui` → `feature` → `state` → `data-access` → `config`
   - NestJS → `presentation` → `application` ← `infrastructure` (+ `config`)
   - Common → shared `dtos`, `models`, `validators`, `messaging`.

5. **Polyglot architecture**
   - **TypeScript/Angular/NestJS** are first-class.
   - **Rails** and **Laravel** follow the same contracts for parity.

6. **Migration path**
   - Start with modular 3-tier bricks.
   - Gradually evolve toward a **DDD/Hexagonal** setup (`anarchitecture-bricks-ddd-hex`) when complexity grows.

---

## 📦 Repository Structure
```
contracts/
  openapi.yaml                # API source of truth
  asyncapi.yaml               # optional async events
  schemas/                    # generated JSON Schemas

libs/
  common/
    ts/
      dtos/                   # @anarchitects/common-ts/dtos
      models/                 # @anarchitects/common-ts/models
      validators/
      messaging/

  contacts/
    ts/                       # @anarchitects/contacts-ts
    ├─ dtos/
    ├─ models/
    └─ index.ts

  angular/                  # @anarchitects/contacts-angular
    ├─ ui/                  # presentational components
    ├─ feature/             # facades, ports
    ├─ state/               # signal store
    ├─ data-access/         # API adapters & generated clients
    ├─ config/              # InjectionTokens & providers
    └─ util/

  nest/                     # @anarchitects/contacts-nest
    ├─ presentation/        # controllers
    ├─ application/         # use-cases, ports
    ├─ infrastructure-persistence/
    ├─ infrastructure-mailer/
    ├─ config/              # typed registerAs config
    └─ util/
```

## 🚀 Quickstart

```bash
# Install dependencies
yarn install

# Validate and generate from contracts
nx run contracts:lint          # Spectral lint
nx run contracts:gen-schemas   # JSON Schemas
nx run contracts:gen-ts        # Generate TS DTOs + clients

# Build a domain package (e.g. Contacts)
nx run contacts-angular:build
nx run contacts-nest:build
```

## 🧭 Package Naming & Imports

Each domain has one package per tech stack with subpath exports:

| Tech              | Example Import                                      | Description                |
|-------------------|-----------------------------------------------------|----------------------------|
| Angular           | @anarchitects/contacts-angular/feature              | Feature/facade layer       |
|                   | @anarchitects/contacts-angular/state                | Signal store               |
|                   | @anarchitects/contacts-angular/config               | Tokens/providers           |
| NestJS            | @anarchitects/contacts-nest/application             | Services & ports           |
|                   | @anarchitects/contacts-nest/presentation            | Controllers                |
|                   | @anarchitects/contacts-nest/infrastructure-persistence | TypeORM repo            |
|                   | @anarchitects/contacts-nest/config                  | registerAs config          |
| TypeScript Common | @anarchitects/contacts-ts/models                    | Shared models              |


## 🧩 Layer Overview

| Layer            | Stack          | Purpose                                  |
|------------------|----------------|------------------------------------------|
| ui               | Angular        | Presentation (dumb components)           |
| feature          | Angular        | Orchestration, ports                     |
| state            | Angular        | Reactive Signal Store                    |
| data-access      | Angular        | API adapters, generated clients          |
| config           | Angular / Nest | Typed configuration (InjectionTokens or registerAs) |
| presentation     | Nest           | Controllers / routing                    |
| application      | Nest           | Business logic, ports                    |
| infrastructure-* | Nest           | Adapters (DB, mail, external APIs)       |
| common           | TS             | DTOs, models, validators, events         |


## 🧩 Dependency Direction
```
Angular:       ui ← feature ← state ← data-access ← config ← dtos/models
NestJS:         presentation → application ← infrastructure
Shared/Common:  used across both, never depends on framework code
```


## ⚙️ Tooling
- Nx for build, lint, test, and publish orchestration.
- TypeBox / Zod for DTOs and schemas.
- Vitest / Jest for unit testing.
- Spectral for contract linting.
- OpenAPI Generator for client creation.
- TypeORM / MailerModule for infra adapters.
- Angular Signals for reactive state.

## 🤖 Copilot & Agents

This repo integrates GitHub Copilot Chat & Agents for consistent automation.
- `.github/copilot-instructions.md` – authoritative coding conventions (layering, contracts-first, naming, codegen rules).
- `AGENTS.md` – operational limits for automation (Nx tooling, no apps, safe commands).
Coding conventions, layering rules, and naming standards.

⸻

## 🔧 Nx Targets

| Command                         | Description                       |
|---------------------------------|-----------------------------------|
| `nx run contracts:lint`         | Lint the OpenAPI contract         |
| `nx run contracts:gen-schemas`  | Generate JSON Schemas             |
| `nx run contracts:gen-ts`       | Generate TS clients & DTOs        |
| `nx run <domain>-angular:build` | Build Angular package             |
| `nx run <domain>-nest:build`    | Build Nest package                |
| `nx affected -t build`          | Build all changed libraries       |


⸻

## 🧩 Roadmap
- ✅ Contracts-first structure
- ✅ Domain-first, subpath-exported libraries
- ✅ Config & State layers for Nest/Angular
- ⏳ Nx inferred-tasks plugins (anarchitecture-nx-plugins)
- ⏳ Extended contract testing (Schemathesis)
- ⏳ Rails & Laravel stub generation
- ⏳ Automated publishing to npm/gems/composer

## 📜 License

MIT © Anarchitects
