# Kotofit Facility Analyzer — Design Doc

**Date:** 2026-05-10
**Status:** Approved (pending user spec review)

## Goal

Build a web app that helps evaluate whether a commercial warehouse/property listing is viable for opening a Kotofit-style indoor badminton/pickleball sports facility. The app answers two questions for any pasted listing:

1. **Is this property physically and financially viable for a badminton-led Kotofit franchise?**
2. **What needs to be confirmed before moving forward?**

A user pastes listing text (e.g. from LoopNet), AI extracts structured fields, the user can edit any value, and a dashboard shows court-fit analysis, projected revenue/expenses, NOI, payback period, deal rating, and risk flags. Users can save analyses to revisit.

## Scope (v1)

In scope:

- Paste-text input → AI extraction (Anthropic Claude Haiku 4.5) → editable form
- Pure-TS calculator covering courts, revenue, expenses, NOI, startup cost, payback
- Deal rating (Strong / Worth Investigating / Risky / Do Not Pursue / Incomplete)
- Risk flags (clear height, missing rent, too few courts, high rent burden, office-space, zoning)
- AI-generated plain-English summary + next-step checklist
- Magic-link auth + Supabase persistence (saved properties)
- Saved properties slide-over (right side of header)
- JSON export of an analysis
- Regex fallback parser when AI extraction fails
- Responsive enough for tablet (not optimized for phone)

Explicitly out of scope (deferred):

