// Catalog of standard pultruded FRP profile sizes, used by selectProfile()
// (reverse selection: "given span + load, which of OUR profiles passes?").
//
// I-BEAM family = F1 Composite's REAL published product range, with REAL
// vendor-published mass per metre (米重) and grade EN 13706 E23. The remaining
// shapes are still a SEED list (common standard pultruded sizes; geometry is
// factual, mass is engine-computed) pending ingestion of f1's real weight
// tables for those shapes — flagged source: "seed-computed".
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
// Dimensions in mm. For square-tube/round-tube tf is unused (wall = tw; for
// round-tube h = outer diameter). For angle, tw = leg thickness (tf unused).

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

const mk = (shape: ShapeId, h: number, b: number, tw: number, tf: number, tag: string): CatalogProfile => ({
  id: `${shape}-${h}x${b}x${tw}${shape === "i-beam" || shape === "channel" ? `x${tf}` : ""}`,
  shape,
  label: tag,
  h,
  b,
  tw,
  tf,
  source: "seed-computed",
});

// F1 real published I-beam: single wall thickness t → tw = tf = t; grade E23.
const f1i = (h: number, b: number, t: number, weightPerM: number, tag: string): CatalogProfile => ({
  id: `i-beam-${h}x${b}x${t}`,
  shape: "i-beam",
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
  // ── I-beams — F1 Composite REAL published range + REAL published 米重, E23 ──
  f1i(76, 38, 6.4, 1.2, "I 76×38×6.4"),
  f1i(100, 50, 6, 1.6, "I 100×50×6"),
  f1i(120, 60, 6, 2.0, "I 120×60×6"),
  f1i(152, 76, 6.4, 2.9, "I 152×76×6.4"),
  f1i(160, 80, 8, 3.6, "I 160×80×8"),
  f1i(200, 100, 10, 5.8, "I 200×100×10"),
  f1i(240, 120, 12, 8.4, "I 240×120×12"),
  f1i(300, 150, 15, 13.5, "I 300×150×15"),
  f1i(305, 305, 12.7, 16.0, "I 305×305×12.7"),

  // ── Channels — SEED (computed) · pending F1 real weight table ──
  mk("channel", 76, 38, 6.4, 6.4, "C 76×38×6.4"),
  mk("channel", 102, 50, 6.4, 6.4, "C 102×50×6.4"),
  mk("channel", 152, 43, 6.4, 6.4, "C 152×43×6.4"),
  mk("channel", 203, 56, 9.5, 9.5, "C 203×56×9.5"),
  // ── Angles — SEED (computed) · pending F1 real weight table ──
  mk("angle", 51, 51, 6.4, 6.4, "L 51×51×6.4"),
  mk("angle", 76, 76, 6.4, 6.4, "L 76×76×6.4"),
  mk("angle", 102, 102, 9.5, 9.5, "L 102×102×9.5"),
  mk("angle", 152, 152, 9.5, 9.5, "L 152×152×9.5"),
  // ── Square / rectangular tube — SEED (computed) ──
  mk("square-tube", 50, 50, 5, 5, "SHS 50×50×5"),
  mk("square-tube", 75, 75, 6, 6, "SHS 75×75×6"),
  mk("square-tube", 100, 100, 6, 6, "SHS 100×100×6"),
  mk("square-tube", 100, 50, 6, 6, "RHS 100×50×6"),
  mk("square-tube", 150, 150, 8, 8, "SHS 150×150×8"),
  // ── Round tube — SEED (computed) ──
  mk("round-tube", 75, 75, 6, 6, "RND ⌀75×6"),
  mk("round-tube", 100, 100, 6, 6, "RND ⌀100×6"),
];
