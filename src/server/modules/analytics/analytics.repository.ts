import { prisma } from "@/db/prisma";

export type AnalyticsTaskRow = {
  id: string;
  userId: string;
  title: string;
  status: string;
  tag: string | null;
  timeLogs: {
    id: string;
    taskId: string;
    startedAt: Date;
    endedAt: Date | null;
    createdAt: Date;
  }[];
};

export class AnalyticsRepository {
  async findTasksWithOverlappingLogs(
    userId: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<AnalyticsTaskRow[]> {
    return prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        timeLogs: {
          some: {
            deletedAt: null,
            startedAt: { lt: dayEnd },
            OR: [{ endedAt: { gt: dayStart } }, { endedAt: null }],
          },
        },
      },
      select: {
        id: true,
        userId: true,
        title: true,
        status: true,
        tag: true,
        timeLogs: {
          where: {
            deletedAt: null,
            startedAt: { lt: dayEnd },
            OR: [{ endedAt: { gt: dayStart } }, { endedAt: null }],
          },
          select: {
            id: true,
            taskId: true,
            startedAt: true,
            endedAt: true,
            createdAt: true,
          },
          orderBy: [{ startedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }) as Promise<AnalyticsTaskRow[]>;
  }
}
