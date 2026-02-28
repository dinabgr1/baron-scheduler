ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flight_purpose TEXT DEFAULT 'אימון';

CREATE TABLE IF NOT EXISTS pilots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  rate_per_hour DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hour_packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pilot_id UUID REFERENCES pilots(id),
  pilot_name TEXT NOT NULL,
  hours_purchased DECIMAL(10,1) NOT NULL,
  hours_used DECIMAL(10,1) DEFAULT 0,
  price_paid DECIMAL(10,2),
  purchase_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hour_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_pilots" ON pilots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_rates" ON rates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_rates" ON rates FOR SELECT USING (true);
CREATE POLICY "service_packages" ON hour_packages FOR ALL USING (auth.role() = 'service_role');

-- Add billing_records linked to pilots by name
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
