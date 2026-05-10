CREATE TABLE IF NOT EXISTS "fasting_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_type" text NOT NULL,
	"amount" integer NOT NULL,
	"fasted_on" text,
	"source_phase_id" uuid,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fasting_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"pattern" text NOT NULL,
	"days_missed_per_ramadan" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prayer_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prayer" text NOT NULL,
	"entry_type" text NOT NULL,
	"amount" integer NOT NULL,
	"source_phase_id" uuid,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prayer_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"pattern" text NOT NULL,
	"missed_pct" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"birth_year" integer NOT NULL,
	"baligh_age" integer DEFAULT 15 NOT NULL,
	"baligh_certain" boolean DEFAULT false NOT NULL,
	"gender" text NOT NULL,
	"avg_cycle_days" integer,
	"avg_period_days" integer,
	"avg_period_in_ramadan" integer,
	"fasting_start_age" integer,
	"madhab" text,
	"intent_stacking" boolean DEFAULT false NOT NULL,
	"locale" text DEFAULT 'id' NOT NULL,
	"timezone" text DEFAULT 'Asia/Jakarta' NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fasting_ledger_user_idx" ON "fasting_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fasting_phases_user_idx" ON "fasting_phases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_ledger_user_prayer_idx" ON "prayer_ledger" USING btree ("user_id","prayer");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_ledger_user_logged_idx" ON "prayer_ledger" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_phases_user_idx" ON "prayer_phases" USING btree ("user_id");--> statement-breakpoint

-- Foreign keys
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "prayer_phases" ADD CONSTRAINT "prayer_phases_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "prayer_ledger" ADD CONSTRAINT "prayer_ledger_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "prayer_ledger" ADD CONSTRAINT "prayer_ledger_phase_id_fk" FOREIGN KEY ("source_phase_id") REFERENCES "prayer_phases"("id") ON DELETE SET NULL;
ALTER TABLE "fasting_phases" ADD CONSTRAINT "fasting_phases_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "fasting_ledger" ADD CONSTRAINT "fasting_ledger_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "fasting_ledger" ADD CONSTRAINT "fasting_ledger_phase_id_fk" FOREIGN KEY ("source_phase_id") REFERENCES "fasting_phases"("id") ON DELETE SET NULL;--> statement-breakpoint

-- Check constraints
ALTER TABLE "profiles" ADD CONSTRAINT "gender_check" CHECK ("gender" in ('male','female'));
ALTER TABLE "profiles" ADD CONSTRAINT "madhab_check" CHECK ("madhab" in ('shafii','hanafi','maliki','hanbali'));
ALTER TABLE "prayer_phases" ADD CONSTRAINT "prayer_pattern_check" CHECK ("pattern" in ('consistent','inconsistent','mostly_missed','completely_missed'));
ALTER TABLE "prayer_phases" ADD CONSTRAINT "prayer_missed_pct_check" CHECK ("missed_pct" between 0 and 100);
ALTER TABLE "prayer_phases" ADD CONSTRAINT "prayer_start_end_check" CHECK ("start_year" <= "end_year");
ALTER TABLE "prayer_ledger" ADD CONSTRAINT "prayer_check" CHECK ("prayer" in ('subuh','zuhur','asar','maghrib','isya'));
ALTER TABLE "prayer_ledger" ADD CONSTRAINT "prayer_entry_type_check" CHECK ("entry_type" in ('baseline','miss','qadha','adjustment'));
ALTER TABLE "prayer_ledger" ADD CONSTRAINT "prayer_amount_sign_check" CHECK (
  ("entry_type" in ('baseline','miss') and "amount" > 0) or
  ("entry_type" = 'qadha' and "amount" < 0) or
  ("entry_type" = 'adjustment')
);
ALTER TABLE "fasting_phases" ADD CONSTRAINT "fasting_pattern_check" CHECK ("pattern" in ('all_fasted','few_missed','half','few_fasted','none_fasted','custom'));
ALTER TABLE "fasting_phases" ADD CONSTRAINT "fasting_days_check" CHECK ("days_missed_per_ramadan" between 0 and 30);
ALTER TABLE "fasting_phases" ADD CONSTRAINT "fasting_start_end_check" CHECK ("start_year" <= "end_year");
ALTER TABLE "fasting_ledger" ADD CONSTRAINT "fasting_entry_type_check" CHECK ("entry_type" in ('baseline','miss','qadha','adjustment'));
ALTER TABLE "fasting_ledger" ADD CONSTRAINT "fasting_amount_sign_check" CHECK (
  ("entry_type" in ('baseline','miss') and "amount" > 0) or
  ("entry_type" = 'qadha' and "amount" < 0) or
  ("entry_type" = 'adjustment')
);--> statement-breakpoint

-- Views
CREATE VIEW "prayer_remaining" AS select user_id, prayer, sum(amount) as remaining from prayer_ledger group by user_id, prayer;
CREATE VIEW "fasting_remaining" AS select user_id, sum(amount) as remaining from fasting_ledger group by user_id;