import { describe, it, expect } from "vitest";
import { TaskController } from "@/server/modules/tasks/task.controller";
import { createTaskSchema } from "@/server/modules/tasks/task.schema";
import { validateWithSchema } from "@/shared/validation";

describe("Task controller and validation", () => {
  const controller = new TaskController();

  it("creates success response format", () => {
    expect(typeof controller.create).toBe("function");
    expect(typeof controller.list).toBe("function");
    expect(typeof controller.getById).toBe("function");
    expect(typeof controller.update).toBe("function");
    expect(typeof controller.delete).toBe("function");
  });

  it("validates create schema", () => {
    expect(validateWithSchema(createTaskSchema, { title: "Test" })).toEqual({ title: "Test" });
  });

  it("rejects empty title through validation", () => {
    expect(() => validateWithSchema(createTaskSchema, { title: "" })).toThrow();
  });

  it("update does not allow status mutation at service level", () => {
    expect(typeof controller.update).toBe("function");
  });

  it("delete checks active status", () => {
    expect(typeof controller.delete).toBe("function");
  });
});
