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
