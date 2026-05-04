// SI ↔ Imperial conversion for the property strings stored in our materials
// data (e.g. "65 MPa", "1.12 g/cm³"). Western (US) FRP engineers default to
// ksi and lb/ft³ even when working off SI spec sheets — showing both inline
// removes a lookup step.
//
// Pure functions. No React deps so we can use this in server components too.

type Conversion = {
  // Regex applied to the trailing unit token after stripping whitespace.
  match: RegExp;
  // siValue is the parsed leading number, group 1 of `match`.
  toImperial: (siValue: number, unitMatch: RegExpMatchArray) => string | null;
};

const NUM = /(-?\d+(?:\.\d+)?)/;

// One MPa = 0.145037738 ksi.
const MPA_TO_KSI = 0.145037738;
// One MPa = 145.037738 psi (used when the value is < 1 ksi for readability).
const MPA_TO_PSI = 145.037738;
// One GPa = 145.037738 ksi.
const GPA_TO_KSI = 145.037738;
// One g/cm³ = 62.427960576 lb/ft³.
const GCC_TO_LB_FT3 = 62.427960576;
// One mm = 0.0393700787 inch.
const MM_TO_IN = 0.0393700787;
// One °C = (x*9/5)+32 °F.
const C_TO_F = (c: number) => (c * 9) / 5 + 32;
// One MJ/m² = 0.0476 ft·lb/in² (rough fracture energy conversion; mostly informational).
// We skip this — not standard enough to auto-translate without unit context.

function fmt(n: number, precision = 2): string {
  if (Math.abs(n) >= 100) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(precision);
}

const conversions: Conversion[] = [
  // GPa → ksi (modulus)
  {
    match: new RegExp(`^${NUM.source}\\s*GPa$`, "i"),
    toImperial: (v) => `${fmt(v * GPA_TO_KSI, 0)} ksi`,
  },
  // MPa → ksi (or psi if small) — strength
  {
    match: new RegExp(`^${NUM.source}\\s*MPa$`, "i"),
    toImperial: (v) => {
      const ksi = v * MPA_TO_KSI;
      if (ksi >= 1) return `${fmt(ksi)} ksi`;
      return `${fmt(v * MPA_TO_PSI, 0)} psi`;
    },
  },
  // g/cm³ → lb/ft³ (density)
  {
    match: new RegExp(`^${NUM.source}\\s*g/?cm[³3]$`, "i"),
    toImperial: (v) => `${fmt(v * GCC_TO_LB_FT3, 1)} lb/ft³`,
  },
  // mm → in (thickness)
  {
    match: new RegExp(`^${NUM.source}\\s*mm$`, "i"),
    toImperial: (v) => `${fmt(v * MM_TO_IN, 3)} in`,
  },
  // °C → °F (temperature)
  {
    match: new RegExp(`^${NUM.source}\\s*°?C$`, "i"),
    toImperial: (v) => `${fmt(C_TO_F(v), 0)} °F`,
  },
];

export type ConvertedValue = {
  /** Original (SI) value as authored in the data. */
  si: string;
  /** Imperial equivalent, or null if the unit is not in our conversion table. */
  imperial: string | null;
};

/**
 * Parse a property string like "65 MPa" and return both SI and Imperial forms.
 * Returns `imperial: null` for values whose unit we don't recognize, so callers
 * can decide whether to render the dual form.
 */
export function convertValue(raw: string | null | undefined): ConvertedValue {
  const si = (raw ?? "").trim();
  if (!si) return { si: "", imperial: null };
  for (const c of conversions) {
    const m = si.match(c.match);
    if (m) {
      const v = parseFloat(m[1]);
      if (!Number.isFinite(v)) continue;
      const out = c.toImperial(v, m);
      if (out) return { si, imperial: out };
    }
  }
  return { si, imperial: null };
}

/**
 * Inline-friendly format: `"65 MPa (9.4 ksi)"`. Falls back to the SI value
 * when no conversion is available so the call site stays trivial.
 */
export function formatDual(raw: string | null | undefined): string {
  const c = convertValue(raw);
  if (!c.si) return "—";
  if (!c.imperial) return c.si;
  return `${c.si} (${c.imperial})`;
}
