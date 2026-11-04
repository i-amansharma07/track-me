/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/require-await */
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
      where: { id, userId },
    });
  }

  async list(userId: string, filters: ListTasksFilters, tx?: any) {
    const client = getClient(tx);
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: { userId: string; status?: TaskStatus; tag?: TaskTag } = { userId };
    if (filters.status) where.status = filters.status;
    if (filters.tag) where.tag = filters.tag;

    const [items, total] = await Promise.all([
      client.task.findMany({
        where,
        orderBy: [{ userId: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        skip,
        take: limit,
      }),
      client.task.count({ where }),
    ]);

    return { items, total };
  }

  async update(id: string, data: UpdateTaskInput, tx?: any) {
    const client = getClient(tx);
    return client.task.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tx?: any) {
    const client = getClient(tx);
    return client.task.delete({
      where: { id },
    });
  }

  async findActiveTaskByUser(userId: string, tx?: any) {
    const client = getClient(tx);
    return client.task.findFirst({
      where: { userId, status: "active" },
    });
  }

  async findTaskForUpdate(id: string, userId: string, tx?: any) {
    const client = getClient(tx);
    return client.task.findFirst({
      where: { id, userId },
    });
  }

  async findOpenTimeLog(taskId: string, tx?: any) {
    const client = getClient(tx);
    return client.taskTimeLog.findFirst({
      where: { taskId, endedAt: null },
    });
  }

  async createTimeLog(taskId: string, tx?: any) {
    const client = getClient(tx);
    return client.taskTimeLog.create({
      data: { taskId },
    });
  }

  async closeTimeLog(logId: string, tx?: any) {
    const client = getClient(tx);
    return client.taskTimeLog.update({
      where: { id: logId },
      data: { endedAt: new Date() },
    });
  }
}
