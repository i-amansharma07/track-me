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
    const task = await this.repo.findById(id, userId);
    if (!task) {
      throw NotFoundError("Task not found");
    }
    return task;
  }

  async update(id: string, userId: string, data: UpdateTaskInput) {
    const task = await this.repo.findById(id, userId);
    if (!task) {
      throw NotFoundError("Task not found");
    }
    if ((data as Record<string, unknown>).status !== undefined) {
      throw new AppError(
        "Status changes are not allowed through this endpoint",
        409,
        AppErrorCode.BUSINESS_CONFLICT,
        true,
      );
    }
    return this.repo.update(id, data);
  }

  async delete(id: string, userId: string) {
    const task = await this.repo.findById(id, userId);
    if (!task) {
      throw NotFoundError("Task not found");
    }
    if (task.status === TaskStatus.ACTIVE) {
      throw ConflictError("Cannot delete an active task. Pause or complete it first.");
    }
    return this.repo.delete(id);
  }

  async start(taskId: string, userId: string) {
    return this.runTransaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.repo.findById(taskId, userId, tx);
      if (!task) {
        throw NotFoundError("Task not found");
      }
      if (task.status !== TaskStatus.PENDING) {
        throw ConflictError("Task can only be started from pending status.");
      }
      const activeTask = await this.repo.findActiveTaskByUser(userId, tx);
      if (activeTask && activeTask.id !== taskId) {
        throw ConflictError("Another task is already active. Pause it first.");
      }
      const openLog = await this.repo.findOpenTimeLog(taskId, tx);
      if (openLog) {
        throw ConflictError("Task already has an open time log.");
      }
      await this.repo.createTimeLog(taskId, tx);
      try {
        return tx.task.update({
          where: { id: taskId },
          data: { status: TaskStatus.ACTIVE },
        });
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
      const task = await this.repo.findById(taskId, userId, tx);
      if (!task) {
        throw NotFoundError("Task not found");
      }
      if (task.status !== TaskStatus.ACTIVE) {
        throw ConflictError("Task can only be paused when active.");
      }
      const openLog = await this.repo.findOpenTimeLog(taskId, tx);
      if (!openLog) {
        throw ConflictError("No open time log found for active task.");
      }
      await this.repo.closeTimeLog(openLog.id, tx);
      return tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.PAUSE },
      });
    });
  }

  async resume(taskId: string, userId: string) {
    return this.runTransaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.repo.findById(taskId, userId, tx);
      if (!task) {
        throw NotFoundError("Task not found");
      }
      if (task.status !== TaskStatus.PAUSE) {
        throw ConflictError("Task can only be resumed from paused status.");
      }
      const openLog = await this.repo.findOpenTimeLog(taskId, tx);
      if (openLog) {
        throw ConflictError("Task already has an open time log.");
      }
      await this.repo.createTimeLog(taskId, tx);
      try {
        return tx.task.update({
          where: { id: taskId },
          data: { status: TaskStatus.ACTIVE },
        });
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
      const task = await this.repo.findById(taskId, userId, tx);
      if (!task) {
        throw NotFoundError("Task not found");
      }
      if (task.status === TaskStatus.COMPLETED) {
        throw ConflictError("Task is already completed.");
      }
      if (task.status === TaskStatus.ACTIVE) {
        const openLog = await this.repo.findOpenTimeLog(taskId, tx);
        if (openLog) {
          await this.repo.closeTimeLog(openLog.id, tx);
        }
      }
      return tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.COMPLETED, completedAt: new Date() },
      });
    });
  }

  async reopen(taskId: string, userId: string) {
    return this.runTransaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.repo.findById(taskId, userId, tx);
      if (!task) {
        throw NotFoundError("Task not found");
      }
      if (task.status !== TaskStatus.COMPLETED) {
        throw ConflictError("Task can only be reopened from completed status.");
      }
      return tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.PAUSE, completedAt: null },
      });
    });
  }

  async getTimeLogs(taskId: string, userId: string) {
    const task = await this.repo.findById(taskId, userId);
    if (!task) {
      throw NotFoundError("Task not found");
    }
    return prisma.taskTimeLog.findMany({
      where: { taskId },
      orderBy: { startedAt: "asc" },
    });
  }
}
