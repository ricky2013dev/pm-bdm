# Design Guidelines: Birthdate Management App

## Design Approach
**System Selected:** Material Design with calendar app references (Google Calendar, Apple Calendar)
**Rationale:** Utility-focused productivity tool requiring clear information hierarchy, efficient interactions, and familiar calendar patterns.

## Core Design Principles
1. **Calendar-First Interface:** Monthly view dominates the viewport with minimal distractions
2. **Scan-Optimized Layout:** Quick visual identification of birthdays at a glance
3. **Inline Interactions:** All CRUD operations accessible without leaving the calendar view
4. **Clear Visual Hierarchy:** Birthdays stand out from empty dates

## Typography
- **Primary Font:** Inter or Roboto (Google Fonts CDN)
- **Hierarchy:**
  - Month/Year header: text-2xl font-semibold
  - Day numbers: text-sm font-medium
  - Birthday names: text-sm font-normal
  - Form labels: text-xs font-medium uppercase tracking-wide
  - Body text: text-base

## Layout System
**Spacing Units:** Use Tailwind units of 1, 2, 3, 4, 6, 8, 12
- Component padding: p-4 to p-6
- Calendar grid gaps: gap-1
- Section spacing: space-y-4
- Modal/form padding: p-6

**Layout Structure:**
- Single-page max-width container: max-w-6xl mx-auto
- Header with month navigation and add button
- 7-column calendar grid (Sunday-Saturday)
- Slide-out panel or modal for add/edit operations

## Component Library

### Calendar Grid
- **Grid Structure:** 7 columns (days) × 5-6 rows (weeks)
- **Day Cells:** Aspect-square or min-height for consistency
- **Empty Dates:** Subtle background, minimal presence
- **Current Month Dates:** Clear contrast, clickable
- **Today Indicator:** Distinct border or background treatment
- **Birthday Indicators:** 
  - Small circular avatars or initials badges
  - Stack multiple birthdays vertically within cell
  - Maximum 3 visible, "+N more" indicator for overflow

### Navigation
- **Month Switcher:** Centered month/year display with prev/next arrow buttons
- **Quick Jump:** Click month/year to open month/year picker dropdown
- **Add Birthday Button:** Primary action button (top-right or bottom-right fixed position)

### Forms (Add/Edit Birthday)
- **Display Method:** Slide-out panel from right or centered modal
- **Fields Required:**
  - Name input (text field, required)
  - Date picker (calendar popover or date input)
  - Optional notes (textarea, 2-3 rows)
- **Actions:** Save (primary), Cancel (secondary), Delete (destructive, edit mode only)
- **Validation:** Inline error messages below fields

### Birthday Display
- **Calendar Cell View:** 
  - Circular badge with initials or small avatar
  - Name truncated if needed
  - Age indicator (e.g., "28" or "turns 28")
- **Hover/Click Detail:**
  - Popover showing full name, exact date, age, notes
  - Quick actions: Edit, Delete
- **Upcoming Highlight:** Visual distinction for birthdays within next 7-30 days

### Empty States
- **No Birthdays:** Centered message with illustration suggestion and CTA to add first birthday
- **Empty Calendar Cells:** Minimal styling, clickable to quick-add

## Interactions
- **Click Empty Date:** Quick-add modal pre-filled with that date
- **Click Birthday Badge:** Show detail popover with edit/delete actions
- **Keyboard Navigation:** Arrow keys to navigate months, Enter to select
- **Mobile Touch:** Swipe left/right to change months

## Responsive Behavior
- **Desktop (lg+):** Full 7-column grid, side panel for forms
- **Tablet (md):** 7-column grid, modal for forms
- **Mobile (base):** Maintain 7-column grid with smaller cells, full-screen modal for forms, birthday names hidden (show count only), tap cell to see details

## Accessibility
- ARIA labels for all interactive elements
- Keyboard-accessible month navigation and form controls
- Focus indicators on all interactive elements
- Screen reader announcements for birthdays and current date
- Sufficient contrast ratios for all text

## Icons
**Library:** Heroicons (CDN)
- Navigation: chevron-left, chevron-right
- Actions: plus, pencil, trash, x-mark
- Indicators: cake (birthday), bell (notification)

## Animations
**Minimal approach:**
- Month transition: Subtle slide/fade (150ms)
- Modal/panel entry: Slide-in with fade (200ms)
- Hover states: Opacity/scale changes (100ms)
- No scroll animations or complex transitions

## Special Features
- **Upcoming Birthdays Sidebar (Desktop):** Optional narrow right sidebar listing next 5 upcoming birthdays chronologically
- **Age Calculation:** Automatically calculate and display current/upcoming age
- **Search/Filter:** Compact search bar to filter birthdays by name (appears above calendar)