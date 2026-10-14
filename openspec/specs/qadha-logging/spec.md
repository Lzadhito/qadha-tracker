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
The system SHALL show a confirmation toast with an `Undo` action after each one-tap log, and activating `Undo` SHALL remove that qadha as if it had not been logged.

#### Scenario: Undo from the toast
- **WHEN** the user taps `+Qadha` on Asr and then taps `Undo` on the toast
- **THEN** the Asr qadha for today is removed and the remaining count returns to its previous value

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

### Requirement: Day-first multi-prayer backfill
The system SHALL let the user choose one day, then select any subset of the five prayers, and log one qadha for each selected prayer on that day with a single save action.

#### Scenario: Log two prayers for yesterday
- **WHEN** the user opens the day-first sheet, keeps `Yesterday`, selects Dhuhr and Asr, and taps `Save`
- **THEN** one Dhuhr and one Asr qadha dated yesterday are recorded and no other prayer is logged

#### Scenario: Already-logged prayers are shown, not re-logged
- **WHEN** the chosen day already has Subuh logged
- **THEN** Subuh appears checked and disabled, and Save does not log Subuh again

#### Scenario: Select all remaining
- **WHEN** the user taps `Select all` on a day with two prayers already logged
- **THEN** exactly the three unlogged prayers become selected

#### Scenario: Nothing selected
- **WHEN** no prayer is selected
- **THEN** the Save action is disabled

### Requirement: Paid-off prayers are hidden from the prayer list
The system SHALL NOT show a prayer's row on the log screen when its remaining qadha is zero or less, its remaining count has loaded, and it has not been logged today.

#### Scenario: Prayer already paid off
- **WHEN** the log screen loads and Subuh has 0 qadha remaining and no Subuh logged today
- **THEN** no Subuh row is shown and the other prayers with qadha remaining are shown

#### Scenario: Still loading
- **WHEN** the remaining counts have not loaded yet
- **THEN** all five prayer rows are shown

### Requirement: Row stays visible on the day it is paid off
The system SHALL keep a prayer's row visible while that prayer is logged today, even when its remaining qadha is zero, so the user can still undo it.

#### Scenario: Log the last qadha
- **WHEN** the user taps `+Qadha` on Asr and Asr's remaining goes from 1 to 0
- **THEN** the Asr row stays, shows it as logged today and "All paid off", and its undo control still works

#### Scenario: Undo restores the count
- **WHEN** the user undoes that Asr log
- **THEN** the Asr row shows 1 remaining

#### Scenario: Next day
- **WHEN** the user opens the log screen on a later day and Asr still has 0 remaining
- **THEN** no Asr row is shown

### Requirement: All-paid-off message
The system SHALL show a short message in place of the prayer list when no prayer row is visible.

#### Scenario: Every prayer paid off
- **WHEN** all five prayers have 0 remaining and none were logged today
- **THEN** the prayer list is replaced by a message saying all prayer qadha is paid off, and `Log by day` is still available
