import type { Assumptions, ExtractedListing, Rating } from '@/types/analysis'

export interface PropertyRow {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  label: string | null
  address: string | null
  listing_json: ExtractedListing
  assumptions_json: Assumptions
  rating: Rating | null
  noi: number | null
  total_courts: number | null
  payback_years: number | null
}
