import { z } from "zod";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidCalendarDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const dailyAnalyticsQuerySchema = z
  .object({
    date: z
      .string()
      .regex(DATE_RE, "date must be in YYYY-MM-DD format")
      .refine(isValidCalendarDate, "Invalid calendar date"),
    timezone: z.string().refine(isValidTimeZone, "Invalid IANA timezone").optional(),
  })
  .strict();

export type DailyAnalyticsQuery = z.infer<typeof dailyAnalyticsQuerySchema>;
