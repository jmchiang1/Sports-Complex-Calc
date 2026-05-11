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

export function calculateStartupCost(input: {
  totalSqft: number
  warehouseSqft: number
  officeSqft: number
  totalCourts: number
  a: Assumptions
}) {
  const { totalSqft, warehouseSqft, officeSqft, totalCourts, a } = input

  const hvac = totalSqft * a.renovationHvacPerSqft
  const electrical = totalSqft * a.renovationElectricalPerSqft
  const courtLighting = warehouseSqft * a.renovationCourtLightingPerSqft
  const plumbing = totalSqft * a.renovationPlumbingPerSqft
  const courtFlooring = warehouseSqft * a.renovationCourtFlooringPerSqft
  const walls = totalSqft * a.renovationWallsPerSqft
  const officeBuildout = officeSqft * a.renovationOfficeBuildoutPerSqft
  const bathrooms = a.renovationBathroomCost * a.renovationBathroomCount
  const courtEquipment = totalCourts * a.renovationCourtEquipmentPerCourt

  const subtotal =
    hvac + electrical + courtLighting + plumbing + courtFlooring +
    walls + officeBuildout + bathrooms + courtEquipment

  const permitsDesign = subtotal * a.renovationPermitsDesignPct
  const contingency = subtotal * a.renovationContingencyPct

  const mid = subtotal + permitsDesign + contingency + a.franchiseFee

  return {
    low: mid * 0.85,
    mid,
    high: mid * 1.30,
    breakdown: [
      { label: 'HVAC', amount: hvac },
      { label: 'Electrical', amount: electrical },
      { label: 'Court lighting', amount: courtLighting },
      { label: 'Plumbing', amount: plumbing },
      { label: 'Court flooring', amount: courtFlooring },
      { label: 'Walls & finishes', amount: walls },
      { label: 'Office buildout', amount: officeBuildout },
      { label: 'Bathrooms', amount: bathrooms },
      { label: 'Court equipment', amount: courtEquipment },
      { label: 'Permits & design', amount: permitsDesign },
      { label: 'Contingency', amount: contingency },
      { label: 'Franchise fee', amount: a.franchiseFee },
    ],
  }
}

export function calculatePaybackYears(startupMid: number, noi: number): number | null {
  if (noi <= 0) return null
  return startupMid / noi
}

import type { AnalysisInput, AnalysisResult } from '@/types/analysis'
import { rateAnalysis } from './rating'
import { generateRiskFlags } from './risk-flags'
import { generateFallbackSummary } from './summary-fallback'

export function calculateAnalysis(input: AnalysisInput): AnalysisResult {
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

  const officeSqft = listing.officeSqft ?? 0
  const startupCost = calculateStartupCost({
    totalSqft,
    warehouseSqft,
    officeSqft,
    totalCourts: courts.total,
    a: assumptions,
  })
  const paybackYears = calculatePaybackYears(startupCost.mid, noi)

  const rating = rateAnalysis({
    totalSqft: listing.totalSqft,
    rentPerSqftYr: listing.rentPerSqftYr,
    totalCourts: courts.total,
    noi,
    noiMargin,
    paybackYears,
  })

  const riskFlags = generateRiskFlags({ listing, totalCourts: courts.total, rentBurden })

  const summary = generateFallbackSummary({
    address: listing.address,
    rating,
    courts,
    grossRevenue: revenue.gross,
    noi,
    paybackYears,
    flags: riskFlags,
  })

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
    rating,
    riskFlags,
    summary,
  }
}
