import { AuthenticationError } from "@/shared/errors/app.error";

export type AuthenticatedUser = {
  userId: string;
  email?: string;
  name?: string;
};

export type AuthContext = {
  user?: AuthenticatedUser;
};

export function resolveAuthenticatedUser(req?: Request): AuthenticatedUser {
  if (!req) {
    throw AuthenticationError("No request provided for session resolution");
  }

  try {
    // Full Auth.js getServerSession integration deferred to Phase 2
    // Basic cookie/header session resolution used below
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Session resolution failed - fall back to cookie/header
  }

  // Fallback to cookie/header-based session resolution for basic protection
  const cookieHeader = req.headers.get("cookie") || "";
  const sessionMatch = cookieHeader.match(/session=([^;]+)/);
  if (sessionMatch && sessionMatch[1]) {
    return { userId: sessionMatch[1], email: "auth@example.com" };
  }

  const authHeader = req.headers.get("authorization") || "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    if (token && token.length > 0) {
      return { userId: token, email: "auth@example.com" };
    }
  }

  throw AuthenticationError("Authentication required");
}
