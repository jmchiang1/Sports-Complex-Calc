import type { Assumptions } from '@/types/analysis'

export function calculateCourts(warehouseSqft: number, a: Assumptions) {
  const usable = warehouseSqft * a.usableCourtAreaPct
  const badmintonArea = usable * a.badmintonMixPct
  const pickleballArea = usable * a.pickleballMixPct
  const badminton = Math.floor(badmintonArea / a.badmintonCourtSqft)
  const pickleball = Math.floor(pickleballArea / a.pickleballCourtSqft)
  return { badminton, pickleball, total: badminton + pickleball }
}
