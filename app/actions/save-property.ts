'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Assumptions, ExtractedListing, Rating } from '@/types/analysis'

export interface SaveInput {
  id?: string
  label: string | null
  address: string | null
  listing: ExtractedListing
  assumptions: Assumptions
  snapshot: {
    rating: Rating
    noi: number
    totalCourts: number
    paybackYears: number | null
  }
}

export async function saveProperty(input: SaveInput) {
  const sb = await createSupabaseServerClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'not_authenticated' as const }

  const row = {
    user_id: user.id,
    label: input.label,
    address: input.address,
    listing_json: input.listing,
    assumptions_json: input.assumptions,
    rating: input.snapshot.rating,
    noi: input.snapshot.noi,
    total_courts: input.snapshot.totalCourts,
    payback_years: input.snapshot.paybackYears,
    updated_at: new Date().toISOString(),
  }

  const result = input.id
    ? await sb.from('properties').update(row).eq('id', input.id).select().single()
    : await sb.from('properties').insert(row).select().single()

  if (result.error) return { error: result.error.message }
  revalidatePath('/')
  return { id: result.data.id }
}
