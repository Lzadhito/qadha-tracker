# Design

## Context

Today the day cell draws one dot with a CSS `::after` set by a yes/no flag (`data-has-qadha`) in `calendar.tsx`. `QadhaCalendar` already holds `days: Map<dayKey, QadhaEntry[]>`, so the data for a count exists. Qadha amounts are stored negative (a log of one is `-1`), and pending offline entries are already merged into `days`.

## Goals / Non-Goals

**Goals:**
- Show the day's count with the least new code.
- Dots fit a 36px cell without wrapping or overflow.

**Non-Goals:**
- Telling prayers from fasts by colour or shape.
- Changing what the entries sheet shows.

## Decisions

- **Count = sum of absolute amounts per day**, in a small pure helper next to `groupByDay`. Why: the amount can be more than 1, and negative sign is a storage detail. Alternative skipped: count entries, which under-counts a bulk log.
- **Cap at 5 dots, then a number.** 5 dots at 4px with a 2px gap is 28px, which fits. 5 also matches a full day of prayers. Alternative skipped: cap at 3, which makes a normal day show a number.
- **Render real elements in the day button, not `::after`.** A pseudo-element can draw one dot, not N or a number. `QadhaCalendar` passes `Map<dayKey, count>` to the calendar, and the day button reads its own count. Alternative skipped: one modifier per count value, which is clumsy and still cannot show a number.
- **Keep the `qadha` modifier** for the sr-only label and the tap handler, so the existing "unmarked day opens nothing" behaviour does not change. The sr-only text becomes "N qadha done".

## Risks / Trade-offs

- [Dots too small to see on some phones] → 4px is small but they sit in a row; the number kicks in at 6, and size can be tuned in one class.
- [Selected-day styling (primary fill) hides the dots] → reuse the existing `primary-foreground` colour swap that the current dot already uses.
