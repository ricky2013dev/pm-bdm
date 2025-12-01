# Birthday Manager

A simple single-page birthdate management app with a monthly calendar view.

## Overview

This application allows users to track and manage birthdays with the following features:
- Monthly calendar view with birthday indicators
- Add, edit, and delete birthdays
- View birthday details including age calculations
- Dark/light mode toggle
- PostgreSQL database for persistent storage

## Tech Stack

- **Frontend:** React, TypeScript, TailwindCSS, Shadcn/UI components
- **Backend:** Node.js, Express
- **Database:** PostgreSQL with Drizzle ORM
- **Data Fetching:** TanStack Query

## Project Structure

```
client/
  src/
    components/
      BirthdayCalendar.tsx    # Main calendar component with CRUD UI
      ThemeToggle.tsx         # Dark/light mode toggle
    pages/
      Home.tsx                # Main page with data fetching
server/
  db.ts                       # Database connection
  routes.ts                   # API routes
  storage.ts                  # Data access layer
shared/
  schema.ts                   # Database schema and types
```

## API Endpoints

- `GET /api/birthdays` - Fetch all birthdays
- `GET /api/birthdays/:id` - Fetch single birthday
- `POST /api/birthdays` - Create new birthday
- `PUT /api/birthdays/:id` - Update birthday
- `DELETE /api/birthdays/:id` - Delete birthday

## Database Schema

### Birthdays Table
- `id` (varchar, UUID) - Primary key
- `name` (text) - Person's name
- `date` (date) - Birth date
- `notes` (text, nullable) - Optional notes

## Running the App

The app runs on port 5000 using the "Start application" workflow which executes `npm run dev`.

## Recent Changes

- 2024-12-01: Initial implementation with full CRUD functionality and PostgreSQL integration
