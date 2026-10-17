# qadha-calendar Specification

## Purpose

Shows the user on which days they made up prayers or fasts, lets them see what was done on a given day, and links to the full history, all from the home page.

## Requirements

### Requirement: Month calendar on home
The home page SHALL show a month calendar below the fasting card, opening on the current month, with controls to move to previous and next months.

#### Scenario: Initial month
- **WHEN** the user opens the home page
- **THEN** the calendar shows the current month with today visually distinguished

#### Scenario: Change month
- **WHEN** the user taps the previous-month control
- **THEN** the calendar shows the previous month and its qadha days

### Requirement: Dots mark qadha days
The calendar SHALL mark every day on which at least one qadha (prayer or fasting) was recorded, using the Asia/Jakarta (WIB) day boundary. A marked day SHALL show one dot per unit of qadha done that day, up to 5 dots, and SHALL show the number instead of dots when more than 5 were done. Prayers and fasts count equally. Misses, adjustments and baseline entries SHALL NOT produce a mark or count.

#### Scenario: Qadha logged
- **WHEN** a Subuh qadha was logged at 05:00 WIB on the 12th
- **THEN** the 12th shows one dot, and the 11th is not marked

#### Scenario: Several qadha
- **WHEN** 3 prayer qadha and 1 fasting qadha were recorded on the 12th
- **THEN** the 12th shows 4 dots

#### Scenario: Five is still dots
- **WHEN** exactly 5 qadha were recorded on a day
- **THEN** the day shows 5 dots and no number

#### Scenario: Too many for dots
- **WHEN** 7 qadha were recorded on a day
- **THEN** the day shows the number 7 and no dots

#### Scenario: Entry with a larger amount
- **WHEN** one entry records 2 units of qadha on a day
- **THEN** that entry counts as 2

#### Scenario: Only a miss or adjustment
- **WHEN** a day has only a miss or an adjustment entry
- **THEN** that day is not marked

#### Scenario: Fasting qadha
- **WHEN** a fasting qadha was recorded for the 5th
- **THEN** the 5th shows one dot

#### Scenario: Screen reader
- **WHEN** a screen reader reads a marked day
- **THEN** it announces how many qadha were done

### Requirement: Pending logs appear immediately
The calendar SHALL include qadha logged while offline, before they sync, and SHALL drop a mark when the only qadha for that day is undone.

#### Scenario: Offline log
- **WHEN** the user logs a qadha with no network
- **THEN** today is marked immediately and stays marked after sync

#### Scenario: Undo the only qadha
- **WHEN** the user undoes the only qadha logged today
- **THEN** today's mark disappears

### Requirement: Day entries list
Selecting a marked day SHALL open a bottom sheet titled with that date and listing that day's qadha entries in the same row format as History, and selecting a row SHALL open that entry's detail screen. Selecting an unmarked day SHALL NOT open the sheet.

#### Scenario: Open a marked day
- **WHEN** the user taps the 12th, which has a Subuh and a Dhuhr qadha
- **THEN** a sheet lists both entries with their amounts

#### Scenario: Open an entry
- **WHEN** the user taps an entry in the sheet
- **THEN** the entry detail screen opens, and back returns to the home page

#### Scenario: Unmarked day
- **WHEN** the user taps a day with no qadha
- **THEN** no sheet opens

### Requirement: Entry point to full history
Below the calendar the home page SHALL show a `View history` button that opens the existing History screen with its filters and infinite scroll unchanged.

#### Scenario: View history
- **WHEN** the user taps `View history`
- **THEN** the History screen opens listing entries newest first
