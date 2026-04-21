-- Users: optional stripe_customer_id (plugin may populate it; unused for the
-- org-scoped billing flow but part of the @better-auth/stripe schema).
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;
--> statement-breakpoint

-- Organizations: stripe_customer_id + trial_ends_at. For existing rows we
-- backfill max(created_at + 14d, now() + 14d) so every org gets at least a
-- fresh 14-day grace from the moment this migration lands.
ALTER TABLE "organizations" ADD COLUMN "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "trial_ends_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "organizations"
SET "trial_ends_at" = GREATEST(
  "created_at" + interval '14 days',
  now() + interval '14 days'
)
WHERE "trial_ends_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "organizations"
  ALTER COLUMN "trial_ends_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "organizations"
  ALTER COLUMN "trial_ends_at" SET DEFAULT (now() + interval '14 days');
--> statement-breakpoint

-- Subscriptions: auto-managed by @better-auth/stripe from webhook events.
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"reference_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'incomplete' NOT NULL,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false,
	"cancel_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"seats" integer,
	"billing_interval" text,
	"stripe_schedule_id" text
);
--> statement-breakpoint
CREATE INDEX "idx_subscriptions_reference" ON "subscriptions" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_stripe_customer" ON "subscriptions" USING btree ("stripe_customer_id");
