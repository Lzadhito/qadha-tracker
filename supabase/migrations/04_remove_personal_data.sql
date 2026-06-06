-- Remove personal data columns from profiles.
-- gender, menstrual fields, and display_name are now stored in localStorage only.
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "gender_check";
ALTER TABLE "profiles"
  DROP COLUMN IF EXISTS "display_name",
  DROP COLUMN IF EXISTS "gender",
  DROP COLUMN IF EXISTS "avg_cycle_days",
  DROP COLUMN IF EXISTS "avg_period_days",
  DROP COLUMN IF EXISTS "avg_period_in_ramadan";
