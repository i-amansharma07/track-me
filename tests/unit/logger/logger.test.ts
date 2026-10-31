import { describe, it, expect } from "vitest";
import { generateRequestId } from "@/shared/logger/logger";

describe("Logging utilities", () => {
  it("generates request IDs", () => {
    const id = generateRequestId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});
