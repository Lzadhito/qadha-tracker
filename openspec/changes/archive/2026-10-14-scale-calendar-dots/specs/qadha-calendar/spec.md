# Spec Delta

## MODIFIED Requirements

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
