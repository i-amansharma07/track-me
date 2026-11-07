# Project: Task & Time Tracking Application

## 1. Your role

Act as a senior backend engineer and software architect responsible for building a production-quality, extensible backend for a task and time-tracking application.

You must prioritize:

- Clean architecture and separation of concerns.
- Strong TypeScript typing.
- Database consistency and transactional integrity.
- Secure authentication and authorization.
- Maintainable and testable business logic.
- Extensibility without unnecessary abstraction.
- Production-grade error handling and observability.

Do not optimize for generating code quickly. Understand the requirements, reason about the architecture, and implement incrementally.

## 2. Product overview

We are building a personal task and productivity tracking application.

Users authenticate through Google OAuth and can create tasks, organize them using predefined categories, and track the time spent working on each task.

The central feature is time tracking through individual work sessions.

A task can be started, paused, resumed, or completed. Every work session is represented by an independent time-log record.

The application must guarantee that a user can have only one active task at any given time.

## 3. Technology stack

Use the following technologies:

- Framework: Next.js App Router
- Runtime: Node.js
- Language: TypeScript with strict mode
- Database: PostgreSQL
- ORM: Prisma
- Authentication: Auth.js (NextAuth)
- OAuth: Google
- Validation: Zod
- Logging: Pino
- Testing: Vitest
- API architecture: REST using Next.js Route Handlers

Use compatible stable versions of dependencies. Inspect the existing project before installing or upgrading anything.

## 4. Core domain models

### User

A user represents an authenticated application user.

Fields:

- id
- name
- email
- emailVerified
- image
- createdAt
- updatedAt

Use the Prisma Adapter-compatible authentication models required by Auth.js, including Account, Session and VerificationToken where applicable.

Use database-backed sessions initially.

### Task

Fields:

- id
- userId
- title
- status
- tag
- createdAt
- updatedAt
- completedAt (nullable)
- deletedAt (nullable, soft delete)

TaskStatus enum:

- pending
- active
- pause
- completed

TaskTag enum:

- Exercise
- Rest
- Study
- Discipline
- Code
- Revision

New tasks must always be created with pending status.

### TaskTimeLog

Fields:

- id
- taskId
- startedAt
- endedAt (nullable)
- createdAt
- deletedAt (nullable, soft delete; set when the parent task is soft-deleted)

Every time a task starts or resumes, create a new time-log record.

When a task pauses or completes while active, close the current time log by setting endedAt.

An active time log has endedAt = null.

Do not create a new time log when a task is completed without ever being started.

## 5. Business rules

These rules are mandatory and must be enforced by the service layer and, where possible, database constraints.

### Task lifecycle

Allowed transitions:

| Current status | Action   | New status |
| -------------- | -------- | ---------- |
| pending        | start    | active     |
| pending        | complete | completed  |
| active         | pause    | pause      |
| active         | complete | completed  |
| pause          | resume   | active     |
| pause          | complete | completed  |

Completed is a terminal state.

All other transitions must be rejected with an appropriate conflict response.

### Single active task

A user can have only one active task.

If Task A is active and the user attempts to start Task B:

- Reject the operation.
- Return HTTP 409.
- Do not automatically pause Task A.
- Do not modify Task B.
- Do not create a time log for Task B.

The user must explicitly pause Task A before starting Task B.

Enforce this using:

1. Transactional business logic.
2. PostgreSQL partial unique index on Task.userId where status = active.
3. Database row locking to serialize lifecycle operations for the same user.

### Time-log invariants

- An active task must have exactly one open time log.
- A non-active task must have zero open time logs.
- A task may have multiple closed time logs.
- A task must never have multiple open time logs.
- Resuming a task creates a new time log rather than reopening an old one.
- Time logs must not be editable directly by the client.
- Server/database timestamps are authoritative.

Create a PostgreSQL partial unique index on TaskTimeLog.taskId where endedAt IS NULL.

The complete cross-table consistency rules must be enforced through transactional service operations and integration tests.

### Task deletion (soft delete)

