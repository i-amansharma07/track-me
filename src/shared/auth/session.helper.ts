import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth/auth.config";
import { AuthenticationError } from "@/shared/errors/app.error";

export type SessionUser = {
  userId: string;
  email?: string;
};

export async function resolveSessionUser(_req?: Request): Promise<SessionUser> {
  const session = await getServerSession(authConfig);
  const user = session?.user as { id?: string; email?: string } | undefined;

  if (!user?.id) {
    throw AuthenticationError("Authentication required");
  }

  return { userId: user.id, email: user.email };
}
