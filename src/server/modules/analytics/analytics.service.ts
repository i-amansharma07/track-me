import { AnalyticsRepository } from "./analytics.repository";
import type {
  AnalyticsSession,
  AnalyticsTask,
  AnalyticsTaskStatus,
  AnalyticsTaskTag,
  DailyAnalyticsData,
  TimelineSegment,
} from "./analytics.types";
import {
  clipInterval,
  getDayBoundaries,
  resolveOverlaps,
  round2,
  toMinutes,
  type NormalizedInterval,
} from "./analytics.utils";

export class AnalyticsService {
  constructor(private repo: AnalyticsRepository) {}

  async getDaily(date: string, timezone: string | undefined, userId: string): Promise<DailyAnalyticsData> {
    const tz = timezone || "UTC";
    const now = new Date();
    const { dayStart, dayEnd, dayDurationSeconds, dayDurationMinutes } = getDayBoundaries(date, tz);

    const rows = await this.repo.findTasksWithOverlappingLogs(userId, dayStart, dayEnd);
    const normalized: NormalizedInterval[] = [];

    for (const task of rows) {
      for (const log of task.timeLogs) {
        const clipped = clipInterval(log.startedAt, log.endedAt, dayStart, dayEnd, now);
        if (!clipped) continue;
        normalized.push({
          timeLogId: log.id,
          taskId: task.id,
          taskTitle: task.title,
          taskTag: task.tag,
          taskStatus: task.status,
          originalStartedAt: log.startedAt,
          originalEndedAt: log.endedAt,
          timeLogCreatedAt: log.createdAt,
          effectiveStartedAt: clipped.effectiveStartedAt,
          effectiveEndedAt: clipped.effectiveEndedAt,
          isOngoing: clipped.isOngoing,
        });
      }
    }

    const { segments, warnings, accounting } = resolveOverlaps(normalized);
    const dayStartMs = dayStart.getTime();
    const dayEndMs = dayEnd.getTime();

    const timeline: TimelineSegment[] = [];
    let cursor = dayStartMs;
    for (const seg of segments) {
      if (seg.startMs > cursor) {
        timeline.push(this.untracked(cursor, seg.startMs, dayStartMs));
      }
      timeline.push({
        type: "task",
        taskId: seg.taskId,
        taskTitle: seg.taskTitle,
        tag: seg.taskTag as AnalyticsTaskTag,
        startMinute: round2(toMinutes(seg.startMs - dayStartMs)),
        endMinute: round2(toMinutes(seg.endMs - dayStartMs)),
        durationMinutes: round2(toMinutes(seg.endMs - seg.startMs)),
        durationSeconds: Math.max(0, Math.round((seg.endMs - seg.startMs) / 1000)),
        isOngoing: seg.isOngoing,
      });
      cursor = seg.endMs;
    }
    if (cursor < dayEndMs) {
      timeline.push(this.untracked(cursor, dayEndMs, dayStartMs));
    }
    if (timeline.length === 0) {
      timeline.push(this.untracked(dayStartMs, dayEndMs, dayStartMs));
    }

    const tasksById = new Map<string, AnalyticsTask>();
    const sessionsByTask = new Map<string, AnalyticsSession[]>();
    for (const task of rows) {
      sessionsByTask.set(task.id, []);
      tasksById.set(task.id, {
        id: task.id,
        title: task.title,
        tag: task.tag as AnalyticsTaskTag,
        status: task.status as AnalyticsTaskStatus,
        totalDurationSeconds: 0,
        totalDurationMinutes: 0,
        percentageOfDay: 0,
        sessionCount: 0,
        sessions: [],
      });
    }

    for (const it of normalized) {
      const acc = accounting.get(it.timeLogId);
      if (!acc) continue;
      const originalClippedSeconds = acc.originalClippedSeconds;
      const session: AnalyticsSession = {
        id: it.timeLogId,
        originalStartedAt: it.originalStartedAt.toISOString(),
        originalEndedAt: it.originalEndedAt ? it.originalEndedAt.toISOString() : null,
        effectiveStartedAt: it.effectiveStartedAt.toISOString(),
        effectiveEndedAt: it.effectiveEndedAt.toISOString(),
        durationSeconds: originalClippedSeconds,
        durationMinutes: round2(originalClippedSeconds / 60),
        countedDurationSeconds: acc.countedSeconds,
        countedDurationMinutes: round2(acc.countedSeconds / 60),
        overlapSeconds: acc.overlapSeconds,
        isOngoing: it.isOngoing,
      };
      sessionsByTask.get(it.taskId)?.push(session);
    }

    const tasks: AnalyticsTask[] = [];
    for (const [taskId, task] of tasksById) {
      const sessions = (sessionsByTask.get(taskId) || []).sort(
        (a, b) => new Date(a.effectiveStartedAt).getTime() - new Date(b.effectiveStartedAt).getTime(),
      );
      const totalDurationSeconds = sessions.reduce((s, x) => s + x.countedDurationSeconds, 0);
      if (sessions.length === 0) continue;
      tasks.push({
        ...task,
        totalDurationSeconds,
        totalDurationMinutes: round2(totalDurationSeconds / 60),
        percentageOfDay: dayDurationSeconds > 0 ? round2((totalDurationSeconds / dayDurationSeconds) * 100) : 0,
        sessionCount: sessions.length,
        sessions,
      });
    }

    tasks.sort((a, b) => {
      const aFirst = a.sessions[0]?.effectiveStartedAt ?? "";
      const bFirst = b.sessions[0]?.effectiveStartedAt ?? "";
      if (aFirst !== bFirst) return aFirst.localeCompare(bFirst);
      return a.id.localeCompare(b.id);
    });

    const totalTrackedSeconds = segments.reduce(
      (s, seg) => s + Math.max(0, Math.round((seg.endMs - seg.startMs) / 1000)),
      0,
    );
    const untrackedSeconds = Math.max(0, dayDurationSeconds - totalTrackedSeconds);
    const totalSessions = tasks.reduce((s, t) => s + t.sessionCount, 0);

    return {
      date,
      timezone: tz,
      dayStart: dayStart.toISOString(),
      dayEnd: dayEnd.toISOString(),
      dayDurationSeconds,
      dayDurationMinutes: round2(dayDurationMinutes),
      summary: {
        totalTrackedSeconds,
        totalTrackedMinutes: round2(totalTrackedSeconds / 60),
        untrackedSeconds,
        trackedPercentage: dayDurationSeconds > 0 ? round2((totalTrackedSeconds / dayDurationSeconds) * 100) : 0,
        untrackedPercentage: dayDurationSeconds > 0 ? round2((untrackedSeconds / dayDurationSeconds) * 100) : 0,
        totalTasks: tasks.length,
        totalSessions,
      },
      tasks,
      timeline,
      warnings,
    };
  }

  private untracked(startMs: number, endMs: number, dayStartMs: number): TimelineSegment {
    return {
      type: "untracked",
      startMinute: round2(toMinutes(startMs - dayStartMs)),
      endMinute: round2(toMinutes(endMs - dayStartMs)),
      durationMinutes: round2(toMinutes(endMs - startMs)),
      durationSeconds: Math.max(0, Math.round((endMs - startMs) / 1000)),
      isOngoing: false,
    };
  }
}
