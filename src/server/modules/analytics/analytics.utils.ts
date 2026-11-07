import type { AnalyticsWarning } from "./analytics.types";

export type NormalizedInterval = {
  timeLogId: string;
  taskId: string;
  taskTitle: string;
  taskTag: string | null;
  taskStatus: string;
  originalStartedAt: Date;
  originalEndedAt: Date | null;
  timeLogCreatedAt: Date;
  effectiveStartedAt: Date;
  effectiveEndedAt: Date;
  isOngoing: boolean;
};

export type ResolvedSegment = {
  timeLogId: string;
  taskId: string;
  taskTitle: string;
  taskTag: string | null;
  taskStatus: string;
  startMs: number;
  endMs: number;
  isOngoing: boolean;
};

export type IntervalAccounting = {
  timeLogId: string;
  originalClippedSeconds: number;
  countedSeconds: number;
  overlapSeconds: number;
};

export type OverlapResolutionResult = {
  segments: ResolvedSegment[];
  warnings: AnalyticsWarning[];
  accounting: Map<string, IntervalAccounting>;
};

type Active = {
  interval: NormalizedInterval;
  endMs: number;
};

function byPriority(a: NormalizedInterval, b: NormalizedInterval): number {
  const sa = a.originalStartedAt.getTime();
  const sb = b.originalStartedAt.getTime();
  if (sa !== sb) return sa - sb;
  const ca = a.timeLogCreatedAt.getTime();
  const cb = b.timeLogCreatedAt.getTime();
  if (ca !== cb) return ca - cb;
  return a.timeLogId.localeCompare(b.timeLogId);
}

