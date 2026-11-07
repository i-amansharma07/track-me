import { describe, expect, it } from "vitest";
import {
  clipInterval,
  getDayBoundaries,
  resolveOverlaps,
  type NormalizedInterval,
} from "@/server/modules/analytics/analytics.utils";

const dayStart = new Date("2026-11-03T18:30:00.000Z");
const dayEnd = new Date("2026-11-04T18:30:00.000Z");

function ni(
  partial: Partial<NormalizedInterval> &
    Pick<NormalizedInterval, "timeLogId" | "taskId" | "originalStartedAt" | "effectiveStartedAt" | "effectiveEndedAt">,
): NormalizedInterval {
  return {
    taskTitle: "Task",
    taskTag: null,
    taskStatus: "completed",
    originalEndedAt: partial.effectiveEndedAt ?? null,
    timeLogCreatedAt: new Date("2026-11-01T00:00:00.000Z"),
    isOngoing: false,
    ...partial,
  };
}

describe("analytics.utils day boundaries", () => {
  it("computes Asia/Kolkata day as 86400 seconds", () => {
    const b = getDayBoundaries("2026-11-04", "Asia/Kolkata");
    expect(b.dayStart.toISOString()).toBe("2026-11-03T18:30:00.000Z");
    expect(b.dayEnd.toISOString()).toBe("2026-11-04T18:30:00.000Z");
    expect(b.dayDurationSeconds).toBe(86400);
  });

  it("computes 23-hour DST day (US spring forward 2026-03-08)", () => {
    const b = getDayBoundaries("2026-03-08", "America/New_York");
    expect(b.dayDurationSeconds).toBe(23 * 3600);
  });

  it("computes 25-hour DST day (US fall back 2026-11-01)", () => {
    const b = getDayBoundaries("2026-11-01", "America/New_York");
    expect(b.dayDurationSeconds).toBe(25 * 3600);
  });
});

describe("analytics.utils clipInterval", () => {
  it("clips cross-midnight intervals", () => {
    const r = clipInterval(
      new Date("2026-11-03T17:00:00.000Z"),
      new Date("2026-11-03T20:00:00.000Z"),
      dayStart,
      dayEnd,
      new Date("2026-11-10T00:00:00.000Z"),
    );
    expect(r?.effectiveStartedAt.toISOString()).toBe(dayStart.toISOString());
    expect(r?.effectiveEndedAt.toISOString()).toBe("2026-11-03T20:00:00.000Z");
    expect(r?.isOngoing).toBe(false);
  });

  it("marks ongoing when effective end is now", () => {
    const now = new Date("2026-11-04T10:00:00.000Z");
    const r = clipInterval(new Date("2026-11-04T09:00:00.000Z"), null, dayStart, dayEnd, now);
    expect(r?.isOngoing).toBe(true);
    expect(r?.effectiveEndedAt.toISOString()).toBe(now.toISOString());
  });
});

