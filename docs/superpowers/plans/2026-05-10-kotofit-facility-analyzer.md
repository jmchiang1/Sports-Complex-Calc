# Kotofit Facility Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single-page Next.js app that takes pasted commercial-listing text, AI-extracts structured fields, lets the user edit assumptions, and shows a Kotofit-franchise viability dashboard with deal rating, NOI, payback, risk flags, and an AI-written summary. Authenticated users can save analyses to Supabase.

**Architecture:** Next.js 15 App Router + TypeScript. Pure-TS calculator runs in the browser for instant feedback. Anthropic Claude Haiku 4.5 (forced tool-use + Zod validation) for extraction and summary, called via Server Actions to keep keys off the client. Supabase Postgres + magic-link auth with one `properties` table and RLS. Three swap points (`lib/calculator.ts`, `lib/extract/`, `lib/supabase/`) so AI provider, DB, or math can change without touching UI.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Zod, `@anthropic-ai/sdk`, `@supabase/ssr`, Vitest.

**Reference:** [Design doc — `docs/superpowers/specs/2026-05-10-kotofit-facility-analyzer-design.md`](../specs/2026-05-10-kotofit-facility-analyzer-design.md)

---

## Task 1: Project scaffold & dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.env.local.example`, `README.md`

- [ ] **Step 1: Bootstrap Next.js**

```bash
cd "/Users/jonathanchiang/Desktop/Vibes/Sports Complex Calc/Sports-Complex-Calc"
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --no-eslint --import-alias "@/*" --use-npm --turbopack=false
```

When prompted "Would you like your project to be in the current directory?" answer Yes. If it refuses because the directory isn't empty, scaffold into `_tmp/` then move files up:

```bash
npx create-next-app@latest _tmp --typescript --tailwind --app --src-dir=false --no-eslint --import-alias "@/*" --use-npm
rsync -a _tmp/ ./
rm -rf _tmp
```

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @anthropic-ai/sdk @supabase/ssr @supabase/supabase-js zod recharts class-variance-authority clsx tailwind-merge lucide-react
```

- [ ] **Step 3: Install dev dependencies (Vitest + jsdom + testing-library)**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 5: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Add scripts to `package.json`**

Edit the `"scripts"` block to include:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 7: Create `.env.local.example`**

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 8: Verify scaffold runs**

```bash
npm run build
```

Expected: build succeeds.

```bash
npm test
```

Expected: "No test files found" — that's fine; test runner is wired.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "scaffold: Next.js 15 + Tailwind + Vitest"
```

---

## Task 2: shadcn/ui setup

**Files:**
- Create: `components.json`, `lib/utils.ts`
- Modify: `tailwind.config.ts`, `app/globals.css`

- [ ] **Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

Answer: TypeScript=yes, style=Default, base color=Slate, CSS variables=yes.

- [ ] **Step 2: Install needed primitives**

```bash
npx shadcn@latest add button card badge input textarea label sheet dialog collapsible toast separator skeleton
```

- [ ] **Step 3: Verify build still passes**

```bash
npm run build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "scaffold: shadcn/ui primitives"
```

---

## Task 3: Type definitions

**Files:**
- Create: `types/analysis.ts`

- [ ] **Step 1: Write `types/analysis.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add types/analysis.ts
git commit -m "types: AnalysisInput / AnalysisResult / RiskFlag"
```

---

## Task 4: Default-assumptions constants

**Files:**
- Create: `lib/constants.ts`

- [ ] **Step 1: Write `lib/constants.ts`**

```ts
import type { Assumptions } from '@/types/analysis'

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  badmintonCourtSqft: 1250,
  pickleballCourtSqft: 1800,
  usableCourtAreaPct: 0.8,
  badmintonMixPct: 0.6,
  pickleballMixPct: 0.4,
  badmintonHourlyRate: 45,
  pickleballHourlyRate: 55,
  badmintonReservedHoursPerWeek: 42,
  pickleballReservedHoursPerWeek: 38,
  weeksPerYear: 52,
  otherRevenuePct: 0.18,
  payrollHourlyRate: 17,
  payrollHoursPerWeek: 40,
  payrollBurden: 1.12,
  utilitiesPerSqftYr: 4.5,
  insurancePerSqftYr: 1.25,
  maintenancePerSqftYr: 2.25,
  royaltyPct: 0.07,
  marketingPct: 0.025,
  miscAdminPct: 0.02,
  renovationPerSqftLow: 18,
  renovationPerSqftMid: 28,
  renovationPerSqftHigh: 45,
  franchiseFee: 40_000,
}

export const EMPTY_LISTING = {
  address: null,
  totalSqft: null,
  warehouseSqft: null,
  officeSqft: null,
  clearHeight: null,
  rentPerSqftYr: null,
  zoning: null,
  loading: null,
  parking: null,
  locationNotes: [],
} as const
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "lib: default assumptions + empty listing"
```

---

## Task 5: Calculator — courts (TDD)

**Files:**
- Create: `lib/calculator.ts`, `lib/__tests__/calculator.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/__tests__/calculator.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { calculateCourts } from '../calculator'
import { DEFAULT_ASSUMPTIONS } from '../constants'

describe('calculateCourts', () => {
  it('returns 3 badminton + 1 pickleball for 10,000 sf warehouse with default assumptions', () => {
    const result = calculateCourts(10_000, DEFAULT_ASSUMPTIONS)
    expect(result).toEqual({ badminton: 3, pickleball: 1, total: 4 })
  })

  it('returns all zeros when warehouseSqft is 0', () => {
    expect(calculateCourts(0, DEFAULT_ASSUMPTIONS)).toEqual({ badminton: 0, pickleball: 0, total: 0 })
  })

  it('returns 6 badminton + 2 pickleball for 16,000 sf warehouse', () => {
    // usable = 12,800; bad area = 7,680 / 1,250 = 6 ; pickle area = 5,120 / 1,800 = 2
    const result = calculateCourts(16_000, DEFAULT_ASSUMPTIONS)
    expect(result).toEqual({ badminton: 6, pickleball: 2, total: 8 })
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- calculator
```

Expected: FAIL — `calculateCourts` not defined.

- [ ] **Step 3: Implement**

`lib/calculator.ts`:

```ts
import type { Assumptions } from '@/types/analysis'

export function calculateCourts(warehouseSqft: number, a: Assumptions) {
  const usable = warehouseSqft * a.usableCourtAreaPct
  const badmintonArea = usable * a.badmintonMixPct
  const pickleballArea = usable * a.pickleballMixPct
  const badminton = Math.floor(badmintonArea / a.badmintonCourtSqft)
  const pickleball = Math.floor(pickleballArea / a.pickleballCourtSqft)
  return { badminton, pickleball, total: badminton + pickleball }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- calculator
```

Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/calculator.ts lib/__tests__/calculator.test.ts
git commit -m "calc: court fit"
```

---

## Task 6: Calculator — revenue (TDD)

**Files:**
- Modify: `lib/calculator.ts`, `lib/__tests__/calculator.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `lib/__tests__/calculator.test.ts`:

```ts
import { calculateRevenue } from '../calculator'

describe('calculateRevenue', () => {
  it('matches spec example for 3 badminton + 1 pickleball', () => {
    // bad: 3 * 45 * 42 * 52 = 294,840
    // pickle: 1 * 55 * 38 * 52 = 108,680
    // court: 403,520
    // other: 403,520 * 0.18 = 72,633.6
    // gross: 476,153.6
    const result = calculateRevenue({ badminton: 3, pickleball: 1, total: 4 }, DEFAULT_ASSUMPTIONS)
    expect(result.badminton).toBe(294_840)
    expect(result.pickleball).toBe(108_680)
    expect(result.other).toBeCloseTo(72_633.6, 5)
    expect(result.gross).toBeCloseTo(476_153.6, 5)
  })

  it('returns zeros for zero courts', () => {
    const result = calculateRevenue({ badminton: 0, pickleball: 0, total: 0 }, DEFAULT_ASSUMPTIONS)
    expect(result).toEqual({ badminton: 0, pickleball: 0, other: 0, gross: 0 })
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- calculator
```

Expected: FAIL — `calculateRevenue` not defined.

- [ ] **Step 3: Implement**

Append to `lib/calculator.ts`:

