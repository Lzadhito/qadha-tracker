-- Row-level security for all user-data tables
-- Users can only see/modify their own data

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_select" ON "profiles" FOR SELECT USING (auth.uid() = "user_id");
CREATE POLICY "profiles_self_insert" ON "profiles" FOR INSERT WITH CHECK (auth.uid() = "user_id");
CREATE POLICY "profiles_self_update" ON "profiles" FOR UPDATE USING (auth.uid() = "user_id");
CREATE POLICY "profiles_self_delete" ON "profiles" FOR DELETE USING (auth.uid() = "user_id");

ALTER TABLE "prayer_phases" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prayer_phases_self_select" ON "prayer_phases" FOR SELECT USING (auth.uid() = "user_id");
CREATE POLICY "prayer_phases_self_insert" ON "prayer_phases" FOR INSERT WITH CHECK (auth.uid() = "user_id");
CREATE POLICY "prayer_phases_self_update" ON "prayer_phases" FOR UPDATE USING (auth.uid() = "user_id");
CREATE POLICY "prayer_phases_self_delete" ON "prayer_phases" FOR DELETE USING (auth.uid() = "user_id");

ALTER TABLE "prayer_ledger" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prayer_ledger_self_select" ON "prayer_ledger" FOR SELECT USING (auth.uid() = "user_id");
CREATE POLICY "prayer_ledger_self_insert" ON "prayer_ledger" FOR INSERT WITH CHECK (auth.uid() = "user_id");
CREATE POLICY "prayer_ledger_self_update" ON "prayer_ledger" FOR UPDATE USING (auth.uid() = "user_id");
CREATE POLICY "prayer_ledger_self_delete" ON "prayer_ledger" FOR DELETE USING (auth.uid() = "user_id");

ALTER TABLE "fasting_phases" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fasting_phases_self_select" ON "fasting_phases" FOR SELECT USING (auth.uid() = "user_id");
CREATE POLICY "fasting_phases_self_insert" ON "fasting_phases" FOR INSERT WITH CHECK (auth.uid() = "user_id");
CREATE POLICY "fasting_phases_self_update" ON "fasting_phases" FOR UPDATE USING (auth.uid() = "user_id");
CREATE POLICY "fasting_phases_self_delete" ON "fasting_phases" FOR DELETE USING (auth.uid() = "user_id");

ALTER TABLE "fasting_ledger" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fasting_ledger_self_select" ON "fasting_ledger" FOR SELECT USING (auth.uid() = "user_id");
CREATE POLICY "fasting_ledger_self_insert" ON "fasting_ledger" FOR INSERT WITH CHECK (auth.uid() = "user_id");
CREATE POLICY "fasting_ledger_self_update" ON "fasting_ledger" FOR UPDATE USING (auth.uid() = "user_id");
CREATE POLICY "fasting_ledger_self_delete" ON "fasting_ledger" FOR DELETE USING (auth.uid() = "user_id");

-- Views inherit RLS from underlying tables automatically
