import { describe, it, expect } from "vitest";
import {
  createSuccessResponse,
  createSuccessResponseWithPagination,
  createErrorResponse,
} from "@/shared/http/response";
import { buildPaginationMeta, buildPaginatedResult } from "@/shared/http/pagination";

describe("Response utilities", () => {
  it("creates success response", () => {
    const res = createSuccessResponse({ id: 1 }, "Done");
    expect(res.success).toBe(true);
    expect(res.message).toBe("Done");
    expect(res.data).toEqual({ id: 1 });
  });

  it("creates paginated response", () => {
    const paginated = buildPaginatedResult([1, 2], 10, 1, 5);
    expect(paginated.pagination.totalPages).toBe(2);
  });

  it("creates error response", () => {
    const err = createErrorResponse("Not found", "NOT_FOUND");
    expect(err.success).toBe(false);
    expect(err.code).toBe("NOT_FOUND");
  });
});