```ts
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
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- calculator
```

Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/calculator.ts lib/__tests__/calculator.test.ts
git commit -m "calc: revenue"
```

---

## Task 7: Calculator — expenses (TDD)

**Files:**
- Modify: `lib/calculator.ts`, `lib/__tests__/calculator.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `lib/__tests__/calculator.test.ts`:

```ts
import { calculateExpenses } from '../calculator'

describe('calculateExpenses', () => {
  it('matches spec example: 12,500 sf @ $20/sf, gross $476,153.6', () => {
    const result = calculateExpenses({
      totalSqft: 12_500,
      rentPerSqftYr: 20,
      grossRevenue: 476_153.6,
      assumptions: DEFAULT_ASSUMPTIONS,
    })
    expect(result.rent).toBe(250_000)
    expect(result.payroll).toBeCloseTo(39_603.2, 5)        // 17 * 40 * 52 * 1.12
    expect(result.utilities).toBe(56_250)                   // 12,500 * 4.5
    expect(result.insurance).toBe(15_625)                   // 12,500 * 1.25
    expect(result.maintenance).toBe(28_125)                 // 12,500 * 2.25
    expect(result.royalty).toBeCloseTo(33_330.752, 5)       // gross * 0.07
    expect(result.marketing).toBeCloseTo(11_903.84, 5)      // gross * 0.025
    expect(result.miscAdmin).toBeCloseTo(9_523.072, 5)      // gross * 0.02
    expect(result.total).toBeCloseTo(444_360.864, 3)
  })

  it('handles missing rent as zero', () => {
    const result = calculateExpenses({
      totalSqft: 12_500,
      rentPerSqftYr: null,
      grossRevenue: 0,
      assumptions: DEFAULT_ASSUMPTIONS,
    })
    expect(result.rent).toBe(0)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- calculator
```

Expected: FAIL — `calculateExpenses` not defined.

- [ ] **Step 3: Implement**

Append to `lib/calculator.ts`:

```ts
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
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- calculator
```

Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/calculator.ts lib/__tests__/calculator.test.ts
git commit -m "calc: expenses"
```

---

## Task 8: Calculator — startup cost & payback (TDD)

**Files:**
- Modify: `lib/calculator.ts`, `lib/__tests__/calculator.test.ts`

- [ ] **Step 1: Add the failing tests**

Append to `lib/__tests__/calculator.test.ts`:

```ts
import { calculateStartupCost, calculatePaybackYears } from '../calculator'

describe('calculateStartupCost', () => {
  it('matches spec for 12,500 sf', () => {
    const r = calculateStartupCost(12_500, DEFAULT_ASSUMPTIONS)
    expect(r.low).toBe(12_500 * 18 + 40_000)   // 265,000
    expect(r.mid).toBe(12_500 * 28 + 40_000)   // 390,000
    expect(r.high).toBe(12_500 * 45 + 40_000)  // 602,500
  })
})

