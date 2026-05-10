export interface ExtractedListing {
  address: string | null
  totalSqft: number | null
  warehouseSqft: number | null
  officeSqft: number | null
  clearHeight: number | null
  rentPerSqftYr: number | null
  zoning: string | null
  loading: string | null
  parking: string | null
  locationNotes: string[]
}

export interface Assumptions {
  badmintonCourtSqft: number
  pickleballCourtSqft: number
  usableCourtAreaPct: number
  badmintonMixPct: number
  pickleballMixPct: number
  badmintonHourlyRate: number
  pickleballHourlyRate: number
  badmintonReservedHoursPerWeek: number
  pickleballReservedHoursPerWeek: number
  weeksPerYear: number
  otherRevenuePct: number
  payrollHourlyRate: number
  payrollHoursPerWeek: number
  payrollBurden: number
  utilitiesPerSqftYr: number
  insurancePerSqftYr: number
  maintenancePerSqftYr: number
  royaltyPct: number
  marketingPct: number
  miscAdminPct: number
  renovationPerSqftLow: number
  renovationPerSqftMid: number
  renovationPerSqftHigh: number
  franchiseFee: number
}

export interface AnalysisInput {
  listing: ExtractedListing
  assumptions: Assumptions
}

export type Rating =
  | 'Strong Candidate'
  | 'Worth Investigating'
  | 'Risky'
  | 'Do Not Pursue'
  | 'Incomplete'

export type RiskFlagId =
  | 'low-clear-height'
  | 'missing-rent'
  | 'too-few-courts'
  | 'high-rent-burden'
  | 'office-space'
  | 'zoning'

export interface RiskFlag {
  id: RiskFlagId
  severity: 'high' | 'medium' | 'low'
  title: string
  detail: string
}

export interface AnalysisResult {
  courts: { badminton: number; pickleball: number; total: number }
  revenue: { badminton: number; pickleball: number; other: number; gross: number }
  expenses: {
    rent: number
    payroll: number
    utilities: number
    insurance: number
    maintenance: number
    royalty: number
    marketing: number
    miscAdmin: number
    total: number
  }
  noi: number
  noiMargin: number
  monthlyRent: number
  monthlyRevenue: number
  rentBurden: number
  revenuePerSqft: number
  startupCost: { low: number; mid: number; high: number }
  paybackYears: number | null
  rating: Rating
  riskFlags: RiskFlag[]
  summary: string
}
