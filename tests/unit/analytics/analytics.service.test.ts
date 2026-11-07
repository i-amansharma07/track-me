/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { describe, expect, it, vi, afterEach } from "vitest";
import { AnalyticsService } from "@/server/modules/analytics/analytics.service";
import type { AnalyticsTaskRow } from "@/server/modules/analytics/analytics.repository";

function repo(rows: AnalyticsTaskRow[]) {
  return { findTasksWithOverlappingLogs: vi.fn().mockResolvedValue(rows) };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("AnalyticsService.getDaily", () => {
  it("returns empty-day response with full untracked timeline", async () => {
    const svc = new AnalyticsService(repo([]) as any);
    const r = await svc.getDaily("2026-11-04", "UTC", "u1");
    expect(r.summary.totalTrackedSeconds).toBe(0);
    expect(r.summary.totalTasks).toBe(0);
    expect(r.summary.totalSessions).toBe(0);
    expect(r.summary.untrackedPercentage).toBe(100);
    expect(r.tasks).toEqual([]);
    expect(r.timeline).toHaveLength(1);
    expect(r.timeline[0]).toMatchObject({ type: "untracked", startMinute: 0, endMinute: 1440, isOngoing: false });
  });

  it("computes task occupying entire day", async () => {
    const rows: AnalyticsTaskRow[] = [
      {
        id: "t1", userId: "u1", title: "Sleep", status: "completed", tag: "Rest",
        timeLogs: [{ id: "l1", taskId: "t1", startedAt: new Date("2026-11-04T00:00:00Z"), endedAt: new Date("2026-11-05T00:00:00Z"), createdAt: new Date("2026-11-04T00:00:00Z") }],
      },
    ];
    const svc = new AnalyticsService(repo(rows) as any);
    const r = await svc.getDaily("2026-11-04", "UTC", "u1");
    expect(r.summary.totalTrackedSeconds).toBe(86400);
    expect(r.summary.untrackedSeconds).toBe(0);
    expect(r.tasks[0].percentageOfDay).toBe(100);
  });

  it("aggregates multiple sessions of same task and keeps timeline segments", async () => {
    const rows: AnalyticsTaskRow[] = [
      {
        id: "code", userId: "u1", title: "Coding", status: "completed", tag: "Code",
        timeLogs: [
          { id: "a", taskId: "code", startedAt: new Date("2026-11-04T10:00:00Z"), endedAt: new Date("2026-11-04T11:00:00Z"), createdAt: new Date("2026-11-04T10:00:00Z") },
          { id: "b", taskId: "code", startedAt: new Date("2026-11-04T14:00:00Z"), endedAt: new Date("2026-11-04T16:00:00Z"), createdAt: new Date("2026-11-04T14:00:00Z") },
        ],
      },
    ];
    const svc = new AnalyticsService(repo(rows) as any);
    const r = await svc.getDaily("2026-11-04", "UTC", "u1");
    expect(r.tasks).toHaveLength(1);
    expect(r.tasks[0].sessionCount).toBe(2);
    expect(r.tasks[0].totalDurationSeconds).toBe(10800);
    expect(r.timeline.filter((s) => s.type === "task")).toHaveLength(2);
  });

  it("clips timelog starting before day and ending after day", async () => {
    const rows: AnalyticsTaskRow[] = [
      {
        id: "t1", userId: "u1", title: "Long", status: "pause", tag: null,
        timeLogs: [{ id: "l1", taskId: "t1", startedAt: new Date("2026-11-03T22:00:00Z"), endedAt: new Date("2026-11-05T02:00:00Z"), createdAt: new Date("2026-11-03T22:00:00Z") }],
      },
    ];
    const svc = new AnalyticsService(repo(rows) as any);
    const r = await svc.getDaily("2026-11-04", "UTC", "u1");
    expect(r.tasks[0].totalDurationSeconds).toBe(86400);
    expect(r.tasks[0].sessions[0].originalStartedAt).toBe("2026-11-03T22:00:00.000Z");
    expect(r.tasks[0].sessions[0].effectiveStartedAt).toBe("2026-11-04T00:00:00.000Z");
  });

  it("handles ongoing timelog with null originalEndedAt and isOngoing", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T10:00:00.000Z"));
    const rows: AnalyticsTaskRow[] = [
      {
        id: "t1", userId: "u1", title: "Active", status: "active", tag: "Code",
        timeLogs: [{ id: "l1", taskId: "t1", startedAt: new Date("2026-11-04T09:00:00Z"), endedAt: null, createdAt: new Date("2026-11-04T09:00:00Z") }],
      },
    ];
    const svc = new AnalyticsService(repo(rows) as any);
    const r = await svc.getDaily("2026-11-04", "UTC", "u1");
    expect(r.tasks[0].sessions[0].originalEndedAt).toBeNull();
    expect(r.tasks[0].sessions[0].isOngoing).toBe(true);
    const taskSeg = r.timeline.find((s) => s.type === "task") as any;
    expect(taskSeg.isOngoing).toBe(true);
  });

  it("aggregates by task id when titles match", async () => {
    const rows: AnalyticsTaskRow[] = [
      { id: "t1", userId: "u1", title: "Same", status: "completed", tag: "Code", timeLogs: [{ id: "l1", taskId: "t1", startedAt: new Date("2026-11-04T01:00:00Z"), endedAt: new Date("2026-11-04T02:00:00Z"), createdAt: new Date("2026-11-04T01:00:00Z") }] },
      { id: "t2", userId: "u1", title: "Same", status: "completed", tag: "Study", timeLogs: [{ id: "l2", taskId: "t2", startedAt: new Date("2026-11-04T03:00:00Z"), endedAt: new Date("2026-11-04T04:00:00Z"), createdAt: new Date("2026-11-04T03:00:00Z") }] },
    ];
    const svc = new AnalyticsService(repo(rows) as any);
    const r = await svc.getDaily("2026-11-04", "UTC", "u1");
    expect(r.tasks).toHaveLength(2);
  });

  it("uses countedDurationSeconds for overlap totals and warnings", async () => {
    const rows: AnalyticsTaskRow[] = [
      { id: "sleep", userId: "u1", title: "Sleep", status: "completed", tag: "Rest", timeLogs: [{ id: "s1", taskId: "sleep", startedAt: new Date("2026-11-04T00:00:00Z"), endedAt: new Date("2026-11-04T08:00:00Z"), createdAt: new Date("2026-11-04T00:00:00Z") }] },
      { id: "ex", userId: "u1", title: "Exercise", status: "completed", tag: "Exercise", timeLogs: [{ id: "e1", taskId: "ex", startedAt: new Date("2026-11-04T07:00:00Z"), endedAt: new Date("2026-11-04T09:00:00Z"), createdAt: new Date("2026-11-04T07:00:00Z") }] },
    ];
    const svc = new AnalyticsService(repo(rows) as any);
    const r = await svc.getDaily("2026-11-04", "UTC", "u1");
    const ex = r.tasks.find((t) => t.id === "ex")!;
    expect(ex.sessions[0].durationSeconds).toBe(7200);
    expect(ex.sessions[0].countedDurationSeconds).toBe(3600);
    expect(ex.sessions[0].overlapSeconds).toBe(3600);
    expect(ex.totalDurationSeconds).toBe(3600);
    expect(r.summary.totalTrackedSeconds).toBe(32400);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("includes dayDurationMinutes for DST day", async () => {
    const svc = new AnalyticsService(repo([]) as any);
    const r = await svc.getDaily("2026-03-08", "America/New_York", "u1");
    expect(r.dayDurationSeconds).toBe(23 * 3600);
    expect(r.dayDurationMinutes).toBe(1380);
  });
});
