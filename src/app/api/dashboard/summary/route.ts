import { NextResponse } from "next/server";
import { AnalyticsController } from "@/server/modules/analytics/analytics.controller";
import { createSuccessResponse, createErrorResponse } from "@/shared/http/response";
import { AppErrorCode } from "@/shared/errors/app.error";

const controller = new AnalyticsController();

export async function GET() {
  try {
    const userId = "placeholder-user-id";
    const result = await controller.summary(userId);
    return NextResponse.json(createSuccessResponse(result, "Dashboard summary"));
  } catch (err: unknown) {
    const info =
      err instanceof Error
        ? { message: err.message, code: AppErrorCode.INTERNAL_ERROR, statusCode: 500 }
        : { message: "Something went wrong", code: AppErrorCode.INTERNAL_ERROR, statusCode: 500 };
    return NextResponse.json(createErrorResponse(info.message, info.code), {
      status: info.statusCode,
    });
  }
}
