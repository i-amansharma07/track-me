export type HttpSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
};

export type HttpErrorResponse = {
  success: false;
  message: string;
  code: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export const createSuccessResponse = <T>(
  data: T,
  message = "Operation successful",
): HttpSuccessResponse<T> => ({
  success: true,
  message,
  data,
});

export const createSuccessResponseWithPagination = <T>(
  paginated: PaginatedResult<T>,
  message = "Operation successful",
): HttpSuccessResponse<T[]> => ({
  success: true,
  message,
  data: paginated.data,
  pagination: paginated.pagination,
});

export const createErrorResponse = (message: string, code: string): HttpErrorResponse => ({
  success: false,
  message,
  code,
});
