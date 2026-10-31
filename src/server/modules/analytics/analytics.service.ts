import { prisma } from "@/db/prisma";

export type SummaryResult = {
  totalTasks: number;
  pendingTasks: number;
  activeTasks: number;
  pausedTasks: number;
  completedTasks: number;
  totalTrackedSeconds: number;
};

export type DailyResultItem = {
  date: string;
  totalTrackedSeconds: number;
  completedTasks: number;
  workSessions: number;
};

export type CategoryResultItem = {
  tag: string | null;
  totalTrackedSeconds: number;
};

// Timezone behavior: All database timestamps are stored in UTC.
// Calendar-day aggregation uses UTC date boundaries.
export class AnalyticsService {
  async summary(userId: string): Promise<SummaryResult> {
    const counts = await prisma.task.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
    });

    const totalTasks = counts.reduce((sum, c) => sum + c._count.id, 0);
    const pendingTasks = counts.find((c) => c.status === "pending")?._count.id || 0;
    const activeTasks = counts.find((c) => c.status === "active")?._count.id || 0;
    const pausedTasks = counts.find((c) => c.status === "pause")?._count.id || 0;
    const completedTasks = counts.find((c) => c.status === "completed")?._count.id || 0;

    const logs = await prisma.taskTimeLog.findMany({
      where: {
        task: { userId },
      },
    });

    const now = new Date();
    let totalTrackedSeconds = 0;
    for (const log of logs) {
      const start = log.startedAt;
      const end = log.endedAt || now;
      totalTrackedSeconds += Math.floor((end.getTime() - start.getTime()) / 1000);
    }

    return {
      totalTasks,
      pendingTasks,
      activeTasks,
      pausedTasks,
      completedTasks,
      totalTrackedSeconds,
    };
  }

  async daily(userId: string, start?: string, end?: string): Promise<DailyResultItem[]> {
    const logs = await prisma.taskTimeLog.findMany({
      where: {
        task: { userId },
        startedAt: {
          gte: start ? new Date(start) : undefined,
          lte: end ? new Date(end) : undefined,
        },
      },
      include: {
        task: { select: { status: true, completedAt: true } },
      },
    });

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        completedAt: {
          gte: start ? new Date(start) : undefined,
          lte: end ? new Date(end) : new Date(),
        },
      },
    });

    const dateMap: Record<
      string,
      { totalTrackedSeconds: number; completedTasks: number; workSessions: number }
    > = {};

    for (const log of logs) {
      const dateStr = log.startedAt.toISOString().split("T")[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { totalTrackedSeconds: 0, completedTasks: 0, workSessions: 0 };
      }
      const startMs = log.startedAt.getTime();
      const endMs = log.endedAt ? log.endedAt.getTime() : new Date().getTime();
      dateMap[dateStr].totalTrackedSeconds += Math.floor((endMs - startMs) / 1000);
      dateMap[dateStr].workSessions += 1;
    }

    for (const task of tasks) {
      const dateStr = task.completedAt ? task.completedAt.toISOString().split("T")[0] : null;
      if (dateStr) {
        if (!dateMap[dateStr]) {
          dateMap[dateStr] = { totalTrackedSeconds: 0, completedTasks: 0, workSessions: 0 };
        }
        dateMap[dateStr].completedTasks += 1;
      }
    }

    return Object.entries(dateMap).map(([date, meta]) => ({
      date,
      totalTrackedSeconds: meta.totalTrackedSeconds,
      completedTasks: meta.completedTasks,
      workSessions: meta.workSessions,
    }));
  }

  async categories(userId: string): Promise<CategoryResultItem[]> {
    const logs = await prisma.taskTimeLog.findMany({
      where: { task: { userId } },
      include: { task: { select: { tag: true } } },
    });

    const tagMap: Record<string, number> = {};
    const now = new Date();
    for (const log of logs) {
      const tag = log.task.tag || "Unknown";
      const startMs = log.startedAt.getTime();
      const endMs = log.endedAt ? log.endedAt.getTime() : now.getTime();
      const seconds = Math.floor((endMs - startMs) / 1000);
      tagMap[tag] = (tagMap[tag] || 0) + seconds;
    }

    return Object.entries(tagMap).map(([tag, totalTrackedSeconds]) => ({
      tag,
      totalTrackedSeconds,
    }));
  }
}
