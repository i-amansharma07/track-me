/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import {
  TaskRepository,
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksFilters,
} from "./task.repository";
import { AppError, AppErrorCode, ConflictError, NotFoundError } from "@/shared/errors/app.error";
import { validateWithSchema } from "@/shared/validation";
import { createTaskSchema } from "./task.schema";
import { TaskStatus } from "./task.types";
import { prisma } from "@/db/prisma";

export class TaskService {
  constructor(private repo: TaskRepository) {}

  private runTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn, { maxWait: 10_000, timeout: 20_000 });
  }

  private async getOwnedTask(id: string, userId: string, tx?: any) {
    const task = await this.repo.findById(id, userId, tx);
    if (!task) {
      throw NotFoundError("Task not found");
    }
    return task;
  }

  async create(input: CreateTaskInput) {
    const validated = validateWithSchema(createTaskSchema, input);
    return this.repo.create({ ...validated, userId: input.userId });
  }

  async list(userId: string, filters: ListTasksFilters) {
    const result = await this.repo.list(userId, filters);
    const items = result.items.map((task: any) => {
      const { timeLogs, ...rest } = task;
      const logs = (timeLogs || []).map((log: any) => ({
        id: log.id,
        startedAt: log.startedAt.toISOString(),
        endedAt: log.endedAt ? log.endedAt.toISOString() : null,
      }));
      const durations = logs.map((log: { startedAt: string; endedAt: string | null }) => {
        const started = new Date(log.startedAt).getTime();
        const ended = log.endedAt ? new Date(log.endedAt).getTime() : Date.now();
        return Math.max(0, Math.floor((ended - started) / 1000));
      });
      const totalDurationSeconds = durations.reduce((a: number, b: number) => a + b, 0);
      const longestDurationSeconds = durations.length > 0 ? Math.max(...durations) : 0;
      return {
        ...rest,
        logs,
        totalDurationSeconds,
        longestDurationSeconds,
      };
    });
    return { items, total: result.total };
  }

  async getById(id: string, userId: string) {
    return this.getOwnedTask(id, userId);
  }

  async update(id: string, userId: string, data: UpdateTaskInput) {
    await this.getOwnedTask(id, userId);
    if ((data as Record<string, unknown>).status !== undefined) {
      throw new AppError(
        "Status changes are not allowed through this endpoint",
        409,
        AppErrorCode.BUSINESS_CONFLICT,
        true,
      );
    }
    const result = await this.repo.update(id, userId, data);
    if (result.count === 0) {
      throw NotFoundError("Task not found");
    }
    return this.getOwnedTask(id, userId);
  }

  async delete(id: string, userId: string) {
    return this.runTransaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.getOwnedTask(id, userId, tx);
      if (task.status === TaskStatus.ACTIVE) {
        throw ConflictError("Cannot delete an active task. Pause or complete it first.");
      }
      const now = new Date();
      const result = await this.repo.softDelete(id, userId, now, tx);
      if (result.count === 0) {
        throw NotFoundError("Task not found");
      }
      return { deletedAt: now };
    });
  }

  async start(taskId: string, userId: string) {
    return this.runTransaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.getOwnedTask(taskId, userId, tx);
      if (task.status !== TaskStatus.PENDING) {
        throw ConflictError("Task can only be started from pending status.");
      }
      const activeTask = (await this.repo.findActiveTaskByUser(userId, tx)) as { id: string } | null;
      if (activeTask && activeTask.id !== taskId) {
        throw ConflictError("Another task is already active. Pause it first.");
      }
      const openLog = (await this.repo.findOpenTimeLog(taskId, tx)) as { id: string } | null;
      if (openLog) {
        throw ConflictError("Task already has an open time log.");
      }
      await this.repo.createTimeLog(taskId, tx);
      try {
        const updated = await tx.task.updateMany({
          where: { id: taskId, userId, deletedAt: null },
          data: { status: TaskStatus.ACTIVE },
        });
        if (updated.count === 0) throw NotFoundError("Task not found");
        return this.getOwnedTask(taskId, userId, tx);
      } catch (err: unknown) {
        const prismaErr = err as Record<string, unknown>;
        if (
          typeof prismaErr.code === "string" &&
          prismaErr.code === "P2002" &&
          typeof prismaErr.meta === "object" &&
          prismaErr.meta !== null
        ) {
          const meta = prismaErr.meta as Record<string, unknown>;
          const target = meta.target;
          if (Array.isArray(target) && target.includes("userId")) {
            throw ConflictError("Another task is already active. Pause it first.");
          }
        }
        throw err;
      }
    });
  }

  async pause(taskId: string, userId: string) {
    return this.runTransaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.getOwnedTask(taskId, userId, tx);
      if (task.status !== TaskStatus.ACTIVE) {
        throw ConflictError("Task can only be paused when active.");
      }
      const openLog = (await this.repo.findOpenTimeLog(taskId, tx)) as { id: string } | null;
      if (!openLog) {
        throw ConflictError("No open time log found for active task.");
      }
      await this.repo.closeTimeLog(openLog.id, new Date(), tx);
      const updated = await tx.task.updateMany({
        where: { id: taskId, userId, deletedAt: null },
        data: { status: TaskStatus.PAUSE },
      });
      if (updated.count === 0) throw NotFoundError("Task not found");
      return this.getOwnedTask(taskId, userId, tx);
    });
  }

  async resume(taskId: string, userId: string) {
    return this.runTransaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.getOwnedTask(taskId, userId, tx);
      if (task.status !== TaskStatus.PAUSE) {
        throw ConflictError("Task can only be resumed from paused status.");
      }
      const openLog = (await this.repo.findOpenTimeLog(taskId, tx)) as { id: string } | null;
      if (openLog) {
        throw ConflictError("Task already has an open time log.");
      }
      await this.repo.createTimeLog(taskId, tx);
      try {
        const updated = await tx.task.updateMany({
          where: { id: taskId, userId, deletedAt: null },
          data: { status: TaskStatus.ACTIVE },
        });
        if (updated.count === 0) throw NotFoundError("Task not found");
        return this.getOwnedTask(taskId, userId, tx);
      } catch (err: unknown) {
        const prismaErr = err as Record<string, unknown>;
        if (
          typeof prismaErr.code === "string" &&
          prismaErr.code === "P2002" &&
          typeof prismaErr.meta === "object" &&
          prismaErr.meta !== null
        ) {
          const meta = prismaErr.meta as Record<string, unknown>;
          const target = meta.target;
          if (Array.isArray(target) && target.includes("userId")) {
            throw ConflictError("Another task is already active. Pause it first.");
          }
        }
        throw err;
      }
    });
  }

  async complete(taskId: string, userId: string) {
    return this.runTransaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.getOwnedTask(taskId, userId, tx);
      if (task.status === TaskStatus.COMPLETED) {
        throw ConflictError("Task is already completed.");
      }
      if (task.status === TaskStatus.ACTIVE) {
        const openLog = (await this.repo.findOpenTimeLog(taskId, tx)) as { id: string } | null;
        if (openLog) {
          await this.repo.closeTimeLog(openLog.id, new Date(), tx);
        }
      }
      const updated = await tx.task.updateMany({
        where: { id: taskId, userId, deletedAt: null },
        data: { status: TaskStatus.COMPLETED, completedAt: new Date() },
      });
      if (updated.count === 0) throw NotFoundError("Task not found");
      return this.getOwnedTask(taskId, userId, tx);
    });
  }

  async reopen(taskId: string, userId: string) {
    return this.runTransaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.getOwnedTask(taskId, userId, tx);
      if (task.status !== TaskStatus.COMPLETED) {
        throw ConflictError("Task can only be reopened from completed status.");
      }
      const updated = await tx.task.updateMany({
        where: { id: taskId, userId, deletedAt: null },
        data: { status: TaskStatus.PAUSE, completedAt: null },
      });
      if (updated.count === 0) throw NotFoundError("Task not found");
      return this.getOwnedTask(taskId, userId, tx);
    });
  }

  async getTimeLogs(taskId: string, userId: string) {
    await this.getOwnedTask(taskId, userId);
    return this.repo.listTimeLogs(taskId);
  }
}
