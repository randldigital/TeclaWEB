-- Migration: Fix tickets table schema
-- Add paid_at column
ALTER TABLE "tickets" ADD COLUMN "paid_at" timestamp;

-- Update existing tickets with ACTIVE status to Pendiente
UPDATE "tickets" SET "status" = 'Pendiente' WHERE "status" = 'ACTIVE';

-- Change default value for status column
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'Pendiente';
