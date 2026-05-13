/**
 * Detects NYC borough or Nassau County from a property address.
 * Returns null if we can't confidently place it.
 *
 * Strategy: city/borough name match first (most reliable), zip code fallback.
 */

export const REGIONS = [
  'Manhattan',
  'Brooklyn',
  'Queens',
  'Bronx',
  'Staten Island',
  'Nassau County',
] as const

export type Region = (typeof REGIONS)[number]

const NASSAU_CITIES = [
  // Inner-ring Nassau towns / villages — extend as needed
  'mineola',
  'hempstead',
  'garden city',
  'great neck',
  'manhasset',
  'roslyn',
  'glen cove',
  'westbury',
  'mineola',
  'levittown',
  'massapequa',
  'long beach',
  'oceanside',
  'rockville centre',
  'valley stream',
  'lynbrook',
  'baldwin',
  'freeport',
  'merrick',
  'bellmore',
  'farmingdale',
  'plainview',
  'syosset',
  'huntington',
  'jericho',
  'oyster bay',
  'port washington',
  'floral park',
  'new hyde park',
  'elmont',
  'franklin square',
  'uniondale',
  'east meadow',
  'wantagh',
  'seaford',
  'island park',
  'lawrence',
  'cedarhurst',
  'inwood',
  'woodmere',
  'hewlett',
]

export function detectRegion(address: string | null): Region | null {
  if (!address) return null
  const lower = address.toLowerCase()

  // City / borough name matches (most reliable)
  if (/\bmanhattan\b/.test(lower)) return 'Manhattan'
  if (/\bbrooklyn\b/.test(lower)) return 'Brooklyn'
  if (/\bstaten island\b/.test(lower)) return 'Staten Island'
  if (/\bbronx\b/.test(lower)) return 'Bronx'
  if (
    /\bqueens\b/.test(lower) ||
    /\bastoria\b/.test(lower) ||
    /\blong island city\b/.test(lower) ||
    /\bjamaica\b/.test(lower) ||
    /\bflushing\b/.test(lower) ||
    /\bjackson heights\b/.test(lower) ||
    /\belmhurst\b/.test(lower) ||
    /\bforest hills\b/.test(lower) ||
    /\brego park\b/.test(lower) ||
    /\bridgewood\b/.test(lower) ||
    /\bwoodhaven\b/.test(lower) ||
    /\brichmond hill\b/.test(lower) ||
    /\bbayside\b/.test(lower)
  ) {
    return 'Queens'
  }
  if (NASSAU_CITIES.some((c) => new RegExp(`\\b${c}\\b`).test(lower))) {
    return 'Nassau County'
  }
  // "New York, NY" without a borough usually means Manhattan
  if (/\bnew york\b/.test(lower)) return 'Manhattan'

  // Fall back to zip code
  const zipMatch = lower.match(/\b(1\d{4})\b/)
  if (zipMatch) {
    const zip = parseInt(zipMatch[1], 10)
    if (zip >= 10001 && zip <= 10282) return 'Manhattan'
    if (zip >= 10301 && zip <= 10314) return 'Staten Island'
    if (zip >= 10451 && zip <= 10475) return 'Bronx'
    if (zip >= 11201 && zip <= 11256) return 'Brooklyn'
    if (zip >= 11501 && zip <= 11598) return 'Nassau County'
    // Queens covers split ranges
    if ((zip >= 11004 && zip <= 11109) || (zip >= 11351 && zip <= 11697)) return 'Queens'
  }

  return null
}
