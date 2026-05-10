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
