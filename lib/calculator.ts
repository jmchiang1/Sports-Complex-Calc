import type { Assumptions } from '@/types/analysis'

export function calculateCourts(warehouseSqft: number, a: Assumptions) {
  const usable = warehouseSqft * a.usableCourtAreaPct
  const badmintonArea = usable * a.badmintonMixPct
  const pickleballArea = usable * a.pickleballMixPct
  const badminton = Math.floor(badmintonArea / a.badmintonCourtSqft)
  const pickleball = Math.floor(pickleballArea / a.pickleballCourtSqft)
  return { badminton, pickleball, total: badminton + pickleball }
}

export function calculateRevenue(
  courts: { badminton: number; pickleball: number; total: number },
  a: Assumptions,
) {
  const badminton =
    courts.badminton * a.badmintonHourlyRate * a.badmintonReservedHoursPerWeek * a.weeksPerYear
  const pickleball =
    courts.pickleball * a.pickleballHourlyRate * a.pickleballReservedHoursPerWeek * a.weeksPerYear
  const courtRevenue = badminton + pickleball
  const other = courtRevenue * a.otherRevenuePct
  const gross = courtRevenue + other
  return { badminton, pickleball, other, gross }
}

export function calculateExpenses(input: {
  totalSqft: number
  rentPerSqftYr: number | null
  grossRevenue: number
  assumptions: Assumptions
}) {
  const { totalSqft, rentPerSqftYr, grossRevenue, assumptions: a } = input
  const rent = (rentPerSqftYr ?? 0) * totalSqft
  const payroll = a.payrollHourlyRate * a.payrollHoursPerWeek * a.weeksPerYear * a.payrollBurden
  const utilities = totalSqft * a.utilitiesPerSqftYr
  const insurance = totalSqft * a.insurancePerSqftYr
  const maintenance = totalSqft * a.maintenancePerSqftYr
  const royalty = grossRevenue * a.royaltyPct
  const marketing = grossRevenue * a.marketingPct
  const miscAdmin = grossRevenue * a.miscAdminPct
  const total = rent + payroll + utilities + insurance + maintenance + royalty + marketing + miscAdmin
  return { rent, payroll, utilities, insurance, maintenance, royalty, marketing, miscAdmin, total }
}

export function calculateStartupCost(totalSqft: number, a: Assumptions) {
  return {
    low: totalSqft * a.renovationPerSqftLow + a.franchiseFee,
    mid: totalSqft * a.renovationPerSqftMid + a.franchiseFee,
    high: totalSqft * a.renovationPerSqftHigh + a.franchiseFee,
  }
}

export function calculatePaybackYears(startupMid: number, noi: number): number | null {
  if (noi <= 0) return null
  return startupMid / noi
}

import type { AnalysisInput, AnalysisResult } from '@/types/analysis'

type PartialResult = Omit<AnalysisResult, 'rating' | 'riskFlags' | 'summary'>

export function calculateAnalysis(input: AnalysisInput): PartialResult {
  const { listing, assumptions } = input
  const totalSqft = listing.totalSqft ?? 0
  const warehouseSqft = listing.warehouseSqft ?? totalSqft

  const courts = calculateCourts(warehouseSqft, assumptions)
  const revenue = calculateRevenue(courts, assumptions)
  const expenses = calculateExpenses({
    totalSqft,
    rentPerSqftYr: listing.rentPerSqftYr,
    grossRevenue: revenue.gross,
    assumptions,
  })

  const noi = revenue.gross - expenses.total
  const noiMargin = revenue.gross > 0 ? noi / revenue.gross : 0
  const monthlyRent = expenses.rent / 12
  const monthlyRevenue = revenue.gross / 12
  const rentBurden = revenue.gross > 0 ? expenses.rent / revenue.gross : 0
  const revenuePerSqft = totalSqft > 0 ? revenue.gross / totalSqft : 0

  const startupCost = calculateStartupCost(totalSqft, assumptions)
  const paybackYears = calculatePaybackYears(startupCost.mid, noi)

  return {
    courts,
    revenue,
    expenses,
    noi,
    noiMargin,
    monthlyRent,
    monthlyRevenue,
    rentBurden,
    revenuePerSqft,
    startupCost,
    paybackYears,
  }
}
