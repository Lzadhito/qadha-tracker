# Spec Delta

## ADDED Requirements

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
