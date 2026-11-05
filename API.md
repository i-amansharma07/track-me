# API Specification

OpenAPI 3.0. Source of truth for frontend contracts.

## Authentication

Use Auth.js (NextAuth) with Google OAuth. Endpoints under `/api/auth/[...nextauth]` handle sign-in/callback/session.

Every protected endpoint requires an active authenticated session. The server derives the user ID from the session (`userId` from the `User` model). Never send a `userId` from the client.

## Base URL

```
http://localhost:3000/api
```

## Error responses

Standard format:

```json
{
  "success": false,
  "message": "Task not found",
  "code": "NOT_FOUND"
}
```

Error codes:

- `VALIDATION_ERROR` (400) — Zod validation failed.
- `AUTHENTICATION_ERROR` (401) — No valid session.
- `AUTHORIZATION_ERROR` (403) — Not allowed for this user.
- `NOT_FOUND` (404) — Resource missing or not owned by user.
- `BUSINESS_CONFLICT` (409) — Invalid state transition, active task conflict, active task deletion blocked.
- `INTERNAL_ERROR` (500) — Unexpected server error.

## Tasks

### POST /api/tasks

Create a new task.

Request body:

```json
{
  "title": "Study TypeScript",
  "tag": "Study"
}
```

Response (201):

```json
{
  "success": true,
  "message": "Task created",
  "data": {
    "id": "...",
    "userId": "...",
    "title": "Study TypeScript",
    "status": "pending",
    "tag": "Study",
    "createdAt": "...",
    "updatedAt": "...",
    "completedAt": null
  }
}
```

Notes:

- Status is always `pending`.
- `userId` is derived server-side from the session; ignore any client value.

---

### GET /api/tasks

List tasks with pagination and filtering.

Query parameters:

- `status` (optional): `pending`, `active`, `pause`, `completed`
- `tag` (optional): `Exercise`, `Rest`, `Study`, `Discipline`, `Code`, `Revision`
- `page` (default 1): page number
- `limit` (default 20, max 100): items per page

Response:

```json
{
  "success": true,
  "message": "Tasks retrieved",
  "data": [ { ... } ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

Ordering is stable by `userId` asc, `createdAt` asc, `id` asc.

---

### GET /api/tasks/:taskId

Retrieve a single task. Returns 404 if missing or not owned by user.

Response (200):

```json
{
  "success": true,
  "message": "Task retrieved",
  "data": { ... }
}
```

---

### PATCH /api/tasks/:taskId

Update title and/or tag only. Status mutation through PATCH is rejected (409).

Request body:

```json
{
  "title": "Updated title",
  "tag": "Discipline"
}
```

Response (200): updated task object.

---

### DELETE /api/tasks/:taskId

Delete a task. Rejected (409) if the task is `active`. Pending, paused, and completed tasks can be deleted; associated time logs cascade through the database foreign key.

Response (200):

```json
{
  "success": true,
  "message": "Task deleted",
  "data": null
}
```

---

## Task Lifecycle

All lifecycle endpoints require authentication.

### POST /api/tasks/:taskId/start

Allowed from `pending`. Creates a new open time log and sets status to `active`. Returns 409 if the user has another active task or the task is not in `pending`.

Response (200): updated task.

---

### POST /api/tasks/:taskId/pause

Allowed from `active`. Closes exactly one open time log using the current server timestamp. Returns 409 if no open log exists or the task is not `active`.

Response (200): updated task.

---

### POST /api/tasks/:taskId/resume

Allowed from `pause`. Creates a new open time log and sets status to `active`. Returns 409 if an open log already exists or the task is not `pause`.

Response (200): updated task.

---

### POST /api/tasks/:taskId/complete

Allowed from `pending`, `active`, or `pause`. If `active`, closes the open time log. If `pending` or `pause`, does not create or modify time logs. Sets `status` to `completed` and `completedAt` to current server time.

Response (200): updated task.

---

### POST /api/tasks/:taskId/reopen

Reopens a `completed` task back to `pause` status. Time logs remain unchanged. `completedAt` is cleared. Returns 409 if the task is not `completed`.

Response (200): updated task.

---

### GET /api/tasks/:taskId/timelogs

Retrieve time logs for the task, ordered by `startedAt` ascending. Returns 404 if the task does not exist or is not owned by the user.

Response (200):

```json
{
  "success": true,
  "message": "Time logs retrieved",
  "data": [
    { "id": "...", "taskId": "...", "startedAt": "...", "endedAt": "...", "createdAt": "..." }
  ]
}
```

---

## Time-log rules for frontend

- Never calculate or submit duration values from the frontend timer. Server timestamps (`startedAt`, `endedAt`) are authoritative.
- For active tasks, include the current session `startedAt` timestamp and total completed session duration from analytics endpoints.
- Do not implement direct `POST` or `PATCH` endpoints for `TaskTimeLog`.

## Authentication setup


1. Configure `.env` with `AUTH_SECRET`, `AUTH_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.
2. Check `AUTH_TRUST_HOST` for development.
3. Ensure `prisma/migrations/20251031_071200_init/` includes Auth.js-compatible `Account`, `Session`, and `VerificationToken` models.
4. Use the `/api/auth/[...nextauth]` endpoint for OAuth sign-in and session management.
5. Every protected endpoint derives `userId` from the server-side session, never from client input.

---

## Integration guide for frontend

- Always include the session cookie when calling protected endpoints.
- To retrieve all tasks: `GET /api/tasks?page=1&limit=20`.
- To filter: `GET /api/tasks?status=active&tag=Study`.
- To start a task: `POST /api/tasks/:taskId/start`.
- To restore an active timer after refresh: `GET /api/tasks` and check for `status: "active"`; retrieve `GET /api/tasks/:taskId/timelogs` to show current session `startedAt`.
- To show tracked time: `GET /api/dashboard/summary` for total; include active session duration from `GET /api/tasks` results.
- Never submit `userId`, `status`, or duration values manually.
