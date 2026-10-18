## MODIFIED Requirements

### Requirement: Undo after a one-tap log
The system SHALL show a confirmation toast with an `Undo` action after each one-tap log, naming the prayer and its anchor, and activating `Undo` SHALL remove that qadha as if it had not been logged.

#### Scenario: Undo from the toast
- **WHEN** the user taps `+Qadha` on Asr and then taps `Undo` on the toast
- **THEN** the Asr qadha for today is removed and the remaining count returns to its previous value

#### Scenario: Toast names the anchor
- **WHEN** the user logs Fajr at 18:00
- **THEN** the toast reads that Fajr was logged after Maghrib

#### Scenario: Toast ignored
- **WHEN** the user taps `+Qadha` and does nothing further
- **THEN** the toast dismisses on its own and the log stays

### Requirement: Per-prayer date picker remains available
The system SHALL provide a secondary control (a calendar icon) beside each prayer's `+Qadha` button that opens the day-first logging sheet restricted to that prayer. The sheet SHALL show the same day choices as the `Log by day` sheet (Today, Yesterday, other date or range) and a single row of "done after" cells for that prayer, and SHALL log one qadha per ticked cell on each chosen day with a single save action.

#### Scenario: Open the date sheet
- **WHEN** the user taps the calendar control on the Subuh card
- **THEN** a sheet opens titled for Subuh with the day choices and one row of five "done after" cells, and no other prayer is shown

#### Scenario: Plus Qadha unchanged
- **WHEN** the user taps `+Qadha` on the Subuh card
- **THEN** one Subuh qadha dated today is logged immediately and no sheet opens

#### Scenario: Backfill one prayer
- **WHEN** the user opens the Subuh sheet, keeps `Yesterday`, ticks Subuh after Zuhur and after Isya, and taps `Save`
- **THEN** two Subuh qadha dated yesterday are recorded, anchored to Zuhur and Isya

#### Scenario: Already-logged cells
- **WHEN** the chosen single day already has Subuh anchored to Zuhur
- **THEN** that cell appears checked and disabled and Save does not log it again

#### Scenario: Nothing selected
- **WHEN** no cell is ticked
- **THEN** the Save action is disabled

### Requirement: Today and Yesterday shortcuts
The system SHALL offer `Today` and `Yesterday` choices that do not require the calendar in the day-first sheet, both for all prayers (`Log by day`) and for a single prayer (the calendar icon on a prayer card).

#### Scenario: Log yesterday without the calendar
- **WHEN** the user opens the Maghrib sheet, keeps `Yesterday`, ticks one cell and taps `Save`
- **THEN** one Maghrib qadha dated yesterday (WIB) is recorded and the sheet closes

### Requirement: Anchor stored with each qadha
The system SHALL record on every qadha logged through one-tap logging the anchor for the prayer slot of the device clock at that moment, and SHALL accept qadha with no anchor (entries logged before anchors existed).

#### Scenario: One-tap stores the anchor
- **WHEN** the clock is in the Maghrib slot and the user taps `+Qadha` on Fajr
- **THEN** one Fajr qadha dated today is recorded with anchor Maghrib

#### Scenario: Offline
- **WHEN** the user logs while offline
- **THEN** the anchor is kept in the pending log and synced with it

#### Scenario: Old entries
- **WHEN** an entry was logged before anchors existed
- **THEN** it displays and counts as before, with no anchor

## REMOVED Requirements

### Requirement: Prayer-time selector
**Reason**: The row of five buttons added clutter and a decision on every visit. The anchor now always follows the device clock for one-tap logging, and the day sheets already let the user tick any anchor.
**Migration**: None. Existing entries keep their stored anchors. A previously saved manual pick in local storage is ignored.
