# Database Setup (Phase 1)

## Schema

`prisma/schema.prisma` defines:

- User (Auth.js-compatible: id, name, email, emailVerified, image, createdAt, updatedAt)
- Account (provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state)
- Session (sessionToken, userId, expires)
- VerificationToken (identifier, token, expires)
- Task (id UUID, userId UUID, title, status enum, tag enum, createdAt, updatedAt, completedAt)
- TaskTimeLog (id UUID, taskId UUID, startedAt, endedAt, createdAt)

## Migrations

- `prisma/migrations/20251031_071200_init/migration.sql` — full initial migration
- `prisma/migrations/20251031_071200_init/custom.sql` — partial unique indexes and check constraint reference

Custom SQL included in the migration:

- Partial unique index on `Task(userId)` WHERE `status = 'active'`
- Partial unique index on `TaskTimeLog(taskId)` WHERE `endedAt IS NULL`
- Check constraint on `Task`: `TRIM(title) <> ''`

## Setup Instructions

1. Ensure `DATABASE_URL` is set in `.env` (see `.env.example`).
2. Apply migration to a real PostgreSQL database:
   ```bash
   npx prisma migrate deploy
   ```
3. If recreating from scratch:
   ```bash
   npx prisma migrate reset
   npx prisma migrate deploy
   ```
4. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

## Verification (requires live PostgreSQL)

- All models can be created.
- Relationships work (User → Task, Task → TaskTimeLog, User → Account/Session).
- Foreign keys reject invalid references.
- A user cannot have two active tasks (partial unique index).
- A task cannot have two open time logs (partial unique index).
- Deleting a task cascades to its time logs.
- Empty/whitespace-only titles are rejected (check constraint).
