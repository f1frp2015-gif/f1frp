import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { SupplierCategorySlug } from "@/lib/data/supplier-category-pages";
import { SUPPLIER_CATEGORY_IMAGES } from "@/lib/data/supplier-category-images";

export function SupplierCategoryCardImage({
  slug,
}: {
  slug: SupplierCategorySlug;
}) {
  const image = SUPPLIER_CATEGORY_IMAGES[slug];

  return (
    <div className="relative aspect-[8/5] overflow-hidden bg-[#e8eff1]">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) calc(50vw - 2rem), 270px"
        className="object-cover saturate-[0.82] transition duration-500 ease-out group-hover:scale-[1.025] group-hover:saturate-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071A2B]/25 via-transparent to-white/5" />
      <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-white/70 bg-white/90 text-[#071A2B] shadow-sm backdrop-blur-sm transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
        <ArrowUpRight size={15} aria-hidden />
      </span>
    </div>
  );
}
