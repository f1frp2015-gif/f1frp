// Rotating query pool for daily ingestion cron.
// Each entry: keyword → target category. The cron rotates based on day-of-year
// so the same topic doesn't repeat for ~2 weeks.

export type QueryEntry = {
  query: string;
  category: string; // papers category id
  patentCategory?: string; // patents category id (optional)
};

export const paperQueryPool: QueryEntry[] = [
  { query: "carbon fiber reinforced polymer fatigue", category: "durability" },
  { query: "glass fiber recycling composite", category: "recycling" },
  { query: "pultrusion process FRP", category: "process" },
  { query: "vacuum assisted resin transfer molding", category: "process" },
  { query: "basalt fiber composite mechanical", category: "fiber" },
  { query: "aramid fiber reinforced polymer", category: "fiber" },
  { query: "epoxy resin bio-based composite", category: "matrix" },
  { query: "vinyl ester corrosion durability", category: "matrix" },
  { query: "FRP pipe joint strength", category: "application" },
  { query: "wind turbine blade composite", category: "application" },
  { query: "aerospace composite honeycomb sandwich", category: "application" },
  { query: "composite hydrogen storage tank", category: "application" },
  { query: "Hashin failure criterion composite", category: "mechanics" },
  { query: "delamination mode II composite", category: "mechanics" },
  { query: "interlaminar shear strength test", category: "mechanics" },
  { query: "hygrothermal aging polymer composite", category: "durability" },
  { query: "3D printing continuous fiber composite", category: "process" },
  { query: "automated fiber placement", category: "process" },
  { query: "nano clay polymer composite", category: "matrix" },
  { query: "graphene carbon nanotube composite", category: "matrix" },
  { query: "bridge deck FRP structural", category: "application" },
  { query: "civil engineering FRP retrofit", category: "application" },
  { query: "thermoplastic composite welding", category: "process" },
  { query: "resin infusion simulation darcy", category: "process" },
];

export const patentQueryPool: QueryEntry[] = [
  { query: "fiber reinforced polymer recycling", category: "recycling", patentCategory: "recycling" },
  { query: "pultrusion die heating", category: "process", patentCategory: "process" },
  { query: "composite wind blade manufacturing", category: "process", patentCategory: "process" },
  { query: "carbon fiber sizing treatment", category: "fiber", patentCategory: "fiber" },
  { query: "epoxy resin composition composite", category: "matrix", patentCategory: "resin" },
  { query: "vinyl ester resin formulation", category: "matrix", patentCategory: "resin" },
  { query: "GFRP pipe coupling", category: "application", patentCategory: "product" },
  { query: "composite hydrogen vessel winding", category: "application", patentCategory: "application" },
  { query: "automotive composite body panel", category: "application", patentCategory: "application" },
  { query: "composite rebar reinforcement", category: "application", patentCategory: "product" },
  { query: "resin transfer molding apparatus", category: "process", patentCategory: "process" },
  { query: "fiber placement machine", category: "process", patentCategory: "process" },
  { query: "thermoplastic composite consolidation", category: "process", patentCategory: "process" },
  { query: "composite aircraft structure", category: "application", patentCategory: "application" },
];

export function pickForDay<T extends QueryEntry>(
  pool: T[],
  day: Date = new Date()
): T {
  // Use UTC day-of-year so rotation is deterministic per calendar day.
  const start = Date.UTC(day.getUTCFullYear(), 0, 0);
  const doy = Math.floor((day.getTime() - start) / 86_400_000);
  return pool[doy % pool.length];
}