- Only the task owner can delete a task.
- Deletion is implemented as a **soft delete**: user-initiated `DELETE /api/tasks/:taskId` must not physically remove rows.
- Soft-deleting a task sets `deletedAt` (server timestamp) on the `Task` and on all associated `TaskTimeLog` rows in the same database transaction.
- Soft-deleted tasks and their time logs must not appear in task lists, task retrieval, lifecycle operations, time-log retrieval, analytics, or any other user-facing endpoint. Accessing a soft-deleted task by ID returns `404 Not Found`.
- Do not allow deletion of an active task. Return HTTP `409 Conflict` and require the user to pause or complete it first. (This preserves the open-time-log invariant.)
- Deleting pending, paused, or completed tasks is allowed.
- No restore or undelete endpoint is provided in this change. Data remains in the database for future administrative/recovery work if approved.
- Database-level cascade FKs may remain as a safeguard for future hard-delete/admin paths, but the application delete path must use soft delete, not `DELETE` on the `Task` row.

### Task ownership

Never trust a userId supplied by the client.

Derive the authenticated user ID from the server-side Auth.js session.

All task and time-log queries must be scoped to the authenticated user and must exclude soft-deleted rows (`deletedAt IS NULL`) unless an explicitly approved administrative path states otherwise. No such administrative path exists in the current scope.

## 6. Architecture

Use modular architecture with the following request flow:

Route Handler → Controller → Service → Repository → Prisma → PostgreSQL

Responsibilities:

Route Handler:

- HTTP method handling.
- Route parameter extraction.
- Delegating to controllers.

Controller:

- Extracting validated request data.
- Invoking application services.
- Returning HTTP responses.

Service:

- Business logic.
- State transitions.
- Transaction orchestration.
- Authorization-related domain checks.
- Error handling.

Repository:

- Prisma queries.
- Database access.
- Transaction-compatible persistence operations.

Schema:

- Zod validation schemas.

Types:

- Module-specific TypeScript types.

Keep the layers separate without introducing unnecessary abstractions.

Services must not depend on Next.js request/response objects or React/browser APIs.

## 7. Recommended project structure

src/
app/
api/
auth/
tasks/
dashboard/

server/
modules/
tasks/
task.controller.ts
task.service.ts
task.repository.ts
task.schema.ts
task.types.ts

      timelogs/
        timelog.repository.ts
        timelog.service.ts
        timelog.types.ts

      users/

      analytics/

    auth/
      auth.ts
      auth.config.ts

    db/
      prisma.ts

    config/
      env.ts

    shared/
      errors/
      logger/
      validation/
      http/

types/

prisma/
schema.prisma
migrations/

tests/
unit/
integration/

The exact structure may be improved when justified, but preserve clear module boundaries.

## 8. API requirements

All APIs must be under /api.

Authentication:

- Auth.js Google OAuth endpoints.

Tasks:

POST /api/tasks
GET /api/tasks
GET /api/tasks/:taskId
PATCH /api/tasks/:taskId
DELETE /api/tasks/:taskId

Lifecycle:

POST /api/tasks/:taskId/start
POST /api/tasks/:taskId/pause
POST /api/tasks/:taskId/resume
POST /api/tasks/:taskId/complete

Time logs:

GET /api/tasks/:taskId/timelogs

Analytics:

GET /api/dashboard/summary
GET /api/dashboard/daily
GET /api/dashboard/categories

Task listing must support:

- Pagination.
- Status filtering.
- Tag filtering.
- Stable ordering.
- Ownership scoping.

Generic PATCH must only allow title and tag updates. Status changes must only happen through lifecycle endpoints.

Do not expose POST or PATCH endpoints for directly manipulating time logs.

## 9. Core infrastructure

Implement:

- Centralized application error class.
- Consistent HTTP error mapping.
- Standardized success and error response formats.
- Zod validation.
- Structured Pino logging.
- Request correlation IDs.
- Environment validation.
- Reusable authenticated-user helper.
- Prisma singleton.
- Database transaction utilities where appropriate.

Never expose internal stack traces, database errors, secrets or sensitive authentication data to clients.

## 10. Database requirements

Use Prisma migrations.

Implement:

- Proper foreign keys.
- Unique constraints.
- Required indexes.
- Cascading foreign-key behavior where appropriate (safeguard for future hard-delete/admin paths).
- Soft-delete columns (`deletedAt`) and query/index strategy that preserves correctness for non-deleted data.
- Partial unique indexes using custom PostgreSQL migration SQL.

Important indexes:

