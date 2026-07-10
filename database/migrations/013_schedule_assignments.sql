-- DCAM v18 Scheduling and Job Allocation Foundation

CREATE TABLE IF NOT EXISTS schedule_assignments (
  id SERIAL PRIMARY KEY,

  work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  assigned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  schedule_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  notes TEXT,

  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_assignments_work_order_id ON schedule_assignments (work_order_id);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_assigned_user_id ON schedule_assignments (assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_schedule_date ON schedule_assignments (schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_status ON schedule_assignments (status);
