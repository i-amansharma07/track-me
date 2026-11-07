# Daily Analytics API — Frontend Contract

## Endpoint

- **Method:** `GET`
- **Path:** `/api/analytics`
- **Auth:** Required (session cookie). User ID is derived from the authenticated session; never send `userId`.

## Query parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `date` | `YYYY-MM-DD` | Yes | Local calendar date to analyze (strict calendar validation). |
| `timezone` | IANA timezone (e.g. `Asia/Kolkata`, `UTC`) | No | Timezone used for day boundaries and minute offsets. **Default: `UTC`** when omitted. Frontend should send the user’s timezone explicitly. |

Invalid/missing `date`, invalid calendar dates, and invalid IANA timezones return `400` with the standard error envelope.

## Response envelope

All responses use the existing wrapper:

```json
{ "success": true, "message": "Daily analytics retrieved", "data": { ... } }
```

Errors:

```json
{ "success": false, "message": "...", "code": "VALIDATION_ERROR|AUTHENTICATION_ERROR|..." }
```

## `data` shape

```ts
type DailyAnalyticsData = {
  date: string;                 // YYYY-MM-DD
  timezone: string;             // resolved timezone (UTC fallback)
  dayStart: string;             // ISO absolute start of local day
  dayEnd: string;               // ISO absolute end/exclusive boundary of local day
  dayDurationSeconds: number;   // actual day length (DST-aware)
  dayDurationMinutes: number;   // actual day length in minutes (DST-aware)
  summary: {
    totalTrackedSeconds: number; // UNION of tracked time after overlap resolution
    totalTrackedMinutes: number;
    untrackedSeconds: number;    // dayDurationSeconds - totalTrackedSeconds
    trackedPercentage: number;   // of actual day duration
    untrackedPercentage: number;
    totalTasks: number;
    totalSessions: number;
  };
  tasks: AnalyticsTask[];       // aggregated per task ID
  timeline: TimelineSegment[];  // chronological, non-overlapping, covers full day
  warnings: AnalyticsWarning[]; // data-integrity warnings (200 still returned)
};
```

### `tasks[]` (aggregated)

- Aggregated by **task ID** (not title).
- `totalDurationSeconds = sum(sessions[].countedDurationSeconds)`.
- `percentageOfDay = totalDurationSeconds / dayDurationSeconds * 100` (actual day duration).
- `sessionCount = sessions.length`.

### `sessions[]`

| Field | Meaning |
|---|---|
| `originalStartedAt` / `originalEndedAt` | Original DB values. `originalEndedAt` is `null` for ongoing logs. |
| `effectiveStartedAt` / `effectiveEndedAt` | Clipped to the requested day (and to `now` for ongoing). |
| `durationSeconds` / `durationMinutes` | **Original clipped** duration (before overlap resolution). |
| `countedDurationSeconds` / `countedDurationMinutes` | Duration **attributed** after overlap resolution; used for task/summary totals. |
| `overlapSeconds` | Clipped time excluded because another log won priority. |
| `isOngoing` | `true` only for an actually ongoing timelog (`endedAt === null`) whose effective end is the current time. |

### `timeline[]`

Chronological, **non-overlapping**, and covers the entire day (gaps become `untracked`). Each segment:

- `type`: `"task" | "untracked"`
- `startMinute`, `endMinute`, `durationMinutes` — minutes from local day start (floats allowed). DST days use actual `dayDurationMinutes` (e.g. 1380/1500).
- `durationSeconds`
- `isOngoing`: `true` only when the segment is attributed to an ongoing timelog and ends at `now`.
- Task segments also include `taskId`, `taskTitle`, `tag`.

## Overlap resolution (deterministic)

Overlaps are resolved server-side; totals/timeline **never double-count**. Response is still `200` with `warnings`.

Priority (winner owns the overlapping interval):
1. Earliest original `startedAt`
2. Earliest `createdAt` if startedAt equal
3. Lexicographical `timeLogId` tie-breaker

Applied across same or different tasks. Intervals are split at ownership changes. `timeline.taskId` is always the winning task.

### Warning structure

```json
{
  "code": "OVERLAPPING_TIMELOGS",
  "message": "Overlapping timelogs were detected and resolved using earliest-started priority.",
  "affectedTimeLogIds": ["..."],
  "winnerTimeLogId": "...",
  "overlapStartedAt": "...",
  "overlapEndedAt": "..."
}
```

## Time/ongoing rules

- `effectiveEnd = min(endedAt ?? now, dayEnd)`; include only when `effectiveStart < effectiveEnd`.
- Ongoing (`endedAt === null`) is clipped to `dayEnd`/`now`, never extended to future dates; previous-day ongoing logs do not extend past requested `dayEnd`.
- `originalEndedAt` remains `null` for ongoing logs.

## Timezone & DST

- Default timezone: **UTC** (no user timezone stored yet).
- Day boundaries are computed in the requested IANA timezone and converted to absolute timestamps.
- Use **`dayDurationMinutes`/`dayDurationSeconds`** for positioning (DST-safe):

```ts
heightPct = (segment.durationMinutes / dayDurationMinutes) * 100;
topPct = (segment.startMinute / dayDurationMinutes) * 100; // 0 = bottom/12:00 AM in a vertical chart
```

## Frontend rendering guidance

- Build the 24h vertical timeline from `timeline[]` (already chronological, full-day).
- Build legend/summary from `tasks[]` (aggregated, by task ID). Match segments via `taskId`.
- Frontend assigns colors; backend does not.
- Display ongoing segments where `isOngoing === true`.

## Examples

Request:

```http
GET /api/analytics?date=2026-11-04&timezone=Asia/Kolkata
```

Empty day (success, not 404): `tasks=[]`, `summary.totalTrackedSeconds=0`, `summary.untrackedPercentage=100`, `timeline` has one `untracked` segment covering the full day.

Error examples: missing/invalid `date` or invalid `timezone` => `400 VALIDATION_ERROR`; unauthenticated => `401`.
