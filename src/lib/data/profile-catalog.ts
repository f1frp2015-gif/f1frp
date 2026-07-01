// Catalog of standard pultruded FRP profile sizes = F1 Composite's REAL
// published product range, with REAL vendor-published mass per metre (米重) and
// grade EN 13706 E23, across all 5 shapes the mechanics engine supports
// (i-beam / channel / angle / square-tube / round-tube). Data source:
// f1composite.com standard-profiles product pages (published 米重 tables).
// Used by selectProfile() (reverse selection: "given span + load, which of OUR
// profiles passes?").
//
// DATA-INTEGRITY RULE (project_f1composite_pultruded_hub_seo): weightPerM is the
// vendor-published value and is authoritative for display / ranking. Section
// properties (Ix, Wx) are ALWAYS engine-computed by profile-mechanics and are a
// PRELIMINARY screen only — never presented as datasheet section properties.
// Mirrors f1composite's own "we deliberately do not publish back-calculated
// Ix/Sx" stance. F1 Composite is the named principal on getfrp, so publishing
// F1's own specs here is not an anonymization breach (that rule protects the
// upstream Chinese factories, not F1's own catalog).
//
// Dimensions in mm; F1 publishes a single wall/flange thickness t per size, so
// tw = tf = t. For square/round tube tf is unused (wall = tw); for round-tube
// h = b = outer diameter. For angle, tw = leg thickness (tf unused).

import type { ShapeId, MaterialKey } from "./profile-mechanics";

export type CatalogProfile = {
  id: string;
  shape: ShapeId;
  label: string; // human label, e.g. "I 200×100×10"
  h: number;
  b: number;
  tw: number;
  tf: number;
  /** F1-published mass per metre (kg/m). Authoritative — NOT engine-computed. */
  weightPerM?: number;
  /** Grade key into PROFILE_MATERIALS, e.g. "frp-e23". */
  grade?: MaterialKey;
  /** Provenance: real vendor data vs generic computed seed. */
  source?: "f1-published" | "seed-computed";
};

// F1 real published profile: single wall/flange thickness t → tw = tf = t; E23.
// For round-tube pass h = b = outer diameter.
const f1 = (shape: ShapeId, h: number, b: number, t: number, weightPerM: number, tag: string): CatalogProfile => ({
  id: `${shape}-${h}x${b}x${t}`,
  shape,
  label: tag,
  h,
  b,
  tw: t,
  tf: t,
  weightPerM,
  grade: "frp-e23",
  source: "f1-published",
});

