import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type Booking = {
  id: string
  pilot_name: string
  date: string
  start_time: string
  end_time: string
  with_instructor: boolean
  instructor_name: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  google_event_id: string | null
}

export type FlightLog = {
  id: string
  booking_id: string
  hobbs_start: number
  hobbs_end: number
  flight_time_hours: number
  flight_time_minutes: number
  fuel_added_liters: number
  fuel_level_quarters: number
  oil_engine1: number
  oil_engine2: number
  notes: string | null
  created_at: string
}
