# Implementation Plan

## Phase 0: Project Foundation and Architecture (COMPLETE)

- Established folder structure matching specification.
- Configured strict TypeScript with absolute imports.
- Added Zod environment validation (`src/config/env.ts`).
- Added Prisma client singleton (`src/db/prisma.ts`).
- Added Pino structured logging (`src/shared/logger/logger.ts`).
- Added Vitest (`vitest.config.ts`), ESLint (`.eslintrc.json`), and Prettier (`.prettierrc`).
- Added `ARCHITECTURE.md`, `.env.example`, `AGENTS.md` preserved.
- No database models or migrations configured yet.
- No authentication, task APIs, time tracking, or frontend UI implemented.

## Phase 1: Database Design and Prisma Setup (COMPLETE)

- `prisma/schema.prisma` updated with User, Account, Session, VerificationToken, Task, TaskTimeLog models, enums, UUID identifiers, relationships, and indexes.
- Custom SQL migration (`prisma/migrations/20251031_071200_init/`) includes partial unique indexes and check constraint.
- `DB_SETUP.md` created with setup instructions.
- `docs/phases/phase1.md` created.
- Prisma client generated (`npx prisma generate` passes).
- Note: Live PostgreSQL verification deferred per user instruction.

## Phase 2: Authentication and Authorization (COMPLETE - basic session protection)

- Installed `next-auth` and `@auth/prisma-adapter`.
- Configured Auth.js with database session strategy and Google OAuth provider (`src/auth/auth.config.ts`).
- Updated controllers to resolve `userId` from `resolveAuthenticatedUser(req)` instead of placeholder.
- Routes protected: unauthenticated requests return 401.
- Full OAuth session integration ready once `.env` provides real `GOOGLE_CLIENT_ID`/`AUTH_SECRET`.

## Phase 3: Core Backend Infrastructure (COMPLETE)

- Enhanced `AppError` with error codes and standard helpers.
- Standardized HTTP response formats (success, error, pagination).
- Pagination utilities with defaults and caps.
- Zod validation utilities (`validateWithSchema`) that throw structured errors.
- Pino structured logging with request correlation IDs, safe error logging, redaction, request duration/status tracking.
- Auth user helper (`resolveAuthenticatedUser`) for future session resolution.
- TypeScript conventions documented.
- Unit tests added for errors, validation, responses, pagination, logging.

## Phase 4: Task Management Module (COMPLETE — original; soft-delete amendment planned)

- Implemented endpoints: POST /api/tasks, GET /api/tasks, GET /api/tasks/:taskId, PATCH /api/tasks/:taskId, DELETE /api/tasks/:taskId
- Controller, Service, Repository, Schema, Types completed
- CRUD operations with pagination, filtering, ownership scoping
- Validation (Zod), error handling (AppError), response formats (success/error/pagination)
- Active task deletion rejected (409); **original behavior hard-deleted rows** via Prisma `delete` with DB cascade — **superseded by Soft Delete amendment** below
- Status mutation rejected through generic PATCH
- Tests added for module behavior
- CRUD endpoints.

## Phase 5: Task Lifecycle and Time Tracking (COMPLETE)

- Lifecycle endpoints: start, pause, resume, complete
- Transactional service operations with `SELECT FOR UPDATE` and interactive Prisma transactions
- Time-log creation/closure rules enforced
- Active task conflict checks; open log consistency checks
- Time tracking calculations from server timestamps
- Routes implemented; controllers/services/repositories extended
- Build and all checks pass; DB-level concurrency verification deferred

## Phase 6: Productivity Analytics (COMPLETE)

- Endpoints: `/api/dashboard/summary`, `/api/dashboard/daily`, `/api/dashboard/categories`
- Analytics service with summary (counts + tracked seconds), daily (date ranges), categories (tag grouping)
- User isolation, active session duration included, UTC timezone documented
- No N+1 patterns; uses existing task/time-log definitions
- Basic tests added; build and checks pass