- Task(userId, status)
- Task(userId, createdAt)
- TaskTimeLog(taskId, startedAt)
- Unique active non-deleted task per user: partial unique index on `Task(userId)` where `status = 'active' AND deletedAt IS NULL`.
- Unique open time log per task: partial unique index on `TaskTimeLog(taskId)` where `endedAt IS NULL` (review during implementation; active-task deletion is blocked so soft-deleted active/open-log combinations must not occur through the public API).
- Consider indexes supporting soft-delete filtering if query plans require them (e.g., `Task(userId, deletedAt, createdAt)` or equivalent), validated during implementation.

Use UUIDs for task and time-log identifiers. Use an Auth.js-compatible user ID type consistently.

Review generated migration SQL before applying it.

## 11. Transaction and concurrency requirements

All lifecycle operations must execute transactionally.

Use Prisma interactive transactions and PostgreSQL row locking.

For lifecycle operations, lock the corresponding user row using SELECT FOR UPDATE within the transaction before checking or modifying task states.

This serializes lifecycle changes for the same user.

For starting a task:

1. Lock user row.
2. Retrieve task and verify ownership.
3. Verify eligible status.
4. Check for another active task.
5. Reject if one exists.
6. Create time log.
7. Update task status.
8. Commit.

Apply the same locking strategy consistently to pause, resume and complete operations.

Use database constraints as the final safeguard against race conditions.

Ensure failed transactions roll back all related writes.

## 12. Testing requirements

Use Vitest.

Unit tests:

- Task state transitions.
- Business-rule validation.
- Service behavior.
- Error handling.
- Duration calculations.

Integration tests against PostgreSQL:

- CRUD operations.
- Authentication-related persistence.
- Foreign keys.
- Partial unique indexes.
- Transactions.
- Rollbacks.
- Ownership enforcement.

Concurrency tests:

- Two simultaneous start requests for different tasks belonging to the same user.
- Two simultaneous start requests for the same task.
- Concurrent pause and resume.
- Multiple lifecycle requests for the same user.

Verify that no invalid task/time-log combinations can be committed.

## 13. Engineering rules

1. Use strict TypeScript. Avoid any unless explicitly justified.
2. Never put business logic in Route Handlers.
3. Never execute complex database queries directly inside controllers.
4. Do not duplicate validation logic across modules.
5. Never trust userId or timestamps supplied by the client.
6. Use transactions for related database mutations.
7. Use database constraints for critical invariants.
8. Keep services independently testable.
9. Avoid unnecessary dependencies and abstractions.
10. Document non-obvious architectural decisions.
11. Do not introduce frontend components or UI functionality during backend implementation.
12. Do not implement future features outside the current phase.
13. Do not silently change established business requirements.

## 14. Implementation workflow

The project will be implemented in ten phases:

Phase 0: Project foundation and architecture.

Phase 1: Database design and Prisma setup.

Phase 2: Authentication and authorization.

Phase 3: Core backend infrastructure.

Phase 4: Task management module.

Phase 5: Task lifecycle and time tracking.

Phase 6: Productivity queries and summaries.

Phase 7: Comprehensive testing and concurrency verification.

Phase 8: API documentation and frontend contract.

Phase 9: Production readiness.

Only implement the phase explicitly requested by the user.

Before implementation:

- Inspect the repository.
- Understand existing configuration.
- Identify potential conflicts.
- Propose changes.
- Explain significant architectural decisions.

After implementation:

- Run relevant tests.
- Run TypeScript checks.
- Run linting.
- Review modified files.
- Verify every acceptance criterion.
- Report any incomplete work.

Maintain these documents:

- AGENTS.md: Permanent coding and architecture instructions.
- ARCHITECTURE.md: Current architecture and important design decisions.
- IMPLEMENTATION_PLAN.md: Phase status, deliverables and progress.
- API.md or OpenAPI specification: API contracts.

Update these documents as implementation progresses.

## 15. Completion criteria

The backend is considered complete only when:

- Google authentication works.
- User isolation is enforced.
- Task CRUD works.
- Task lifecycle works.
- Time logs are accurate.
- Only one task can be active per user.
- Soft delete hides deleted tasks/time logs from all user-facing endpoints while preserving data in the database.
- Transactions and concurrency behavior are verified.
- Analytics endpoints work.
- Automated tests pass.
- API documentation exists.
- Production configuration is documented.

Do not begin frontend implementation until the backend has passed its completion criteria.

Your responsibility is to build a reliable backend foundation that can support additional productivity features without requiring architectural rewrites.
