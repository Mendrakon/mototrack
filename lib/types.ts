export interface Bike {
  id: string
  user_id: string
  name: string
  make: string | null
  model: string | null
  year: number | null
  total_hours: number
  hours_offset: number
  api_key: string
  created_at: string
}

export interface ServiceInterval {
  id: string
  bike_id: string
  name: string
  interval_hours: number
  created_at: string
}

export interface ServiceLog {
  id: string
  bike_id: string
  interval_id: string | null
  service_name: string
  hours_at_service: number
  date: string
  notes: string | null
}

export type ServiceLogPartial = Pick<ServiceLog, 'interval_id' | 'hours_at_service' | 'date'>
