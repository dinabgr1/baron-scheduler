// D1 Database helper for Cloudflare Pages
import { getRequestContext } from '@cloudflare/next-on-pages'

interface CloudflareEnv {
  DB: D1Database
  ADMIN_PASSWORD?: string
}

export function getDB(): D1Database {
  const ctx = getRequestContext()
  return (ctx.env as unknown as CloudflareEnv).DB
}

export function getEnv(): CloudflareEnv {
  const ctx = getRequestContext()
  return ctx.env as unknown as CloudflareEnv
}

// Simple query helpers
export async function dbAll<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]> {
  const db = getDB()
  const stmt = db.prepare(sql)
  const result = params.length > 0 ? await stmt.bind(...params).all<T>() : await stmt.all<T>()
  return result.results || []
}

export async function dbFirst<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T | null> {
  const db = getDB()
  const stmt = db.prepare(sql)
  return params.length > 0 ? await stmt.bind(...params).first<T>() : await stmt.first<T>()
}

export async function dbRun(sql: string, ...params: unknown[]): Promise<D1Result> {
  const db = getDB()
  const stmt = db.prepare(sql)
  return params.length > 0 ? await stmt.bind(...params).run() : await stmt.run()
}

// Re-export types for backward compat
export type Booking = {
  id: string; pilot_name: string; date: string; start_time: string; end_time: string;
  with_instructor: number; instructor_name: string | null; status: string;
  created_at: string; google_event_id: string | null; phone: string | null; flight_purpose: string | null
}
export type FlightLog = {
  id: string; booking_id: string; hobbs_start: number; hobbs_end: number;
  flight_time_hours: number; flight_time_minutes: number; fuel_added_liters: number;
  fuel_level_quarters: number; oil_engine1: number; oil_engine2: number; notes: string | null; created_at: string
}
export type Pilot = { id: string; name: string; phone: string|null; email: string|null; license_number: string|null; is_active: number; created_at: string; twin_engine_status: string|null }
export type CadetLessonRecord = {
  id: string; pilot_name: string; booking_id: string|null;
  flight_log_id: string|null; lesson_type: string; lesson_number: number;
  lesson_attempt: number; lesson_status: string; instructor_name: string|null;
  instructor_license: string|null; notes: string|null; submitted_by: string|null;
  created_at: string; updated_at: string
}
export type CadetLessonExercise = {
  id: string; lesson_record_id: string; exercise_name: string;
  grade: string; created_at: string
}
export type Rate = { id: string; name: string; rate_per_hour: number; description: string|null; is_active: number; created_at: string }
export type HourPackage = { id: string; pilot_id: string|null; pilot_name: string; hours_purchased: number; hours_used: number; price_paid: number|null; purchase_date: string; notes: string|null; created_at: string }
export type BillingRecord = { id: string; booking_id: string|null; pilot_name: string; flight_date: string|null; hours_flown: number|null; rate_per_hour: number|null; total_amount: number|null; payment_method: string; package_id: string|null; notes: string|null; created_at: string }
export type MaintenanceRecord = { id: string; maintenance_type: string; last_done_date: string|null; last_done_hobbs: number; interval_hours: number|null; interval_months: number|null; notes: string|null; visible_to_pilots: number; interval_type: 'calendar'|'airtime'|'fixed_airframe'; last_done_airframe_hours: number|null; next_due_airframe_hours: number|null; hobbs_at_maintenance: number|null; created_at: string; updated_at: string }
export type AircraftSetting = { key: string; value: string; updated_at: string }
export type MaintenanceHistory = { id: string; maintenance_record_id: string; done_date: string; done_airframe_hours: number|null; hobbs_reading: number|null; notes: string|null; created_at: string }
