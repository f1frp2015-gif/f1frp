import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { CURRENT_SITE_URL } from "@/lib/sites";

// One <PageBreadcrumbs /> serves both the BreadcrumbList JSON-LD that Google
// uses for SERP rich results / AI Overview citations AND the visible breadcrumb
// nav. Pages should pass an ordered list from root → current. The first item
// (Home) is injected automatically; callers only describe descendants.
//
// Schema follows https://schema.org/BreadcrumbList with absolute URLs because
// the spec recommends them and a few AI crawlers refuse relative ones.

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface Props {
  trail: BreadcrumbItem[];
  homeLabel?: string;
  className?: string;
}

export function PageBreadcrumbs({ trail, homeLabel = "Home", className }: Props) {
  const items: BreadcrumbItem[] = [{ label: homeLabel, href: "/" }, ...trail];

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      item: `${CURRENT_SITE_URL}${item.href === "/" ? "" : item.href}`,
    })),
  };

  return (
    <>
      <JsonLd data={schema} />
      <nav
        aria-label="Breadcrumb"
        className={
          className ??
          "mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        }
      >
        {items.map((item, idx) => {
          const last = idx === items.length - 1;
          return (
            <span key={`${item.href}-${idx}`} className="inline-flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight
                  size={11}
                  className="text-muted-foreground/50"
                  strokeWidth={2}
                />
              )}
              {last ? (
                <span className="text-foreground">{item.label}</span>
              ) : (
                <Link
                  href={item.href as never}
                  className="hover:text-foreground"
                >
                  {item.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
