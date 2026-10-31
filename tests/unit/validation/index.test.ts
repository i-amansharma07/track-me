import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateWithSchema } from "@/shared/validation";

describe("Validation utilities", () => {
  it("validates successfully", () => {
    const schema = z.object({ name: z.string() });
    expect(validateWithSchema(schema, { name: "test" })).toEqual({ name: "test" });
  });

  it("throws ValidationError for invalid data", () => {
    const schema = z.object({ name: z.string() });
    expect(() => validateWithSchema(schema, {})).toThrow();
  });
});
