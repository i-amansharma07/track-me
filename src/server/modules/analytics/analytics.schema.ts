import { z } from "zod";

export const dateRangeSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});
