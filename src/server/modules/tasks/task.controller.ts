/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "./task.service";
import { TaskRepository } from "./task.repository";
import { validateWithSchema } from "@/shared/validation";
import { createTaskSchema } from "./task.schema";
import { AppErrorCode } from "@/shared/errors/app.error";
import {
  createSuccessResponse,
  createErrorResponse,
  createSuccessResponseWithPagination,
} from "@/shared/http/response";
import { parsePaginationOptions, buildPaginationMeta } from "@/shared/http/pagination";
import { TaskStatus, TaskTag } from "./task.types";
import { resolveSessionUser } from "@/shared/auth/session.helper";

const repo = new TaskRepository();
const service = new TaskService(repo);

function extractErrorInfo(err: unknown): { message: string; code: string; statusCode: number } {
  if (err instanceof Error) {
    const customErr = err instanceof Error ? (err as unknown as Record<string, unknown>) : {};
    return {
      message: err.message || "Something went wrong",
      code: typeof customErr.code === "string" ? customErr.code : AppErrorCode.INTERNAL_ERROR,
      statusCode: typeof customErr.statusCode === "number" ? customErr.statusCode : 500,
    };
  }
  return { message: "Something went wrong", code: AppErrorCode.INTERNAL_ERROR, statusCode: 500 };
}

export class TaskController {
  async create(req: Request) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const body: Record<string, unknown> = await req.json();
      const validated = validateWithSchema(createTaskSchema, { title: body.title, tag: body.tag });
      const userId =
        typeof body.userId === "string"
          ? String(body.userId)
          : resolveSessionUser(req as Request).userId;
      const task = await service.create({ ...validated, userId });
      return NextResponse.json(createSuccessResponse(task, "Task created"), { status: 201 });
    } catch (err: unknown) {
      const info = extractErrorInfo(err);
      return NextResponse.json(createErrorResponse(info.message, info.code), {
        status: info.statusCode,
      });
    }
  }

  async list(req: NextRequest) {
    try {
      const url = new URL(req.url);
      const userId = url.searchParams.get("userId") || resolveSessionUser(req as Request).userId;
      const statusParam = url.searchParams.get("status");
      const tagParam = url.searchParams.get("tag");
      const paginationOpts = parsePaginationOptions({
        page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined,
        limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
      });
      const filters = {
        status: (statusParam as TaskStatus) || undefined,
        tag: (tagParam as TaskTag) || undefined,
        page: paginationOpts.page,
        limit: paginationOpts.limit,
      };
      const result = await service.list(userId, filters);
      const paginated = {
        data: result.items,
        pagination: buildPaginationMeta(paginationOpts.page, paginationOpts.limit, result.total),
      };
      return NextResponse.json(createSuccessResponseWithPagination(paginated, "Tasks retrieved"));
    } catch (err: unknown) {
      const info = extractErrorInfo(err);
      return NextResponse.json(createErrorResponse(info.message, info.code), {
        status: info.statusCode,
      });
    }
  }

  async getById(params: { taskId: string }, req?: Request) {
    try {
      const userId = req
        ? resolveSessionUser(req).userId
        : (resolveSessionUser(new Request("http://localhost") as Request)).userId;
      const task = await service.getById(params.taskId, userId);
      return NextResponse.json(createSuccessResponse(task, "Task retrieved"));
    } catch (err: unknown) {
      const info = extractErrorInfo(err);
      return NextResponse.json(createErrorResponse(info.message, info.code), {
        status: info.statusCode,
      });
    }
  }

  async update(params: { taskId: string }, req: Request) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const body: Record<string, unknown> = await req.json();
      const userId = resolveSessionUser(req as Request).userId;
      const updated = await service.update(params.taskId, userId, {
        title: typeof body.title === "string" ? String(body.title) : undefined,
        tag:
          typeof body.tag === "string"
            ? (String(body.tag) as import("./task.types").TaskTag)
            : undefined,
      });
      return NextResponse.json(createSuccessResponse(updated, "Task updated"));
    } catch (err: unknown) {
      const info = extractErrorInfo(err);
      return NextResponse.json(createErrorResponse(info.message, info.code), {
        status: info.statusCode,
      });
    }
  }

  async start(params: { taskId: string }, req: Request) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const body: Record<string, unknown> = await req.json().catch(() => ({}));
      const userId =
        typeof body.userId === "string"
          ? String(body.userId)
          : resolveSessionUser(req as Request).userId;
      const result = await service.start(params.taskId, userId);
      return NextResponse.json(createSuccessResponse(result, "Task started"));
    } catch (err: unknown) {
      const info = extractErrorInfo(err);
      return NextResponse.json(createErrorResponse(info.message, info.code), {
        status: info.statusCode,
      });
    }
  }

  async pause(params: { taskId: string }, req: Request) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const body: Record<string, unknown> = await req.json().catch(() => ({}));
      const userId =
        typeof body.userId === "string"
          ? String(body.userId)
          : resolveSessionUser(req as Request).userId;
      const result = await service.pause(params.taskId, userId);
      return NextResponse.json(createSuccessResponse(result, "Task paused"));
    } catch (err: unknown) {
      const info = extractErrorInfo(err);
      return NextResponse.json(createErrorResponse(info.message, info.code), {
        status: info.statusCode,
      });
    }
  }

  async resume(params: { taskId: string }, req: Request) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const body: Record<string, unknown> = await req.json().catch(() => ({}));
      const userId =
        typeof body.userId === "string"
          ? String(body.userId)
          : resolveSessionUser(req as Request).userId;
      const result = await service.resume(params.taskId, userId);
      return NextResponse.json(createSuccessResponse(result, "Task resumed"));
    } catch (err: unknown) {
      const info = extractErrorInfo(err);
      return NextResponse.json(createErrorResponse(info.message, info.code), {
        status: info.statusCode,
      });
    }
  }

  async complete(params: { taskId: string }, req: Request) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const body: Record<string, unknown> = await req.json().catch(() => ({}));
      const userId =
        typeof body.userId === "string"
          ? String(body.userId)
          : resolveSessionUser(req as Request).userId;
      const result = await service.complete(params.taskId, userId);
      return NextResponse.json(createSuccessResponse(result, "Task completed"));
    } catch (err: unknown) {
      const info = extractErrorInfo(err);
      return NextResponse.json(createErrorResponse(info.message, info.code), {
        status: info.statusCode,
      });
    }
  }

  async getTimeLogs(params: { taskId: string }, req?: Request) {
    try {
      const userId = req
        ? resolveSessionUser(req).userId
        : (resolveSessionUser(new Request("http://localhost") as Request)).userId;
      const logs = await service.getTimeLogs(params.taskId, userId);
      return NextResponse.json(createSuccessResponse(logs, "Time logs retrieved"));
    } catch (err: unknown) {
      const info = extractErrorInfo(err);
      return NextResponse.json(createErrorResponse(info.message, info.code), {
        status: info.statusCode,
      });
    }
  }

  async delete(params: { taskId: string }, req?: Request) {
    try {
      const userId = req
        ? resolveSessionUser(req).userId
        : (resolveSessionUser(new Request("http://localhost") as Request)).userId;
      await service.delete(params.taskId, userId);
      return NextResponse.json(createSuccessResponse(null, "Task deleted"));
    } catch (err: unknown) {
      const info = extractErrorInfo(err);
      return NextResponse.json(createErrorResponse(info.message, info.code), {
        status: info.statusCode,
      });
    }
  }
}
