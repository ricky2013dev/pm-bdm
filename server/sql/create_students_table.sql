-- Create students table for PostgreSQL
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  course_interested TEXT,
  location TEXT,
  status TEXT NOT NULL,
  citizenship_status TEXT,
  current_situation TEXT,
  registration_date DATE NOT NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_registration_date ON students(registration_date);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);
