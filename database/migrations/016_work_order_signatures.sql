-- DCAM v22 Technician Job Sign-Off Foundation

CREATE TABLE IF NOT EXISTS work_order_signatures (
  id SERIAL PRIMARY KEY,

  work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  signer_name TEXT NOT NULL,
  signer_role TEXT,
  signature_text TEXT NOT NULL,
  notes TEXT,

  signed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_order_signatures_work_order_id ON work_order_signatures (work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_signatures_signed_at ON work_order_signatures (signed_at);
