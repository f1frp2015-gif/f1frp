import { convertValue } from "@/lib/units";

/**
 * Inline display for a SI property string with the Imperial equivalent
 * shown in muted text alongside. Server-renderable; no client state.
 *
 * Example:
 *   <DualUnit value="65 MPa" />
 *   →  "65 MPa  ·  9.4 ksi"
 *
 * If the unit isn't in the conversion table, falls back to the original.
 */
export function DualUnit({
  value,
  separator = "·",
  className,
}: {
  value: string | null | undefined;
  separator?: string;
  className?: string;
}) {
  const c = convertValue(value);
  if (!c.si) return <span className={className}>—</span>;
  if (!c.imperial) return <span className={className}>{c.si}</span>;
  return (
    <span className={className}>
      <span>{c.si}</span>
      <span className="mx-1.5 text-muted-foreground/60">{separator}</span>
      <span className="text-muted-foreground">{c.imperial}</span>
    </span>
  );
}
