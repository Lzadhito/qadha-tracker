-- Remove birth_year, baligh_age, baligh_certain from profiles.
-- These are now stored in localStorage only (see local-profile.ts).
ALTER TABLE "profiles"
  DROP COLUMN IF EXISTS "birth_year",
  DROP COLUMN IF EXISTS "baligh_age",
  DROP COLUMN IF EXISTS "baligh_certain";
