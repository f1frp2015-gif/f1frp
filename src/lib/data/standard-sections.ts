// Cold-start chapter skeletons for top standards.
// Content is structural summary (scope, method outline, key parameters) — not the copyrighted full text.
// Bodies are short paragraphs; keyPoints give tight bullet-ready facts for AI context injection.

export type StandardSectionSeed = {
  standardId: string;
  chapterNo: string;
  title: string;
  body: string;
  keyPoints: string[];
  sortOrder: number;
};

// Reusable section factory — most test standards share the same chapter skeleton.
function testMethodSkeleton(
  standardId: string,
  opts: {
    scope: string;
    normativeRefs: string[];
    terms: string[];
    principle: string;
    specimen: string;
    apparatus: string;
    procedure: string;
    calc: string[];
    report: string[];
  }
): StandardSectionSeed[] {
  return [
    {
      standardId,
      chapterNo: "1",
      title: "范围 (Scope)",
      body: opts.scope,
      keyPoints: [opts.scope],
      sortOrder: 10,
    },
    {
      standardId,
      chapterNo: "2",
      title: "规范性引用文件 (Normative References)",
      body:
        "本标准引用下列文件，其最新版本适用：\n- " +
        opts.normativeRefs.join("\n- "),
      keyPoints: opts.normativeRefs,
      sortOrder: 20,
    },
    {
      standardId,
      chapterNo: "3",
      title: "术语与定义 (Terms)",
      body: opts.terms.map((t) => `• ${t}`).join("\n"),
      keyPoints: opts.terms,
      sortOrder: 30,
    },
    {
      standardId,
      chapterNo: "4",
      title: "试验原理 (Principle)",
      body: opts.principle,
      keyPoints: [opts.principle],
      sortOrder: 40,
    },
    {
      standardId,
      chapterNo: "5",
      title: "试样 (Specimen)",
      body: opts.specimen,
      keyPoints: opts.specimen.split(/；|;/).filter(Boolean),
      sortOrder: 50,
    },
    {
      standardId,
      chapterNo: "6",
      title: "试验设备 (Apparatus)",
      body: opts.apparatus,
      keyPoints: opts.apparatus.split(/；|;/).filter(Boolean),
      sortOrder: 60,
    },
    {
      standardId,
      chapterNo: "7",
      title: "试验步骤 (Procedure)",
      body: opts.procedure,
      keyPoints: opts.procedure.split(/；|;/).filter(Boolean),
      sortOrder: 70,
    },
    {
      standardId,
      chapterNo: "8",
      title: "结果计算 (Calculation)",
      body: opts.calc.join("\n"),
      keyPoints: opts.calc,
      sortOrder: 80,
    },
    {
      standardId,
      chapterNo: "9",
      title: "试验报告 (Report)",
      body: "试验报告应包含以下内容：\n- " + opts.report.join("\n- "),
      keyPoints: opts.report,
      sortOrder: 90,
    },
  ];
}

