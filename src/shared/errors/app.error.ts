export enum AppErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  BUSINESS_CONFLICT = "BUSINESS_CONFLICT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: AppErrorCode;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    code: AppErrorCode = AppErrorCode.INTERNAL_ERROR,
    isOperational = true,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.context = context;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const ValidationError = (message: string, context?: Record<string, unknown>) =>
  new AppError(message, 400, AppErrorCode.VALIDATION_ERROR, true, context);

export const AuthenticationError = (
  message = "Authentication required",
  context?: Record<string, unknown>,
) => new AppError(message, 401, AppErrorCode.AUTHENTICATION_ERROR, true, context);

export const AuthorizationError = (message = "Access denied", context?: Record<string, unknown>) =>
  new AppError(message, 403, AppErrorCode.AUTHORIZATION_ERROR, true, context);

export const NotFoundError = (message = "Resource not found", context?: Record<string, unknown>) =>
  new AppError(message, 404, AppErrorCode.NOT_FOUND, true, context);

export const ConflictError = (message = "Conflict", context?: Record<string, unknown>) =>
  new AppError(message, 409, AppErrorCode.BUSINESS_CONFLICT, true, context);

export const InternalError = (
  message = "Internal server error",
  context?: Record<string, unknown>,
) => new AppError(message, 500, AppErrorCode.INTERNAL_ERROR, false, context);
