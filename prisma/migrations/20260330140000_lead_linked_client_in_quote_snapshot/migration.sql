-- Prefer `quoteSnapshot.linkedExistingClientId` in app code (avoids Prisma hot-reload staleness).
-- If `linkedClientId` exists from an earlier schema, copy it into JSON then drop the column.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Lead' AND column_name = 'linkedClientId'
  ) THEN
    UPDATE "Lead"
    SET "quoteSnapshot" = jsonb_set(
      COALESCE("quoteSnapshot"::jsonb, '{}'::jsonb),
      '{linkedExistingClientId}',
      to_jsonb("linkedClientId"),
      true
    )
    WHERE "linkedClientId" IS NOT NULL;

    ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_linkedClientId_fkey";
    DROP INDEX IF EXISTS "Lead_linkedClientId_idx";
    ALTER TABLE "Lead" DROP COLUMN "linkedClientId";
  END IF;
END $$;
