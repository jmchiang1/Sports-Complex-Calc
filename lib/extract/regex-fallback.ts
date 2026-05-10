import type { ExtractedListing } from '@/types/analysis'

const SQFT_RE = /([\d,]+)\s*(?:SF|sq\.?\s*ft)/i
// Prefer explicit "warehouse" keyword; fall back to "industrial" only if no warehouse match
const WAREHOUSE_RE = /([\d,]+)\s*SF\s*warehouse/i
const WAREHOUSE_INDUSTRIAL_RE = /([\d,]+)\s*SF\s*industrial/i
const OFFICE_RE = /([\d,]+)\s*SF\s*(?:dedicated\s*)?office/i
const CLEAR_HEIGHT_RE = /clear\s*(?:height|ceiling)\s*[:\-]?\s*(\d+)\s*(?:'|ft|feet)/i
const ZONING_RE = /zoning\s*[:\-]?\s*([A-Z][\w\-/]*)/i
const RENT_PSF_YR_RE = /\$?\s*(\d+(?:\.\d+)?)\s*\/\s*(?:sf|psf|sq\.?\s*ft)\s*\/?\s*(yr|year)?/i
const RENT_PSF_MO_RE = /\$?\s*(\d+(?:\.\d+)?)\s*\/\s*(?:sf|psf|sq\.?\s*ft)\s*\/?\s*(?:mo|month)/i
const UPON_REQUEST_RE = /upon\s+request|negotiable/i

const num = (s: string) => Number(s.replace(/,/g, ''))

export function parseListingWithRegex(text: string): ExtractedListing {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const address = lines[0]?.match(/^[\w\s\-,#'.]+(?:Ave|St|Rd|Blvd|Way|Pl|Dr|Ct|Pkwy|Hwy)\b.*/i)?.[0] ?? null

  const totalMatch = text.match(SQFT_RE)
  const totalSqft = totalMatch ? num(totalMatch[1]) : null

  const warehouseMatch = text.match(WAREHOUSE_RE) ?? text.match(WAREHOUSE_INDUSTRIAL_RE)
  const warehouseSqft = warehouseMatch ? num(warehouseMatch[1]) : null

  const officeMatch = text.match(OFFICE_RE)
  const officeSqft = officeMatch ? num(officeMatch[1]) : null

  const clearMatch = text.match(CLEAR_HEIGHT_RE)
  const clearHeight = clearMatch ? num(clearMatch[1]) : null

  const zoningMatch = text.match(ZONING_RE)
  const zoning = zoningMatch ? zoningMatch[1] : null

  let rentPerSqftYr: number | null = null
  if (!UPON_REQUEST_RE.test(text)) {
    const yrMatch = text.match(RENT_PSF_YR_RE)
    const moMatch = text.match(RENT_PSF_MO_RE)
    if (yrMatch) rentPerSqftYr = num(yrMatch[1])
    else if (moMatch) rentPerSqftYr = num(moMatch[1]) * 12
  }

  return {
    address,
    totalSqft,
    warehouseSqft,
    officeSqft,
    clearHeight,
    rentPerSqftYr,
    zoning,
    loading: null,
    parking: null,
    locationNotes: [],
  }
}
