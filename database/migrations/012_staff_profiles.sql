-- DCAM v17 Technician and Engineer Profile Foundation

CREATE TABLE IF NOT EXISTS staff_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  job_title TEXT,
  employment_type TEXT NOT NULL DEFAULT 'Employee',
  phone TEXT,
  skills TEXT,
  service_areas TEXT,
  working_hours TEXT,
  availability_status TEXT NOT NULL DEFAULT 'Available',
  competency_notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_qualifications (
  id SERIAL PRIMARY KEY,
  staff_profile_id INTEGER NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  qualification_name TEXT NOT NULL,
  issuing_body TEXT,
  certificate_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'Valid',
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON staff_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_availability_status ON staff_profiles (availability_status);
CREATE INDEX IF NOT EXISTS idx_staff_qualifications_profile_id ON staff_qualifications (staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_qualifications_expiry_date ON staff_qualifications (expiry_date);
CREATE INDEX IF NOT EXISTS idx_staff_qualifications_status ON staff_qualifications (status);
