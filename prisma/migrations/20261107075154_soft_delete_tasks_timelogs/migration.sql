-- Add soft-delete markers
ALTER TABLE "Task" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "TaskTimeLog" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Active-task uniqueness must ignore soft-deleted tasks
DROP INDEX IF EXISTS "Task_active_user_unique";
CREATE UNIQUE INDEX "Task_active_user_unique" ON "Task" ("userId") WHERE ("status" = 'active' AND "deletedAt" IS NULL);

-- Support common user-scoped non-deleted lookups
CREATE INDEX "Task_userId_deletedAt_createdAt_idx" ON "Task" ("userId", "deletedAt", "createdAt");
CREATE INDEX "TaskTimeLog_taskId_deletedAt_idx" ON "TaskTimeLog" ("taskId", "deletedAt");
