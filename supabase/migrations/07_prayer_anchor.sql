-- Which daily prayer a qadha was done with (e.g. Fajr qadha after Maghrib). Nullable: old entries
-- and past-day logs have none. Apply this BEFORE deploying the app version that sends `anchor`.
ALTER TABLE "prayer_ledger" ADD COLUMN IF NOT EXISTS "anchor" text;
ALTER TABLE "prayer_ledger" ADD CONSTRAINT "prayer_anchor_check" CHECK ("anchor" is null or "anchor" in ('subuh','zuhur','asar','maghrib','isya'));
