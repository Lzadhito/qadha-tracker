-- Remove prayer_phases and fasting_phases tables.
-- Phases were only used for onboarding baseline calculation and settings re-edit.
-- Baselines are already materialized in prayer_ledger / fasting_ledger.
-- Phases are now stored in localStorage only.
ALTER TABLE "prayer_ledger" DROP CONSTRAINT IF EXISTS "prayer_ledger_phase_id_fk";
ALTER TABLE "fasting_ledger" DROP CONSTRAINT IF EXISTS "fasting_ledger_phase_id_fk";
ALTER TABLE "prayer_ledger" DROP COLUMN IF EXISTS "source_phase_id";
ALTER TABLE "fasting_ledger" DROP COLUMN IF EXISTS "source_phase_id";
DROP TABLE IF EXISTS "prayer_phases";
DROP TABLE IF EXISTS "fasting_phases";
