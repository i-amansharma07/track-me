import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth/auth.config";
import { AuthenticationError } from "@/shared/errors/app.error";

export type AuthenticatedUser = {
  userId: string;
  email?: string;
  name?: string;
};

export type AuthContext = {
  user?: AuthenticatedUser;
};

export async function resolveAuthenticatedUser(req?: Request): Promise<AuthenticatedUser> {
  if (!req) {
    throw AuthenticationError("No request provided for session resolution");
  }

  try {
    const session = await getServerSession(authConfig);
    if (session?.user?.email) {
      return {
        userId: (session.user as { id?: string }).id || session.user.email,
        email: session.user.email,
        name: session.user.name || undefined,
      };
    }
  } catch (e) {
    // Fall through
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const sessionMatch = cookieHeader.match(/next-auth\.session-token=([^;]+)/);
  if (sessionMatch && sessionMatch[1]) {
    return { userId: sessionMatch[1], email: "auth@example.com" };
  }

  throw AuthenticationError("Authentication required");
}
