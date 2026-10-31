# AGENTS.md

## 1. Project Overview

This repository contains a task-management and time-tracking application.

The application uses:

- Next.js App Router
- TypeScript (strict mode)
- PostgreSQL
- Prisma ORM
- Auth.js (Google OAuth)
- Zod for validation
- Pino for structured logging
- Vitest for testing

Before implementing anything, read:

1. `PROJECT_SPEC.md` — product requirements and business rules.
2. `IMPLEMENTATION_PLAN.md` — implementation phases and completion criteria.
3. `ARCHITECTURE.md` — architectural decisions, if available.
4. The current phase document under `docs/phases/`.

These documents are the source of truth. Do not invent or silently change business requirements.

## 2. General Engineering Principles

- Write production-oriented, maintainable code.
- Prefer simple solutions over unnecessary abstractions.
- Follow the existing project structure and conventions.
- Use TypeScript strict mode. Avoid `any`; use `unknown` when the type is genuinely unknown.
- Keep functions small and focused on a single responsibility.
- Prefer explicit, readable code over clever or overly compact implementations.
- Avoid premature optimization.
- Do not introduce dependencies unless they solve a genuine requirement.
- Do not duplicate existing functionality.
- Do not leave placeholder implementations, fake responses, or silently swallowed errors.
- Never claim something works without running the relevant checks.

## 3. Architecture and Separation of Concerns

Follow this general backend flow:

Route Handler → Controller → Service → Repository → Prisma/PostgreSQL

Responsibilities:

**Route Handlers**

- Handle HTTP methods and route parameters.
- Resolve the authenticated user.
- Invoke the appropriate controller.
- Return HTTP responses.
- Must not contain business logic or direct database queries.

**Controllers**

- Coordinate HTTP input, service calls, and response construction.
- Keep HTTP-specific concerns out of services.

**Services**

- Contain business rules and application logic.
- Coordinate transactions and repository operations.
- Must not depend on Next.js request/response objects or browser APIs.

**Repositories**

- Encapsulate database access.
- Use Prisma for database operations.
- Do not contain HTTP response logic.
- Keep database queries focused and reusable where appropriate.

**Validation**

- Use Zod to validate external input.
- Validate request bodies, query parameters, and route parameters.
- Never assume client-provided data is trustworthy.

Avoid adding unnecessary layers or abstractions. If a simpler structure achieves the same separation of concerns, prefer it.

## 4. Authentication and Authorization

- Use Auth.js with Google OAuth.
- Every protected API endpoint must verify the authenticated session.
- Never trust a `userId` supplied by the client.
- Obtain the user ID from the authenticated server-side session.
- Scope every task and time-log query to the authenticated user.
- Verify ownership before reading, modifying, or deleting a task.
- Do not expose another user's tasks, time logs, or analytics.
- Return appropriate HTTP errors for unauthenticated and unauthorized requests.

## 5. Task Lifecycle and Time-Tracking Rules

The application has four task statuses:

- `pending`
- `active`
- `pause`
- `completed`

The following rules are mandatory:

1. A user can have only one active task at a time.
2. Starting another task while one is already active must return HTTP `409 Conflict`.
3. Never automatically pause an existing active task.
4. A user must manually pause the active task before starting another.
5. Starting a pending task creates a new time-log record.
6. Resuming a paused task creates a new time-log record.
7. Pausing a task closes its currently open time log.
8. Completing an active task closes its currently open time log.
9. Completing a pending or paused task does not create a new time log.
10. A completed task is terminal and cannot be restarted.
11. Task status changes must happen through dedicated lifecycle endpoints, not generic task updates.

### Time-log invariants

- An active task must have exactly one open time log.
- A non-active task must have zero open time logs.
- An open time log has `endedAt = null`.
- A task must never have more than one open time log.
- Users must not be able to create or modify time logs directly through public API endpoints.
- Total tracked duration is calculated from completed sessions plus the current active session, if one exists.
- Backend/database timestamps are authoritative.

All lifecycle operations must be atomic. A failed operation must not leave task status and time-log records inconsistent.

## 6. Database and Transaction Rules

