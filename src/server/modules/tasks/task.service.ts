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
}