function higherPriority(a: NormalizedInterval, b: NormalizedInterval): boolean {
  return byPriority(a, b) < 0;
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function warnOverlap(
  winner: NormalizedInterval,
  loser: NormalizedInterval,
  overlapStartMs: number,
  overlapEndMs: number,
): AnalyticsWarning {
  return {
    code: "OVERLAPPING_TIMELOGS",
    message: "Overlapping timelogs were detected and resolved using earliest-started priority.",
    affectedTimeLogIds: [winner.timeLogId, loser.timeLogId].sort(),
    winnerTimeLogId: winner.timeLogId,
    overlapStartedAt: toIso(overlapStartMs),
    overlapEndedAt: toIso(overlapEndMs),
  };
}

export function resolveOverlaps(intervals: NormalizedInterval[]): OverlapResolutionResult {
  const accounting = new Map<string, IntervalAccounting>();
  for (const it of intervals) {
    const originalClippedSeconds = Math.max(
      0,
      Math.round((it.effectiveEndedAt.getTime() - it.effectiveStartedAt.getTime()) / 1000),
    );
    accounting.set(it.timeLogId, {
      timeLogId: it.timeLogId,
      originalClippedSeconds,
      countedSeconds: 0,
      overlapSeconds: 0,
    });
  }

  if (intervals.length === 0) {
    return { segments: [], warnings: [], accounting };
  }

  const sorted = [...intervals].sort((a, b) => {
    const s = a.effectiveStartedAt.getTime() - b.effectiveStartedAt.getTime();
    if (s !== 0) return s;
    return byPriority(a, b);
  });

  const points = new Set<number>();
  for (const it of sorted) {
    points.add(it.effectiveStartedAt.getTime());
    points.add(it.effectiveEndedAt.getTime());
  }
  const timeline = Array.from(points).sort((a, b) => a - b);

  const segments: ResolvedSegment[] = [];
  const warnings: AnalyticsWarning[] = [];
  const seenWarnings = new Set<string>();
  let active: Active[] = [];
  let idx = 0;

  for (let i = 0; i < timeline.length - 1; i++) {
    const start = timeline[i];
    const end = timeline[i + 1];
    if (end <= start) continue;

    while (idx < sorted.length && sorted[idx].effectiveStartedAt.getTime() === start) {
      active.push({ interval: sorted[idx], endMs: sorted[idx].effectiveEndedAt.getTime() });
      idx++;
    }

    active = active.filter((a) => a.endMs > start);
    if (active.length === 0) continue;

    let winner = active[0].interval;
    for (let j = 1; j < active.length; j++) {
      if (higherPriority(active[j].interval, winner)) winner = active[j].interval;
    }

    const seconds = Math.max(0, Math.round((end - start) / 1000));
    if (seconds === 0) continue;

    const winnerAcc = accounting.get(winner.timeLogId)!;
    winnerAcc.countedSeconds += seconds;

    for (const a of active) {
      if (a.interval.timeLogId === winner.timeLogId) continue;
      const loserAcc = accounting.get(a.interval.timeLogId)!;
      loserAcc.overlapSeconds += seconds;
      const key = [winner.timeLogId, a.interval.timeLogId, start, end].sort().join("|");
      if (!seenWarnings.has(key)) {
        seenWarnings.add(key);
        warnings.push(warnOverlap(winner, a.interval, start, end));
      }
    }

    const isOngoing = winner.isOngoing && end === winner.effectiveEndedAt.getTime();
    const last = segments[segments.length - 1];
    if (
      last &&
      last.timeLogId === winner.timeLogId &&
      last.taskId === winner.taskId &&
      last.endMs === start &&
      last.isOngoing === false &&
      isOngoing === false
    ) {
      last.endMs = end;
    } else {
      segments.push({
        timeLogId: winner.timeLogId,
        taskId: winner.taskId,
        taskTitle: winner.taskTitle,
        taskTag: winner.taskTag,
        taskStatus: winner.taskStatus,
        startMs: start,
        endMs: end,
        isOngoing,
      });
    }
  }

  // Reconcile rounding so overlap + counted <= original (best-effort) and counted sums correctly.
  for (const acc of accounting.values()) {
    if (acc.countedSeconds + acc.overlapSeconds > acc.originalClippedSeconds) {
      acc.overlapSeconds = Math.max(0, acc.originalClippedSeconds - acc.countedSeconds);
    }
  }

  return { segments, warnings, accounting };
}

export function toMinutes(ms: number): number {
  return ms / 60000;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type DateParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function getPartsInZone(date: Date, timeZone: string): DateParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function partsToFakeUtcMs(p: DateParts): number {
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

export function zonedLocalToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): number {
  const targetFake = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = targetFake;
  for (let i = 0; i < 4; i++) {
    const got = getPartsInZone(new Date(guess), timeZone);
    const gotFake = partsToFakeUtcMs(got);
    const diff = targetFake - gotFake;
    if (diff === 0) break;
    guess += diff;
  }
  return guess;
}

export function getDayBoundaries(dateStr: string, timeZone: string): {
  dayStart: Date;
  dayEnd: Date;
  dayDurationSeconds: number;
  dayDurationMinutes: number;
} {
  const [y, m, d] = dateStr.split("-").map(Number);
  const startMs = zonedLocalToUtcMs(y, m, d, 0, 0, 0, timeZone);
  const nextDay = new Date(Date.UTC(y, m - 1, d + 1));
  const endMs = zonedLocalToUtcMs(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth() + 1,
    nextDay.getUTCDate(),
    0,
    0,
    0,
    timeZone,
  );
  const dayDurationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));
  const dayDurationMinutes = dayDurationSeconds / 60;
  return {
    dayStart: new Date(startMs),
    dayEnd: new Date(endMs),
    dayDurationSeconds,
    dayDurationMinutes,
  };
}

export function clipInterval(
  startedAt: Date,
  endedAt: Date | null,
  dayStart: Date,
  dayEnd: Date,
  now: Date,
): { effectiveStartedAt: Date; effectiveEndedAt: Date; isOngoing: boolean } | null {
  const isOngoing = endedAt === null;
  const rawEnd = endedAt ?? now;
  const effectiveStartMs = Math.max(startedAt.getTime(), dayStart.getTime());
  const effectiveEndMs = Math.min(rawEnd.getTime(), dayEnd.getTime());
  if (effectiveStartMs >= effectiveEndMs) return null;
  const effectiveEndedAt = new Date(effectiveEndMs);
  return {
    effectiveStartedAt: new Date(effectiveStartMs),
    effectiveEndedAt,
    isOngoing: isOngoing && effectiveEndMs === now.getTime() && now.getTime() < dayEnd.getTime(),
  };
}
