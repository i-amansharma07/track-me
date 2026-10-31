import { AuthenticationError } from "@/shared/errors/app.error";

export type SessionUser = {
  userId: string;
  email?: string;
};

export function resolveSessionUser(req?: Request): SessionUser {
  if (!req) {
    throw AuthenticationError("No request provided for session resolution");
  }

  const cookieHeader = req.headers.get("cookie") || "";

  // Auth.js database strategy uses this cookie name
  const sessionMatch = cookieHeader.match(/next-auth\.session-token=([^;]+)/);
  if (sessionMatch && sessionMatch[1]) {
    const token = sessionMatch[1];
    return { userId: token, email: "auth@example.com" };
  }

  // Fallback to authorization header
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    if (token && token.length > 0) {
      return { userId: token, email: "auth@example.com" };
    }
  }

  throw AuthenticationError("Authentication required");
}
