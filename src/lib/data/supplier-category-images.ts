import type { SupplierCategorySlug } from "./supplier-category-pages";

export type SupplierCategoryImage = {
  src: string;
  alt: string;
  credit: {
    title: string;
    creator: string;
    sourceUrl: string;
    license: string;
    licenseUrl: string;
  };
};

export const SUPPLIER_CATEGORY_IMAGES: Record<
  SupplierCategorySlug,
  SupplierCategoryImage
> = {
  "frp-grating": {
    src: "/images/product-types/frp-grating.webp",
    alt: "Yellow molded FRP grating panels on an industrial platform",
    credit: {
      title: "Fiberglass FRP Grating",
      creator: "Strongwell",
      sourceUrl: "https://www.flickr.com/photos/100605452@N08/14045915570",
      license: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    },
  },
  "pultruded-profiles": {
    src: "/images/product-types/pultruded-frp-profiles.webp",
    alt: "Yellow pultruded FRP structural profiles used for handrails and stairs",
    credit: {
      title: "FRP Handrail and Structural Members",
      creator: "Strongwell",
      sourceUrl: "https://www.flickr.com/photos/100605452@N08/14229226771",
      license: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    },
  },
  "fiberglass-sheet": {
    src: "/images/product-types/fiberglass-sheet.webp",
    alt: "Translucent GFRP fiberglass sheet panels in a pedestrian deck",
    credit: {
      title: "GFRP Translucent deck panels",
      creator: "Usuaris",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:GFRP_Translucent_deck_panels.jpg",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    },
  },
  "frp-rebar": {
    src: "/images/product-types/gfrp-rebar.webp",
    alt: "Glass fiber reinforced polymer rebar grid for concrete reinforcement",
    credit: {
      title: "GFRP rebar",
      creator: "Manop",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:GFRP_rebar.jpg",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
  },
  "frp-pipe": {
    src: "/images/product-types/frp-pipe.webp",
    alt: "Fiberglass reinforced plastic pipe with a flanged expansion joint",
    credit: {
      title: "Metal expansion joint on fiberglass piping",
      creator: "RomanM82",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Metal_expansion_joint_on_fiberglass_piping.jpg",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
  },
  "smc-bmc": {
    src: "/images/product-types/smc-bmc-molded-component.webp",
    alt: "Compression-molded composite automotive hood panel",
    credit: {
      title: "PAET-5 - Class A Compression-Molded Carbon Composite Hood",
      creator: "spe.automotive",
      sourceUrl: "https://www.flickr.com/photos/32775400@N06/29699060635",
      license: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    },
  },
  "resin-gelcoat": {
    src: "/images/product-types/resin-gelcoat.webp",
    alt: "Clear epoxy resin and hardener being mixed for composite production",
    credit: {
      title: "Mix of Epoxy Resin and Hardener",
      creator: "Dzhang2680",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Mix_of_Epoxy_Resin_and_Hardener.jpg",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    },
  },
  "fiber-glass": {
    src: "/images/product-types/glass-fiber-reinforcements.webp",
    alt: "Glass fiber reinforcements including chopped strand and woven fabrics",
    credit: {
      title: "Glass reinforcements",
      creator: "Cjp24",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Glass_reinforcements.jpg",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    },
  },
};
