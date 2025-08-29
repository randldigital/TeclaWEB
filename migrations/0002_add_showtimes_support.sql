-- Migration: Add showtimes support to plays table
-- Add parent_play_id column for grouping related showtimes
ALTER TABLE "plays" ADD COLUMN "parent_play_id" TEXT;

-- Add showtime_order column for sorting showtimes
ALTER TABLE "plays" ADD COLUMN "showtime_order" INTEGER DEFAULT 0;

-- Create index for better performance when querying by parent_play_id
CREATE INDEX IF NOT EXISTS "idx_plays_parent_play_id" ON "plays" ("parent_play_id");

-- Update existing plays to set themselves as their own parent
UPDATE "plays" SET "parent_play_id" = "id" WHERE "parent_play_id" IS NULL;

