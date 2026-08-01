export type SupplierCategorySlug =
  | "frp-grating"
  | "pultruded-profiles"
  | "fiberglass-sheet"
  | "frp-rebar"
  | "frp-pipe"
  | "smc-bmc"
  | "resin-gelcoat"
  | "fiber-glass";

export type SupplierCategoryPage = {
  slug: SupplierCategorySlug;
  name: string;
  shortName: string;
  summary: string;
  overview: string[];
  match: {
    businessTypes: string[];
    keywords: string[];
  };
  specifications: Array<{
    field: string;
    typicalRange: string;
    sourcingNote: string;
  }>;
  buyingChecks: string[];
  provinceNotes: Record<string, string>;
  faqs: Array<{ question: string; answer: string }>;
};

export const SUPPLIER_CATEGORY_PAGES: SupplierCategoryPage[] = [
  {
    slug: "frp-grating",
    name: "FRP Grating",
    shortName: "FRP Grating",
    summary:
      "Compare Chinese manufacturers of molded and pultruded FRP grating by resin system, panel geometry, fire performance, public company profile and production cluster.",
    overview: [
      "China’s FRP grating supply base covers molded panels, pultruded load-bearing panels, stair treads, trench covers and custom-cut assemblies. The first sourcing decision is not factory size but service condition: orthophthalic polyester is common for general industrial walkways, isophthalic systems improve chemical resistance, vinyl ester is selected for aggressive process environments, and phenolic systems are considered when smoke and flame performance dominate. A useful RFQ therefore names the resin family, load case, support span, surface treatment and destination standard instead of asking only for a panel price.",
      "Export-ready factories differ most in their control of glass content, cure, bar geometry, dimensional tolerance and traceability. For molded grating, buyers should confirm mesh pattern, overall depth, load-bar thickness and whether the quoted size is the nominal mold size or the finished cut panel. For pultruded grating, confirm bearing-bar pitch, cross-rod construction and the test basis for published load tables. CE documents, ISO 9001 certificates and test reports should always be checked for the legal entity, product scope and validity date rather than accepted as logo files.",
      "GetFRP exposes public company profiles and capability evidence for first-pass comparison. A procurement team can compare documented process, relevant certifications, production region, scale tier and the ability to supply the requested resin and surface before contacting a factory. Once the specification is stable, the sourcing desk can request matched samples, confirm current test evidence and arrange pre-shipment inspection against the same acceptance criteria used in the RFQ.",
    ],
    match: {
      businessTypes: ["manufacturer"],
      keywords: ["grating", "gratings", "grid", "stair tread", "trench cover"],
    },
    specifications: [
      { field: "Process", typicalRange: "Molded or pultruded", sourcingNote: "Do not treat the two constructions as interchangeable in structural checks." },
      { field: "Panel depth", typicalRange: "25 / 30 / 38 / 50 mm", sourcingNote: "Confirm finished depth, tolerance and support span." },
      { field: "Mesh", typicalRange: "38 × 38 mm and micro-mesh options", sourcingNote: "State clear opening and accessibility requirement." },
      { field: "Resin", typicalRange: "Ortho / iso / vinyl ester / phenolic", sourcingNote: "Match the resin to chemical and fire exposure." },
      { field: "Surface", typicalRange: "Concave / grit / covered / conductive", sourcingNote: "Specify slip, cleaning and static-control needs." },
      { field: "Evidence", typicalRange: "Load table, fire report, resin certificate, MTC", sourcingNote: "Require report numbers and scope before approval." },
    ],
    buyingChecks: [
      "Recalculate the design load on the actual support span; do not select a panel from an unsupported catalogue headline.",
      "Check whether the fire report covers the offered resin, construction, thickness and surface rather than a related product family.",
      "Freeze the cut plan, sealed edges, clips and panel orientation before final pricing because fabrication changes yield and packing.",
      "Use an approved colour and grit sample, then define acceptable exposed fibre, resin-rich area, chip and surface-repair limits.",
      "Inspect packing height, corner protection and moisture barrier so nested panels do not abrade or distort during ocean transit.",
    ],
    provinceNotes: {
      Jiangsu: "Dense export-oriented grating and pultrusion capacity with broad finishing options.",
      Shandong: "Strong industrial FRP fabrication base and competitive volume production.",
      Hebei: "Established molded-grating and anti-corrosion equipment cluster.",
      Guangdong: "Useful for South China consolidation and custom fabrication.",
      Zhejiang: "Mixed profile, grating and engineered-component capability.",
    },
    faqs: [
      {
        question: "Does EN 13706 certify FRP grating fire performance?",
        answer:
          "No. EN 13706 is a specification for pultruded profiles and includes designation, test methods and mechanical property classes. It is not a universal fire classification for grating. Ask for the product-specific fire or smoke report required by the project, identify the tested resin and construction, and verify that the reported specimen represents the offered panel.",
      },
      {
        question: "Should I buy molded or pultruded FRP grating?",
        answer:
          "Molded grating provides two-directional continuity, flexible cutting and broad corrosion-resistant resin choices. Pultruded grating is usually selected when high unidirectional stiffness, longer spans or repeatable load-bar geometry matter. The correct choice depends on span, load, cut-outs, chemical exposure and deflection limit—not headline price per square metre.",
      },
      {
        question: "What should a China FRP grating RFQ include?",
        answer:
          "Include process type, panel and mesh dimensions, resin, colour, surface, design load, support span, deflection limit, fire or smoke requirement, cut plan, clips, quantity, packaging, destination and Incoterm. Ask the supplier to identify deviations explicitly and attach current test evidence.",
      },
      {
        question: "How does getfrp verify a grating supplier?",
        answer:
          "The shortlist is screened for legal identity, manufacturing process, relevant product capability, certification scope, scale tier and export readiness. Before an order, documents are rechecked for validity and the inspection plan is tied to the approved specification, sample and acceptance criteria.",
      },
    ],
  },
  {
    slug: "pultruded-profiles",
    name: "Pultruded FRP Profiles",
    shortName: "Pultruded Profiles",
    summary:
      "Source standard and custom pultruded FRP structural profiles from Chinese manufacturers with published resin, reinforcement, tolerance and EN 13706 capability evidence.",
    overview: [
      "China’s pultrusion network supplies angles, channels, I-beams, square and round tubes, rods, flat strips, ladders, cable-tray components, window profiles and custom constant-section shapes. Standard catalogue profiles can reduce tooling time, but structural procurement still requires a section drawing, laminate description and design basis. Two profiles with the same outside dimensions can have materially different stiffness, strength and durability because glass architecture, veil, resin system, fibre fraction and wall build-up are different.",
      "EN 13706 is a useful reference for European structural profiles, especially its designation, test methods and E17 or E23 property classes, but it does not replace project engineering. North American projects may instead call up ASTM test methods and project-specific allowable values. Buyers should request longitudinal and transverse properties, coupon orientation, conditioning, batch traceability and the exact report behind any published table. Dimensional tolerance and straightness also deserve a separate acceptance table, particularly for long lengths and assemblies.",
      "A capable supplier match considers die availability, maximum pulling force, heated-die control, inline cutting, secondary machining, surface veil, packing length and the ability to hold colour between production runs. GetFRP presents those signals alongside public company profiles so buyers can compare capabilities before opening a commercial conversation. The objective is to avoid paying for new tooling when a compatible die exists, while also avoiding the opposite mistake: forcing a critical section into a catalogue profile that cannot meet deflection, connection or corrosion requirements.",
    ],
    match: {
      businessTypes: ["manufacturer"],
      keywords: ["pultruded", "pultrusion", "profile", "profiles", "frp rod", "frp tube", "cable tray"],
    },
    specifications: [
      { field: "Common sections", typicalRange: "Angle / channel / I-beam / tube / rod / flat", sourcingNote: "Attach a dimensioned drawing and revision." },
      { field: "Resin", typicalRange: "Polyester / vinyl ester / epoxy / polyurethane", sourcingNote: "State exposure, temperature and flame requirement." },
      { field: "Reinforcement", typicalRange: "Roving + continuous mat + surface veil", sourcingNote: "Request laminate architecture and fibre fraction." },
      { field: "Property class", typicalRange: "EN 13706 E17 / E23 or project allowables", sourcingNote: "Verify the actual test report and specimen direction." },
      { field: "Tolerance", typicalRange: "Project table or ASTM D3917 reference", sourcingNote: "Include bow, twist, wall and cut-length limits." },
      { field: "Finishing", typicalRange: "Cut / drill / CNC / bonded or bolted assemblies", sourcingNote: "Define edge sealing and hole quality." },
    ],
    buyingChecks: [
      "Run the member calculation with supplier-specific longitudinal and transverse properties; generic FRP values are not design allowables.",
      "Confirm whether the die already exists, who owns any new tooling and how revision changes will be controlled after approval.",
      "Set measurable bow, twist, wall, angle and cut-length tolerances for each section rather than citing “industry standard.”",
      "Tie every mechanical report to profile geometry, laminate, test direction and production site before claiming EN 13706 performance.",
      "Design the bundle around the longest profile, unloading equipment and container support points to prevent permanent transit bow.",
    ],
    provinceNotes: {
      Jiangsu: "Broad standard-profile catalogues, custom dies and export documentation.",
      Shandong: "Competitive structural, ladder and industrial profile production.",
      Zhejiang: "Strong engineered profiles, window systems and precision finishing.",
      Hebei: "Industrial profiles, cable support and corrosion-resistant systems.",
      Guangdong: "Custom secondary machining and South China export consolidation.",
    },
    faqs: [
      {
        question: "What do EN 13706 E17 and E23 mean?",
        answer:
          "They are mechanical property classes defined for pultruded profiles under EN 13706-3. E23 carries higher minimum property requirements than E17. A supplier should identify the tested profile, laminate and laboratory evidence; a certificate logo alone does not prove that every offered geometry meets the class.",
      },
      {
        question: "Can a Chinese factory use my existing CAD drawing?",
        answer:
          "Yes, but an RFQ should also define material system, reinforcement intent, critical tolerances, surface, cut length, holes, annual volume and the governing acceptance tests. The factory will then assess die design, pulling stability and secondary operations. Freeze the drawing revision before tooling approval.",
      },
      {
        question: "How should pultruded FRP profiles be checked before shipment?",
        answer:
          "Use a dimensional sampling plan plus visual, hardness and documentation checks. Critical projects may add coupon tests for tensile, flexural or short-beam properties. Inspection should cover straightness, twist, cracks, exposed fibres, colour, cut ends, hole quality, packing protection and traceability to the production batch.",
      },
      {
        question: "Why do quotations for the same profile vary so much?",
        answer:
          "Price changes with resin, glass architecture, fibre content, veil, flame-retardant package, colour, tolerance, line speed, die ownership, machining, length and packing density. Compare a controlled specification and landed quantity, not only price per kilogram.",
      },
    ],
  },
  {
    slug: "fiberglass-sheet",
    name: "Fiberglass Sheet",
    shortName: "Fiberglass Sheet",
    summary:
      "Compare China fiberglass sheet, laminate and FRP panel manufacturers for electrical, structural, corrosion-resistant and architectural applications.",
    overview: [
      "Fiberglass sheet is not one uniform product family. Chinese suppliers produce hand-laminated plate, pultruded flat sheet, continuous-laminated panel, compression-moulded sheet, insulation laminate and sandwich panel. Each route produces a different balance of thickness tolerance, fibre orientation, surface quality, electrical behaviour and production volume. The RFQ should therefore name the manufacturing route or required properties instead of using only the phrase “fiberglass sheet.”",
      "Electrical laminates are commonly controlled through dielectric, flame and thermal requirements, while structural or corrosion panels are driven by resin, glass content, flexural performance and environmental exposure. Architectural panels add colour, UV stability, translucency and finish consistency. Buyers should confirm whether published values are typical or minimum, how specimens were conditioned, and whether the offered sheet is made continuously or cut from a larger moulded panel.",
      "GetFRP matches the request against public network records for process, material, thickness range, finishing and export evidence. Engineering teams can open the company profile, review the published capability evidence and then contact the factory or submit one controlled RFQ. The final shortlist can be validated with a sample, measurement report, certificate set and packaging trial—important because flatness and corner damage often create more installation loss than the nominal sheet price suggests.",
    ],
    match: {
      businessTypes: ["manufacturer"],
      keywords: ["sheet", "sheets", "panel", "panels", "laminate", "plate", "flat sheet"],
    },
    specifications: [
      { field: "Construction", typicalRange: "Solid laminate / pultruded / continuous panel / sandwich", sourcingNote: "Name the process or required property set." },
      { field: "Thickness", typicalRange: "Typically 0.8–50 mm by product family", sourcingNote: "Set average and local tolerance." },
      { field: "Resin", typicalRange: "Polyester / vinyl ester / epoxy / phenolic", sourcingNote: "Match corrosion, electrical and fire needs." },
      { field: "Surface", typicalRange: "Smooth / textured / gelcoated / UV film / veil", sourcingNote: "Approve colour and gloss on a master sample." },
      { field: "Fabrication", typicalRange: "Cut / drill / CNC / bonded sandwich", sourcingNote: "Define edge quality and protective film." },
      { field: "Packing", typicalRange: "Flat crate, pallet or protected bundle", sourcingNote: "Control bow, moisture and corner impact." },
    ],
    buyingChecks: [
      "Identify whether sheet properties are isotropic, machine-direction dominated or based on a different laminate construction.",
      "Agree a flatness measurement fixture and conditioning period so buyer and factory use the same acceptance method.",
      "Approve colour, gloss, texture, protective film and visible-defect limits on a signed master panel under controlled lighting.",
      "Include nesting, kerf and edge-finish requirements when buying CNC-cut parts; quoted sheet yield can materially change unit cost.",
      "Use rigid flat packing with protected corners and lifting instructions, especially for thin panels and high-gloss surfaces.",
    ],
    provinceNotes: {
      Jiangsu: "Diverse sheet, panel, laminate and industrial fabrication capability.",
      Zhejiang: "Precision laminates and engineered panel systems.",
      Guangdong: "Electrical and architectural sheet supply with export consolidation.",
      Shandong: "Competitive industrial panels and moulded sheet production.",
      Hebei: "Corrosion-resistant plate and general FRP fabrication.",
    },
    faqs: [
      {
        question: "What is the difference between FRP sheet and fiberglass laminate?",
        answer:
          "The terms overlap, but “laminate” usually emphasises a controlled stack of reinforcement and resin, while “sheet” may describe several continuous, pultruded or moulded products. Always compare the manufacturing process, reinforcement orientation, resin and property table rather than relying on the name.",
      },
      {
        question: "How do I specify flatness and thickness tolerance?",
        answer:
          "State the measuring method, gauge locations, conditioning, maximum local variation and full-panel flatness over a defined support. For machined components, identify critical datum surfaces. A single nominal thickness without an inspection method is not enough for acceptance.",
      },
      {
        question: "Can fiberglass sheet be supplied with fire certification?",
        answer:
          "Yes, but the report must match the offered resin, reinforcement, thickness, surface and test method. Fire behaviour can change with thickness, pigment, gelcoat and filler. Ask for the complete current report and confirm that your project accepts that classification.",
      },
      {
        question: "What sample should I approve before mass production?",
        answer:
          "Approve a representative full-width or agreed-size panel with colour, gloss, texture, thickness, flatness, edge condition and key test results recorded. Keep a signed master sample and reference its revision in the purchase order and PSI checklist.",
      },
    ],
  },
  {
    slug: "frp-rebar",
    name: "FRP Rebar",
    shortName: "FRP Rebar",
    summary:
      "Find Chinese GFRP and BFRP rebar manufacturers by bar diameter, surface, tensile evidence, ACI 440 test basis, capacity and export readiness.",
    overview: [
      "China supplies glass- and basalt-fibre composite reinforcement for bridges, seawalls, tunnels, slabs, magnetic-sensitive facilities and corrosion-prone concrete. FRP rebar is anisotropic and does not yield like steel, so procurement cannot be separated from design assumptions. The RFQ should identify fibre type, nominal diameter, guaranteed tensile property, modulus, bond surface, bend or straight-bar requirement, design code and whether values are minimum, characteristic or typical.",
      "Surface geometry is central to bond performance. Sand-coated, helically wrapped, ribbed and hybrid surfaces can behave differently even at the same diameter. Buyers should request the bar-area definition, test method, grip system, free length, failure mode and laboratory accreditation behind tensile claims. For bent bars or stirrups, confirm whether bends are moulded during manufacture; field bending thermoset FRP rebar is generally not treated like bending steel.",
      "Cost comparison should consider installed life rather than replacing steel tonnes one-for-one. FRP is lighter and corrosion resistant, but design ratios, lap lengths, handling rules and code familiarity affect project economics. GetFRP lets buyers review public manufacturing and test capability before contacting a supplier, then coordinates samples and current evidence when sourcing support is requested. This keeps early comparison focused on engineering fitness rather than a misleading price-per-tonne ranking.",
    ],
    match: {
      businessTypes: ["manufacturer"],
      keywords: ["rebar", "reinforcing bar", "composite bar", "gfrp bar", "bfrp bar"],
    },
    specifications: [
      { field: "Fibre", typicalRange: "E-glass / ECR-glass / basalt / carbon", sourcingNote: "State the exact reinforcement family." },
      { field: "Diameter", typicalRange: "Common nominal sizes about 6–32 mm", sourcingNote: "Define nominal area and tolerance method." },
      { field: "Surface", typicalRange: "Sand-coated / wrapped / ribbed", sourcingNote: "Tie bond evidence to the offered surface." },
      { field: "Tensile basis", typicalRange: "ASTM D7205 or project method", sourcingNote: "Request minimum value, modulus and failure mode." },
      { field: "Form", typicalRange: "Straight lengths / coils / factory-formed bends", sourcingNote: "Set coil diameter and straightness limits." },
      { field: "Traceability", typicalRange: "Batch ID, fibre/resin records, test certificate", sourcingNote: "Link every shipment to the approved test basis." },
    ],
    buyingChecks: [
      "Confirm the design code, bar-area definition and guaranteed property basis with the project engineer before requesting quotes.",
      "Require the tensile report to state grip system, free length, modulus method, failure location and specimen batch.",
      "Approve the surface geometry and bond evidence for the exact diameter because coating and wrap pattern affect development length.",
      "Issue bent-bar geometry before production and prohibit unapproved site bending, heating or straightening in handling instructions.",
      "Specify coil diameter, bundle support, UV protection and identification so lightweight bars arrive straight and traceable.",
    ],
    provinceNotes: {
      Jiangsu: "Pultrusion know-how and export-oriented composite reinforcement capacity.",
      Shandong: "Competitive high-volume bar and civil-infrastructure supply.",
      Hebei: "Construction-products cluster with broad domestic project experience.",
      Zhejiang: "Engineered composite reinforcement and precision processing.",
      Guangdong: "South China project support and export consolidation.",
    },
    faqs: [
      {
        question: "Which ACI 440 document applies to FRP rebar?",
        answer:
          "The ACI 440 family covers design, construction and qualification topics for FRP reinforcement, but the applicable document and edition depend on project jurisdiction and structure type. Procurement should follow the engineer’s design basis and pair it with an accepted bar test method such as ASTM D7205 where specified.",
      },
      {
        question: "Is FRP rebar cheaper than steel rebar?",
        answer:
          "Not necessarily on material price per unit, and tonnes are a poor comparison because density and design behaviour differ. FRP may reduce transport, handling and corrosion-life costs, but required reinforcement ratio, lap length, detailing and local code approval determine installed value.",
      },
      {
        question: "Can GFRP rebar be bent on site?",
        answer:
          "Thermoset GFRP bars should not be assumed to bend like steel. Bends are normally manufactured to the required geometry under a controlled process. Give the supplier a bar-bending schedule and minimum radius, then approve geometry and properties before production.",
      },
      {
        question: "What evidence should accompany an FRP rebar quote?",
        answer:
          "Ask for bar geometry, fibre and resin declaration, tensile strength and modulus, bond or pull-out evidence where required, test methods, laboratory identity, batch traceability, production capacity and packaging method. Separate current product evidence from general company certificates.",
      },
    ],
  },
  {
    slug: "frp-pipe",
    name: "FRP Pipe",
    shortName: "FRP Pipe",
    summary:
      "Compare Chinese FRP and GRP pipe factories for filament-wound, centrifugal-cast and custom piping systems by pressure, stiffness, liner and standards.",
    overview: [
      "Chinese FRP pipe manufacturers cover water transmission, sewer, chemical process, seawater, flue-gas and industrial duct applications. Filament winding is common for pressure and chemical systems, while other processes serve drainage and special geometries. Diameter alone is not a sufficient buying specification: pressure class, ring stiffness, vacuum, temperature, chemical media, liner, burial condition, joint type and design life must be considered together.",
      "Relevant standards may include ASTM D2992 and D2996, ISO 10928, EN 1796, EN 14364, GB/T 21238 and project-specific piping codes. These documents are not automatically equivalent. A supplier should state the design basis, regression data, laminate sequence and safety factors behind a proposed class. Chemical service also requires confirmation of the corrosion barrier, resin manufacturer guidance and any temperature derating.",
      "GetFRP screens the public network for process, diameter range, winding control, joint capability, testing equipment and documented export experience. Buyers can inspect company profiles first and use a controlled RFQ once the engineering scope is coherent. For orders, inspection can cover dimensions, hardness, visual condition, hydrostatic testing where applicable, laminate records, fittings, trial assembly, packing saddles and marking so that pipe arriving at site can be traced to the accepted design.",
    ],
    match: {
      businessTypes: ["manufacturer"],
      keywords: ["frp pipe", "grp pipe", "pipes", "piping", "filament wound pipe", "duct"],
    },
    specifications: [
      { field: "Service", typicalRange: "Water / sewer / chemical / seawater / FGD", sourcingNote: "Provide fluid, concentration and temperature." },
      { field: "Design class", typicalRange: "Pressure, stiffness, vacuum and burial case", sourcingNote: "State transient loads and design life." },
      { field: "Construction", typicalRange: "Liner + structural wall + exterior layer", sourcingNote: "Request laminate sequence and resin system." },
      { field: "Joint", typicalRange: "Bell-spigot / butt-wrap / flange / mechanical", sourcingNote: "Include site method and gasket requirements." },
      { field: "Standards", typicalRange: "ASTM / ISO / EN / GB / project code", sourcingNote: "Define the governing edition and hierarchy." },
      { field: "Testing", typicalRange: "Hydrostatic / stiffness / hardness / visual / dimensions", sourcingNote: "Agree witness points before production." },
    ],
    buyingChecks: [
      "Issue a process datasheet covering fluid, concentration, normal and upset temperature, pressure, vacuum and design life.",
      "Review the calculation basis, laminate schedule, liner resin and regression evidence as one controlled design package.",
      "Confirm flange, gasket and bolt compatibility and trial-fit representative joints before releasing a large production run.",
      "Define hold points for raw materials, winding records, cure, dimensions and pressure or stiffness testing in the inspection plan.",
      "Approve saddle spacing, end protection, nesting and unloading instructions; poor pipe packing can invalidate good factory quality.",
    ],
    provinceNotes: {
      Hebei: "Large established cluster for wound pipe, tanks and anti-corrosion systems.",
      Shandong: "Industrial, water and environmental-equipment production base.",
      Jiangsu: "Chemical-process engineering and export documentation capability.",
      Guangdong: "Marine and South China industrial project support.",
      Zhejiang: "Engineered piping components and precision fabrication.",
    },
    faqs: [
      {
        question: "What is the difference between ASTM D2992 and ASTM D2996?",
        answer:
          "ASTM D2992 addresses procedures for establishing hydrostatic or pressure design basis, while ASTM D2996 is a product specification for filament-wound glass-fibre-reinforced thermosetting-resin pipe. A project may use both, together with joining, installation and service-specific requirements.",
      },
      {
        question: "Can EN 1796 and EN 14364 pipe be treated as the same?",
        answer:
          "No. EN 1796 addresses GRP piping for water supply, while EN 14364 covers drainage and sewerage applications. Their performance and application requirements differ. The RFQ should name the correct service and standard edition.",
      },
      {
        question: "How should chemical compatibility be confirmed?",
        answer:
          "Provide chemical composition, concentration, continuous and upset temperature, pressure, cleaning media and expected life. The supplier should propose the liner and structural resin, support it with resin-manufacturer guidance or service evidence, and identify any design derating.",
      },
      {
        question: "What should be inspected before FRP pipe shipment?",
        answer:
          "Check dimensions, wall and liner, visual defects, Barcol hardness where specified, joint geometry, fittings, flange drilling, hydrostatic or stiffness tests as applicable, marking, batch documents and packing saddles. Trial-fit representative joints before a large shipment.",
      },
    ],
  },
  {
    slug: "smc-bmc",
    name: "SMC & BMC",
    shortName: "SMC / BMC",
    summary:
      "Find China SMC and BMC compounders and compression molders for electrical, automotive, rail and industrial parts, from formulation through serial production.",
    overview: [
      "China’s SMC and BMC network includes compounders, toolmakers and compression moulders serving electrical enclosures, automotive components, rail parts, sanitary products and structural housings. SMC is supplied as sheet compound and is suited to larger compression-moulded parts; BMC is a bulk compound often used for smaller, intricate or electrically demanding components. The commercial route depends on whether the buyer needs compound only, toll moulding, tooling plus serial parts, or a fully validated assembly.",
      "A useful RFQ defines mechanical, flame, electrical, dimensional and appearance requirements together with annual volume and validation stage. Filler level, fibre length, resin chemistry, thickening, maturation and storage influence mould flow and final properties. For parts, tool temperature, charge pattern, pressure, cure time and post-mould finishing affect repeatability. Material datasheets should be tied to the offered grade, and part-level evidence should reflect the real thickness and geometry where the requirement is sensitive.",
      "MOQ economics differ sharply between a compound trial and serial moulding. A small BMC formulation trial may be possible with existing equipment, while a new SMC part needs tool design, process trials and capability validation before stable production. GetFRP exposes compound and moulding capability through public profiles, helping buyers separate development cost, tooling ownership, sample approval and recurring part price. That creates a clearer comparison than asking multiple factories for one blended unit price.",
    ],
    match: {
      businessTypes: ["manufacturer"],
      keywords: ["smc", "bmc", "sheet molding compound", "sheet moulding compound", "bulk molding compound", "compression molding"],
    },
    specifications: [
      { field: "Supply scope", typicalRange: "Compound / tooling / moulded part / assembly", sourcingNote: "Separate development and recurring production." },
      { field: "Resin system", typicalRange: "UP / vinyl ester / special low-shrink systems", sourcingNote: "State chemical, thermal and surface needs." },
      { field: "Performance", typicalRange: "Mechanical / flame / electrical / tracking / shrinkage", sourcingNote: "Name methods, thickness and minimums." },
      { field: "Tooling", typicalRange: "Prototype / soft tool / serial steel tool", sourcingNote: "Define ownership, life and maintenance." },
      { field: "Volume", typicalRange: "Trial batch through high-volume serial production", sourcingNote: "Provide SOP timing and annual forecast." },
      { field: "Quality", typicalRange: "FAI, control plan, capability study, traceability", sourcingNote: "Match automotive or electrical requirements." },
    ],
    buyingChecks: [
      "Separate compound development, tool cost, sampling, validation and recurring production price so commercial comparisons stay clear.",
      "Convert regulatory and performance needs into method, specimen thickness and minimum value before the formulation is frozen.",
      "Define tool ownership, storage, preventive maintenance, shot life and end-of-program disposition in the purchase terms.",
      "Approve charge pattern, inserts, colour and surface on first articles, then identify critical dimensions for capability monitoring.",
      "Confirm compound shelf life, maturation window and storage controls when material supply and moulding occur at different sites.",
    ],
    provinceNotes: {
      Jiangsu: "Strong compound, electrical and industrial compression-moulding base.",
      Zhejiang: "Precision moulding and mature private-sector tooling ecosystem.",
      Guangdong: "Electrical, appliance and automotive supply chains with export logistics.",
      Shandong: "Competitive industrial moulding and larger-part production.",
      Shanghai: "Material-development, automotive and multinational technical support.",
    },
    faqs: [
      {
        question: "What is the practical difference between SMC and BMC?",
        answer:
          "SMC is a sheet-form moulding compound with longer chopped reinforcement and is commonly charged into compression tools for larger parts. BMC is a bulk dough-like compound that flows into more intricate geometries and is widely used for electrical parts. Grade design and part geometry ultimately control performance.",
      },
      {
        question: "Why is the MOQ different for compound and molded parts?",
        answer:
          "Compound MOQ is driven by mixing, maturation, storage and line-cleaning economics. Moulded-part MOQ also carries tooling setup, charge preparation, process validation and inspection. A development order should therefore separate trial compound, tool trials and serial production pricing.",
      },
      {
        question: "Can a supplier quote from a 3D model alone?",
        answer:
          "A model is not enough for a controlled quote. Add material or performance specification, drawing tolerances, surface class, inserts, annual volume, test plan, packaging and target market. Identify critical-to-quality dimensions and any regulatory evidence needed.",
      },
      {
        question: "What quality evidence matters for serial SMC/BMC parts?",
        answer:
          "Depending on the market, request first-article inspection, material certificates, control plan, dimensional capability, traceability and relevant flame or electrical reports. Automotive work may also require IATF-aligned systems and PPAP-style evidence; verify the actual site and scope.",
      },
    ],
  },
  {
    slug: "resin-gelcoat",
    name: "Composite Resin & Gelcoat",
    shortName: "Resin & Gelcoat",
    summary:
      "Compare Chinese polyester, vinyl ester, epoxy resin and gelcoat suppliers by chemistry, application, documentation, packaging and export capability.",
    overview: [
      "China’s composite-resin supply chain covers unsaturated polyester, vinyl ester, epoxy, polyurethane and application-specific gelcoats for pultrusion, winding, infusion, hand lay-up, RTM, SMC/BMC and coating. Grade names alone are not portable between producers. A sourcing specification should define process viscosity window, gel time or cure schedule, mechanical target, chemical exposure, flame requirement, colour and storage conditions.",
      "For export procurement, consistency and documentation matter as much as the first laboratory result. Buyers should request a current technical datasheet, safety data sheet, certificate of analysis format, shelf life, storage temperature, inhibitor or promoter condition, dangerous-goods classification and packaging. Gelcoat RFQs should also define application method, target wet-film thickness, UV and water exposure, colour tolerance, gloss and whether the system is mould-side or post-applied.",
      "GetFRP compares public manufacturer and formulation-capable supplier profiles by chemistry, process, end use, capacity tier, export packaging and available evidence. Buyers can visit the company profile or official website before requesting a quote. Before a production order, the recommended route is a controlled lab sample followed by a plant trial using the buyer’s reinforcement, catalyst package, ambient condition and equipment, with acceptance criteria recorded before scale-up.",
    ],
    match: {
      businessTypes: ["resin", "additive"],
      keywords: ["resin", "gelcoat", "gel coat", "epoxy", "vinyl ester", "polyester"],
    },
    specifications: [
      { field: "Chemistry", typicalRange: "UP / vinyl ester / epoxy / PU / specialty", sourcingNote: "Name service and process, not just chemistry." },
      { field: "Processing", typicalRange: "Viscosity, gel time, cure schedule, exotherm", sourcingNote: "Define the test temperature and catalyst basis." },
      { field: "Performance", typicalRange: "Mechanical / HDT / corrosion / flame / weathering", sourcingNote: "Distinguish neat-resin from laminate values." },
      { field: "Documents", typicalRange: "TDS / SDS / CoA / regulatory declarations", sourcingNote: "Check revision, language and legal entity." },
      { field: "Packaging", typicalRange: "Drum / IBC / isotank where available", sourcingNote: "Confirm dangerous-goods and temperature controls." },
      { field: "Validation", typicalRange: "Lab sample → plant trial → approved batch", sourcingNote: "Freeze the formulation and test method." },
    ],
    buyingChecks: [
      "Give the supplier the real process window and reinforcement so viscosity, gel time and wet-out are assessed under relevant conditions.",
      "Verify whether mechanical and thermal values describe neat resin, cast resin or a laminate made with a specified glass content.",
      "Review SDS transport classification, packaging, shelf life and temperature control before comparing FOB or CIF prices.",
      "Create a batch CoA template with agreed tests, methods and limits instead of accepting the supplier’s default certificate after shipment.",
      "Retain the approved lab and plant-trial batches as references and require written approval before formulation or raw-material changes.",
    ],
    provinceNotes: {
      Jiangsu: "One of China’s deepest unsaturated polyester and vinyl ester clusters.",
      Shanghai: "Technical-service centres and multinational resin operations.",
      Zhejiang: "Specialty resin, coating and private formulation capability.",
      Guangdong: "Marine, sanitary and decorative gelcoat application support.",
      Shandong: "Competitive industrial resin and bulk chemical supply.",
    },
    faqs: [
      {
        question: "How do I choose between isophthalic polyester and vinyl ester?",
        answer:
          "Vinyl ester is generally selected for stronger corrosion resistance and toughness, while isophthalic polyester can be economical for moderate industrial exposure. The decision needs the actual chemical, concentration, temperature, stress and service life. Confirm it with resin guidance and a representative laminate trial.",
      },
      {
        question: "Can I compare resin prices by kilogram?",
        answer:
          "Only after normalising solids, additives, packaging, Incoterm, dangerous-goods cost, shelf life and process yield. A lower resin price can be offset by slower cure, higher scrap, extra promoters or a poorer surface. Compare cost per accepted part or laminate output.",
      },
      {
        question: "What should be included in a gelcoat colour approval?",
        answer:
          "Use a defined substrate, application method, wet-film thickness and cure. Record colour standard, gloss, surface, weathering requirement and measurement geometry. Keep a signed master panel and define the allowable colour difference for production batches.",
      },
      {
        question: "Why is a plant trial necessary after a lab sample passes?",
        answer:
          "Resin behaviour changes with reinforcement, part thickness, catalyst system, temperature, humidity, mixing and equipment. A plant trial validates flow, wet-out, cure, exotherm, surface and cycle time under the actual process before commercial volume is committed.",
      },
    ],
  },
  {
    slug: "fiber-glass",
    name: "Composite Fiber & Glass",
    shortName: "Fiber & Glass",
    summary:
      "Source glass, carbon, basalt and aramid reinforcement from China suppliers by fibre type, sizing, product form, application and traceable evidence.",
    overview: [
      "China is a major production base for glass-fibre rovings, chopped strand, mats and fabrics, as well as carbon, basalt and other high-performance reinforcements. A generic fibre designation is insufficient for composite processing. The sizing must be compatible with the resin and process, while tex, filament diameter, tow size, areal weight, weave, moisture and package format affect handling and laminate quality.",
      "Pultrusion, winding, spray-up, SMC, thermoplastic compounding and infusion need different product forms and sizing behaviour. Buyers should provide the resin, process, line speed or flow need, target properties and existing reference grade. For carbon fibre, define tow size, strength and modulus class, surface treatment and test basis. For fabrics and mats, include areal-weight tolerance, width, roll length, splice policy and packaging.",
      "getfrp screens verified producers and converters by fibre family, form, application, scale and export readiness. The matching process can include direct producers and specialised fabric or mat converters, but their roles are distinguished. Before approval, compare a current certificate of analysis and run process trials; a nominally equivalent roving can change wet-out, fuzz, breakage, resin demand and final performance when sizing or package construction differs.",
    ],
    match: {
      businessTypes: ["fiber"],
      keywords: ["glass fiber", "glass fibre", "carbon fiber", "carbon fibre", "basalt", "aramid", "roving", "fabric", "mat"],
    },
    specifications: [
      { field: "Fibre", typicalRange: "E / ECR / S glass, carbon, basalt, aramid", sourcingNote: "State performance class and chemistry." },
      { field: "Form", typicalRange: "Roving / chopped / mat / fabric / veil / prepreg", sourcingNote: "Match the downstream process." },
      { field: "Sizing", typicalRange: "Process- and resin-compatible systems", sourcingNote: "Request compatibility and reference applications." },
      { field: "Key controls", typicalRange: "Tex / tow / filament / areal weight / moisture", sourcingNote: "Define tolerance and sampling." },
      { field: "Packaging", typicalRange: "Palletised bobbins, rolls or sealed bags", sourcingNote: "Control moisture, splice and handling damage." },
      { field: "Approval", typicalRange: "CoA review + line trial + laminate test", sourcingNote: "Do not approve on datasheet alone." },
    ],
    buyingChecks: [
      "Match sizing to resin and process; tex or tow size alone does not establish interchangeability with an incumbent reinforcement.",
      "Define package dimensions, inside payout, splice allowance, roll build and pallet pattern for the buyer’s handling equipment.",
      "Measure fuzz, breakage, wet-out and line stability during the trial as well as final laminate properties.",
      "Set moisture, areal-weight or linear-density sampling by batch and retain labels that connect incoming material to production lots.",
      "Require advance notice of sizing, precursor, furnace, converter or manufacturing-site changes that could alter processing behaviour.",
    ],
    provinceNotes: {
      Zhejiang: "Major glass-fibre production and downstream fabric capability.",
      Shandong: "Large reinforcement and carbon-fibre industrial base.",
      Jiangsu: "Carbon fibre, fabric conversion and composite-material clusters.",
      Shanghai: "Multinational technical service and specialist distribution.",
      Hebei: "Glass fabrics, mats and reinforcement conversion.",
    },
    faqs: [
      {
        question: "What is the difference between E-glass and ECR-glass?",
        answer:
          "ECR glass is formulated for improved corrosion resistance compared with conventional E-glass and is widely considered for aggressive environments. Actual performance still depends on fibre, sizing, resin and laminate quality. Ask for the offered grade’s chemistry and application evidence.",
      },
      {
        question: "Why does fibre sizing matter?",
        answer:
          "Sizing protects the fibre during handling and controls compatibility with resin and process. It affects wet-out, adhesion, fuzz, breakage and final properties. A roving with the same tex but a different sizing may behave very differently on a pultrusion or winding line.",
      },
      {
        question: "How should carbon fibre grades be compared?",
        answer:
          "Compare tow size, tensile strength, modulus, elongation, density, sizing level, surface treatment, test method and statistical basis. Confirm whether values apply to fibre, impregnated strand or laminate. Process trials are essential when changing an established grade.",
      },
      {
        question: "What incoming inspection should I use for reinforcement?",
        answer:
          "Verify labels and batch traceability, package condition, mass, tex or areal weight, width, moisture where relevant and a current certificate of analysis. For a new source, add handling and laminate tests tied to the downstream process and approved reference material.",
      },
    ],
  },
];

export const SUPPLIER_CATEGORY_SLUGS = SUPPLIER_CATEGORY_PAGES.map(
  (page) => page.slug,
);

export function getSupplierCategoryPage(
  slug: string,
): SupplierCategoryPage | undefined {
  return SUPPLIER_CATEGORY_PAGES.find((page) => page.slug === slug);
}

export function supplierMatchesCategory(
  page: SupplierCategoryPage,
  supplier: {
    name?: string | null;
    nameEn?: string | null;
    category: string | null;
    productsEn: string[] | null;
    capabilities: string[] | null;
    processListEn: string[] | null;
  },
): boolean {
  const businessTypeMatch = page.match.businessTypes.includes(
    (supplier.category ?? "").toLowerCase(),
  );
  const haystack = [
    supplier.name ?? "",
    supplier.nameEn ?? "",
    ...(supplier.productsEn ?? []),
    ...(supplier.capabilities ?? []),
    ...(supplier.processListEn ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return (
    businessTypeMatch &&
    page.match.keywords.some((keyword) => haystack.includes(keyword))
  );
}