describe("analytics.utils resolveOverlaps", () => {
  it("resolves different tasks with earliest startedAt winning", () => {
    const sleep = ni({
      timeLogId: "s1",
      taskId: "sleep",
      taskTitle: "Sleep",
      originalStartedAt: new Date("2026-11-03T18:30:00.000Z"),
      effectiveStartedAt: new Date("2026-11-03T18:30:00.000Z"),
      effectiveEndedAt: new Date("2026-11-04T02:30:00.000Z"),
      originalEndedAt: new Date("2026-11-04T02:30:00.000Z"),
    });
    const ex = ni({
      timeLogId: "e1",
      taskId: "exercise",
      taskTitle: "Exercise",
      originalStartedAt: new Date("2026-11-04T01:30:00.000Z"),
      effectiveStartedAt: new Date("2026-11-04T01:30:00.000Z"),
      effectiveEndedAt: new Date("2026-11-04T03:30:00.000Z"),
      originalEndedAt: new Date("2026-11-04T03:30:00.000Z"),
    });
    const r = resolveOverlaps([ex, sleep]);
    expect(r.segments).toHaveLength(2);
    expect(r.segments[0]).toMatchObject({
      taskId: "sleep",
      endMs: new Date("2026-11-04T02:30:00.000Z").getTime(),
    });
    expect(r.segments[1]).toMatchObject({
      taskId: "exercise",
      startMs: new Date("2026-11-04T02:30:00.000Z").getTime(),
    });
    expect(r.warnings.some((w) => w.code === "OVERLAPPING_TIMELOGS")).toBe(true);
    expect(r.accounting.get("e1")?.countedSeconds).toBe(3600);
    expect(r.accounting.get("e1")?.overlapSeconds).toBe(3600);
  });

  it("resolves overlaps within same task", () => {
    const a = ni({
      timeLogId: "a",
      taskId: "t",
      originalStartedAt: new Date("2026-11-04T00:00:00.000Z"),
      effectiveStartedAt: new Date("2026-11-04T00:00:00.000Z"),
      effectiveEndedAt: new Date("2026-11-04T02:00:00.000Z"),
    });
    const b = ni({
      timeLogId: "b",
      taskId: "t",
      originalStartedAt: new Date("2026-11-04T01:00:00.000Z"),
      effectiveStartedAt: new Date("2026-11-04T01:00:00.000Z"),
      effectiveEndedAt: new Date("2026-11-04T03:00:00.000Z"),
    });
    const r = resolveOverlaps([a, b]);
    const total = r.segments.reduce((s, x) => s + (x.endMs - x.startMs) / 1000, 0);
    expect(total).toBe(10800);
    expect(r.accounting.get("b")?.countedSeconds).toBe(3600);
  });

  it("uses createdAt when startedAt equal", () => {
    const lateCreated = ni({
      timeLogId: "late",
      taskId: "t1",
      originalStartedAt: new Date("2026-11-04T01:00:00.000Z"),
      timeLogCreatedAt: new Date("2026-11-02T00:00:00.000Z"),
      effectiveStartedAt: new Date("2026-11-04T01:00:00.000Z"),
      effectiveEndedAt: new Date("2026-11-04T02:00:00.000Z"),
    });
    const earlyCreated = ni({
      timeLogId: "early",
      taskId: "t2",
      originalStartedAt: new Date("2026-11-04T01:00:00.000Z"),
      timeLogCreatedAt: new Date("2026-11-01T00:00:00.000Z"),
      effectiveStartedAt: new Date("2026-11-04T01:00:00.000Z"),
      effectiveEndedAt: new Date("2026-11-04T02:00:00.000Z"),
    });
    const r = resolveOverlaps([lateCreated, earlyCreated]);
    expect(r.segments[0].timeLogId).toBe("early");
  });

  it("uses lexicographical id when startedAt and createdAt equal", () => {
    const b = ni({
      timeLogId: "b-id",
      taskId: "t1",
      originalStartedAt: new Date("2026-11-04T01:00:00.000Z"),
      timeLogCreatedAt: new Date("2026-11-01T00:00:00.000Z"),
      effectiveStartedAt: new Date("2026-11-04T01:00:00.000Z"),
      effectiveEndedAt: new Date("2026-11-04T02:00:00.000Z"),
    });
    const a = ni({
      timeLogId: "a-id",
      taskId: "t2",
      originalStartedAt: new Date("2026-11-04T01:00:00.000Z"),
      timeLogCreatedAt: new Date("2026-11-01T00:00:00.000Z"),
      effectiveStartedAt: new Date("2026-11-04T01:00:00.000Z"),
      effectiveEndedAt: new Date("2026-11-04T02:00:00.000Z"),
    });
    const r = resolveOverlaps([b, a]);
    expect(r.segments[0].timeLogId).toBe("a-id");
  });

  it("handles a log that wins part and loses part", () => {
    const w = ni({
      timeLogId: "w",
      taskId: "tw",
      originalStartedAt: new Date("2026-11-04T00:00:00.000Z"),
      effectiveStartedAt: new Date("2026-11-04T01:00:00.000Z"),
      effectiveEndedAt: new Date("2026-11-04T03:00:00.000Z"),
    });
    const l = ni({
      timeLogId: "l",
      taskId: "tl",
      originalStartedAt: new Date("2026-11-04T00:30:00.000Z"),
      effectiveStartedAt: new Date("2026-11-04T00:00:00.000Z"),
      effectiveEndedAt: new Date("2026-11-04T04:00:00.000Z"),
    });
    const r = resolveOverlaps([w, l]);
    expect(r.segments.map((s) => [s.taskId, (s.endMs - s.startMs) / 3600000])).toEqual([
      ["tl", 1],
      ["tw", 2],
      ["tl", 1],
    ]);
    expect(r.accounting.get("l")?.countedSeconds).toBe(7200);
  });

  it("produces no overlapping segments", () => {
    const r = resolveOverlaps([
      ni({ timeLogId: "1", taskId: "a", originalStartedAt: new Date("2026-11-04T00:00:00Z"), effectiveStartedAt: new Date("2026-11-04T00:00:00Z"), effectiveEndedAt: new Date("2026-11-04T03:00:00Z") }),
      ni({ timeLogId: "2", taskId: "b", originalStartedAt: new Date("2026-11-04T01:00:00Z"), effectiveStartedAt: new Date("2026-11-04T01:00:00Z"), effectiveEndedAt: new Date("2026-11-04T04:00:00Z") }),
      ni({ timeLogId: "3", taskId: "c", originalStartedAt: new Date("2026-11-04T02:00:00Z"), effectiveStartedAt: new Date("2026-11-04T02:00:00Z"), effectiveEndedAt: new Date("2026-11-04T05:00:00Z") }),
    ]);
    for (let i = 1; i < r.segments.length; i++) {
      expect(r.segments[i].startMs).toBeGreaterThanOrEqual(r.segments[i - 1].endMs);
    }
  });
});
