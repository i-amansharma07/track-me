# Phase 1: Database Design and Prisma Setup

Status: COMPLETE (schema/migration baseline; **soft-delete columns/index changes planned**)

Deliverables:

- `prisma/schema.prisma` with all required models (User, Account, Session, VerificationToken, Task, TaskTimeLog) and enums.
- `prisma/migrations/20251031_071200_init/migration.sql` — full PostgreSQL schema with foreign keys, indexes, UUID identifiers.
- `prisma/migrations/20251031_071200_init/custom.sql` — custom SQL reference for partial unique indexes and check constraint.
- Migration includes:
  - Partial unique index: `Task(userId) WHERE status = active` (**planned revision:** add `AND deletedAt IS NULL`)
  - Partial unique index: `TaskTimeLog(taskId) WHERE endedAt IS NULL`
  - Check constraint: `TRIM(title) <> ""`
  - Cascade deletes on all foreign keys (**kept as safeguard; app delete path becomes soft delete**)
- Prisma client generated (`npx prisma generate` passed).
- `DB_SETUP.md` added with setup and verification instructions.

**Soft-delete amendment (planned):** add `deletedAt` to `Task`/`TaskTimeLog` via new migration; update partial unique index; implement transactional soft delete in application code.

Not implemented:

- Authentication endpoints
- Task lifecycle APIs
- Time tracking endpoints
- Frontend UI

Verification status (requires live PostgreSQL):

- Schema syntax validated by Prisma CLI (`prisma generate` passes).
- Migration SQL reviewed manually.
- Live DB verification pending (PostgreSQL not available in current environment; user confirmed DB connection deferred).
