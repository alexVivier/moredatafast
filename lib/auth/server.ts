import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db, schema } from "@/db/client";
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "@/lib/email/resend";

import { seedUnifiedViewForUser } from "./hooks";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

// Don't throw at import-time: Next's build step imports every route module to
// "collect page data", and we don't want a missing env var during `docker build`
// to crash the build. If BETTER_AUTH_SECRET is missing at runtime Better-Auth
// itself will fail loudly when the first session request lands, which trips the
// container healthcheck.
const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  "dev-only-insecure-" + Math.random().toString(36).slice(2);

export const auth = betterAuth({
  baseURL,
  secret: authSecret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await seedUnifiedViewForUser(user.id);
        },
      },
    },
  },
  plugins: [nextCookies()],
  trustedOrigins: [baseURL],
});

export type AuthSession = typeof auth.$Infer.Session;
