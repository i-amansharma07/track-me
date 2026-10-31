import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "@/shared/errors/app.error";

export const validateWithSchema = <T>(schema: ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({ path: e.path.join("."), message: e.message }));
      throw ValidationError("Validation failed", { details });
    }
    throw ValidationError("Invalid input");
  }
};
