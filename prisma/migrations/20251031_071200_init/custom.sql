-- Partial unique index: one active task per user
CREATE UNIQUE INDEX "Task_active_user_unique" ON "Task" ("userId") WHERE ("status" = 'active');

-- Partial unique index: one open time log per task
CREATE UNIQUE INDEX "TaskTimeLog_open_task_unique" ON "TaskTimeLog" ("taskId") WHERE ("endedAt" IS NULL);

-- Check constraint: title must not be empty or whitespace-only
ALTER TABLE "Task" ADD CONSTRAINT "Task_title_not_empty" CHECK (TRIM("title") <> '');