- PostgreSQL is the source of truth for application data.
- Use Prisma for normal database access.
- Use parameterized SQL when raw SQL is required.
- Never construct raw SQL using untrusted string concatenation.
- Use database transactions for operations involving multiple related writes.
- Use an interactive Prisma transaction where transaction-level coordination is required.
- All task lifecycle operations must acquire the corresponding user's database row lock (`SELECT ... FOR UPDATE`) before checking or changing lifecycle state.
- Acquire the lock and perform all related reads and writes inside the same transaction.
- All lifecycle operations for a user must follow the same locking strategy.
- Preserve database-level constraints and indexes defined in the project specification.
- Never bypass foreign keys, unique constraints, or other database integrity rules to make an operation succeed.

Database constraints are important safeguards, but they do not replace application-level business validation.

## 7. API and Error Handling

- Follow REST conventions.
- Use appropriate HTTP status codes.
- Keep API response formats consistent.
- Use centralized error handling rather than repeating error-response logic.
- Do not expose stack traces, SQL queries, internal implementation details, or sensitive information to clients.
- Distinguish validation errors, authentication errors, authorization errors, missing resources, business conflicts, and unexpected server errors.
- Do not return successful responses when an operation has only partially completed.
- Use pagination for collection endpoints where appropriate.
- Use stable ordering when returning paginated data. Include a unique tie-breaker when sorting by non-unique fields.

## 8. Logging and Observability

Use Pino for structured application logging.

- Log meaningful application events and unexpected failures.
- Include relevant context such as request ID, user ID where appropriate, operation name, and resource ID.
- Use appropriate log levels (`debug`, `info`, `warn`, `error`).
- Avoid logging passwords, access tokens, OAuth credentials, secrets, or sensitive personal information.
- Do not log the same error repeatedly at every architectural layer without a reason.
- Preserve the original error when wrapping or rethrowing errors.
- Prefer structured log objects over interpolated log strings.

## 9. Testing Requirements

Use Vitest for testing.

- Write unit tests for business logic.
- Write integration tests for repository/database behavior.
- Test API validation and error responses.
- Test authorization and task ownership.
- Test every valid and invalid task lifecycle transition.
- Test transaction rollback behavior.
- Test concurrent lifecycle operations, particularly concurrent attempts to start tasks for the same user.
- Test database constraints and time-log consistency.

Do not mock database behavior in tests that are specifically intended to verify PostgreSQL constraints, transactions, or concurrency.

A feature is not complete merely because its implementation compiles.

## 10. Security and Configuration

- Keep secrets in environment variables.
- Validate environment variables at application startup using Zod.
- Never commit `.env` files containing real credentials.
- Provide an `.env.example` containing variable names and safe placeholder values.
- Validate and sanitize external input.
- Use secure authentication and session practices.
- Never expose server-only environment variables to client-side code.
- Use the Node.js runtime for database-dependent route handlers.

## 11. Dependencies and Scope Control

Do not introduce the following unless explicitly approved:

- Redis
- Message queues
- Background workers
- Microservices
- Additional databases
- Unnecessary state-management libraries
- Unnecessary abstraction frameworks

Keep the initial implementation as a well-structured monolithic Next.js application.

Do not implement frontend functionality until the backend implementation phases are complete and explicitly approved.

## 12. Coding Agent Workflow

Follow these rules for every implementation phase:

1. Read the relevant project specification and phase document.
2. Inspect the existing codebase before making changes.
3. Understand existing conventions and reuse existing utilities where appropriate.
4. Identify the files that need to be created or modified.
5. Briefly explain the proposed implementation approach before substantial changes.
6. Implement only the requirements belonging to the current phase.
7. Do not start future phases without explicit approval.
8. Do not modify unrelated files or refactor unrelated functionality.
9. Run relevant tests, type checks, linting, and build checks.
10. Fix issues introduced by the implementation.
11. Report what was implemented, which files changed, and which checks passed or failed.
12. Clearly mention any incomplete work, assumptions, or known limitations.

### Important execution rules

- Do not skip phases.
- Do not silently change architectural decisions.
- Do not invent missing requirements.
- If a requirement conflicts with the existing specification, explain the conflict before proceeding.
- If a decision materially affects the architecture or data model and is not documented, ask for clarification.
- Do not claim a test passed unless it was actually executed.
- Do not proceed to the next phase automatically.

## 13. Definition of Done

A task or phase is considered complete only when:

- All requirements for that phase are implemented.
- Code follows the established architecture and conventions.
- TypeScript type checking passes.
- Relevant tests pass.
- Linting passes, if configured.
- No known regression has been introduced.
- Database migrations are included when schema changes are required.
- Any necessary documentation is updated.
- Remaining limitations are explicitly reported.
