import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  check,
  index,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// Profiles: extends auth.users with app-specific data
export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id").primaryKey(),
    displayName: text("display_name"),
    birthYear: integer("birth_year").notNull(),
    balighAge: integer("baligh_age").notNull().default(15),
    balighCertain: boolean("baligh_certain").notNull().default(false),
    gender: text("gender").notNull(),
    avgCycleDays: integer("avg_cycle_days"),
    avgPeriodDays: integer("avg_period_days"),
    avgPeriodInRamadan: integer("avg_period_in_ramadan"),
    fastingStartAge: integer("fasting_start_age"),
    madhab: text("madhab"),
    intentStacking: boolean("intent_stacking").notNull().default(false),
    locale: text("locale").notNull().default("id"),
    timezone: text("timezone").notNull().default("Asia/Jakarta"),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    genderCheck: check("gender_check", sql`${table.gender} in ('male','female')`),
    madhaBCheck: check(
      "madhab_check",
      sql`${table.madhab} in ('shafii','hanafi','maliki','hanbali')`
    ),
  })
)

// Prayer phases: chunks of life the user describes during onboarding
export const prayerPhases = pgTable(
  "prayer_phases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    startYear: integer("start_year").notNull(),
    endYear: integer("end_year").notNull(),
    pattern: text("pattern").notNull(),
    missedPct: integer("missed_pct").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("prayer_phases_user_idx").on(table.userId),
    patternCheck: check(
      "prayer_pattern_check",
      sql`${table.pattern} in ('consistent','inconsistent','mostly_missed','completely_missed')`
    ),
    missedPctCheck: check(
      "prayer_missed_pct_check",
      sql`${table.missedPct} between 0 and 100`
    ),
    startEndCheck: check(
      "prayer_start_end_check",
      sql`${table.startYear} <= ${table.endYear}`
    ),
  })
)

// Prayer ledger: append-only log of every change to qadha count
export const prayerLedger = pgTable(
  "prayer_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    prayer: text("prayer").notNull(),
    entryType: text("entry_type").notNull(),
    amount: integer("amount").notNull(),
    sourcePhaseId: uuid("source_phase_id"),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userPrayerIdx: index("prayer_ledger_user_prayer_idx").on(
      table.userId,
      table.prayer
    ),
    userLoggedIdx: index("prayer_ledger_user_logged_idx").on(
      table.userId,
      table.loggedAt
    ),
    prayerCheck: check(
      "prayer_check",
      sql`${table.prayer} in ('subuh','zuhur','asar','maghrib','isya')`
    ),
    entryTypeCheck: check(
      "prayer_entry_type_check",
      sql`${table.entryType} in ('baseline','miss','qadha','adjustment')`
    ),
    amountSignCheck: check(
      "prayer_amount_sign_check",
      sql`
        (${table.entryType} in ('baseline','miss') and ${table.amount} > 0) or
        (${table.entryType} = 'qadha' and ${table.amount} < 0) or
        (${table.entryType} = 'adjustment')
      `
    ),
  })
)

// Fasting phases: per-Ramadan granularity
export const fastingPhases = pgTable(
  "fasting_phases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    startYear: integer("start_year").notNull(),
    endYear: integer("end_year").notNull(),
    pattern: text("pattern").notNull(),
    daysMissedPerRamadan: integer("days_missed_per_ramadan").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("fasting_phases_user_idx").on(table.userId),
    patternCheck: check(
      "fasting_pattern_check",
      sql`${table.pattern} in ('all_fasted','few_missed','half','few_fasted','none_fasted','custom')`
    ),
    daysCheck: check(
      "fasting_days_check",
      sql`${table.daysMissedPerRamadan} between 0 and 30`
    ),
    startEndCheck: check(
      "fasting_start_end_check",
      sql`${table.startYear} <= ${table.endYear}`
    ),
  })
)

// Fasting ledger
export const fastingLedger = pgTable(
  "fasting_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    entryType: text("entry_type").notNull(),
    amount: integer("amount").notNull(),
    fastedOn: text("fasted_on"),
    sourcePhaseId: uuid("source_phase_id"),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("fasting_ledger_user_idx").on(table.userId),
    entryTypeCheck: check(
      "fasting_entry_type_check",
      sql`${table.entryType} in ('baseline','miss','qadha','adjustment')`
    ),
    amountSignCheck: check(
      "fasting_amount_sign_check",
      sql`
        (${table.entryType} in ('baseline','miss') and ${table.amount} > 0) or
        (${table.entryType} = 'qadha' and ${table.amount} < 0) or
        (${table.entryType} = 'adjustment')
      `
    ),
  })
)