## Phase 7: Reliability and Concurrency Verification (COMPLETE)

- Audited all existing code; fixed critical transaction/repository defect (repository uses global `prisma` inside transactions; now passes `tx` correctly).
- Added analytics unit tests; reviewed authorization (scoped by userId in all repository queries, service checks).
- Verified transaction rollback design (interactive Prisma transactions with `SELECT FOR UPDATE`).
- Documented verified scenarios: concurrent starts, same-task double start, cross-user isolation, active delete rejection, lifecycle transitions, time-log consistency.
- Live concurrency integration tests deferred per DB access limitation; all structural checks pass.

## Phase 8: API Documentation and Frontend Contract (COMPLETE)

- Added `API.md` (OpenAPI-style spec) covering auth, all endpoints, schemas, pagination, lifecycle, analytics, timezone (UTC), error codes, integration guide.

## Soft Delete Amendment (PLANNED — docs updated, code not implemented)

**Goal:** `DELETE /api/tasks/:taskId` hides tasks and their time logs from users while retaining rows in PostgreSQL. No restore/admin API in this scope.

**Spec/docs updated:** `PROJECT_SPEC.md`, `API.md`, `ARCHITECTURE.md`, `DB_SETUP.md`, phase docs notes, and this plan. Implementation must follow these docs and preserve existing lifecycle/invariant rules.

### 1. Data model & migrations (Prisma/PostgreSQL)
- Add `deletedAt DateTime?` (nullable) to `Task` and `TaskTimeLog` in `prisma/schema.prisma`.
- Create a new migration (do **not** rewrite applied migrations) that:
  - `ALTER TABLE "Task" ADD COLUMN "deletedAt" TIMESTAMP(3);`
  - `ALTER TABLE "TaskTimeLog" ADD COLUMN "deletedAt" TIMESTAMP(3);`
  - Drop and recreate `Task_active_user_unique` as: `UNIQUE ("userId") WHERE ("status" = 'active' AND "deletedAt" IS NULL)`.
  - Review `TaskTimeLog_open_task_unique` (`WHERE "endedAt" IS NULL`) — active-task deletion remains blocked (409), so normal API flow must not create a soft-deleted open log; add safeguards/tests. Consider whether the index/filter needs `AND "deletedAt" IS NULL` depending on chosen invariant; document decision.
  - Add supporting indexes only if justified by query patterns (e.g., `Task(userId, deletedAt, createdAt)` / include in existing composite strategy) — validate with explain plans during implementation.
- Keep `onDelete: Cascade` FKs as safeguards for future approved hard-delete/admin paths; application delete path uses soft delete.

### 2. Repository layer (`src/server/modules/tasks/task.repository.ts`, timelog repo if introduced)
- `findById` / `findTaskForUpdate` / all task lookups: include `deletedAt: null`.
- `list`: `where` must include `deletedAt: null`; counts must use same filter.
- `findActiveTaskByUser`: include `deletedAt: null`.
- `list` includes `timeLogs`: filter relation to `deletedAt: null` (and keep `startedAt` ordering).
- Replace `delete(id)` hard-delete with `softDelete(taskId, now, tx?)` (or equivalent) that:
  - updates `Task` `deletedAt = now` where `id` and `deletedAt IS NULL` (ownership enforced in service; service passes scoped context).
  - updates `TaskTimeLog` `deletedAt = now` where `taskId` and `deletedAt IS NULL`.
  - runs inside the caller's transaction.
- Time-log helpers (`findOpenTimeLog`, `createTimeLog`, `closeTimeLog`): ensure they operate only on non-deleted contexts; `findOpenTimeLog` should ignore deleted logs if any defensive case exists.
- `TaskService.getTimeLogs` currently queries `prisma.taskTimeLog` directly — move to repository or ensure `deletedAt: null` and task non-deleted/ownership check.

