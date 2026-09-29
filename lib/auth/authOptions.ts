import { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { encode } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail, getUserById, updateLastLogin } from "@/lib/db/queries";

const ONE_DAY_SECONDS = 24 * 60 * 60;

/** Session length when "keep me signed in" is checked. */
export const REMEMBERED_SESSION_MAX_AGE = 30 * ONE_DAY_SECONDS;

/** Session length for a normal sign-in. */
export const DEFAULT_SESSION_MAX_AGE = ONE_DAY_SECONDS;

/**
 * How often a live session re-reads its user row so that role changes and
 * deleted accounts take effect without waiting for the token to expire.
 */
const USER_RECHECK_INTERVAL_MS = 5 * 60 * 1000;

function sessionMaxAgeFor(token: JWT | undefined): number {
  return token?.rememberMe ? REMEMBERED_SESSION_MAX_AGE : DEFAULT_SESSION_MAX_AGE;
}

/**
 * NextAuth configuration
 *
 * v1: Uses Credentials provider with email/password
 * Future: Add Azure AD provider for Microsoft 365 SSO
 *
 * Sessions are JWTs. Every session read re-issues the token, so the expiry
 * is rolling: it measures time since the user last used the app. The length
 * of that window is chosen per sign-in by the "keep me signed in" checkbox
 * and stored on the token, then applied in the custom `jwt.encode` below.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Keep me signed in", type: "checkbox" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get user from database
          const user = await getUserByEmail(credentials.email);

          if (!user) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isValidPassword) {
            return null;
          }

          // Record last login time
          await updateLastLogin(user.id);

          // Return user object (without password hash)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            rememberMe: credentials.rememberMe === "true",
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),

    // TODO: Add Microsoft 365 / Azure AD provider
    // AzureADProvider({
    //   clientId: process.env.AZURE_AD_CLIENT_ID!,
    //   clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    //   tenantId: process.env.AZURE_AD_TENANT_ID!,
    // }),
  ],
  session: {
    strategy: "jwt",
    // The cookie lifetime. The JWT inside it carries its own, shorter expiry
    // for sign-ins that did not ask to be remembered (see jwt.encode).
    maxAge: REMEMBERED_SESSION_MAX_AGE,
  },
  jwt: {
    async encode(params) {
      return encode({ ...params, maxAge: sessionMaxAgeFor(params.token) });
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to JWT token on sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.rememberMe = user.rememberMe === true;
        token.userCheckedAt = Date.now();
        token.invalidated = false;
        return token;
      }

      // Periodically confirm the user still exists and pick up role changes.
      const lastChecked = token.userCheckedAt ?? 0;
      if (token.id && Date.now() - lastChecked > USER_RECHECK_INTERVAL_MS) {
        try {
          const dbUser = await getUserById(token.id);
          if (dbUser) {
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.role = dbUser.role;
            token.invalidated = false;
          } else {
            token.invalidated = true;
          }
          token.userCheckedAt = Date.now();
        } catch (error) {
          // Transient database error: keep the existing claims and retry later.
          console.error("Session re-validation error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.id || !token.role || token.invalidated) {
        // Reject the session: no user, already expired.
        return { expires: new Date(0).toISOString() };
      }

      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
      };
      // Report the real expiry for this sign-in rather than the cookie's.
      session.expires = new Date(
        Date.now() + sessionMaxAgeFor(token) * 1000
      ).toISOString();
      return session;
    },
  },
};
