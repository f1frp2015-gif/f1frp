import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Supplier detail pages are CLOSED.
//
// getfrp.com (en / overseas) previously rendered a full per-factory profile
// (name, address, Organization JSON-LD, products, certs) and pre-rendered the
// top-200 at build — that hands overseas buyers a resolvable factory identity
// and disintermediates the F1 sourcing desk. f1frp.com (zh) already 404'd this
// route. So the page now 404s on EVERY host; the network is presented in
// aggregate (anonymized) at /suppliers, and AI feasibility matching is
// anonymized in lib/ai/tools/feasibility-match. f1frp.com behaviour is
// unchanged (it was, and remains, a 404).

export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export function generateMetadata(): Metadata {
  return { robots: { index: false, follow: false } };
}

export default function SupplierDetailClosed() {
  notFound();
}