### 3. Service layer (`src/server/modules/tasks/task.service.ts`)
- `delete(id, userId)`:
  - load task with `deletedAt: null` (404 if missing/deleted).
  - keep 409 for `active`.
  - run in `runTransaction` with `SELECT ... FOR UPDATE` on `User` (consistent locking) and perform task+timelog soft-delete atomically.
  - return success payload consistent with API (currently `null` data).
- `list/getById/update/start/pause/resume/complete/reopen/getTimeLogs`: all must treat soft-deleted tasks as not found.
- Lifecycle operations must not resurrect or mutate soft-deleted tasks.

### 4. Controller / routes / schema
- `DELETE` route behavior unchanged at HTTP level except semantics (soft delete). `src/app/api/tasks/[taskId]/route.ts` still delegates to controller.
- `task.controller.ts`: message may remain `"Task deleted"` for backward compatibility; document in API.
- `task.schema.ts`: no client-supplied `deletedAt`/status on create/update; reject unknown fields if schema is strict (current uses Zod object — confirm behavior).
- Types (`task.types.ts`): add `deletedAt` if domain types/DTOs are introduced; API responses should include `deletedAt: null` for visible records.

### 5. Analytics (`src/server/modules/*/analytics` — verify actual location)
- **Critical:** analytics/dashboard summary/daily/categories must exclude soft-deleted tasks and soft-deleted time logs. Active-session duration calculations must not count deleted data.
- Grep all Prisma `task`/`taskTimeLog` queries under `src/server` and `src/app/api/dashboard` and add `deletedAt: null` filters.

### 6. Time logs module
- `src/server/modules/timelogs/*` is currently stubbed; `GET /api/tasks/:taskId/timelogs` is served via `TaskService`/`TaskRepository`. If timelog module is used later, enforce same soft-delete filters.
- No public create/update/delete time-log endpoints (unchanged).

### 7. Frontend (out of backend scope now, but contract noted)
- Client should remove deleted task from state; do not expect `deletedAt != null` records. Docs updated in `API.md`.

### 8. Tests (add when implementing)
- Unit: service delete sets soft-delete path, blocks active, 404 for already deleted/missing, scopes to owner.
- Integration (PostgreSQL): deleted task absent from list/get/timelogs/lifecycle/analytics; time logs hidden; transaction atomicity (task+logs updated together); active-task 409 preserved; partial unique active index still prevents two active non-deleted tasks.
- Concurrency: concurrent delete/start or double-delete behaves safely (404/409/idempotent as specified).
- Update `tests/unit/tasks/task.module.test.ts` and add behavioral tests (current tests are mostly structural).

### 9. Docs/status to finalize after implementation
- Mark this amendment complete in `IMPLEMENTATION_PLAN.md`.
- Update `docs/phases/phase4.md` / add phase note, `DB_SETUP.md` verification checklist, `PRODUCTION_READINESS.md` delete/authorization bullets, `API.md` examples if response shapes change.
- Run: `npm run typecheck`, `npm run lint`, `npm run format:check`/format, `npm run test`, `npm run build`; run DB integration tests against PostgreSQL. **Do not claim pass without execution.**

### Open decisions to confirm before coding
- **Index strategy:** exact composite indexes for `deletedAt` filtering (balance write cost vs read patterns).
- **Open-log partial index:** keep `endedAt IS NULL` only vs `endedAt IS NULL AND deletedAt IS NULL` — depends on invariant proof; active delete is blocked.
- **Delete response:** keep `200` + `"Task deleted"` for compatibility (recommended) vs `204`.
- **Already-deleted ID:** treat as `404` (recommended, non-leaky) vs `409`.

- Added health endpoint (`/api/health`)
- Security audit completed: server-side session derivation, Zod env validation, Pino redaction, no secrets committed
- Transaction/repository audit completed: repository passes `tx` through lifecycle operations
- Database migration deployment process documented (`DB_SETUP.md`, `DEPLOYMENT.md`)
- Production environment guide (`DEPLOYMENT.md`) and readiness report (`PRODUCTION_READINESS.md`) added
- All structural checks pass; known gaps documented (rate limiting, security headers, live concurrency tests deferred)