describe('calculatePaybackYears', () => {
  it('returns startupMid / noi when noi > 0', () => {
    expect(calculatePaybackYears(390_000, 100_000)).toBe(3.9)
  })
  it('returns null when noi is zero', () => {
    expect(calculatePaybackYears(390_000, 0)).toBeNull()
  })
  it('returns null when noi is negative', () => {
    expect(calculatePaybackYears(390_000, -1000)).toBeNull()
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- calculator
```

Expected: FAIL — functions not defined.

- [ ] **Step 3: Implement**

Append to `lib/calculator.ts`:

```ts
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
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- calculator
```

Expected: 11 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/calculator.ts lib/__tests__/calculator.test.ts
git commit -m "calc: startup cost + payback"
```

---

## Task 9: Calculator — orchestrator (TDD)

**Files:**
- Modify: `lib/calculator.ts`, `lib/__tests__/calculator.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `lib/__tests__/calculator.test.ts`:

```ts
import { calculateAnalysis } from '../calculator'
import { EMPTY_LISTING } from '../constants'

describe('calculateAnalysis (orchestrator)', () => {
  it('returns the spec example end-to-end (without rating/flags/summary, those come later)', () => {
    const result = calculateAnalysis({
      listing: {
        ...EMPTY_LISTING,
        address: '91-15 139th St',
        totalSqft: 12_500,
        warehouseSqft: 10_000,
        officeSqft: 2_500,
        clearHeight: 20,
        rentPerSqftYr: 20,
      },
      assumptions: DEFAULT_ASSUMPTIONS,
    })

    expect(result.courts).toEqual({ badminton: 3, pickleball: 1, total: 4 })
    expect(result.revenue.gross).toBeCloseTo(476_153.6, 3)
    expect(result.expenses.total).toBeCloseTo(444_360.864, 3)
    expect(result.noi).toBeCloseTo(31_792.736, 3)
    expect(result.noiMargin).toBeCloseTo(0.0668, 3)
    expect(result.rentBurden).toBeCloseTo(0.525, 3)
    expect(result.monthlyRent).toBeCloseTo(20_833.33, 2)
    expect(result.monthlyRevenue).toBeCloseTo(39_679.47, 2)
    expect(result.revenuePerSqft).toBeCloseTo(38.09, 2)
    expect(result.startupCost.mid).toBe(390_000)
    expect(result.paybackYears).toBeCloseTo(12.27, 2)
  })

  it('falls back to totalSqft when warehouseSqft is null', () => {
    const result = calculateAnalysis({
      listing: { ...EMPTY_LISTING, totalSqft: 10_000, warehouseSqft: null, rentPerSqftYr: 20 },
      assumptions: DEFAULT_ASSUMPTIONS,
    })
    expect(result.courts.total).toBeGreaterThan(0)
  })

  it('returns zero-revenue when totalSqft is null', () => {
    const result = calculateAnalysis({
      listing: { ...EMPTY_LISTING },
      assumptions: DEFAULT_ASSUMPTIONS,
    })
    expect(result.revenue.gross).toBe(0)
    expect(result.noi).toBeLessThanOrEqual(0)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- calculator
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Append to `lib/calculator.ts`:

```ts
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
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- calculator
```

Expected: 14 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/calculator.ts lib/__tests__/calculator.test.ts
git commit -m "calc: orchestrator"
```

---

## Task 10: Rating module (TDD)

**Files:**
- Create: `lib/rating.ts`, `lib/__tests__/rating.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/__tests__/rating.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { rateAnalysis } from '../rating'

const baseInput = {
  totalSqft: 15_000,
  rentPerSqftYr: 18,
  totalCourts: 6,
  noi: 250_000,
  noiMargin: 0.30,
  rentBurden: 0.20,
  paybackYears: 2.0,
}

describe('rateAnalysis', () => {
  it('returns Incomplete when totalSqft missing', () => {
    expect(rateAnalysis({ ...baseInput, totalSqft: 0 })).toBe('Incomplete')
  })
  it('returns Incomplete when rent missing', () => {
    expect(rateAnalysis({ ...baseInput, rentPerSqftYr: null })).toBe('Incomplete')
  })
  it('returns Do Not Pursue when courts < 4', () => {
    expect(rateAnalysis({ ...baseInput, totalCourts: 3 })).toBe('Do Not Pursue')
  })
  it('returns Do Not Pursue when noi <= 0', () => {
    expect(rateAnalysis({ ...baseInput, noi: 0 })).toBe('Do Not Pursue')
  })
  it('returns Do Not Pursue when rentBurden > 0.35', () => {
    expect(rateAnalysis({ ...baseInput, rentBurden: 0.40 })).toBe('Do Not Pursue')
  })
  it('returns Strong Candidate when payback ≤ 2.5, margin ≥ 0.25, rentBurden ≤ 0.22', () => {
    expect(rateAnalysis(baseInput)).toBe('Strong Candidate')
  })
  it('returns Worth Investigating when payback ≤ 4 and margin ≥ 0.15', () => {
    expect(rateAnalysis({ ...baseInput, paybackYears: 3.5, noiMargin: 0.18, rentBurden: 0.28 })).toBe(
      'Worth Investigating',
    )
  })
  it('returns Risky as the fallback', () => {
    expect(rateAnalysis({ ...baseInput, paybackYears: 6, noiMargin: 0.10, rentBurden: 0.30 })).toBe(
      'Risky',
    )
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- rating
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/rating.ts`:

```ts
import type { Rating } from '@/types/analysis'

export interface RatingInput {
  totalSqft: number | null
  rentPerSqftYr: number | null
  totalCourts: number
  noi: number
  noiMargin: number
  rentBurden: number
  paybackYears: number | null
}

export function rateAnalysis(i: RatingInput): Rating {
  if (!i.totalSqft || i.rentPerSqftYr == null) return 'Incomplete'
  if (i.totalCourts < 4 || i.noi <= 0 || i.rentBurden > 0.35) return 'Do Not Pursue'
  if (
    i.paybackYears !== null &&
    i.paybackYears <= 2.5 &&
    i.noiMargin >= 0.25 &&
    i.rentBurden <= 0.22
  ) {
    return 'Strong Candidate'
  }
  if (i.paybackYears !== null && i.paybackYears <= 4 && i.noiMargin >= 0.15) {
    return 'Worth Investigating'
  }
  return 'Risky'
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- rating
```

Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/rating.ts lib/__tests__/rating.test.ts
git commit -m "rating: deal score thresholds"
```

---

## Task 11: Risk-flags module (TDD)

**Files:**
- Create: `lib/risk-flags.ts`, `lib/__tests__/risk-flags.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/__tests__/risk-flags.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateRiskFlags } from '../risk-flags'
import { EMPTY_LISTING } from '../constants'

const noFlags = {
  listing: {
    ...EMPTY_LISTING,
    totalSqft: 15_000,
    warehouseSqft: 15_000,
    officeSqft: 0,
    clearHeight: 28,
    rentPerSqftYr: 18,
    zoning: null,
  },
  totalCourts: 8,
  rentBurden: 0.18,
}

describe('generateRiskFlags', () => {
  it('returns no flags when nothing concerning', () => {
    expect(generateRiskFlags(noFlags)).toEqual([])
  })
  it('flags low-clear-height when below 24', () => {
    const flags = generateRiskFlags({ ...noFlags, listing: { ...noFlags.listing, clearHeight: 20 } })
    expect(flags.map(f => f.id)).toContain('low-clear-height')
  })
  it('flags missing-rent when rent is null', () => {
    const flags = generateRiskFlags({ ...noFlags, listing: { ...noFlags.listing, rentPerSqftYr: null } })
    expect(flags.map(f => f.id)).toContain('missing-rent')
  })
  it('flags too-few-courts when courts < 6', () => {
    const flags = generateRiskFlags({ ...noFlags, totalCourts: 4 })
    expect(flags.map(f => f.id)).toContain('too-few-courts')
  })
  it('flags high-rent-burden when burden > 0.30', () => {
    const flags = generateRiskFlags({ ...noFlags, rentBurden: 0.32 })
    expect(flags.map(f => f.id)).toContain('high-rent-burden')
  })
  it('flags office-space when officeSqft > 0', () => {
    const flags = generateRiskFlags({
      ...noFlags,
      listing: { ...noFlags.listing, officeSqft: 1_500 },
    })
    expect(flags.map(f => f.id)).toContain('office-space')
  })
  it('flags zoning whenever zoning is present', () => {
    const flags = generateRiskFlags({
      ...noFlags,
      listing: { ...noFlags.listing, zoning: 'M1-1' },
    })
    expect(flags.map(f => f.id)).toContain('zoning')
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- risk-flags
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/risk-flags.ts`:

```ts
import type { ExtractedListing, RiskFlag } from '@/types/analysis'

export interface RiskFlagInput {
  listing: ExtractedListing
  totalCourts: number
  rentBurden: number
}

export function generateRiskFlags(i: RiskFlagInput): RiskFlag[] {
  const flags: RiskFlag[] = []
  const { listing } = i

  if (listing.clearHeight !== null && listing.clearHeight < 24) {
    flags.push({
      id: 'low-clear-height',
      severity: 'high',
      title: 'Low ceiling',
      detail:
        'Clear height is below the preferred 24–30 ft range for badminton. Verify ceiling obstructions, lighting, ducts, beams, and actual playable height.',
    })
  }

  if (listing.rentPerSqftYr == null) {
    flags.push({
      id: 'missing-rent',
      severity: 'high',
      title: 'Rent missing',
      detail: 'Rental rate is missing. Contact broker before relying on financial model.',
    })
  }

  if (i.totalCourts > 0 && i.totalCourts < 6) {
    flags.push({
      id: 'too-few-courts',
      severity: 'medium',
      title: 'Below 6-court target',
      detail: 'This property may be too small for the preferred Kotofit 6-court model.',
    })
  }

  if (i.rentBurden > 0.30) {
    flags.push({
      id: 'high-rent-burden',
      severity: 'medium',
      title: 'High rent burden',
      detail:
        'Rent burden is high. This may put pressure on profitability unless revenue assumptions are conservative.',
    })
  }

  if (listing.officeSqft != null && listing.officeSqft > 0) {
    flags.push({
      id: 'office-space',
      severity: 'low',
      title: 'Includes office area',
      detail:
        'Listing includes office area. Court layout should be based on clear-span warehouse area, not total square footage.',
    })
  }

  if (listing.zoning) {
    flags.push({
      id: 'zoning',
      severity: 'low',
      title: 'Confirm zoning',
      detail: 'Zoning must be confirmed for recreational/sports facility use before lease signing.',
    })
  }

  return flags
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- risk-flags
```

Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/risk-flags.ts lib/__tests__/risk-flags.test.ts
git commit -m "risk-flags: all six conditions"
```

---

## Task 12: Summary fallback (TDD)

**Files:**
- Create: `lib/summary-fallback.ts`, `lib/__tests__/summary-fallback.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/__tests__/summary-fallback.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateFallbackSummary } from '../summary-fallback'

describe('generateFallbackSummary', () => {
  it('mentions the rating, court counts, and triggered flags', () => {
    const text = generateFallbackSummary({
      address: '91-15 139th St, Jamaica, NY',
      rating: 'Risky',
      courts: { badminton: 3, pickleball: 1, total: 4 },
      grossRevenue: 476_153,
      noi: 31_792,
      paybackYears: 12.27,
      flags: [
        { id: 'low-clear-height', severity: 'high', title: 'Low ceiling', detail: '' },
        { id: 'missing-rent', severity: 'high', title: 'Rent missing', detail: '' },
      ],
    })
    expect(text).toMatch(/Risky/)
    expect(text).toMatch(/3 badminton/)
    expect(text).toMatch(/1 pickleball/)
    expect(text).toMatch(/Low ceiling|clear height/i)
    expect(text).toMatch(/Next steps/)
  })

  it('handles null payback gracefully', () => {
    const text = generateFallbackSummary({
      address: null,
      rating: 'Do Not Pursue',
      courts: { badminton: 0, pickleball: 0, total: 0 },
      grossRevenue: 0,
      noi: -5000,
      paybackYears: null,
      flags: [],
    })
    expect(text).toMatch(/Not profitable|unavailable/i)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- summary-fallback
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/summary-fallback.ts`:

```ts
import type { Rating, RiskFlag } from '@/types/analysis'

export interface FallbackInput {
  address: string | null
  rating: Rating
  courts: { badminton: number; pickleball: number; total: number }
  grossRevenue: number
  noi: number
  paybackYears: number | null
  flags: RiskFlag[]
}

const fmtMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}K`

export function generateFallbackSummary(i: FallbackInput): string {
  const where = i.address ? `at ${i.address}` : 'this property'
  const article = i.rating.startsWith('S') || i.rating.startsWith('R') ? 'a' : 'a'
  const ratingLine = `This ${where ? 'property' : 'listing'} is ${article} ${i.rating} candidate for a Kotofit-style badminton/pickleball facility.`

  const courtLine =
    i.courts.total > 0
      ? `It supports an estimated ${i.courts.badminton} badminton and ${i.courts.pickleball} pickleball court(s) (${i.courts.total} total).`
      : 'Court count could not be determined from the inputs provided.'

  const noiLine =
    i.paybackYears !== null
      ? `Projected gross revenue is ${fmtMoney(i.grossRevenue)} with NOI of ${fmtMoney(i.noi)} and a ~${i.paybackYears.toFixed(1)} year payback.`
      : i.noi <= 0
        ? 'Not profitable under the current assumptions, so payback is unavailable.'
        : 'Payback period is unavailable.'

  const flagLines = i.flags.length
    ? `Risk flags: ${i.flags.map(f => f.title).join('; ')}.`
    : 'No major risk flags triggered.'

  const nextSteps = [
    '1. Confirm asking rent.',
    '2. Verify true clear height and ceiling obstructions.',
    '3. Confirm recreational use is allowed under zoning.',
    '4. Ask for floor plan and column spacing.',
    '5. Confirm parking count.',
  ].join('\n')

  return `${ratingLine}\n\n${courtLine} ${noiLine}\n\n${flagLines}\n\nNext steps:\n${nextSteps}`
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- summary-fallback
```

Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/summary-fallback.ts lib/__tests__/summary-fallback.test.ts
git commit -m "summary: deterministic fallback"
```

---

## Task 13: Calculator final wiring — rating + flags + summary

**Files:**
- Modify: `lib/calculator.ts`, `lib/__tests__/calculator.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `lib/__tests__/calculator.test.ts`:

```ts
describe('calculateAnalysis (full result)', () => {
  it('produces the full result with rating + flags + fallback summary for spec example', () => {
    const result = calculateAnalysis({
      listing: {
        ...EMPTY_LISTING,
        address: '91-15 139th St, Jamaica, NY 11435',
        totalSqft: 12_500,
        warehouseSqft: 10_000,
        officeSqft: 2_500,
        clearHeight: 20,
        rentPerSqftYr: 20,
        zoning: 'M1-1',
      },
      assumptions: DEFAULT_ASSUMPTIONS,
    })

    expect(result.rating).toBe('Do Not Pursue')              // rentBurden > 0.35
    const flagIds = result.riskFlags.map(f => f.id)
    expect(flagIds).toContain('low-clear-height')
    expect(flagIds).toContain('too-few-courts')
    expect(flagIds).toContain('high-rent-burden')
    expect(flagIds).toContain('office-space')
    expect(flagIds).toContain('zoning')
    expect(result.summary).toMatch(/Do Not Pursue/)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- calculator
```

Expected: FAIL — `calculateAnalysis` currently returns a `PartialResult` and the test expects `rating`/`riskFlags`/`summary`.

- [ ] **Step 3: Update orchestrator return type and wire helpers**

In `lib/calculator.ts`, replace the entire `calculateAnalysis` function (along with its `import type` line and the `PartialResult` type alias from Task 9) with the block below. The pure helper functions (`calculateCourts`, `calculateRevenue`, `calculateExpenses`, `calculateStartupCost`, `calculatePaybackYears`) stay as-is.

```ts
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

  const startupCost = calculateStartupCost(totalSqft, assumptions)
  const paybackYears = calculatePaybackYears(startupCost.mid, noi)

  const rating = rateAnalysis({
    totalSqft: listing.totalSqft,
    rentPerSqftYr: listing.rentPerSqftYr,
    totalCourts: courts.total,
    noi,
    noiMargin,
    rentBurden,
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
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test
```

Expected: all tests passing (calculator + rating + risk-flags + summary-fallback).

- [ ] **Step 5: Commit**

```bash
git add lib/calculator.ts lib/__tests__/calculator.test.ts
git commit -m "calc: wire rating, flags, fallback summary"
```

---

## Task 14: Extraction Zod schema

**Files:**
- Create: `lib/extract/schema.ts`, `lib/extract/__tests__/schema.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/extract/__tests__/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ExtractedListingSchema } from '../schema'

describe('ExtractedListingSchema', () => {
  it('accepts a fully-populated listing', () => {
    const result = ExtractedListingSchema.parse({
      address: '91-15 139th St',
      totalSqft: 12_500,
      warehouseSqft: 10_000,
      officeSqft: 2_500,
      clearHeight: 20,
      rentPerSqftYr: 18,
      zoning: 'M1-1',
      loading: '1 dock',
      parking: null,
      locationNotes: ['Near JFK'],
    })
    expect(result.totalSqft).toBe(12_500)
  })

  it('coerces undefined strings to null', () => {
    const result = ExtractedListingSchema.parse({
      address: null,
      totalSqft: null,
      warehouseSqft: null,
      officeSqft: null,
      clearHeight: null,
      rentPerSqftYr: null,
      zoning: null,
      loading: null,
      parking: null,
      locationNotes: [],
    })
    expect(result.address).toBeNull()
  })

  it('rejects negative sqft', () => {
    expect(() =>
      ExtractedListingSchema.parse({
        address: null,
        totalSqft: -1,
        warehouseSqft: null,
        officeSqft: null,
        clearHeight: null,
        rentPerSqftYr: null,
        zoning: null,
        loading: null,
        parking: null,
        locationNotes: [],
      }),
    ).toThrow()
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- extract
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/extract/schema.ts`:

```ts
import { z } from 'zod'

const nonNegativeNullableNumber = z.number().min(0).nullable()

export const ExtractedListingSchema = z.object({
  address: z.string().nullable(),
  totalSqft: nonNegativeNullableNumber,
  warehouseSqft: nonNegativeNullableNumber,
  officeSqft: nonNegativeNullableNumber,
  clearHeight: nonNegativeNullableNumber,
  rentPerSqftYr: nonNegativeNullableNumber,
  zoning: z.string().nullable(),
  loading: z.string().nullable(),
  parking: z.string().nullable(),
  locationNotes: z.array(z.string()).default([]),
})

export type ExtractedListingFromAI = z.infer<typeof ExtractedListingSchema>
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- extract
```

Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/extract/schema.ts lib/extract/__tests__/schema.test.ts
git commit -m "extract: Zod schema for AI output"
```

---

## Task 15: Regex fallback parser (TDD)

**Files:**
- Create: `lib/extract/regex-fallback.ts`, `lib/extract/__tests__/regex-fallback.test.ts`

- [ ] **Step 1: Write the failing test using the spec example**

`lib/extract/__tests__/regex-fallback.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseListingWithRegex } from '../regex-fallback'

const specExample = `91-15 139th St, Jamaica, NY 11435
12,500 SF industrial space available
10,000 SF warehouse + 2,500 SF dedicated office space
Clear Height: 20'
Rental Rate: Upon Request
Zoning: M1-1
1 drive-in bay, 1 interior dock door
Near Van Wyck Expressway, JFK Airport, E/J/Z trains and LIRR Jamaica`

describe('parseListingWithRegex', () => {
  it('extracts the spec example', () => {
    const r = parseListingWithRegex(specExample)
    expect(r.address).toMatch(/91-15 139th St/)
    expect(r.totalSqft).toBe(12_500)
    expect(r.warehouseSqft).toBe(10_000)
    expect(r.officeSqft).toBe(2_500)
    expect(r.clearHeight).toBe(20)
    expect(r.rentPerSqftYr).toBeNull()      // "Upon Request"
    expect(r.zoning).toBe('M1-1')
  })

  it('returns mostly nulls for empty input', () => {
    const r = parseListingWithRegex('')
    expect(r.totalSqft).toBeNull()
    expect(r.zoning).toBeNull()
  })

  it('parses dollar rent like "$24/SF/yr"', () => {
    const r = parseListingWithRegex('Rental Rate: $24/SF/yr')
    expect(r.rentPerSqftYr).toBe(24)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- regex-fallback
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/extract/regex-fallback.ts`:

```ts
import type { ExtractedListing } from '@/types/analysis'

const SQFT_RE = /([\d,]+)\s*(?:SF|sq\.?\s*ft)/i
const WAREHOUSE_RE = /([\d,]+)\s*SF\s*(?:warehouse|industrial)/i
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

  const warehouseMatch = text.match(WAREHOUSE_RE)
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
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- regex-fallback
```

Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/extract/regex-fallback.ts lib/extract/__tests__/regex-fallback.test.ts
git commit -m "extract: regex fallback parser"
```

---

## Task 16: Anthropic prompt builder + extract Server Action

**Files:**
- Create: `lib/extract/prompt.ts`, `lib/extract/anthropic.ts`, `app/actions/extract-listing.ts`

- [ ] **Step 1: Write `lib/extract/prompt.ts`**

```ts
export const EXTRACT_SYSTEM_PROMPT = `You extract structured property data from commercial real-estate listing text.

Rules:
- Return null for any field not explicitly stated. Do NOT invent values.
- For ranges (e.g. "25-30 ft"), return the LOWER bound.
- If only total square footage is given, leave warehouseSqft and officeSqft null.
- If both warehouse and office breakouts are given, return both.
- Rent: parse "$24/SF/yr", "$24 PSF", "$24 per SF" as 24. Convert "$2/sf/mo" to 24 (×12). "Upon Request", "Negotiable", "Call for pricing" → null.
- Clear height: prefer "clear height". If only "ceiling height" is given, use it but add a note to locationNotes mentioning that.
- locationNotes is for nearby transit, freeways, airports, landmarks — short phrases, one per item.
- You MUST call the extract_listing tool. Do not produce free-form text.`
```

- [ ] **Step 2: Write `lib/extract/anthropic.ts`**

```ts
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { ExtractedListingSchema } from './schema'
import { EXTRACT_SYSTEM_PROMPT } from './prompt'
import type { ExtractedListing } from '@/types/analysis'

const MODEL = 'claude-haiku-4-5-20251001'

const TOOL = {
  name: 'extract_listing',
  description: 'Extract structured property data from a commercial listing.',
  input_schema: {
    type: 'object' as const,
    properties: {
      address: { type: ['string', 'null'] },
      totalSqft: { type: ['number', 'null'] },
      warehouseSqft: { type: ['number', 'null'] },
      officeSqft: { type: ['number', 'null'] },
      clearHeight: { type: ['number', 'null'] },
      rentPerSqftYr: { type: ['number', 'null'] },
      zoning: { type: ['string', 'null'] },
      loading: { type: ['string', 'null'] },
      parking: { type: ['string', 'null'] },
      locationNotes: { type: 'array', items: { type: 'string' } },
    },
    required: [
      'address', 'totalSqft', 'warehouseSqft', 'officeSqft', 'clearHeight',
      'rentPerSqftYr', 'zoning', 'loading', 'parking', 'locationNotes',
    ],
  },
} as const

export async function extractWithAnthropic(rawText: string): Promise<ExtractedListing> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: EXTRACT_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [TOOL],
    tool_choice: { type: 'tool', name: 'extract_listing' },
    messages: [{ role: 'user', content: rawText }],
  })

  const toolUse = response.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Anthropic did not return a tool_use block')
  }

  return ExtractedListingSchema.parse(toolUse.input)
}
```

- [ ] **Step 3: Write `app/actions/extract-listing.ts`**

```ts
'use server'

import { extractWithAnthropic } from '@/lib/extract/anthropic'
import { parseListingWithRegex } from '@/lib/extract/regex-fallback'
import type { ExtractedListing } from '@/types/analysis'

export interface ExtractResult {
  listing: ExtractedListing
  source: 'ai' | 'regex'
  error?: string
}

export async function extractListing(rawText: string): Promise<ExtractResult> {
  if (!rawText.trim()) {
    return { listing: parseListingWithRegex(''), source: 'regex' }
  }

  try {
    const listing = await extractWithAnthropic(rawText)
    return { listing, source: 'ai' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return {
      listing: parseListingWithRegex(rawText),
      source: 'regex',
      error: `AI extraction failed: ${message}`,
    }
  }
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: success. (No runtime test for the AI call — that requires a key. The fallback path is covered by the regex test.)

- [ ] **Step 5: Commit**

```bash
git add lib/extract/prompt.ts lib/extract/anthropic.ts app/actions/extract-listing.ts
git commit -m "extract: Anthropic forced tool-use + regex fallback action"
```

---

## Task 17: Anthropic summary Server Action

**Files:**
- Create: `app/actions/generate-summary.ts`

- [ ] **Step 1: Write `app/actions/generate-summary.ts`**

```ts
'use server'

import Anthropic from '@anthropic-ai/sdk'
import type { AnalysisResult } from '@/types/analysis'
import { generateFallbackSummary } from '@/lib/summary-fallback'

const MODEL = 'claude-haiku-4-5-20251001'

const SUMMARY_SYSTEM = `You are an analyst for a Kotofit franchise scout.

Given a property analysis, produce a 3-5 sentence plain-English summary that:
- States the deal rating in plain English
- Mentions court counts and key numbers (gross revenue, NOI, payback)
- Calls out the most important risk flags
- Ends with a numbered "Next steps:" list of 3-5 concrete questions to ask the broker.

Be direct. No marketing fluff. No emoji. No bullet points except the numbered next-steps list.`

export interface SummaryResult {
  summary: string
  source: 'ai' | 'fallback'
}

export async function generateSummary(
  result: AnalysisResult,
  address: string | null,
): Promise<SummaryResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  const fallback = (): SummaryResult => ({
    summary: generateFallbackSummary({
      address,
      rating: result.rating,
      courts: result.courts,
      grossRevenue: result.revenue.gross,
      noi: result.noi,
      paybackYears: result.paybackYears,
      flags: result.riskFlags,
    }),
    source: 'fallback',
  })

  if (!apiKey) return fallback()

  try {
    const client = new Anthropic({ apiKey })
    const userPayload = {
      address,
      rating: result.rating,
      courts: result.courts,
      revenue: result.revenue,
      noi: result.noi,
      noiMargin: result.noiMargin,
      paybackYears: result.paybackYears,
      rentBurden: result.rentBurden,
      riskFlags: result.riskFlags.map(f => ({ id: f.id, title: f.title })),
    }

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: [
        { type: 'text', text: SUMMARY_SYSTEM, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: JSON.stringify(userPayload, null, 2) }],
    })

    const textBlock = resp.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text' || !textBlock.text.trim()) return fallback()

    return { summary: textBlock.text, source: 'ai' }
  } catch {
    return fallback()
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add app/actions/generate-summary.ts
git commit -m "extract: AI summary action with deterministic fallback"
```

---

## Task 18: Supabase schema + clients

**Files:**
- Create: `supabase/migrations/0001_properties.sql`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/types.ts`, `README.md` (or append)

- [ ] **Step 1: Write the migration**

`supabase/migrations/0001_properties.sql`:

```sql
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  label text,
  address text,

  listing_json jsonb not null,
  assumptions_json jsonb not null,

  rating text,
  noi numeric,
  total_courts int,
  payback_years numeric
);

create index if not exists properties_user_id_idx on properties(user_id);
create index if not exists properties_created_at_idx on properties(created_at desc);

alter table properties enable row level security;

drop policy if exists "own rows" on properties;
create policy "own rows" on properties
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 2: Write `lib/supabase/types.ts`** (DB row shape)

```ts
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
```

- [ ] **Step 3: Write `lib/supabase/client.ts`** (browser)

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 4: Write `lib/supabase/server.ts`** (server actions / route handlers)

```ts
import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: list => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // ignore in server components
          }
        },
      },
    },
  )
}
```

- [ ] **Step 5: Add README setup notes**

Append to `README.md`:

```md
## Supabase setup

1. Create a project at https://supabase.com
2. In the SQL editor, run `supabase/migrations/0001_properties.sql`
3. Auth → URL config: add `http://localhost:3000/api/auth/callback` to redirect URLs
4. Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`.
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "supabase: schema + browser/server clients"
```

---

## Task 19: Save / list / delete server actions + magic-link auth

**Files:**
- Create: `app/actions/save-property.ts`, `app/actions/list-properties.ts`, `app/actions/delete-property.ts`, `app/actions/auth.ts`, `app/api/auth/callback/route.ts`

- [ ] **Step 1: Write `app/actions/save-property.ts`**

```ts
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
```

- [ ] **Step 2: Write `app/actions/list-properties.ts`**

```ts
'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { PropertyRow } from '@/lib/supabase/types'

export async function listProperties(): Promise<PropertyRow[]> {
  const sb = await createSupabaseServerClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return []

  const { data, error } = await sb
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as PropertyRow[]
}
```

- [ ] **Step 3: Write `app/actions/delete-property.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function deleteProperty(id: string) {
  const sb = await createSupabaseServerClient()
  const { error } = await sb.from('properties').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { ok: true }
}
```

- [ ] **Step 4: Write `app/actions/auth.ts`**

```ts
'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'email required' }

  const sb = await createSupabaseServerClient()
  const origin = (await headers()).get('origin') ?? 'http://localhost:3000'
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/api/auth/callback` },
  })
  if (error) return { error: error.message }
  return { ok: true }
}

export async function signOut() {
  const sb = await createSupabaseServerClient()
  await sb.auth.signOut()
  redirect('/')
}
```

- [ ] **Step 5: Write `app/api/auth/callback/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (code) {
    const sb = await createSupabaseServerClient()
    await sb.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/', url))
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 7: Commit**

```bash
git add app/actions app/api
git commit -m "actions: save/list/delete + magic-link auth"
```

---

## Task 20: Header component (auth pill + saved button)

**Files:**
- Create: `components/Header.tsx`, `components/SignInDialog.tsx`

- [ ] **Step 1: Write `components/SignInDialog.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { signInWithMagicLink } from '@/app/actions/auth'

export function SignInDialog({ children }: { children: React.ReactNode }) {
  const [pending, start] = useTransition()
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
        </DialogHeader>
        <form
          action={(fd) => {
            setError(null)
            start(async () => {
              const r = await signInWithMagicLink(fd)
              if ('error' in r && r.error) setError(r.error)
              else setSent(String(fd.get('email') ?? ''))
            })
          }}
          className="space-y-3"
        >
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required disabled={pending || !!sent} />
          {sent ? (
            <p className="text-sm text-emerald-600">Magic link sent to {sent}. Check your inbox.</p>
          ) : (
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Sending…' : 'Send magic link'}
            </Button>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Write `components/Header.tsx`**

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { SignInDialog } from './SignInDialog'

export async function Header() {
  const sb = await createSupabaseServerClient()
  const { data: { user } } = await sb.auth.getUser()

  return (
    <header className="bg-[#0a0f1c] text-white border-b border-[#1f2937]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          Kotofit Facility Analyzer
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-slate-300 mr-2">{user.email}</span>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm" className="text-slate-200 hover:text-white">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <SignInDialog>
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-white">
                Sign in
              </Button>
            </SignInDialog>
          )}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Use header in `app/layout.tsx`**

Replace the contents of `app/layout.tsx` with:

```tsx
import './globals.css'
import type { Metadata } from 'next'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: 'Kotofit Facility Analyzer',
  description: 'Evaluate commercial properties for badminton/pickleball facility viability',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased">
        <Header />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 5: Commit**

```bash
git add components/Header.tsx components/SignInDialog.tsx app/layout.tsx
git commit -m "ui: header with magic-link sign-in"
```

---

## Task 21: Listing input + property form

**Files:**
- Create: `components/ListingInput.tsx`, `components/PropertyForm.tsx`

- [ ] **Step 1: Write `components/ListingInput.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { extractListing } from '@/app/actions/extract-listing'
import type { ExtractedListing } from '@/types/analysis'

interface Props {
  onExtracted: (listing: ExtractedListing, source: 'ai' | 'regex', error?: string) => void
}

export function ListingInput({ onExtracted }: Props) {
  const [text, setText] = useState('')
  const [pending, start] = useTransition()
  const [warning, setWarning] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listing input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={8}
          placeholder="Paste listing text from LoopNet, Crexi, broker email, etc..."
          value={text}
          onChange={e => setText(e.target.value)}
          className="font-mono text-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            disabled={pending || !text.trim()}
            onClick={() =>
              start(async () => {
                setWarning(null)
                const r = await extractListing(text)
                if (r.source === 'regex' && r.error) setWarning(r.error)
                onExtracted(r.listing, r.source, r.error)
              })
            }
          >
            {pending ? 'Extracting…' : 'Extract with AI'}
          </Button>
          <span className="text-sm text-slate-500">or fill the form manually below.</span>
        </div>
        {warning && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {warning} Used local parser — please double-check fields.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Write `components/PropertyForm.tsx`**

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ExtractedListing } from '@/types/analysis'

interface Props {
  value: ExtractedListing
  onChange: (next: ExtractedListing) => void
}

const Field = (props: {
  label: string
  type?: 'text' | 'number'
  value: string | number | null
  onChange: (v: string | number | null) => void
  step?: string
}) => (
  <div>
    <Label className="text-xs text-slate-600">{props.label}</Label>
    <Input
      type={props.type ?? 'text'}
      step={props.step}
      value={props.value == null ? '' : props.value}
      onChange={e => {
        const v = e.target.value
        if (props.type === 'number') props.onChange(v === '' ? null : Number(v))
        else props.onChange(v === '' ? null : v)
      }}
    />
  </div>
)

export function PropertyForm({ value, onChange }: Props) {
  const set = <K extends keyof ExtractedListing>(k: K, v: ExtractedListing[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Address" value={value.address} onChange={v => set('address', v as string | null)} />
        <Field label="Zoning" value={value.zoning} onChange={v => set('zoning', v as string | null)} />
        <Field label="Total sq ft" type="number" value={value.totalSqft} onChange={v => set('totalSqft', v as number | null)} />
        <Field label="Warehouse sq ft" type="number" value={value.warehouseSqft} onChange={v => set('warehouseSqft', v as number | null)} />
        <Field label="Office sq ft" type="number" value={value.officeSqft} onChange={v => set('officeSqft', v as number | null)} />
        <Field label="Clear height (ft)" type="number" value={value.clearHeight} onChange={v => set('clearHeight', v as number | null)} />
        <Field label="Rent ($/sf/yr)" type="number" step="0.01" value={value.rentPerSqftYr} onChange={v => set('rentPerSqftYr', v as number | null)} />
        <Field label="Loading" value={value.loading} onChange={v => set('loading', v as string | null)} />
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add components/ListingInput.tsx components/PropertyForm.tsx
git commit -m "ui: listing input + property form"
```

---

## Task 22: Assumptions panel (collapsible)

**Files:**
- Create: `components/AssumptionsPanel.tsx`

- [ ] **Step 1: Write `components/AssumptionsPanel.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import type { Assumptions } from '@/types/analysis'
import { DEFAULT_ASSUMPTIONS } from '@/lib/constants'

interface Props {
  value: Assumptions
  onChange: (next: Assumptions) => void
}

const fields: Array<{ key: keyof Assumptions; label: string; step?: string }> = [
  { key: 'badmintonHourlyRate', label: 'Badminton $/hr' },
  { key: 'pickleballHourlyRate', label: 'Pickleball $/hr' },
  { key: 'badmintonReservedHoursPerWeek', label: 'Badminton hrs/wk' },
  { key: 'pickleballReservedHoursPerWeek', label: 'Pickleball hrs/wk' },
  { key: 'otherRevenuePct', label: 'Other revenue %', step: '0.01' },
  { key: 'badmintonMixPct', label: 'Badminton mix %', step: '0.01' },
  { key: 'pickleballMixPct', label: 'Pickleball mix %', step: '0.01' },
  { key: 'usableCourtAreaPct', label: 'Usable court area %', step: '0.01' },
  { key: 'badmintonCourtSqft', label: 'Badminton court sf' },
  { key: 'pickleballCourtSqft', label: 'Pickleball court sf' },
  { key: 'utilitiesPerSqftYr', label: 'Utilities $/sf/yr', step: '0.01' },
  { key: 'insurancePerSqftYr', label: 'Insurance $/sf/yr', step: '0.01' },
  { key: 'maintenancePerSqftYr', label: 'Maintenance $/sf/yr', step: '0.01' },
  { key: 'royaltyPct', label: 'Royalty %', step: '0.001' },
  { key: 'marketingPct', label: 'Marketing %', step: '0.001' },
  { key: 'miscAdminPct', label: 'Misc/Admin %', step: '0.001' },
  { key: 'payrollHourlyRate', label: 'Payroll $/hr' },
  { key: 'payrollHoursPerWeek', label: 'Payroll hrs/wk' },
  { key: 'payrollBurden', label: 'Payroll burden ×', step: '0.01' },
  { key: 'renovationPerSqftLow', label: 'Reno $/sf low' },
  { key: 'renovationPerSqftMid', label: 'Reno $/sf mid' },
  { key: 'renovationPerSqftHigh', label: 'Reno $/sf high' },
  { key: 'franchiseFee', label: 'Franchise fee' },
]

export function AssumptionsPanel({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader>
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <CardTitle>Assumptions</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(DEFAULT_ASSUMPTIONS)
                }}
              >
                Reset to defaults
              </Button>
              <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs text-slate-600">{f.label}</Label>
                <Input
                  type="number"
                  step={f.step}
                  value={value[f.key]}
                  onChange={e => onChange({ ...value, [f.key]: Number(e.target.value) })}
                />
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add components/AssumptionsPanel.tsx
git commit -m "ui: collapsible assumptions panel"
```

---

## Task 23: Dashboard — RatingBadge + KpiCards

**Files:**
- Create: `components/Dashboard/RatingBadge.tsx`, `components/Dashboard/KpiCards.tsx`, `lib/format.ts`

- [ ] **Step 1: Write `lib/format.ts`**

```ts
export function fmtMoney(n: number): string {
  if (!isFinite(n) || n === 0) return '$0'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1000)}K`
  return `$${Math.round(n)}`
}

export function fmtPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`
}

export function fmtYears(n: number | null): string {
  if (n === null) return '—'
  return `${n.toFixed(1)} yr`
}
```

- [ ] **Step 2: Write `components/Dashboard/RatingBadge.tsx`**

```tsx
import type { Rating } from '@/types/analysis'

const styles: Record<Rating, string> = {
  'Strong Candidate': 'bg-[#dcfce7] text-[#166534]',
  'Worth Investigating': 'bg-[#fef3c7] text-[#92400e]',
  'Risky': 'bg-[#ffedd5] text-[#9a3412]',
  'Do Not Pursue': 'bg-[#fee2e2] text-[#991b1b]',
  'Incomplete': 'bg-[#f1f5f9] text-[#475569]',
}

export function RatingBadge({ rating }: { rating: Rating }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${styles[rating]}`}
    >
      {rating}
    </span>
  )
}
```

- [ ] **Step 3: Write `components/Dashboard/KpiCards.tsx`**

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { fmtMoney, fmtPct, fmtYears } from '@/lib/format'
import type { AnalysisResult } from '@/types/analysis'

export function KpiCards({ result }: { result: AnalysisResult }) {
  const items = [
    { label: 'Gross revenue', value: fmtMoney(result.revenue.gross), sub: `${fmtMoney(result.monthlyRevenue)}/mo` },
    {
      label: 'NOI',
      value: fmtMoney(result.noi),
      sub: result.revenue.gross > 0 ? `${fmtPct(result.noiMargin)} margin` : '—',
      className: result.noi <= 0 ? 'text-red-700' : '',
    },
    {
      label: 'Payback',
      value: fmtYears(result.paybackYears),
      sub: `${fmtMoney(result.startupCost.mid)} startup (mid)`,
    },
    {
      label: 'Rent burden',
      value: fmtPct(result.rentBurden),
      sub: `${fmtMoney(result.expenses.rent)}/yr`,
      className: result.rentBurden > 0.30 ? 'text-amber-700' : '',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(i => (
        <Card key={i.label}>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{i.label}</div>
            <div className={`text-2xl font-semibold tabular-nums mt-1 ${i.className ?? ''}`}>
              {i.value}
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">{i.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 5: Commit**

```bash
git add lib/format.ts components/Dashboard/RatingBadge.tsx components/Dashboard/KpiCards.tsx
git commit -m "ui: rating badge + KPI cards"
```

---

## Task 24: Dashboard — CourtFitPanel + RiskFlagsPanel + SummaryPanel

**Files:**
- Create: `components/Dashboard/CourtFitPanel.tsx`, `components/Dashboard/RiskFlagsPanel.tsx`, `components/Dashboard/SummaryPanel.tsx`

- [ ] **Step 1: Write `components/Dashboard/CourtFitPanel.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalysisResult, ExtractedListing, Assumptions } from '@/types/analysis'

interface Props {
  result: AnalysisResult
  listing: ExtractedListing
  assumptions: Assumptions
}

export function CourtFitPanel({ result, listing, assumptions }: Props) {
  const warehouseSqft = listing.warehouseSqft ?? listing.totalSqft ?? 0
  const usable = warehouseSqft * assumptions.usableCourtAreaPct
  const tooFew = result.courts.total > 0 && result.courts.total < 6

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Court fit · {Math.round(usable).toLocaleString()} sf usable
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm tabular-nums">
        <Row label={`Badminton (${assumptions.badmintonCourtSqft} sf each)`} value={`${result.courts.badminton} courts`} />
        <Row label={`Pickleball (${assumptions.pickleballCourtSqft} sf each)`} value={`${result.courts.pickleball} courts`} />
        <Row
          label="Total planned"
          value={`${result.courts.total} / 6 target`}
          highlight={tooFew ? 'text-amber-700' : ''}
        />
      </CardContent>
    </Card>
  )
}

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: string }) => (
  <div className={`flex justify-between py-1.5 border-b border-dashed border-slate-200 last:border-0 ${highlight ?? ''}`}>
    <span>{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
)
```

- [ ] **Step 2: Write `components/Dashboard/RiskFlagsPanel.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RiskFlag } from '@/types/analysis'

