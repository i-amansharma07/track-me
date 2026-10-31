export type AuthenticatedUser = {
  userId: string;
  email?: string;
  name?: string;
};

export type AuthContext = {
  user?: AuthenticatedUser;
};

export const resolveAuthenticatedUser = (context?: AuthContext): AuthenticatedUser => {
  if (!context?.user?.userId) {
    throw new Error("No authenticated user");
  }
  return context.user;
};
