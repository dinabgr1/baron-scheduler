-- Billing records linked to pilots by name
CREATE TABLE IF NOT EXISTS billing_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  pilot_name TEXT NOT NULL,
  flight_date DATE,
  hours_flown DECIMAL(10,2),
  rate_per_hour DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  payment_method TEXT DEFAULT 'בנק שעות',
  package_id UUID REFERENCES hour_packages(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_billing" ON billing_records FOR ALL USING (auth.role() = 'service_role');
