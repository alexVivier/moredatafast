ALTER TABLE "views" ADD COLUMN "layout_seeded_at" timestamp with time zone;

-- Backfill: views that already have layout items count as seeded, so the
-- lazy seeder won't re-insert defaults if the user later empties them.
UPDATE "views"
SET "layout_seeded_at" = now()
WHERE EXISTS (
  SELECT 1 FROM "layout_items"
  WHERE "layout_items"."view_id" = "views"."id"
);
