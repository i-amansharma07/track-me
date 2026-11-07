/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { describe, it, expect, vi } from "vitest";
import { TaskService } from "@/server/modules/tasks/task.service";
import { TaskStatus } from "@/server/modules/tasks/task.types";

function makeRepo(overrides: Record<string, unknown> = {}) {
  return {
    findById: vi.fn(),
    softDelete: vi.fn(),
    listTimeLogs: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    list: vi.fn(),
    findActiveTaskByUser: vi.fn(),
    findOpenTimeLog: vi.fn(),
    createTimeLog: vi.fn(),
    closeTimeLog: vi.fn(),
    ...overrides,
  };
}

describe("TaskService soft delete", () => {
  it("rejects deleting an active task", async () => {
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue({ id: "t1", userId: "u1", status: TaskStatus.ACTIVE }),
    });
    const service = new TaskService(repo as never);
    (service as any).runTransaction = async (fn: any) =>
      fn({ $executeRaw: vi.fn().mockResolvedValue(undefined) });

    await expect(service.delete("t1", "u1")).rejects.toMatchObject({
      message: "Cannot delete an active task. Pause or complete it first.",
      statusCode: 409,
    });
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it("soft-deletes a non-active owned task in a transaction", async () => {
    const nowish = new Date();
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue({ id: "t1", userId: "u1", status: TaskStatus.PAUSE }),
      softDelete: vi.fn().mockResolvedValue({ count: 1 }),
    });
    const service = new TaskService(repo as never);
    (service as any).runTransaction = async (fn: any) =>
      fn({ $executeRaw: vi.fn().mockResolvedValue(undefined) });

    const result = await service.delete("t1", "u1");
    expect(repo.softDelete).toHaveBeenCalledWith("t1", "u1", expect.any(Date), expect.anything());
    expect(result.deletedAt).toBeInstanceOf(Date);
    expect(result.deletedAt.getTime()).toBeGreaterThanOrEqual(nowish.getTime() - 1000);
  });

  it("returns 404 when task is missing or already soft-deleted", async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const service = new TaskService(repo as never);
    (service as any).runTransaction = async (fn: any) =>
      fn({ $executeRaw: vi.fn().mockResolvedValue(undefined) });

    await expect(service.delete("missing", "u1")).rejects.toMatchObject({
      message: "Task not found",
      statusCode: 404,
    });
  });

  it("returns 404 from getTimeLogs for missing/deleted task", async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const service = new TaskService(repo as never);

    await expect(service.getTimeLogs("missing", "u1")).rejects.toMatchObject({
      message: "Task not found",
      statusCode: 404,
    });
    expect(repo.listTimeLogs).not.toHaveBeenCalled();
  });
});
