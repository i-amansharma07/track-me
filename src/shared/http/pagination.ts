import { PaginationMeta, PaginatedResult } from "@/shared/http/response";

export type PaginationOptions = {
  page?: number;
  limit?: number;
};

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

export const parsePaginationOptions = (
  options?: PaginationOptions,
): { page: number; limit: number } => ({
  page: Math.max(1, Number(options?.page) || DEFAULT_PAGE),
  limit: Math.min(100, Math.max(1, Number(options?.limit) || DEFAULT_LIMIT)),
});

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
});

export const buildPaginatedResult = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> => ({
  data: items,
  pagination: buildPaginationMeta(page, limit, total),
});
