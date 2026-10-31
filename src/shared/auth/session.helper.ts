import { AuthenticationError } from "@/shared/errors/app.error";

export type SessionUser = {
  userId: string;
  email?: string;
};

export function resolveSessionUser(req?: Request): SessionUser {
  // Placeholder session resolution; in production this should use Auth.js getServerSession(req)
  // For now, requires a valid session cookie or authorization header with userId
  const authHeader = req ? req.headers.get("authorization") || undefined : undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    if (token && token.length > 0) {
      return { userId: token, email: "auth@example.com" };
    }
  }

  const cookieHeader = req ? req.headers.get("cookie") || "" : "";
  const sessionMatch = cookieHeader.match(/session=([^;]+)/);
  if (sessionMatch && sessionMatch[1]) {
    return { userId: sessionMatch[1], email: "auth@example.com" };
  }

  throw AuthenticationError("Authentication required");
}
