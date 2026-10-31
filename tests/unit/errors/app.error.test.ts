import { describe, it, expect } from "vitest";
import {
  AppError,
  AppErrorCode,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalError,
} from "@/shared/errors/app.error";

describe("AppError", () => {
  it("creates error with default values", () => {
    const err = new AppError("fail");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe(AppErrorCode.INTERNAL_ERROR);
    expect(err.isOperational).toBe(true);
  });

  it("creates validation error (400)", () => {
    const err = ValidationError("bad input", { field: "email" });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe(AppErrorCode.VALIDATION_ERROR);
    expect(err.context).toEqual({ field: "email" });
  });

  it("maps all error types", () => {
    expect(AuthenticationError().statusCode).toBe(401);
    expect(AuthorizationError().statusCode).toBe(403);
    expect(NotFoundError().statusCode).toBe(404);
    expect(ConflictError().statusCode).toBe(409);
    expect(InternalError().statusCode).toBe(500);
    expect(InternalError().isOperational).toBe(false);
  });
});