export const SEED_PROFILE_CATALOG: CatalogProfile[] = [
  // ── I-beams — F1 published range + 米重, E23 ──
  f1("i-beam", 76, 38, 6.4, 1.2, "I 76×38×6.4"),
  f1("i-beam", 100, 50, 6, 1.6, "I 100×50×6"),
  f1("i-beam", 120, 60, 6, 2.0, "I 120×60×6"),
  f1("i-beam", 152, 76, 6.4, 2.9, "I 152×76×6.4"),
  f1("i-beam", 160, 80, 8, 3.6, "I 160×80×8"),
  f1("i-beam", 200, 100, 10, 5.8, "I 200×100×10"),
  f1("i-beam", 240, 120, 12, 8.4, "I 240×120×12"),
  f1("i-beam", 300, 150, 15, 13.5, "I 300×150×15"),
  f1("i-beam", 305, 305, 12.7, 16.0, "I 305×305×12.7"),

  // ── Channels (U) — F1 published range + 米重, E23 ──
  f1("channel", 38, 13, 4.8, 0.4, "U 38×13×4.8"),
  f1("channel", 50, 25, 5, 0.7, "U 50×25×5"),
  f1("channel", 76, 25, 6.4, 1.0, "U 76×25×6.4"),
  f1("channel", 76, 38, 6.4, 1.4, "U 76×38×6.4"),
  f1("channel", 100, 30, 6, 1.5, "U 100×30×6"),
  f1("channel", 100, 50, 6, 1.8, "U 100×50×6"),
  f1("channel", 120, 50, 6, 2.0, "U 120×50×6"),
  f1("channel", 150, 40, 6, 2.1, "U 150×40×6"),
  f1("channel", 152, 43, 6.4, 2.2, "U 152×43×6.4"),
  f1("channel", 152, 43, 9.5, 3.2, "U 152×43×9.5"),
  f1("channel", 160, 48, 8, 3.0, "U 160×48×8"),
  f1("channel", 200, 60, 8, 3.8, "U 200×60×8"),
  f1("channel", 200, 60, 10, 4.6, "U 200×60×10"),
  f1("channel", 240, 72, 8, 4.6, "U 240×72×8"),
  f1("channel", 240, 72, 12, 6.8, "U 240×72×12"),
  f1("channel", 254, 76, 9.5, 5.6, "U 254×76×9.5"),
  f1("channel", 300, 90, 15, 10.4, "U 300×90×15"),
  f1("channel", 305, 89, 12.7, 8.8, "U 305×89×12.7"),
  f1("channel", 360, 108, 18, 15.0, "U 360×108×18"),

  // ── Angles (L, equal-leg) — F1 published range + 米重, E23 ──
  f1("angle", 25, 25, 3.2, 0.3, "L 25×25×3.2"),
  f1("angle", 30, 30, 4, 0.4, "L 30×30×4"),
  f1("angle", 38, 38, 4.8, 0.5, "L 38×38×4.8"),
  f1("angle", 50, 50, 5, 0.8, "L 50×50×5"),
  f1("angle", 50, 50, 6, 0.9, "L 50×50×6"),
  f1("angle", 50, 50, 8, 1.2, "L 50×50×8"),
  f1("angle", 65, 65, 6, 1.2, "L 65×65×6"),
  f1("angle", 75, 75, 6, 1.4, "L 75×75×6"),
  f1("angle", 75, 75, 8, 1.8, "L 75×75×8"),
  f1("angle", 76, 76, 6.4, 1.5, "L 76×76×6.4"),
  f1("angle", 100, 100, 8, 2.5, "L 100×100×8"),
  f1("angle", 100, 100, 10, 3.0, "L 100×100×10"),
  f1("angle", 102, 102, 9.5, 3.0, "L 102×102×9.5"),
  f1("angle", 150, 150, 12, 5.6, "L 150×150×12"),
  f1("angle", 152, 152, 12.7, 6.0, "L 152×152×12.7"),

  // ── Square / rectangular tube (SHS/RHS) — F1 published range + 米重, E23 ──
  f1("square-tube", 25, 25, 3.2, 0.4, "SHS 25×25×3.2"),
  f1("square-tube", 38, 38, 4.8, 0.9, "SHS 38×38×4.8"),
  f1("square-tube", 40, 20, 7, 1.0, "RHS 40×20×7"),
  f1("square-tube", 40, 25, 8, 1.2, "RHS 40×25×8"),
  f1("square-tube", 50, 50, 5, 1.4, "SHS 50×50×5"),
  f1("square-tube", 60, 60, 5, 1.7, "SHS 60×60×5"),
  f1("square-tube", 75, 75, 6, 2.5, "SHS 75×75×6"),
  f1("square-tube", 80, 60, 5, 2.0, "RHS 80×60×5"),
  f1("square-tube", 100, 100, 6, 3.5, "SHS 100×100×6"),
  f1("square-tube", 100, 100, 8, 4.5, "SHS 100×100×8"),
  f1("square-tube", 100, 60, 8, 3.6, "RHS 100×60×8"),
  f1("square-tube", 114, 114, 6, 4.0, "SHS 114×114×6"),
  f1("square-tube", 114, 114, 8, 5.2, "SHS 114×114×8"),
  f1("square-tube", 120, 120, 8, 5.6, "SHS 120×120×8"),
  f1("square-tube", 120, 60, 5, 2.6, "RHS 120×60×5"),
  f1("square-tube", 132, 132, 9.5, 7.0, "SHS 132×132×9.5"),
  f1("square-tube", 152, 152, 9.5, 8.2, "SHS 152×152×9.5"),
  f1("square-tube", 160, 160, 8, 7.4, "SHS 160×160×8"),
  f1("square-tube", 200, 200, 10, 11.6, "SHS 200×200×10"),
  f1("square-tube", 240, 240, 12, 16.8, "SHS 240×240×12"),

  // ── Round tube (CHS) — F1 published range + 米重, E23 (h = b = OD) ──
  f1("round-tube", 25, 25, 3, 0.3, "CHS 25×3"),
  f1("round-tube", 32, 32, 3, 0.4, "CHS 32×3"),
  f1("round-tube", 38, 38, 3.2, 0.5, "CHS 38×3.2"),
  f1("round-tube", 42, 42, 4, 0.7, "CHS 42×4"),
  f1("round-tube", 50, 50, 4, 0.9, "CHS 50×4"),
  f1("round-tube", 50, 50, 5, 1.1, "CHS 50×5"),
  f1("round-tube", 60, 60, 5, 1.3, "CHS 60×5"),
  f1("round-tube", 63.5, 63.5, 6.4, 1.7, "CHS 63.5×6.4"),
  f1("round-tube", 70, 70, 5, 1.6, "CHS 70×5"),
  f1("round-tube", 76, 76, 6.4, 2.1, "CHS 76×6.4"),
  f1("round-tube", 80, 80, 5, 1.8, "CHS 80×5"),
  f1("round-tube", 80, 80, 7, 2.5, "CHS 80×7"),
  f1("round-tube", 89, 89, 6.4, 2.5, "CHS 89×6.4"),
  f1("round-tube", 100, 100, 6, 2.7, "CHS 100×6"),
  f1("round-tube", 114, 114, 6.4, 3.3, "CHS 114×6.4"),
  f1("round-tube", 127, 127, 6.4, 3.7, "CHS 127×6.4"),
  f1("round-tube", 150, 150, 8, 5.4, "CHS 150×8"),
];
