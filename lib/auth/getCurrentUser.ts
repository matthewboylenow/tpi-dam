import { getServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: "sales" | "admin";
}

/**
 * Get the current user from the server session
 * Use this in server components and API routes
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return {
    id: (session.user as any).id,
    email: session.user.email!,
    name: session.user.name || null,
    role: (session.user as any).role,
  };
}

/**
 * Require authentication in server components
 * Throws an error if user is not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Require admin role in server components
 * Throws an error if user is not an admin
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return user;
}