export const standardSectionSeeds: StandardSectionSeed[] = [
  // ─── GB/T 1446-2005 总则 ─────────────────────
  {
    standardId: "cn-001",
    chapterNo: "1",
    title: "范围",
    body:
      "本标准规定了纤维增强塑料（FRP）性能试验的总则性要求，包括状态调节、试验环境、试样外观、数据处理和报告格式。适用于所有以连续或不连续纤维增强的热固性或热塑性塑料基复合材料。",
    keyPoints: ["覆盖 FRP 试验的通用规则", "适用热固性与热塑性基体", "规定状态调节与环境"],
    sortOrder: 10,
  },
  {
    standardId: "cn-001",
    chapterNo: "2",
    title: "试验环境与状态调节",
    body:
      "标准试验环境温度 (23 ± 2) °C，相对湿度 (50 ± 5) %。试样试验前应在标准环境中至少状态调节 88 h。特殊要求可按产品标准约定调整。",
    keyPoints: [
      "标准温度 23±2 °C",
      "标准湿度 50±5 %RH",
      "状态调节时间不少于 88 h",
    ],
    sortOrder: 20,
  },
  {
    standardId: "cn-001",
    chapterNo: "3",
    title: "试样数量与外观",
    body:
      "每组试验的有效试样数量一般不少于 5 个。试样表面应无可见缺陷、气泡、分层或划伤。异常试样应记录并从有效样本中剔除。",
    keyPoints: ["每组有效试样 ≥ 5 个", "试样应无气泡/分层"],
    sortOrder: 30,
  },
  {
    standardId: "cn-001",
    chapterNo: "4",
    title: "数据处理",
    body:
      "试验结果取算术平均值。当单个试样数据与平均值偏差超过 2 倍标准差时，应舍弃并补做。计算结果保留至规定的有效数字位数。",
    keyPoints: ["取算术平均值", "超 2σ 舍弃并补做"],
    sortOrder: 40,
  },
  {
    standardId: "cn-001",
    chapterNo: "5",
    title: "试验报告内容",
    body:
      "报告应包括：试样描述（材料、工艺、方向）、试验环境、试样尺寸、试验设备信息、加载速率、试验结果（平均值/标准差/最大最小值）、破坏模式、试验人员与日期。",
    keyPoints: [
      "必含试样描述与工艺方向",
      "必含加载速率与破坏模式",
      "必含平均值/标准差/极值",
    ],
    sortOrder: 50,
  },

  // ─── GB/T 1447-2005 拉伸 ─────────────────────
  ...testMethodSkeleton("cn-002", {
    scope:
      "规定了纤维增强塑料平板拉伸性能试验方法，适用于测定拉伸强度、拉伸弹性模量、断裂伸长率和泊松比。适用于手糊、缠绕、模压、拉挤等工艺制品。",
    normativeRefs: [
      "GB/T 1446 纤维增强塑料性能试验方法总则",
      "GB/T 2918 塑料试样状态调节",
    ],
    terms: [
      "拉伸强度 σt：试样所能承受的最大拉伸应力",
      "拉伸模量 E：应力-应变曲线线性段斜率",
      "断裂伸长率 εb：断裂时的相对伸长百分比",
    ],
    principle:
      "沿试样长度方向施加单轴拉伸载荷至破坏，记录载荷-位移曲线，由最大载荷和原始截面积计算拉伸强度，由初始线性段计算弹性模量。",
    specimen:
      "矩形平板试样；I 型长 250 mm、宽 25 mm、厚 2–10 mm；II 型长 170 mm、中部宽 10 mm；端部粘贴加强片防止夹持破坏",
    apparatus:
      "电子万能试验机，载荷示值误差 ≤ ±1 %；引伸计，标距 50 mm，精度 0.5 级；应变片或非接触视频引伸计用于泊松比",
    procedure:
      "试样对中安装；设定加载速率 2–5 mm/min；以恒速加载至破坏；记录载荷、位移、纵横向应变；记录破坏模式",
    calc: [
      "σt = Fmax / (b × h)  b 为宽度，h 为厚度",
      "E = Δσ / Δε  取应变 0.05 %~0.25 % 线性段",
      "εb = ΔL / L0 × 100 %",
    ],
    report: [
      "试样规格与铺层方向",
      "加载速率与引伸计标距",
      "拉伸强度、模量、断裂伸长率的平均值/标准差",
      "破坏模式（夹持区内/外、层间分层、纤维断裂）",
    ],
  }),

  // ─── GB/T 1449-2005 弯曲 ─────────────────────
  ...testMethodSkeleton("cn-004", {
    scope:
      "规定纤维增强塑料矩形截面试样的弯曲性能试验方法，测定弯曲强度、弯曲弹性模量、弯曲应变。适用于平板、板材、层压板等。",
    normativeRefs: ["GB/T 1446 总则", "ISO 178 塑料弯曲性能"],
    terms: [
      "弯曲强度 σf：最大弯曲应力",
      "弯曲模量 Ef：弯曲应力-应变曲线线性斜率",
      "跨厚比 L/h：支座跨距与试样厚度之比",
    ],
    principle:
      "采用三点弯曲加载，试样置于两支座上，中点施加垂直载荷至破坏或规定应变，计算表层最大应力与中点挠度。",
    specimen:
      "矩形试样长 80 mm、宽 15 mm、厚 4 mm（标准）；跨厚比 L/h = 16:1（推荐）；表面光洁，无划痕",
    apparatus:
      "万能试验机；三点弯曲夹具，压头 R = 5 mm，支座 R = 2 mm；挠度计或位移传感器",
    procedure:
      "按 L/h 设置跨距；试样对中放置；加载速率 v = 0.01 L²/(6h) 约 2 mm/min；加载至破坏或应变达 5 %",
    calc: [
      "σf = 3 F L / (2 b h²)",
      "Ef = L³ × Δm / (4 b h³)  Δm 为载荷-挠度曲线初始斜率",
      "εf = 6 s h / L²  s 为中点挠度",
    ],
    report: [
      "跨厚比 L/h 与加载速率",
      "弯曲强度、模量、最大应变",
      "破坏位置（压缩面/拉伸面/剪切）",
    ],
  }),

  // ─── GB/T 1450.1-2005 层间剪切 ──────────────
  ...testMethodSkeleton("cn-005", {
    scope:
      "规定纤维增强塑料层间剪切强度试验方法（短梁法）。用于评价层合板层间抗剪切能力，是判定层合质量的关键指标。",
    normativeRefs: ["GB/T 1446", "ASTM D2344 短梁剪切"],
    terms: [
      "层间剪切强度 τ：试样破坏时的最大剪切应力",
      "短梁跨厚比：L/h ≤ 5，强制剪切破坏模式",
    ],
    principle:
      "使用小跨厚比（L/h = 4~5）的三点弯曲加载，在中性面形成最大剪切应力诱发层间剪切破坏。",
    specimen:
      "矩形试样长 20 mm、宽 10 mm、厚 2 mm；跨厚比 L/h = 5；端面与上下表面平整",
    apparatus:
      "万能试验机；三点剪切夹具压头 R = 3 mm，支座 R = 1.5 mm",
    procedure:
      "试样居中置于支座；加载速率 1 mm/min；加载至载荷峰值；检查破坏模式确认为层间剪切（中性面分层）而非压溃",
    calc: [
      "τ = 3 Fmax / (4 b h)",
      "仅层间剪切破坏模式下结果有效",
    ],
    report: ["试样跨厚比", "破坏模式（层间剪切/压溃/弯曲）", "剪切强度平均值/标准差"],
  }),

  // ─── GB/T 3354-2014 定向纤维拉伸 ────────────
  ...testMethodSkeleton("cn-009", {
    scope:
      "规定定向纤维增强塑料（单向或织物）拉伸性能试验方法，适用于测定 0° / 90° / 偏轴方向的拉伸强度、模量、泊松比、主泊松比。",
    normativeRefs: ["GB/T 1446", "ASTM D3039", "ISO 527-5"],
    terms: [
      "0° 拉伸：沿主纤维方向加载",
      "90° 拉伸：垂直主纤维方向加载",
      "偏轴拉伸：与主纤维方向成 ±45° 或自定义角度",
    ],
    principle:
      "在试样有效测试段施加单轴拉伸载荷至破坏；采用加强片防止夹持区破坏。对于偏轴试样，粘贴双向应变片测主/次方向应变。",
    specimen:
      "0° 试样长 250 mm、宽 15 mm、厚 1 mm；90° 试样宽 25 mm、厚 2 mm；端部粘贴 50 mm × 15° 斜边玻纤加强片；夹持段 50 mm",
    apparatus:
      "万能试验机 ±1 % 精度；液压楔形夹具；双向应变片 5 mm；视频引伸计（备选）",
    procedure:
      "试样对中安装；加载速率 0° 为 2 mm/min、90° 为 1 mm/min；记录破坏位置与模式；破坏必须在有效测试段内",
    calc: [
      "σ = F / (b × h)",
      "E1 = Δσ1 / Δε1",
      "ν12 = -Δε2 / Δε1  在 25 %~50 % 破坏载荷区间",
    ],
    report: [
      "纤维方向（0°/90°/偏轴）",
      "破坏位置（测试段内/外/加强片下）",
      "强度、模量、泊松比",
    ],
  }),

  // ─── ISO 527-4:2023 拉伸 ─────────────────────
  ...testMethodSkeleton("iso-001", {
    scope:
      "Part 4 规定各向同性和正交各向异性纤维增强复合材料的拉伸性能测试。通常与 ISO 527-1 通则配套使用。",
    normativeRefs: ["ISO 527-1 Tensile general principles", "ISO 291 Standard atmospheres"],
    terms: [
      "Isotropic: equal properties in all directions",
      "Orthotropic: distinct properties along principal material axes",
      "Tensile modulus Et: slope between 0.05 %~0.25 % strain",
    ],
    principle:
      "Apply uniaxial tensile force at constant crosshead rate; measure force, elongation and strain until failure; compute strength, modulus and Poisson ratio.",
    specimen:
      "Type 1B (most common): gauge 150 mm, width 25 mm, thickness 2–10 mm; end tabs recommended for unidirectional composites; tabs bevel 7°–15°",
    apparatus:
      "Universal testing machine ±1 %; extensometer gauge length 50 mm class 0.5; biaxial strain gauge for Poisson's ratio",
    procedure:
      "Align specimen in grips; apply rate 2 mm/min (standard) or 1 mm/min for 90° specimens; log force-strain to failure; note failure mode per ISO 527-1 Annex C",
    calc: [
      "σt = F / A",
      "Et computed between εt = 0.0005 and 0.0025",
      "ν = -ε_transverse / ε_longitudinal",
    ],
    report: [
      "Specimen geometry and layup",
      "Crosshead speed and extensometer gauge",
      "Failure mode code (per ISO 527-1 Annex C)",
      "Mean / std-dev / min / max",
    ],
  }),

  // ─── ISO 14125:1998 弯曲 ─────────────────────
  ...testMethodSkeleton("iso-003", {
    scope:
      "Specifies flexural test for fibre-reinforced plastic composites using three-point or four-point loading. Determines flexural strength, modulus and strain.",
    normativeRefs: ["ISO 291", "ISO 1268 Prepreg laminates"],
    terms: [
      "Three-point flexure: single central load",
      "Four-point flexure: two symmetric loads, pure bending in middle span",
      "Span-to-thickness ratio L/h: typically 16 or 32",
    ],
    principle:
      "Simply-supported beam under three- or four-point loading; flexural stress computed from peak load and specimen geometry; flexural modulus from initial linear slope.",
    specimen:
      "Class I (high-strength): L/h = 16, specimen 100 mm × 15 mm × 4 mm; Class II (high-modulus): L/h = 32 or 40; Class III (high shear sensitivity): L/h = 40",
    apparatus:
      "Universal test machine; flexure fixture with specified radii (loading nose R = 5 mm, supports R = 2 mm standard)",
    procedure:
      "Center specimen on supports; loading rate v = 0.01 L²/(6h) mm/min; continue to failure or to 5 % strain; record load-deflection curve",
    calc: [
      "σf = 3 F L / (2 b h²)  three-point",
      "σf = F L / (b h²)  four-point with L/4 spacing",
      "Ef = L³ m / (4 b h³)  m = initial slope",
    ],
    report: [
      "Loading configuration (3-pt / 4-pt) and L/h",
      "Specimen orientation",
      "Flexural strength, modulus, strain",
      "Failure mode: tension, compression, shear",
    ],
  }),

  // ─── ASTM D3039 拉伸 ─────────────────────────
  ...testMethodSkeleton("us-001", {
    scope:
      "Tensile test method for polymer matrix composite laminates reinforced by high-modulus fibres. Determines in-plane tensile strength, modulus, Poisson's ratio and strain-to-failure.",
    normativeRefs: [
      "ASTM D5229 Moisture absorption conditioning",
      "ASTM D3878 Composite terminology",
      "ASTM E4 Force verification",
    ],
    terms: [
      "Ultimate tensile strength Ftu",
      "Tensile chord modulus Et: between ε = 1000 and 3000 microstrain",
      "Poisson's ratio ν12",
    ],
    principle:
      "Thin, flat, constant-cross-section coupon loaded in tension at constant crosshead rate; force, displacement and strain recorded to failure; tabs bond specimen to grip region to avoid grip-induced failure.",
    specimen:
      "0° unidirectional: 250 × 15 × 1 mm with 56 mm tabs; 90° unidirectional: 175 × 25 × 2 mm; balanced symmetric laminate: 250 × 25 × 2.5 mm; tab bevel 7°±1°",
    apparatus:
      "Universal test machine ±1 %; hydraulic wedge grips; bonded strain gauges or extensometer; two gauges for Poisson's ratio (one longitudinal, one transverse)",
    procedure:
      "Install specimen aligned to load axis; apply strain rate 0.01 /min (≈ 2 mm/min for 250 mm specimen); record to failure; validate failure within gauge section",
    calc: [
      "Ftu = Pmax / A",
      "Et (chord) = Δσ / Δε between 1000-3000 με",
      "ν12 = -Δε_transverse / Δε_longitudinal",
    ],
    report: [
      "Specimen lay-up and nominal ply thickness",
      "Grip type and tab material",
      "Failure mode per ASTM D3039 three-character code (e.g., LAT = Lateral/At grip/Top)",
      "Strength, modulus, Poisson's ratio, strain-to-failure",
    ],
  }),

  // ─── ASTM D790 弯曲 ──────────────────────────
  ...testMethodSkeleton("us-003", {
    scope:
      "Flexural test for unreinforced and reinforced plastics, including high-modulus composites. Procedure A for flexural strength and modulus of rupture; Procedure B for materials that undergo large deflection.",
    normativeRefs: ["ASTM D618 Conditioning", "ASTM D883 Terminology"],
    terms: [
      "Procedure A: strain rate 0.01 mm/mm/min",
      "Procedure B: strain rate 0.10 mm/mm/min",
      "Flexural stress σf at outer surface",
    ],
    principle:
      "Simply-supported beam under three-point loading at constant crosshead rate; stress and strain in outer fibre computed from load and mid-span deflection.",
    specimen:
      "Standard: 127 × 12.7 × 3.2 mm; L/h = 16 (standard) or 32 (for high shear sensitivity); specimen cut parallel to intended loading direction",
    apparatus:
      "Test machine with support and loading noses of specified radii (R = 5 mm loading, 3 mm supports typical); deflection measured via crosshead or LVDT",
    procedure:
      "Place specimen on supports with L/h = 16; apply load at rate R = Z L²/(6h), Z = 0.01 or 0.10; run to failure or 5 % strain (whichever first)",
    calc: [
      "σf = 3 P L / (2 b h²)",
      "Eb = L³ m / (4 b h³)",
      "εf = 6 D h / L²",
    ],
    report: [
      "Procedure (A or B) and L/h ratio",
      "Flexural strength and chord modulus",
      "Maximum strain achieved",
      "Failure mode (outer fibre rupture, shear, compression)",
    ],
  }),

  // ─── ASTM D5379 V型缺口剪切 ─────────────────
  ...testMethodSkeleton("us-007", {
    scope:
      "Iosipescu V-notched beam shear test for polymer matrix composites. Determines in-plane and interlaminar shear properties including shear strength and modulus.",
    normativeRefs: ["ASTM D3878", "ASTM D5229"],
    terms: [
      "V-notched beam: specimen with symmetric 90° V-notches on both edges at mid-length",
      "Shear modulus G12 from strain-gauge response at ±45°",
    ],
    principle:
      "Apply asymmetric four-point load to V-notched specimen to create pure shear stress state in the notch region; measure shear strain via back-to-back ±45° strain gauges.",
    specimen:
      "76 × 20 × 3 mm with 90° V-notches 4 mm deep at mid-length; notch tip radius 1.3 mm; ±45° strain gauges 1.5 mm gauge length bonded at notch centre",
    apparatus:
      "Iosipescu fixture (Wyoming type); universal test machine; strain gauge amplifier with ≥ 2 μstrain resolution",
    procedure:
      "Align specimen in fixture; apply displacement rate 2 mm/min; log load and ±45° strain gauge output to failure; verify failure initiates from notch root",
    calc: [
      "τ12 = P / A_notch",
      "γ12 = ε_+45 - ε_-45",
      "G12 = Δτ / Δγ between γ = 2000-6000 μstrain",
    ],
    report: [
      "Fibre orientation relative to notch axis",
      "Shear strength and chord modulus G12",
      "Failure mode (notch-root crack vs non-valid)",
    ],
  }),

  // ─── EN 13706-1 拉挤型材命名 ────────────────
  {
    standardId: "eu-001",
    chapterNo: "1",
    title: "Scope",
    body:
      "Part 1 of EN 13706 establishes a designation system for pultruded reinforced plastics profiles. Defines classification by minimum flexural modulus and by reinforcement/matrix type.",
    keyPoints: [
      "Covers pultruded FRP profiles",
      "Classifies by minimum flexural modulus grade (E17 / E23)",
    ],
    sortOrder: 10,
  },
  {
    standardId: "eu-001",
    chapterNo: "2",
    title: "Grade classification (E17 / E23)",
    body:
      "Profiles are classified into minimum performance grades:\n• E17 — minimum longitudinal flexural modulus 17 GPa\n• E23 — minimum longitudinal flexural modulus 23 GPa\nGrades also specify minimum tensile strength, flexural strength, interlaminar shear, and pin-bearing values. E23 is the higher-performance structural grade widely used in load-bearing construction profiles.",
    keyPoints: [
      "E17: flexural modulus ≥ 17 GPa",
      "E23: flexural modulus ≥ 23 GPa",
      "E23 used for structural/load-bearing applications",
    ],
    sortOrder: 20,
  },
  {
    standardId: "eu-001",
    chapterNo: "3",
    title: "Designation format",
    body:
      "Full designation: EN 13706-E##-RF/MM\n• E## — grade (E17 or E23)\n• RF — reinforcement code (G = glass, C = carbon, A = aramid)\n• MM — matrix code (UP = unsaturated polyester, VE = vinyl ester, EP = epoxy, PF = phenolic)\nExample: EN 13706-E23-G/VE = E23 grade glass/vinyl-ester pultrusion.",
    keyPoints: [
      "Format: EN 13706-E##-RF/MM",
      "Reinforcement: G / C / A",
      "Matrix: UP / VE / EP / PF",
    ],
    sortOrder: 30,
  },
  {
    standardId: "eu-001",
    chapterNo: "4",
    title: "Test methods linkage",
    body:
      "Performance values required by Part 1 are measured per Part 2 (EN 13706-2) which references ISO 527, ISO 14125 and ISO 14130 test methods for tensile, flexural and interlaminar shear respectively.",
    keyPoints: [
      "Tensile: ISO 527",
      "Flexural: ISO 14125",
      "Interlaminar shear: ISO 14130",
    ],
    sortOrder: 40,
  },
  {
    standardId: "eu-001",
    chapterNo: "5",
    title: "Typical applications",
    body:
      "E23-grade profiles: structural beams, platforms, gratings, cable ladders, walkways, handrails in corrosive environments (chemical plants, offshore, wastewater). E17 grade: non-load-bearing enclosures, architectural trim, light cladding.",
    keyPoints: [
      "E23: load-bearing structures in corrosive service",
      "E17: non-structural / aesthetic",
    ],
    sortOrder: 50,
  },
];
