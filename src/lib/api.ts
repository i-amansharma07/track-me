export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type TaskStatus = "pending" | "active" | "pause" | "completed";
export type TaskTag = "Exercise" | "Rest" | "Study" | "Discipline" | "Code" | "Revision";

export type TaskData = {
  id: string;
  userId: string;
  title: string;
  status: TaskStatus;
  tag?: TaskTag;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  logs?: { id: string; startedAt: string; endedAt: string | null }[];
  totalDurationSeconds?: number;
  longestDurationSeconds?: number;
};

export type PaginatedTasks = {
  data: TaskData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const BASE = "/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    credentials: "include",
  });
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `Request failed: ${res.status}`);
  }
  return json;
}

export type AnalyticsTimelineSegment =
  | {
      type: "task";
      taskId: string;
      taskTitle: string;
      tag: TaskTag | null;
      startMinute: number;
      endMinute: number;
      durationMinutes: number;
      durationSeconds: number;
      isOngoing: boolean;
    }
  | {
      type: "untracked";
      startMinute: number;
      endMinute: number;
      durationMinutes: number;
      durationSeconds: number;
      isOngoing: boolean;
    };

export type AnalyticsSession = {
  id: string;
  originalStartedAt: string;
  originalEndedAt: string | null;
  effectiveStartedAt: string;
  effectiveEndedAt: string;
  durationSeconds: number;
  durationMinutes: number;
  countedDurationSeconds: number;
  countedDurationMinutes: number;
  overlapSeconds: number;
  isOngoing: boolean;
};

export type AnalyticsTask = {
  id: string;
  title: string;
  tag: TaskTag | null;
  status: TaskStatus;
  totalDurationSeconds: number;
  totalDurationMinutes: number;
  percentageOfDay: number;
  sessionCount: number;
  sessions: AnalyticsSession[];
};

export type DailyAnalyticsData = {
  date: string;
  timezone: string;
  dayStart: string;
  dayEnd: string;
  dayDurationSeconds: number;
  dayDurationMinutes: number;
  summary: {
    totalTrackedSeconds: number;
    totalTrackedMinutes: number;
    untrackedSeconds: number;
    trackedPercentage: number;
    untrackedPercentage: number;
    totalTasks: number;
    totalSessions: number;
  };
  tasks: AnalyticsTask[];
  timeline: AnalyticsTimelineSegment[];
  warnings: { code: string; message: string }[];
};

export const api = {
  analytics: {
    daily: (params: { date: string; timezone?: string }) => {
      const search = new URLSearchParams({ date: params.date });
      if (params.timezone) search.set("timezone", params.timezone);
      return fetchJson<DailyAnalyticsData>(`${BASE}/analytics?${search.toString()}`);
    },
  },
  tasks: {
    list: (params?: { status?: TaskStatus; tag?: TaskTag; page?: number; limit?: number }) => {
      const search = new URLSearchParams();
      if (params?.status) search.set("status", params.status);
      if (params?.tag) search.set("tag", params.tag);
      if (params?.page) search.set("page", String(params.page));
      if (params?.limit) search.set("limit", String(params.limit));
      return fetchJson<TaskData[]>(`${BASE}/tasks?${search.toString()}`);
    },
    get: (taskId: string) => fetchJson<TaskData>(`${BASE}/tasks/${taskId}`),
    create: (body: { title: string; tag?: TaskTag }) =>
      fetchJson<TaskData>(`${BASE}/tasks`, { method: "POST", body: JSON.stringify(body) }),
    update: (taskId: string, body: { title?: string; tag?: TaskTag }) =>
      fetchJson<TaskData>(`${BASE}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: (taskId: string) => fetchJson<null>(`${BASE}/tasks/${taskId}`, { method: "DELETE" }),
    start: (taskId: string) =>
      fetchJson<TaskData>(`${BASE}/tasks/${taskId}/start`, { method: "POST" }),
    pause: (taskId: string) =>
      fetchJson<TaskData>(`${BASE}/tasks/${taskId}/pause`, { method: "POST" }),
    resume: (taskId: string) =>
      fetchJson<TaskData>(`${BASE}/tasks/${taskId}/resume`, { method: "POST" }),
    complete: (taskId: string) =>
      fetchJson<TaskData>(`${BASE}/tasks/${taskId}/complete`, { method: "POST" }),
    reopen: (taskId: string) =>
      fetchJson<TaskData>(`${BASE}/tasks/${taskId}/reopen`, { method: "POST" }),
    timeLogs: (taskId: string) =>
      fetchJson<
        {
          id: string;
          taskId: string;
          startedAt: string;
          endedAt: string | null;
          createdAt: string;
        }[]
      >(`${BASE}/tasks/${taskId}/timelogs`),
  },
};
