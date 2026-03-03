-- Baron Scheduler D1 Schema

CREATE TABLE IF NOT EXISTS pilots (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  pilot_name TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  with_instructor INTEGER DEFAULT 0,
  instructor_name TEXT,
  status TEXT DEFAULT 'pending',
  google_event_id TEXT,
  phone TEXT,
  flight_purpose TEXT DEFAULT 'אימון',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS flight_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  booking_id TEXT,
  hobbs_start REAL NOT NULL,
  hobbs_end REAL NOT NULL,
  flight_time_hours INTEGER DEFAULT 0,
  flight_time_minutes INTEGER DEFAULT 0,
  fuel_added_liters REAL DEFAULT 0,
  fuel_level_quarters INTEGER DEFAULT 4,
  oil_engine1 REAL DEFAULT 0,
  oil_engine2 REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hour_packages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  pilot_id TEXT,
  pilot_name TEXT NOT NULL,
  hours_purchased REAL NOT NULL,
  hours_used REAL DEFAULT 0,
  price_paid REAL,
  purchase_date TEXT DEFAULT (date('now')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  rate_per_hour REAL NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  maintenance_type TEXT NOT NULL,
  last_done_date TEXT,
  last_done_hobbs REAL,
  interval_hours REAL,
  interval_months INTEGER,
  notes TEXT,
  visible_to_pilots INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS billing_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  booking_id TEXT,
  pilot_name TEXT NOT NULL,
  flight_date TEXT,
  hours_flown REAL,
  rate_per_hour REAL,
  total_amount REAL,
  payment_method TEXT DEFAULT 'hour-bank',
  package_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pilot_documents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  pilot_id TEXT,
  doc_type TEXT NOT NULL,
  expiry_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS preflight_checklists (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  booking_id TEXT,
  pilot_name TEXT NOT NULL,
  checked_items TEXT NOT NULL DEFAULT '[]',
  all_passed INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_pilot ON bookings(pilot_name);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_flight_logs_booking ON flight_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_hour_packages_pilot ON hour_packages(pilot_name);
CREATE INDEX IF NOT EXISTS idx_billing_pilot ON billing_records(pilot_name);
