# Spec Delta

## Purpose

Defines the app's one-page structure: the home page is the single hub, with no tab navigation, and secondary screens are reached from it and lead back to it.

## ADDED Requirements

### Requirement: No tab navigation
The system SHALL NOT show a bottom navigation bar or a side navigation on any signed-in screen.

#### Scenario: Phone viewport
- **WHEN** the user opens the home page on a phone-width viewport
- **THEN** no bottom navigation bar is shown and content is not padded to make room for one

#### Scenario: Desktop viewport
- **WHEN** the user opens the home page on a wide viewport
- **THEN** no side navigation is shown and the content stays centered in a single column

### Requirement: Settings reachable from the home header
The system SHALL show a Settings icon in the top right of the home header that opens the Settings screen, with an accessible label.

#### Scenario: Open settings
- **WHEN** the user taps the Settings icon on the home page
- **THEN** the Settings screen opens

#### Scenario: Single gear
- **WHEN** the user views the home header
- **THEN** exactly one gear icon is present and it opens Settings

### Requirement: Drill-down screens return home
Settings, its sub-pages, and History SHALL each show a back control that returns to the previous screen, ending at the home page.

#### Scenario: Back from history
- **WHEN** the user opens History from the home page and taps back
- **THEN** the home page is shown

#### Scenario: Back from a settings sub-page
- **WHEN** the user opens Settings, then Data & privacy, and taps back twice
- **THEN** the home page is shown

### Requirement: Adjust remaining lives in Settings
The system SHALL offer "Adjust remaining" as a row in Settings that opens the same adjustment flow previously opened from the home header, and SHALL NOT offer it on the home page.

#### Scenario: Adjust from settings
- **WHEN** the user taps "Adjust remaining" in Settings and saves a change
- **THEN** the remaining counts update and the change appears in history as an adjustment

#### Scenario: Not on home
- **WHEN** the user views the home page
- **THEN** no control for adjusting remaining counts is shown
