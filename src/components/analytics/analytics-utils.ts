import type { AnalyticsTask, AnalyticsTimelineSegment } from "@/lib/api";

const GOLDEN_ANGLE = 137.508;

export function taskColorMap(tasks: AnalyticsTask[]): Record<string, string> {
  const map: Record<string, string> = {};
  const offset = Math.random() * 360;
  for (let i = 0; i < tasks.length; i++) {
    const hue = (offset + i * GOLDEN_ANGLE) % 360;
    map[tasks[i].id] = `hsl(${hue.toFixed(1)} 68% 58%)`;
  }
  return map;
}

export function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function formatMinuteLabel(minute: number): string {
  const m = Math.round(minute);
  const h24 = Math.floor(((m % 1440) + 1440) % 1440 / 60);
  const mm = Math.floor(((m % 60) + 60) % 60);
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
}

export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDate(dateIso: string, days: number): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function formatDateHeading(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function segmentTitle(seg: AnalyticsTimelineSegment): string {
  if (seg.type === "untracked") return `Untracked · ${formatSeconds(seg.durationSeconds)}`;
  const ongoing = seg.isOngoing ? " · ongoing" : "";
  return `${seg.taskTitle} · ${formatSeconds(seg.durationSeconds)}${ongoing}`;
}