- LoopNet URL scraping / live ingestion
- Competitor mapping, drive-time radius, demographics
- PDF export
- Broker email generator
- Multi-user collaboration / shared analyses
- Property comparison view
- Floor-plan column-spacing analysis (we *prompt* the user to ask the broker; we don't model it)
- Mobile-phone polish

## Tech Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Card, Button, Badge, Dialog, Sheet, Input, Textarea, Collapsible)
- **Supabase** — Postgres + magic-link auth, single `properties` table
- **Anthropic SDK** (`@anthropic-ai/sdk`) — `claude-haiku-4-5-20251001` for both extraction and summary
- **Recharts** — one bar chart for revenue/expense breakdown
- **Zod** — schema validation for AI-extracted JSON

No state library beyond React state + URL params. No tRPC, no React Query — Server Actions are sufficient.

## Architecture

**Where things run:**

- **Browser:** form, dashboard, all calculations (pure TS, recompute on every input change for instant feedback)
- **Server (Next.js Server Actions):** AI extraction call, summary generation, Supabase reads/writes — keeps `ANTHROPIC_API_KEY` and Supabase service role off the client
- **Database:** stores raw extracted JSON + user assumption overrides + a denormalized snapshot (rating/NOI/courts/payback) for fast list rendering

**Why client-side calculations:** the math is deterministic and cheap (sub-millisecond). Running it client-side gives instant feedback as the user edits assumptions. AI and DB are the only things that need server access.

**Module boundaries (the three swap points):**

- `lib/calculator.ts` is the *only* place math happens. Pure functions, no I/O, no React.
- `lib/extract/` is the *only* place that talks to Anthropic.
- `lib/supabase/` is the *only* place that talks to the DB.

Components consume these through hooks/props; they don't reach into them. This means changing the AI provider only touches `extract/`, changing the DB only touches `supabase/`, changing a calculation only touches `calculator.ts`.

## User Flow & Layout

Single page, single route (`/`). Everything stacks vertically; section anchors allow jumping.

```
┌─ Header ──────────────────────────────────────────────┐
│  Kotofit Facility Analyzer       [Saved] [Sign in/out] │
└────────────────────────────────────────────────────────┘

1. Listing input
   [Paste listing text textarea]
   [Extract with AI]   [or fill manually]

2. Property details (editable form, 2 cols)
   Address | Total sf | Warehouse sf | Office sf
   Rent $/sf/yr | Clear height | Zoning | Loading

3. Assumptions (collapsible "Advanced")
   Court mix, hourly rates, hours/week, payroll,
   renovation $/sf, royalty %, etc.

4. Dashboard
   Rating badge + 4 KPI cards (gross rev · NOI · payback · rent burden)
   Court fit panel  (badminton + pickleball counts)
   Revenue/expense breakdown (table + small bar chart)
   Risk flags list
   AI-generated summary + next-step checklist

5. Footer actions
   [Save analysis]   [Reset]   [Export JSON]
```

**Saved properties:** button in header opens a right-side `Sheet` slide-over listing the user's saved analyses (label/address, rating badge, NOI, saved date). Click one → form + dashboard repopulate.

**Auth:** magic-link only. Anonymous users can use the analyzer fully — only the **Save** action is gated behind a sign-in prompt.

**State flow (one user session):**

```
paste text ──► extract action ──► extractedJson ──► form state
                                                       │
                                       ┌───────────────┘
                                       ▼
                              calculator(formState) ──► dashboard
                                                       │
                                              [Save] ──┘──► Supabase
```

Form state is the single source of truth; calculator is a pure function over form state.

## File / Module Structure

```
app/
  layout.tsx                    Root layout, dark header, fonts
  page.tsx                      The single analyzer page
  actions/
    extract-listing.ts          'use server' — calls Anthropic, returns ExtractedListing
    generate-summary.ts         'use server' — Anthropic plain-text summary
    save-property.ts            'use server' — Supabase insert/update
    list-properties.ts          'use server' — Supabase select (current user)
    delete-property.ts          'use server'
  api/
    auth/callback/route.ts      Supabase magic-link callback

components/
  Header.tsx                    Brand + Saved button + auth pill
  ListingInput.tsx              Textarea + Extract button
  PropertyForm.tsx              Editable extracted-fields form
  AssumptionsPanel.tsx          Collapsible advanced assumptions
  Dashboard/
    RatingBadge.tsx             Strong / Worth / Risky / Do Not Pursue / Incomplete
    KpiCards.tsx                4-card row (gross, NOI, payback, rent burden)
    CourtFitPanel.tsx           Badminton + pickleball breakdown
    FinancialBreakdown.tsx      Revenue/expense table + Recharts bar
    RiskFlagsPanel.tsx          List of triggered flags w/ explanations
    SummaryPanel.tsx            AI-generated narrative + next steps
  SavedPropertiesSheet.tsx      Right-side slide-over
  ui/                           shadcn primitives

lib/
  calculator.ts                 Pure — calculateAnalysis(input): AnalysisResult
  rating.ts                     Pure — deal-rating logic
  risk-flags.ts                 Pure — generates flag list
  summary-fallback.ts           Pure — deterministic summary used if AI summary fails
  extract/
    schema.ts                   Zod schema for ExtractedListing
    prompt.ts                   Anthropic system + user prompt builder
    regex-fallback.ts           Local parser used if AI fails
  supabase/
    client.ts                   Browser client
    server.ts                   Server-side client (Server Actions)
    types.ts                    Generated DB types
  constants.ts                  All default assumptions in one place

types/
  analysis.ts                   AnalysisInput, AnalysisResult, RiskFlag, Rating
```

## Data Model

### TypeScript types

```ts
// types/analysis.ts

export interface ExtractedListing {
  address: string | null
  totalSqft: number | null
  warehouseSqft: number | null
  officeSqft: number | null
  clearHeight: number | null      // feet
  rentPerSqftYr: number | null    // dollars
  zoning: string | null
  loading: string | null
  parking: string | null
  locationNotes: string[]
}

export interface Assumptions {
  badmintonCourtSqft: number              // 1250
  pickleballCourtSqft: number             // 1800
  usableCourtAreaPct: number              // 0.8
  badmintonMixPct: number                 // 0.6
  pickleballMixPct: number                // 0.4
  badmintonHourlyRate: number             // 45
  pickleballHourlyRate: number            // 55
  badmintonReservedHoursPerWeek: number   // 42
  pickleballReservedHoursPerWeek: number  // 38
  weeksPerYear: number                    // 52
  otherRevenuePct: number                 // 0.18
  payrollHourlyRate: number               // 17
  payrollHoursPerWeek: number             // 40
  payrollBurden: number                   // 1.12
  utilitiesPerSqftYr: number              // 4.5
  insurancePerSqftYr: number              // 1.25
  maintenancePerSqftYr: number            // 2.25
  royaltyPct: number                      // 0.07
  marketingPct: number                    // 0.025
  miscAdminPct: number                    // 0.02
  renovationPerSqftLow: number            // 18
  renovationPerSqftMid: number            // 28
  renovationPerSqftHigh: number           // 45
  franchiseFee: number                    // 40000
}

export interface AnalysisInput {
  listing: ExtractedListing
  assumptions: Assumptions
}

export interface AnalysisResult {
  courts: { badminton: number; pickleball: number; total: number }
  revenue: { badminton: number; pickleball: number; other: number; gross: number }
  expenses: {
    rent: number; payroll: number; utilities: number; insurance: number
    maintenance: number; royalty: number; marketing: number; miscAdmin: number
    total: number
  }
  noi: number
  noiMargin: number
  monthlyRent: number
  monthlyRevenue: number
  rentBurden: number
  revenuePerSqft: number
  startupCost: { low: number; mid: number; high: number }
  paybackYears: number | null     // null when NOI <= 0
  rating: Rating
  riskFlags: RiskFlag[]
  summary: string                  // populated by generate-summary action; fallback if AI fails
}

export type Rating =
  | 'Strong Candidate'
  | 'Worth Investigating'
  | 'Risky'
  | 'Do Not Pursue'
  | 'Incomplete'

export interface RiskFlag {
  id: 'low-clear-height' | 'missing-rent' | 'too-few-courts' | 'high-rent-burden' | 'office-space' | 'zoning'
  severity: 'high' | 'medium' | 'low'
  title: string
  detail: string
}
```

### Supabase schema

```sql
create table properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  label text,                      -- user-given nickname; falls back to address
  address text,

  listing_json jsonb not null,     -- ExtractedListing
  assumptions_json jsonb not null, -- Assumptions

  -- Snapshot for list view (denormalized)
  rating text,
  noi numeric,
  total_courts int,
  payback_years numeric
);

create index properties_user_id_idx on properties(user_id);
create index properties_created_at_idx on properties(created_at desc);

alter table properties enable row level security;
create policy "own rows" on properties
  for all using (auth.uid() = user_id);
```

The snapshot columns let the saved-properties slide-over render fast without recomputing or fetching everything; the jsonb columns are the source of truth that re-populate the form when a property is opened.

## Calculation Logic

All in `lib/calculator.ts` as pure functions. Verbatim from product spec:

```ts
// Courts
usableCourtArea = warehouseSqft * usableCourtAreaPct        // 0.8
badmintonArea   = usableCourtArea * badmintonMixPct          // 0.6
pickleballArea  = usableCourtArea * pickleballMixPct         // 0.4
plannedBadminton  = floor(badmintonArea / badmintonCourtSqft)   // /1250
plannedPickleball = floor(pickleballArea / pickleballCourtSqft) // /1800
totalCourts       = plannedBadminton + plannedPickleball

// Revenue
badmintonRevenue  = plannedBadminton  * badmintonHourlyRate  * badmintonReservedHoursPerWeek  * weeksPerYear
pickleballRevenue = plannedPickleball * pickleballHourlyRate * pickleballReservedHoursPerWeek * weeksPerYear
courtRevenue      = badmintonRevenue + pickleballRevenue
otherRevenue      = courtRevenue * otherRevenuePct           // 0.18
grossRevenue      = courtRevenue + otherRevenue

// Expenses
annualRent  = totalSqft * rentPerSqftPerYear
payroll     = payrollHourlyRate * payrollHoursPerWeek * weeksPerYear * payrollBurden
utilities   = totalSqft * utilitiesPerSqftYr
insurance   = totalSqft * insurancePerSqftYr
maintenance = totalSqft * maintenancePerSqftYr
royalty     = grossRevenue * royaltyPct
marketing   = grossRevenue * marketingPct
miscAdmin   = grossRevenue * miscAdminPct
operatingExpenses = annualRent + payroll + utilities + insurance + maintenance
                  + royalty + marketing + miscAdmin

// Profitability
noi             = grossRevenue - operatingExpenses
noiMargin       = noi / grossRevenue
monthlyRent     = annualRent / 12
monthlyRevenue  = grossRevenue / 12
rentBurden      = annualRent / grossRevenue
revenuePerSqft  = grossRevenue / totalSqft

// Startup + payback
startupCostLow  = totalSqft * renovationPerSqftLow  + franchiseFee   // 18 + 40k
startupCostMid  = totalSqft * renovationPerSqftMid  + franchiseFee   // 28 + 40k
startupCostHigh = totalSqft * renovationPerSqftHigh + franchiseFee   // 45 + 40k
paybackYears    = noi > 0 ? startupCostMid / noi : null
```

**Court calculation uses warehouseSqft** (clear-span area), not totalSqft. If the listing only provides totalSqft (no office breakdown), `warehouseSqft` defaults to `totalSqft` and the office-space risk flag is not triggered.

## Deal Rating Logic

```ts
if (!totalSqft || !rentPerSqftYr) {
  rating = 'Incomplete'
} else if (totalCourts < 4 || noi <= 0 || rentBurden > 0.35) {
  rating = 'Do Not Pursue'
} else if (paybackYears <= 2.5 && noiMargin >= 0.25 && rentBurden <= 0.22) {
  rating = 'Strong Candidate'
} else if (paybackYears <= 4 && noiMargin >= 0.15) {
  rating = 'Worth Investigating'
} else {
  rating = 'Risky'
}
```

## Risk Flags

| id                  | Triggered when                               | Severity |
|---------------------|----------------------------------------------|----------|
| `low-clear-height`  | `clearHeight < 24`                           | high     |
| `missing-rent`      | `rentPerSqftYr == null`                      | high     |
| `too-few-courts`    | `totalCourts < 6`                            | medium   |
| `high-rent-burden`  | `rentBurden > 0.30`                          | medium   |
| `office-space`      | `officeSqft != null && officeSqft > 0`       | low      |
| `zoning`            | `zoning != null` (always, just to confirm)   | low      |

Flag detail strings are taken verbatim from the product spec.

## AI Extraction

**Model:** `claude-haiku-4-5-20251001`. One call, ~1–2 s.

**Strategy:** **forced tool use** with a Zod-derived JSON schema. Claude "calls" an `extract_listing` tool whose parameters match `ExtractedListing`. Response is structured JSON, validated with Zod.

```ts
const tool = {
  name: 'extract_listing',
  description: 'Extract structured property data from a commercial listing.',
  input_schema: zodToJsonSchema(ExtractedListingSchema),
}

const response = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1024,
  system: SYSTEM_PROMPT,             // prompt-cached
  tools: [tool],
  tool_choice: { type: 'tool', name: 'extract_listing' },
  messages: [{ role: 'user', content: rawListingText }],
})

const toolUse = response.content.find(b => b.type === 'tool_use')
return ExtractedListingSchema.parse(toolUse.input)
```

**System prompt principles:**

- Return `null` if not present — do NOT invent values
- Convert ranges like `25–30 ft` to the lower bound
- If only total sqft is given but the listing splits warehouse + office, return both. If only total is given, leave warehouse/office null.
- Rent: parse `$24/SF/yr`, `$24 PSF`, `$2/sf/mo` (×12). "Upon Request" / "Negotiable" → null.
- Clear height: if a range, return the lower number; if "ceiling height" is given, treat as clear height but flag in `locationNotes`.
- Output must call the `extract_listing` tool, no commentary.

**Caching:** the system prompt is `cache_control: { type: 'ephemeral' }` since it's the bulk of tokens and never changes.

**Fallback:** if the API call fails or Zod parsing fails, run `regex-fallback.ts` (small local parser handling sqft numbers, `Clear Height: 20'`, address line, zoning code) and surface a toast: "AI extraction failed — used local parser, please double-check fields."

## AI Summary

A second call, made after the user has finalized the form, with the computed `AnalysisResult` as input. Plain-text output, ~3–5 sentences plus a numbered next-steps list. Same model. We pass:

- The rating
- Court counts
- Key numbers (gross, NOI, payback)
- Triggered risk flags

Naturally adapts the prose to which flags fired.

**Fallback:** `summary-fallback.ts` produces a deterministic template if the call fails — boring but always works.

## Visual Design

Direction: **A** from the brainstorm (Bloomberg / CRE-analyst data-forward) with a touch of **B**'s breathing room on KPI cards.

- Dark header (`#0a0f1c`-ish), light dashboard body (`#f8fafc`)
- White cards with `border-radius: 14px`, `border: 1px solid #e5e7eb`
- Tabular-nums on all numeric values
- Rating-badge color map:
  - `Strong Candidate` — green tint (`#dcfce7` / `#166534`)
  - `Worth Investigating` — amber tint (`#fef3c7` / `#92400e`)
  - `Risky` — orange tint (`#ffedd5` / `#9a3412`)
  - `Do Not Pursue` — red tint (`#fee2e2` / `#991b1b`)
  - `Incomplete` — slate tint (`#f1f5f9` / `#475569`)
- Risk-flag severity colors: high = red-tinted (`#fef2f2` / `#991b1b`), medium = amber (`#fffbeb` / `#92400e`), low = slate (`#f1f5f9` / `#475569`)
- Dashed dividers between rows in panels
- Recharts bar with monochrome bars + accent for the largest expense

shadcn/ui defaults will be customized via `globals.css` to match.

## Environment & Config

```
.env.local
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server-side only
```

`SUPABASE_SERVICE_ROLE_KEY` is only used in Server Actions; never imported into client modules.

## Testing Strategy

- `lib/calculator.ts` — unit tests with hand-calculated fixtures (the spec's example: 12,500 sf / 10,000 warehouse → 3 badminton + 1 pickleball)
- `lib/rating.ts` — table-driven tests over rating thresholds
- `lib/risk-flags.ts` — one test per flag's trigger condition
- `lib/extract/regex-fallback.ts` — tests against the spec's example listing text
- AI extraction itself: integration test gated behind `ANTHROPIC_API_KEY`, runs against the spec's example, asserts shape only (not exact values)
- No component-level tests in v1 (manual UI testing); add later if regressions appear

## Risks & Open Questions

- **AI extraction quality on messy real-world LoopNet text** — won't know until tested with several real listings. Regex fallback covers the worst case.
- **Supabase magic-link UX in development** — local-host email delivery requires Supabase's local dev stack or Inbucket; document this in README.
- **Two AI calls per analysis** — extraction + summary. Approved as worthwhile spend; can be flipped to template-only summary later if cost matters.
- **Rating thresholds are heuristics** — the spec's numbers are reasonable starting points; expect to tune them once we run several real properties through.
