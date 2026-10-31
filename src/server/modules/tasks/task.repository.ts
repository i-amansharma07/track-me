import { prisma } from "@/db/prisma";
import { TaskTag, TaskStatus } from "./task.types";

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

export class TaskRepository {
  async create(data: CreateTaskInput) {
    return prisma.task.create({
      data: {
        userId: data.userId,
        title: data.title,
        status: "pending",
        tag: data.tag,
      },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.task.findFirst({
      where: { id, userId },
    });
  }

  async list(userId: string, filters: ListTasksFilters) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: { userId: string; status?: TaskStatus; tag?: TaskTag } = { userId };
    if (filters.status) where.status = filters.status;
    if (filters.tag) where.tag = filters.tag;

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [{ userId: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return { items, total };
  }

  async update(id: string, data: UpdateTaskInput) {
    return prisma.task.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.task.delete({
      where: { id },
    });
  }

  async findActiveTaskByUser(userId: string) {
    return prisma.task.findFirst({
      where: { userId, status: "active" },
    });
  }
}
