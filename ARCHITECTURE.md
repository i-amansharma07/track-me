# Architecture

## Overview

This is a monolithic Next.js App Router application with a layered backend architecture.

## Layers

Route Handler → Controller → Service → Repository → Prisma → PostgreSQL

- Route Handlers handle HTTP concerns only.
- Controllers extract validated input and construct responses.
- Services contain business rules, state transitions, and transaction orchestration.
- Repositories encapsulate Prisma database access.

## Module Boundaries

- `src/app/api/*` — API routes (Next.js Route Handlers)
- `src/server/modules/*` — Domain modules (tasks, timelogs, users, analytics)
- `src/shared/*` — Reusable utilities (errors, logging, validation, http helpers)
- `src/db/*` — Database clients (Prisma singleton)
- `src/config/*` — Environment and configuration

## Key Decisions

- Strict TypeScript (`strict: true`) with no `any` usage.
- Absolute imports via `baseUrl` and path aliases (`@/`).
- Prisma singleton to prevent connection exhaustion during development.
- Pino structured logging with environment-dependent levels.
- Zod validates all environment variables at startup.
- No business logic in route handlers; no database queries in controllers.
- Services are independent of Next.js request/response objects.
- Database-level partial unique indexes enforce single active task and single open time log.
- Schema uses UUIDs for Task and TaskTimeLog; Auth.js-compatible User IDs.
- Custom SQL migration for partial unique indexes and title check constraint.
