import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsRepository } from "./analytics.repository";
import { validateWithSchema } from "@/shared/validation";
import { dailyAnalyticsQuerySchema } from "./analytics.schema";
import { AppErrorCode } from "@/shared/errors/app.error";
import { createSuccessResponse, createErrorResponse } from "@/shared/http/response";
import { resolveSessionUser } from "@/shared/auth/session.helper";

const repo = new AnalyticsRepository();
const service = new AnalyticsService(repo);

function extractErrorInfo(err: unknown): { message: string; code: string; statusCode: number } {
  if (err instanceof Error) {
    const customErr = err as unknown as Record<string, unknown>;
    return {
      message: err.message || "Something went wrong",
      code: typeof customErr.code === "string" ? customErr.code : AppErrorCode.INTERNAL_ERROR,
      statusCode: typeof customErr.statusCode === "number" ? customErr.statusCode : 500,
    };
  }
  return { message: "Something went wrong", code: AppErrorCode.INTERNAL_ERROR, statusCode: 500 };
}

export class AnalyticsController {
  async getDaily(req: NextRequest) {
    try {
      const url = new URL(req.url);
      const userId = (await resolveSessionUser(req)).userId;
      const raw = {
        date: url.searchParams.get("date") ?? undefined,
        timezone: url.searchParams.get("timezone") ?? undefined,
      };
      if (raw.date === undefined) {
        return NextResponse.json(createErrorResponse("date is required", AppErrorCode.VALIDATION_ERROR), {
          status: 400,
        });
      }
      const validated = validateWithSchema(dailyAnalyticsQuerySchema, raw);
      const data = await service.getDaily(validated.date, validated.timezone, userId);
      return NextResponse.json(createSuccessResponse(data, "Daily analytics retrieved"));
    } catch (err: unknown) {
      const info = extractErrorInfo(err);
      return NextResponse.json(createErrorResponse(info.message, info.code), {
        status: info.statusCode,
      });
    }
  }
}
