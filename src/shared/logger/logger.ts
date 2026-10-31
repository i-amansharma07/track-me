import pino from "pino";
import { env } from "@/config/env";

const logLevel = env.LOG_LEVEL;

export const logger = pino({
  level: logLevel,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  messageKey: "msg",
  errorKey: "err",
});
