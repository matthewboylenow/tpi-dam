import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

type UserRole = "sales" | "admin";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    /** Set at sign-in from the "keep me signed in" checkbox. */
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: UserRole;
    /** True when the user asked to stay signed in for the long session length. */
    rememberMe?: boolean;
    /** Epoch ms of the last time the user row was re-read from the database. */
    userCheckedAt?: number;
    /** Set when the user row no longer exists; the session is then rejected. */
    invalidated?: boolean;
  }
}
