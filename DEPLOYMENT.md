# Production Environment Guide

## Required variables (`.env` in production)

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/track_me?schema=public
AUTH_SECRET=<at-least-32-char-random-string>
AUTH_URL=https://your-domain.com
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
LOG_LEVEL=warn
PORT=3000
```

## Deployment steps

1. Generate Prisma client: `npx prisma generate`
2. Deploy migrations: `npx prisma migrate deploy`
3. Build: `npm run build`
4. Start: `npm run start`
5. Verify health: `GET /api/health` should return `{ "status": "ok" }`
6. Monitor: `LOG_LEVEL=warn` reduces noise; adjust to `error` in high-traffic environments.

## Graceful shutdown

Add to production entry point (optional but recommended):

```typescript
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

## Security notes

- Do not set `AUTH_TRUST_HOST=true` in production unless using a reverse proxy.
- Ensure `.env` is excluded from version control (`.gitignore` already covers it).
- Set `DATABASE_URL` to use SSL (`?sslmode=require`) for production PostgreSQL connections.
- Add rate limiting at the reverse proxy or application layer before exposing publicly.

## Health endpoint

`GET /api/health`

Response (200):

```json
{
  "status": "ok",
  "timestamp": "..."
}
```

Used for load balancer health checks and deployment verification.