const severityStyles: Record<RiskFlag['severity'], string> = {
  high: 'bg-[#fef2f2] text-[#991b1b] border-l-[3px] border-red-500',
  medium: 'bg-[#fffbeb] text-[#92400e] border-l-[3px] border-amber-500',
  low: 'bg-[#f1f5f9] text-[#475569] border-l-[3px] border-slate-400',
}

export function RiskFlagsPanel({ flags }: { flags: RiskFlag[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Risks to confirm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {flags.length === 0 ? (
          <p className="text-sm text-slate-500">No major risk flags triggered.</p>
        ) : (
          flags.map(f => (
            <div key={f.id} className={`px-3 py-2 rounded text-sm ${severityStyles[f.severity]}`}>
              <div className="font-semibold">{f.title}</div>
              <div className="text-xs mt-1 opacity-90">{f.detail}</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Write `components/Dashboard/SummaryPanel.tsx`**

```tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { generateSummary } from '@/app/actions/generate-summary'
import type { AnalysisResult } from '@/types/analysis'

interface Props {
  result: AnalysisResult
  address: string | null
}

export function SummaryPanel({ result, address }: Props) {
  const [text, setText] = useState<string>(result.summary)
  const [source, setSource] = useState<'ai' | 'fallback' | 'pending'>('pending')
  const [pending, start] = useTransition()

  useEffect(() => {
    setText(result.summary)
    setSource('fallback')
  }, [result.summary])

  const refresh = () =>
    start(async () => {
      const r = await generateSummary(result, address)
      setText(r.summary)
      setSource(r.source)
    })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Summary</CardTitle>
        <Button size="sm" variant="ghost" onClick={refresh} disabled={pending}>
          {pending ? 'Generating…' : source === 'ai' ? 'Regenerate' : 'Generate AI summary'}
        </Button>
      </CardHeader>
      <CardContent>
        {pending ? <Skeleton className="h-32 w-full" /> : <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{text}</pre>}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 5: Commit**

```bash
git add components/Dashboard
git commit -m "ui: court fit + risk flags + summary panels"
```

---

## Task 25: Dashboard — FinancialBreakdown + bar chart

**Files:**
- Create: `components/Dashboard/FinancialBreakdown.tsx`

- [ ] **Step 1: Write `components/Dashboard/FinancialBreakdown.tsx`**

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { fmtMoney } from '@/lib/format'
import type { AnalysisResult } from '@/types/analysis'

export function FinancialBreakdown({ result }: { result: AnalysisResult }) {
  const expenseData = [
    { name: 'Rent', value: result.expenses.rent },
    { name: 'Payroll', value: result.expenses.payroll },
    { name: 'Utilities', value: result.expenses.utilities },
    { name: 'Insurance', value: result.expenses.insurance },
    { name: 'Maint.', value: result.expenses.maintenance },
    { name: 'Royalty', value: result.expenses.royalty },
    { name: 'Marketing', value: result.expenses.marketing },
    { name: 'Misc', value: result.expenses.miscAdmin },
  ]
  const max = Math.max(...expenseData.map(d => d.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Annual revenue & expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-sm tabular-nums">
            <Row label="Court revenue (badminton)" value={fmtMoney(result.revenue.badminton)} />
            <Row label="Court revenue (pickleball)" value={fmtMoney(result.revenue.pickleball)} />
            <Row label="Other revenue" value={fmtMoney(result.revenue.other)} />
            <Row label="Gross revenue" value={fmtMoney(result.revenue.gross)} bold />
            <div className="h-2" />
            <Row label="Total expenses" value={fmtMoney(result.expenses.total)} />
            <Row label="NOI" value={fmtMoney(result.noi)} bold highlight={result.noi > 0 ? 'text-emerald-700' : 'text-red-700'} />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} margin={{ left: -10, right: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtMoney(v as number)} />
                <Tooltip formatter={(v: number) => fmtMoney(v)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {expenseData.map((d, i) => (
                    <Cell key={i} fill={d.value === max ? '#92400e' : '#475569'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const Row = ({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: string }) => (
  <div className={`flex justify-between py-1.5 border-b border-dashed border-slate-200 last:border-0 ${highlight ?? ''}`}>
    <span className={bold ? 'font-semibold' : ''}>{label}</span>
    <span className={bold ? 'font-bold tabular-nums' : 'tabular-nums'}>{value}</span>
  </div>
)
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add components/Dashboard/FinancialBreakdown.tsx
git commit -m "ui: financial breakdown + expense chart"
```

---

## Task 26: Saved properties slide-over

**Files:**
- Create: `components/SavedPropertiesSheet.tsx`

- [ ] **Step 1: Write `components/SavedPropertiesSheet.tsx`**

```tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { listProperties } from '@/app/actions/list-properties'
import { deleteProperty } from '@/app/actions/delete-property'
import { RatingBadge } from './Dashboard/RatingBadge'
import { fmtMoney } from '@/lib/format'
import type { PropertyRow } from '@/lib/supabase/types'

interface Props {
  onLoad: (row: PropertyRow) => void
}

export function SavedPropertiesSheet({ onLoad }: Props) {
  const [rows, setRows] = useState<PropertyRow[]>([])
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (open) start(async () => setRows(await listProperties()))
  }, [open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">Saved properties</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Saved properties</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {pending && <p className="text-sm text-slate-500">Loading…</p>}
          {!pending && rows.length === 0 && (
            <p className="text-sm text-slate-500">No saved properties yet. Sign in and click Save.</p>
          )}
          {rows.map(r => (
            <div key={r.id} className="border rounded-lg p-3 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm truncate">{r.label || r.address || 'Untitled'}</div>
                {r.rating && <RatingBadge rating={r.rating as any} />}
              </div>
              <div className="text-xs text-slate-500 tabular-nums mt-1">
                NOI {r.noi != null ? fmtMoney(r.noi) : '—'} · {r.total_courts ?? 0} courts ·{' '}
                {r.payback_years != null ? `${Number(r.payback_years).toFixed(1)} yr payback` : 'no payback'}
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="default" onClick={() => { onLoad(r); setOpen(false) }}>
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    start(async () => {
                      await deleteProperty(r.id)
                      setRows(rows.filter(x => x.id !== r.id))
                    })
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add components/SavedPropertiesSheet.tsx
git commit -m "ui: saved-properties slide-over"
```

---

## Task 27: Wire up the main page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ListingInput } from '@/components/ListingInput'
import { PropertyForm } from '@/components/PropertyForm'
import { AssumptionsPanel } from '@/components/AssumptionsPanel'
import { RatingBadge } from '@/components/Dashboard/RatingBadge'
import { KpiCards } from '@/components/Dashboard/KpiCards'
import { CourtFitPanel } from '@/components/Dashboard/CourtFitPanel'
import { FinancialBreakdown } from '@/components/Dashboard/FinancialBreakdown'
import { RiskFlagsPanel } from '@/components/Dashboard/RiskFlagsPanel'
import { SummaryPanel } from '@/components/Dashboard/SummaryPanel'
import { SavedPropertiesSheet } from '@/components/SavedPropertiesSheet'
import { calculateAnalysis } from '@/lib/calculator'
import { DEFAULT_ASSUMPTIONS, EMPTY_LISTING } from '@/lib/constants'
import { saveProperty } from '@/app/actions/save-property'
import type { Assumptions, ExtractedListing } from '@/types/analysis'

export default function Page() {
  const [listing, setListing] = useState<ExtractedListing>({ ...EMPTY_LISTING })
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS)
  const [savedId, setSavedId] = useState<string | undefined>(undefined)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const result = useMemo(
    () => calculateAnalysis({ listing, assumptions }),
    [listing, assumptions],
  )

  const reset = () => {
    setListing({ ...EMPTY_LISTING })
    setAssumptions(DEFAULT_ASSUMPTIONS)
    setSavedId(undefined)
  }

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ listing, assumptions, result }, null, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${listing.address?.replace(/\W+/g, '-') || 'analysis'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const save = () =>
    start(async () => {
      setSaveStatus(null)
      const r = await saveProperty({
        id: savedId,
        label: listing.address,
        address: listing.address,
        listing,
        assumptions,
        snapshot: {
          rating: result.rating,
          noi: result.noi,
          totalCourts: result.courts.total,
          paybackYears: result.paybackYears,
        },
      })
      if ('error' in r) {
        setSaveStatus(r.error === 'not_authenticated' ? 'Sign in to save.' : `Error: ${r.error}`)
      } else {
        setSavedId(r.id)
        setSaveStatus('Saved.')
      }
    })

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">Paste a listing → review → save → compare.</div>
        <SavedPropertiesSheet
          onLoad={(row) => {
            setListing(row.listing_json)
            setAssumptions(row.assumptions_json)
            setSavedId(row.id)
          }}
        />
      </div>

      <ListingInput onExtracted={(l) => setListing(l)} />
      <PropertyForm value={listing} onChange={setListing} />
      <AssumptionsPanel value={assumptions} onChange={setAssumptions} />

      <section className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Analysis</h2>
          <RatingBadge rating={result.rating} />
        </div>

        <KpiCards result={result} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CourtFitPanel result={result} listing={listing} assumptions={assumptions} />
          <RiskFlagsPanel flags={result.riskFlags} />
        </div>

        <FinancialBreakdown result={result} />

        <SummaryPanel result={result} address={listing.address} />
      </section>

      <div className="flex items-center gap-2 pt-3 border-t">
        <Button onClick={save} disabled={pending}>
          {pending ? 'Saving…' : savedId ? 'Update saved analysis' : 'Save analysis'}
        </Button>
        <Button variant="ghost" onClick={reset}>Reset</Button>
        <Button variant="ghost" onClick={exportJson}>Export JSON</Button>
        {saveStatus && <span className="text-sm text-slate-500 ml-2">{saveStatus}</span>}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Run dev server and walk through the spec example**

```bash
npm run dev
```

Open http://localhost:3000. Paste:

```
91-15 139th St, Jamaica, NY 11435
12,500 SF industrial space available
10,000 SF warehouse + 2,500 SF dedicated office space
Clear Height: 20'
Rental Rate: Upon Request
Zoning: M1-1
1 drive-in bay, 1 interior dock door
Near Van Wyck Expressway, JFK Airport, E/J/Z trains and LIRR Jamaica
```

Click **Extract with AI** (or fall through to regex if no API key). Verify:
- Total sq ft = 12,500
- Warehouse = 10,000, Office = 2,500
- Clear height = 20
- Rent is empty
- Zoning = M1-1
- Rating shows **Incomplete** until you fill in a rent value
- Filling rent = 20 → rating becomes **Do Not Pursue** (rentBurden > 0.35)
- Risk flags include low-clear-height, missing-rent (until rent set), too-few-courts, high-rent-burden, office-space, zoning

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "ui: wire main page (paste → form → dashboard → save)"
```

---

## Task 28: Visual polish + final manual walk-through

**Files:**
- Modify: `app/globals.css`, `app/page.tsx` (if needed)

- [ ] **Step 1: Tighten typography & numbers in `app/globals.css`**

Append to `app/globals.css`:

```css
@layer base {
  body {
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
}
```

- [ ] **Step 2: Run dev and re-walk the flow with a Strong-Candidate input**

```bash
npm run dev
```

Manually enter (no paste needed):

- Address: `Test Site`
- Total sq ft: `15000`
- Warehouse sq ft: `15000`
- Office sq ft: `0`
- Clear height: `28`
- Rent: `12`
- Zoning: leave blank

Verify rating becomes **Strong Candidate** (or **Worth Investigating** depending on exact numbers — both are acceptable green/amber outcomes), payback < 4 yr, no clear-height or office flags.

- [ ] **Step 3: Test save → list → reload flow (requires Supabase + sign-in)**

If `.env.local` is set up:

1. Sign in via magic link
2. Save the analysis
3. Open Saved properties sheet → confirm it appears with rating + NOI
4. Click Open → verify form repopulates
5. Delete → verify it disappears

If Supabase isn't set up yet, document that the save flow returns "Sign in to save" and skip.

- [ ] **Step 4: Final test run + build**

```bash
npm test && npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "polish: typography + final manual walk-through"
```

---

## Out of scope (per design doc)

These are explicitly NOT to be implemented in this plan:

- LoopNet URL scraping / live ingestion
- Competitor mapping, drive-time radius, demographics
- PDF export
- Broker email generator
- Multi-user collaboration / shared analyses
- Property comparison view
- Floor-plan column-spacing analysis (we *prompt* the user; we don't model it)
- Mobile-phone polish
- Component-level UI tests

If any of these come up during execution, defer them.
