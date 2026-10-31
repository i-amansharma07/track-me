import pino from "pino";
import { env } from "@/config/env";

export const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export type RequestContext = {
  requestId: string;
  method: string;
  route: string;
  userId?: string;
};

const sensitiveKeys = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "access_token",
  "refresh_token",
  "session_token",
]);

const redact = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(redact);
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.has(key.toLowerCase()) || key.toLowerCase().includes("token")) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redact(value);
      }
    }
    return result;
  }
  return obj;
};

const logLevel = env.LOG_LEVEL;

export const logger = pino({
  level: logLevel,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  messageKey: "msg",
  errorKey: "err",
  serializers: {
    err: pino.stdSerializers.err,
  },
});

export const safeLogError = (
  context: RequestContext,
  err: unknown,
  extra?: Record<string, unknown>,
) => {
  const errorData =
    err instanceof Error ? { message: err.message, stack: err.stack } : { value: err };
  const payload: Record<string, unknown> = {
    requestId: context.requestId,
    method: context.method,
    route: context.route,
    userId: context.userId,
    msg: "Request failed",
  };
  if (extra) {
    Object.assign(payload, redact({ ...extra, error: errorData }));
  } else {
    payload.error = errorData;
  }
  logger.error(payload);
};

export const logRequest = (context: RequestContext, statusCode: number, durationMs: number) => {
  logger.info({
    requestId: context.requestId,
    method: context.method,
    route: context.route,
    userId: context.userId,
    statusCode,
    durationMs,
    msg: "Request completed",
  });
};
