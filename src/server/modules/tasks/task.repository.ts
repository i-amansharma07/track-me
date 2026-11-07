/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { TaskTag, TaskStatus } from "./task.types";
import { prisma } from "@/db/prisma";

export type CreateTaskInput = {
  userId: string;
  title: string;
  tag?: TaskTag;
};

export type UpdateTaskInput = {
  title?: string;
  tag?: TaskTag;
};

export type ListTasksFilters = {
  status?: TaskStatus;
  tag?: TaskTag;
  page?: number;
  limit?: number;
};

function getClient(tx?: any) {
  return tx || prisma;
}

export class TaskRepository {
  async create(data: CreateTaskInput, tx?: any) {
    const client = getClient(tx);
    return client.task.create({
      data: {
        userId: data.userId,
        title: data.title,
        status: "pending",
        tag: data.tag,
      },
    });
  }

  async findById(id: string, userId: string, tx?: any) {
    const client = getClient(tx);
    return client.task.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  async list(userId: string, filters: ListTasksFilters, tx?: any) {
    const client = getClient(tx);
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: { userId: string; deletedAt: null; status?: TaskStatus; tag?: TaskTag } = {
      userId,
      deletedAt: null,
    };
    if (filters.status) where.status = filters.status;
    if (filters.tag) where.tag = filters.tag;

    const [items, total] = await Promise.all([
      client.task.findMany({
        where,
        orderBy: [{ userId: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        skip,
        take: limit,
        include: {
          timeLogs: {
            where: { deletedAt: null },
            orderBy: { startedAt: "asc" },
          },
        },
      }),
      client.task.count({ where }),
    ]);

    return { items, total };
  }

  async update(id: string, userId: string, data: UpdateTaskInput, tx?: any) {
    const client = getClient(tx);
    return client.task.updateMany({
      where: { id, userId, deletedAt: null },
      data,
    });
  }

  async softDelete(id: string, userId: string, deletedAt: Date, tx?: any) {
    const client = getClient(tx);
    const task = await client.task.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt },
    });
    if (task.count > 0) {
      await client.taskTimeLog.updateMany({
        where: { taskId: id, deletedAt: null },
        data: { deletedAt },
      });
    }
    return task;
  }

  async findActiveTaskByUser(userId: string, tx?: any) {
    const client = getClient(tx);
    const task = await client.task.findFirst({
      where: { userId, status: "active", deletedAt: null },
    });
    return task as unknown;
  }

  async findOpenTimeLog(taskId: string, tx?: any) {
    const client = getClient(tx);
    const log = await client.taskTimeLog.findFirst({
      where: { taskId, endedAt: null, deletedAt: null },
    });
    return log as unknown;
  }

  async createTimeLog(taskId: string, tx?: any) {
    const client = getClient(tx);
    const log = await client.taskTimeLog.create({
      data: { taskId },
    });
    return log as unknown;
  }

  async closeTimeLog(logId: string, endedAt: Date, tx?: any) {
    const client = getClient(tx);
    const log = await client.taskTimeLog.update({
      where: { id: logId },
      data: { endedAt },
    });
    return log as unknown;
  }

  async listTimeLogs(taskId: string, tx?: any) {
    const client = getClient(tx);
    const logs = await client.taskTimeLog.findMany({
      where: { taskId, deletedAt: null },
      orderBy: { startedAt: "asc" },
    });
    return logs as unknown[];
  }
}
