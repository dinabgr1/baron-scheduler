-- Baron Scheduler - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pilot_name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  with_instructor BOOLEAN DEFAULT FALSE,
  instructor_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flight logs table
CREATE TABLE IF NOT EXISTS flight_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  hobbs_start DECIMAL(10,1) NOT NULL,
  hobbs_end DECIMAL(10,1) NOT NULL,
  flight_time_hours INTEGER DEFAULT 0,
  flight_time_minutes INTEGER DEFAULT 0,
  fuel_added_liters DECIMAL(10,1) DEFAULT 0,
  fuel_level_quarters INTEGER DEFAULT 4 CHECK (fuel_level_quarters BETWEEN 1 AND 4),
  oil_engine1 DECIMAL(5,2) DEFAULT 0,
  oil_engine2 DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_pilot ON bookings(pilot_name);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_flight_logs_booking ON flight_logs(booking_id);

-- Row Level Security (RLS)
-- Enable RLS on both tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to bookings (for calendar view)
CREATE POLICY "Public read bookings" ON bookings
  FOR SELECT USING (true);

-- Allow public insert for bookings (no auth required)
CREATE POLICY "Public insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Allow service role full access (for admin operations)
CREATE POLICY "Service role full access bookings" ON bookings
  FOR ALL USING (auth.role() = 'service_role');

-- Flight logs policies
CREATE POLICY "Public read flight_logs" ON flight_logs
  FOR SELECT USING (true);

CREATE POLICY "Public insert flight_logs" ON flight_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access flight_logs" ON flight_logs
  FOR ALL USING (auth.role() = 'service_role');
