# Phase 5: Task Lifecycle and Time Tracking

Status: COMPLETE

Deliverables:

- Lifecycle endpoints implemented:
  - POST /api/tasks/:taskId/start
  - POST /api/tasks/:taskId/pause
  - POST /api/tasks/:taskId/resume
  - POST /api/tasks/:taskId/complete
  - GET /api/tasks/:taskId/timelogs
- Service layer enforces all mandatory state transitions with transaction-level consistency.
- Each lifecycle operation acquires the user's database row lock (`SELECT ... FOR UPDATE`) inside an interactive Prisma transaction.
- Active task prevention enforced through partial unique index (`Task_active_user_unique`) plus application-level checks.
- Open time log consistency enforced through partial unique index (`TaskTimeLog_open_task_unique`) plus application-level checks.
- Time-log creation for start/resume; time-log closure for pause/complete; no new log for pending/paused complete.
- Time tracking calculations calculated from `startedAt`/`endedAt` timestamps; no frontend timer persistence.
- Time logs ordered consistently by `startedAt`.
- Route handlers use controllers; controllers delegate to services; services use repositories; repositories use Prisma singleton.
- No direct client manipulation of time logs.
- Ownership verified through database queries scoped to `userId`.

Business rules enforced:

- Only one active task per user (409 conflict returned with clear message).
- Pending → active: creates new open time log.
- Active → pause: closes exactly one open log; sets status to pause.
- Pause → active: creates new open log; verifies no open log exists first.
- Pending/active/pause → completed: sets completed; closes open log if active; no new log created for pending/paused.
- Completed is terminal (rejected by service logic).
- Deletion of active task rejected (409) at service/repository layer.

**Soft-delete amendment (planned):** lifecycle and timelog endpoints must treat soft-deleted tasks as 404 and exclude deleted time logs. `Task_active_user_unique` must be scoped to non-deleted rows.

Tests:

- Basic module structure verified (`tests/unit/tasks/task.module.test.ts`).
- Existing infrastructure and pagination tests pass.
- Integration-level concurrency verification deferred (requires live PostgreSQL).

Verification status:

- TypeScript passes.
- ESLint passes (no errors).
- Prettier passes.
- Build passes (`npm run build`).
- All tests pass (`npm run test`).
- Live database verification for partial unique indexes and transactions deferred per environment limitations.
