import { relations } from "drizzle-orm"
import {
  profiles,
  prayerPhases,
  prayerLedger,
  fastingPhases,
  fastingLedger,
} from "./schema"

export const profilesRelations = relations(profiles, ({ many }) => ({
  prayerPhases: many(prayerPhases),
  prayerLedger: many(prayerLedger),
  fastingPhases: many(fastingPhases),
  fastingLedger: many(fastingLedger),
}))

export const prayerPhasesRelations = relations(
  prayerPhases,
  ({ one, many }) => ({
    profile: one(profiles, {
      fields: [prayerPhases.userId],
      references: [profiles.userId],
    }),
    ledger: many(prayerLedger),
  })
)

export const prayerLedgerRelations = relations(
  prayerLedger,
  ({ one }) => ({
    profile: one(profiles, {
      fields: [prayerLedger.userId],
      references: [profiles.userId],
    }),
    phase: one(prayerPhases, {
      fields: [prayerLedger.sourcePhaseId],
      references: [prayerPhases.id],
    }),
  })
)

export const fastingPhasesRelations = relations(
  fastingPhases,
  ({ one, many }) => ({
    profile: one(profiles, {
      fields: [fastingPhases.userId],
      references: [profiles.userId],
    }),
    ledger: many(fastingLedger),
  })
)

export const fastingLedgerRelations = relations(
  fastingLedger,
  ({ one }) => ({
    profile: one(profiles, {
      fields: [fastingLedger.userId],
      references: [profiles.userId],
    }),
    phase: one(fastingPhases, {
      fields: [fastingLedger.sourcePhaseId],
      references: [fastingPhases.id],
    }),
  })
)
