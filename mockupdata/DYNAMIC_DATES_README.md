# Dynamic Appointment Dates for Demo Data

This project now features dynamic appointment dates for the mockup patient data, allowing you to easily refresh demo data anytime without needing to manually edit dates.

## Overview

- **Upcoming Appointments**: 5-6 patients with appointments 3-7 days from today
- **Past Appointments**: 4+ patients with appointments 30-120 days in the past
- **Realistic Times**: Random appointment times between 8 AM and 7 PM
- **Easy Refresh**: Single command to regenerate all dates

## Features

### Files Created

1. **`src/utils/dateGenerator.ts`** - TypeScript utility for generating dynamic dates
   - `generateDynamicAppointmentDates()` - Generate bulk appointments for demos
   - `getUpcomingAppointmentDate()` - Get single upcoming date
   - `getPastAppointmentDate()` - Get single past date
   - `generatePatientAppointmentDates()` - Generate dates for a specific patient

2. **`mockupdata/generateDynamicDates.cjs`** - Node.js script to update `patients.json`
   - Regenerates all appointment dates while preserving appointment types and provider names
   - Provides statistics and confirmation output
   - Uses CommonJS format (`.cjs`) for compatibility with project's ES module configuration

3. **`package.json`** - Added new npm script
   - `npm run refresh-dates` - Run the date generation script

## Usage

### Refresh Appointment Dates Before Demo

```bash
npm run refresh-dates
```

Output example:
```
✅ Dynamic appointment dates generated successfully!
📊 Statistics:
   - Patients with appointments: 10
   - Total appointments updated: 22

📅 Date ranges:
   - Upcoming appointments: 3-7 days from today
   - Past appointments: 30-120 days ago

💡 Tip: Run this script before doing demos to get fresh dates!
```

### Use in Code (TypeScript/React)

```typescript
import {
  getUpcomingAppointmentDate,
  getPastAppointmentDate,
  generatePatientAppointmentDates
} from '../utils/dateGenerator';

// Get a single upcoming appointment date
const upcomingDate = getUpcomingAppointmentDate();
// Returns: { date: "2025-12-04", time: "10:30 AM" }

// Get a single past appointment date
const pastDate = getPastAppointmentDate();
// Returns: { date: "2025-09-15", time: "2:00 PM" }

// Generate dates for a patient with 3 appointments
const patientAppointments = generatePatientAppointmentDates(3);
// Returns array of 3 appointments with random upcoming/past dates
```

## How It Works

### Date Ranges

- **Upcoming**: `today + 3 to 7 days`
- **Past**: `today - 30 to 120 days`
- **Times**: `8:00 AM to 7:00 PM` (random hours and :00/:30 minutes)

### Patient Appointment Strategy

Each patient gets:
1. **First appointment**: Always scheduled (upcoming)
2. **Remaining appointments**: Always completed (past)

This creates a realistic demo scenario where patients have upcoming scheduled appointments and completed historical appointments.

### Data Preservation

The script preserves:
- Appointment types (e.g., "Teeth Cleaning", "Root Canal")
- Provider names
- All other patient data

Only dates and times are regenerated.

## Schedule Before Demo

**Pro Tip**: Run `npm run refresh-dates` right before your demo so all dates are current and upcoming appointments are truly in the future!

Example workflow:
```bash
# Before starting demo
npm run refresh-dates

# Start demo
npm run dev:all

# All appointments will have current dates relative to today
```

## Customization

To customize date ranges, edit the constants in `mockupdata/generateDynamicDates.cjs`:

```javascript
const FUTURE_DAYS_MIN = 3;    // Minimum days for upcoming
const FUTURE_DAYS_MAX = 7;    // Maximum days for upcoming
const PAST_DAYS_MIN = 30;     // Minimum days in past
const PAST_DAYS_MAX = 120;    // Maximum days in past
```

Or use the TypeScript utility with custom config:

```typescript
import { generateDynamicAppointmentDates } from '../utils/dateGenerator';

const dates = generateDynamicAppointmentDates({
  futureCount: 6,
  pastCount: 4,
  futureDaysMin: 1,
  futureDaysMax: 14,
  pastDaysMin: 60,
  pastDaysMax: 180
});
```

## Benefits

✅ Never have hardcoded dates in demo data
✅ Always relevant demo appointments
✅ Consistent pattern: upcoming + past
✅ Easy to refresh anytime
✅ Realistic time distribution
✅ Preserves appointment metadata

---

**Last Updated**: December 4, 2025
