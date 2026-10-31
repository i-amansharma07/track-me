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

  async create(input: CreateTaskInput) {
    const validated = validateWithSchema(createTaskSchema, input);
    return this.repo.create({ ...validated, userId: input.userId });
  }

  async list(userId: string, filters: ListTasksFilters) {
    return this.repo.list(userId, filters);
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
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.repo.findById(taskId, userId);
      if (!task) {
        throw NotFoundError("Task not found");
      }
      if (task.status !== TaskStatus.PENDING) {
        throw ConflictError("Task can only be started from pending status.");
      }
      const activeTask = await this.repo.findActiveTaskByUser(userId);
      if (activeTask && activeTask.id !== taskId) {
        throw ConflictError("Another task is already active. Pause it first.");
      }
      const openLog = await this.repo.findOpenTimeLog(taskId);
      if (openLog) {
        throw ConflictError("Task already has an open time log.");
      }
      await this.repo.createTimeLog(taskId);
      return tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.ACTIVE },
      });
    });
  }

  async pause(taskId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.repo.findById(taskId, userId);
      if (!task) {
        throw NotFoundError("Task not found");
      }
      if (task.status !== TaskStatus.ACTIVE) {
        throw ConflictError("Task can only be paused when active.");
      }
      const openLog = await this.repo.findOpenTimeLog(taskId);
      if (!openLog) {
        throw ConflictError("No open time log found for active task.");
      }
      await this.repo.closeTimeLog(openLog.id);
      return tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.PAUSE },
      });
    });
  }

  async resume(taskId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.repo.findById(taskId, userId);
      if (!task) {
        throw NotFoundError("Task not found");
      }
      if (task.status !== TaskStatus.PAUSE) {
        throw ConflictError("Task can only be resumed from paused status.");
      }
      const openLog = await this.repo.findOpenTimeLog(taskId);
      if (openLog) {
        throw ConflictError("Task already has an open time log.");
      }
      await this.repo.createTimeLog(taskId);
      return tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.ACTIVE },
      });
    });
  }

  async complete(taskId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT * FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const task = await this.repo.findById(taskId, userId);
      if (!task) {
        throw NotFoundError("Task not found");
      }
      if (task.status === TaskStatus.COMPLETED) {
        throw ConflictError("Task is already completed.");
      }
      if (task.status === TaskStatus.ACTIVE) {
        const openLog = await this.repo.findOpenTimeLog(taskId);
        if (openLog) {
          await this.repo.closeTimeLog(openLog.id);
        }
      }
      return tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.COMPLETED, completedAt: new Date() },
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
