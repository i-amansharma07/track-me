export type AnalyticsTaskStatus = "pending" | "active" | "pause" | "completed";
export type AnalyticsTaskTag =
  | "Exercise"
  | "Rest"
  | "Study"
  | "Discipline"
  | "Code"
  | "Revision"
  | null;

export type AnalyticsWarning = {
  code: "OVERLAPPING_TIMELOGS";
  message: string;
  affectedTimeLogIds: string[];
  winnerTimeLogId: string;
  overlapStartedAt: string;
  overlapEndedAt: string;
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
  tag: AnalyticsTaskTag;
  status: AnalyticsTaskStatus;
  totalDurationSeconds: number;
  totalDurationMinutes: number;
  percentageOfDay: number;
  sessionCount: number;
  sessions: AnalyticsSession[];
};

export type TimelineSegment =
  | {
      type: "task";
      taskId: string;
      taskTitle: string;
      tag: AnalyticsTaskTag;
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
  timeline: TimelineSegment[];
  warnings: AnalyticsWarning[];
};
