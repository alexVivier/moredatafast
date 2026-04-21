CREATE TABLE "view_shares" (
  "id" text PRIMARY KEY NOT NULL,
  "view_id" text NOT NULL REFERENCES "views"("id") ON DELETE CASCADE,
  "token" text NOT NULL,
  "created_by" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "last_accessed_at" timestamp with time zone
);

CREATE UNIQUE INDEX "unique_view_share_token" ON "view_shares"("token");
CREATE INDEX "idx_view_shares_view" ON "view_shares"("view_id");
