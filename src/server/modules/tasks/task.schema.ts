import { z } from "zod";
import { TaskTag } from "./task.types";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  tag: z.nativeEnum(TaskTag).optional(),
});
