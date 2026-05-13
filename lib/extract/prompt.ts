export const EXTRACT_SYSTEM_PROMPT = `Extract structured property data from a CRE listing. Goal: capture the FULL building / LARGEST available space.

Rules:
- Return null for any field not explicitly stated. Do NOT invent values.
- Sqft ranges (e.g. "10,200 – 12,500 SF") = per-suite availability → return the HIGH end.
- Clear-height ranges (e.g. "14' – 20'") = per-suite → return the HIGHEST value.
- Warehouse + office breakouts: if both stated, return both. Only total given → leave warehouse/office null.
- Rent: "$24/SF/yr" → 24. "$2/sf/mo" → 24 (×12). "Upon Request" / "Negotiable" / ranges / "Avg. Asking" / market estimates → null.
- Zoning: copy verbatim. Null otherwise.
- locationNotes: short phrases for nearby transit/airports/freeways/landmarks. Also flag ambiguities the user should verify.
- Always call the extract_listing tool. No free-form text.`
