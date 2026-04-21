import "server-only";

import { stripe as stripePlugin } from "@better-auth/stripe";
import { and, eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { db, schema } from "@/db/client";
import { requirePaidAction, PaywallError } from "@/lib/billing/gating";
import { STRIPE_PLAN_NAME, stripe } from "@/lib/billing/stripe";
import {
  sendInvitationEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "@/lib/email/resend";

import { createPersonalOrganizationForUser } from "./hooks";

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

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const premiumMonthly = process.env.STRIPE_PRICE_PREMIUM_MONTHLY || "";
const premiumYearly = process.env.STRIPE_PRICE_PREMIUM_YEARLY || undefined;

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
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
      subscription: schema.subscriptions,
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
          await createPersonalOrganizationForUser({
            id: user.id,
            email: user.email,
            name: user.name,
          });
        },
      },
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      // 48 h — matches the copy in the invitation email.
      invitationExpiresIn: 60 * 60 * 48,
      sendInvitationEmail: async ({ email, invitation, organization, inviter }) => {
        const acceptUrl = `${baseURL}/accept-invite?id=${invitation.id}`;
        const inviterLabel =
          inviter.user.name || inviter.user.email || "A teammate";
        await sendInvitationEmail(
          email,
          acceptUrl,
          organization.name,
          inviterLabel,
        );
      },
      organizationHooks: {
        // Paywall invitations: block creation once the trial has elapsed
        // without an active Stripe sub. Throwing an APIError here gives the
        // client a proper 402 + structured body instead of a generic 500.
        beforeCreateInvitation: async ({ invitation }) => {
          try {
            await requirePaidAction(invitation.organizationId);
          } catch (err) {
            if (err instanceof PaywallError) {
              throw new APIError("PAYMENT_REQUIRED", {
                message: `PAYWALL:${invitation.organizationId}`,
                code: "PAYWALL",
              });
            }
            throw err;
          }
        },
      },
    }),
    stripePlugin({
      stripeClient: stripe,
      stripeWebhookSecret,
      // Billing is org-scoped; no user-level customer objects.
      createCustomerOnSignUp: false,
      organization: { enabled: true },
      subscription: {
        enabled: true,
        plans: [
          {
            name: STRIPE_PLAN_NAME,
            priceId: premiumMonthly,
            annualDiscountPriceId: premiumYearly,
            freeTrial: { days: 14 },
          },
        ],
        // Only owners/admins may operate the subscription. Anyone in the org
        // may merely *list* it (needed to decide whether to render the
        // paywall banner).
        authorizeReference: async ({ user, referenceId, action }) => {
          const [member] = await db
            .select({ role: schema.members.role })
            .from(schema.members)
            .where(
              and(
                eq(schema.members.userId, user.id),
                eq(schema.members.organizationId, referenceId),
              ),
            )
            .limit(1);
          if (!member) return false;
          if (action === "list-subscription") return true;
          return member.role === "owner" || member.role === "admin";
        },
      },
    }),
    nextCookies(),
  ],
  trustedOrigins: [baseURL],
});

export type AuthSession = typeof auth.$Infer.Session;
