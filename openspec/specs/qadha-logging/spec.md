# qadha-logging Specification

## Purpose

Defines how a user records qadha (make-up) prayers from the log screen so that the common cases, logging a prayer just done and backfilling a past day, take as few taps as possible, while staying local-first and reversible.

## Requirements

### Requirement: One-tap logging for today
The system SHALL log one qadha for a prayer, dated today, when the user taps that prayer's `+Qadha` button, without opening any sheet or dialog.

#### Scenario: Tap logs immediately
- **WHEN** the user taps `+Qadha` on the Dhuhr card
- **THEN** one Dhuhr qadha dated today is recorded, the card shows it as logged today, and no sheet opens

#### Scenario: Works offline
- **WHEN** the user taps `+Qadha` while the device has no network
- **THEN** the log appears immediately and syncs later, exactly as other log actions do

### Requirement: Undo after a one-tap log
The system SHALL show a confirmation toast with an `Undo` action after each one-tap log, naming the prayer and its anchor, and activating `Undo` SHALL remove that qadha as if it had not been logged.

#### Scenario: Undo from the toast
- **WHEN** the user taps `+Qadha` on Asr and then taps `Undo` on the toast
- **THEN** the Asr qadha for today is removed and the remaining count returns to its previous value

#### Scenario: Toast names the anchor
- **WHEN** the user logs Fajr with Maghrib selected
- **THEN** the toast reads that Fajr was logged after Maghrib

#### Scenario: Toast ignored
- **WHEN** the user taps `+Qadha` and does nothing further
- **THEN** the toast dismisses on its own and the log stays

### Requirement: Per-prayer date picker remains available
The system SHALL provide a secondary control on each prayer card that opens a date sheet for logging that prayer on a chosen day or range of days.

#### Scenario: Open the date sheet
- **WHEN** the user taps the calendar control on the Subuh card
- **THEN** a sheet opens for logging Subuh on selected dates, and tapping `+Qadha` itself still logs immediately

### Requirement: Today and Yesterday shortcuts
The system SHALL offer `Today` and `Yesterday` choices that do not require the calendar, in both the per-prayer date sheet and the day-first sheet.

#### Scenario: Log yesterday without the calendar
- **WHEN** the user opens the per-prayer date sheet for Maghrib and taps `Yesterday`
- **THEN** one Maghrib qadha dated yesterday (WIB) is recorded and the sheet closes

### Requirement: Prayer-time selector
The system SHALL show a selector on the log screen with the five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) as the current anchor. It SHALL start from the device's time of day, SHALL let the user choose another, and SHALL return to the time-of-day value once the clock moves into a different prayer time slot than when the user chose.

#### Scenario: Starts from the clock
- **WHEN** the user opens the log screen at 18:00 and has chosen nothing
- **THEN** Maghrib is selected

#### Scenario: Manual pick holds within the slot
- **WHEN** the user taps Dhuhr at 13:00 and later opens the screen at 14:00
- **THEN** Dhuhr is still selected

#### Scenario: Manual pick expires with the slot
- **WHEN** the user tapped Dhuhr at 13:00 and the clock reaches the Asr slot
- **THEN** Asr is selected

### Requirement: Anchor stored with each qadha
The system SHALL record the selected anchor on every qadha logged through one-tap logging, and SHALL accept qadha with no anchor (entries logged before this change, and entries logged for a past day or range from the per-prayer date sheet).

#### Scenario: One-tap stores the anchor
- **WHEN** Maghrib is selected and the user taps `+Qadha` on Fajr
- **THEN** one Fajr qadha dated today is recorded with anchor Maghrib

#### Scenario: Offline
- **WHEN** the user logs while offline
- **THEN** the anchor is kept in the pending log and synced with it

#### Scenario: Old entries
- **WHEN** an entry was logged before anchors existed
- **THEN** it displays and counts as before, with no anchor

### Requirement: Today's count on each card
Each prayer card SHALL show how many qadha of that prayer are logged today, including pending ones, and SHALL show nothing when the count is zero.

#### Scenario: Three logs today
- **WHEN** the user has logged Fajr three times today
- **THEN** the Fajr card shows a count of 3

#### Scenario: Undo lowers the count
- **WHEN** the user undoes one of those logs
- **THEN** the Fajr card shows a count of 2

### Requirement: Anchor shown in history rows
History and day-entry rows SHALL show the anchor (for example "after Maghrib") for entries that have one, and SHALL look unchanged for entries that do not.

#### Scenario: Anchored entry
- **WHEN** a history row is a Fajr qadha with anchor Maghrib
- **THEN** the row shows that it was after Maghrib

### Requirement: Anchored day grid backfill
The system SHALL let the user choose a day or range of days, then show a grid of prayer made up by anchor, and log one qadha per ticked cell on each chosen day with a single save action. A single prayer MAY be ticked under several anchors.

#### Scenario: Fajr four times yesterday
- **WHEN** the user keeps `Yesterday`, ticks Fajr under Fajr, Dhuhr, Maghrib and Isha, and taps `Save`
- **THEN** four Fajr qadha dated yesterday are recorded, anchored to those four prayers

#### Scenario: Already-logged cells are shown, not re-logged
- **WHEN** the chosen single day already has Fajr anchored to Maghrib
- **THEN** that cell appears checked and disabled, other Fajr cells stay available, and Save does not log it again

#### Scenario: Range of days
- **WHEN** the user picks several days and ticks cells
- **THEN** each ticked cell is logged once on every chosen day, and no cell is shown as already logged

#### Scenario: Nothing selected
- **WHEN** no cell is ticked
- **THEN** the Save action is disabled
