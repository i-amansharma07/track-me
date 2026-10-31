import { describe, it, expect } from "vitest";
import {
  buildPaginationMeta,
  parsePaginationOptions,
  DEFAULT_LIMIT,
} from "@/shared/http/pagination";

describe("Pagination utilities", () => {
  it("defaults to page 1 and limit 20", () => {
    const opts = parsePaginationOptions();
    expect(opts.page).toBe(1);
    expect(opts.limit).toBe(20);
  });

  it("builds pagination meta", () => {
    const meta = buildPaginationMeta(2, 10, 25);
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(10);
    expect(meta.total).toBe(25);
    expect(meta.totalPages).toBe(3);
  });

  it("caps limit at 100", () => {
    const opts = parsePaginationOptions({ limit: 500 });
    expect(opts.limit).toBe(100);
  });
});
