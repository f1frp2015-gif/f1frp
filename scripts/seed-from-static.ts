import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local for the script
for (const envPath of [".env.local", ".env"]) {
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key]) continue;
    let value = raw.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

import { db } from "../src/lib/db";
import {
  materials as materialsTable,
  formulas as formulasTable,
  standards as standardsTable,
  standardSections as standardSectionsTable,
  papers as papersTable,
  patents as patentsTable,
  processes as processesTable,
  supplierListings,
  articles,
  authors,
} from "../src/lib/db/schema";
import { materials } from "../src/lib/data/materials";
import { formulas } from "../src/lib/data/formulas";
import { standards } from "../src/lib/data/standards";
import { standardSectionSeeds } from "../src/lib/data/standard-sections";
import { processes } from "../src/lib/data/tech";
import { suppliers } from "../src/lib/data/suppliers";
import { newsList } from "../src/lib/data/news";
import { articleBodies } from "../src/lib/data/article-bodies";
import { paperSeeds } from "../src/lib/data/papers";
import { patentSeeds } from "../src/lib/data/patents";
import { paperSlug, patentSlug } from "../src/lib/slug";

function slugify(input: string, fallback: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

async function seed() {
  console.log("🌱 Starting seed…");

  // Materials
  console.log(`📦 materials: ${materials.length}`);
  for (const m of materials) {
    await db
      .insert(materialsTable)
      .values({
        id: m.id,
        name: m.name,
        nameEn: m.nameEn,
        category: m.category,
        subCategory: m.subCategory,
        brand: m.brand,
        model: m.model,
        properties: m.properties,
        applications: m.applications,
        description: m.description,
      })
      .onConflictDoUpdate({
        target: materialsTable.id,
        set: {
          name: m.name,
          nameEn: m.nameEn,
          category: m.category,
          subCategory: m.subCategory,
          brand: m.brand,
          model: m.model,
          properties: m.properties,
          applications: m.applications,
          description: m.description,
          updatedAt: new Date(),
        },
      });
  }

  // Formulas
  console.log(`🧪 formulas: ${formulas.length}`);
  for (const f of formulas) {
    await db
      .insert(formulasTable)
      .values({
        id: f.id,
        name: f.name,
        processId: f.processId,
        process: f.process,
        category: f.category,
        application: f.application,
        difficulty: f.difficulty,
        description: f.description,
        resinSystem: f.resinSystem,
        reinforcement: f.reinforcement,
        auxiliaries: f.auxiliaries,
        processing: f.processing,
        properties: f.properties,
        tips: f.tips,
        safetyNotes: f.safetyNotes,
      })
      .onConflictDoUpdate({
        target: formulasTable.id,
        set: {
          name: f.name,
          processId: f.processId,
          process: f.process,
          category: f.category,
          application: f.application,
          difficulty: f.difficulty,
          description: f.description,
          resinSystem: f.resinSystem,
          reinforcement: f.reinforcement,
          auxiliaries: f.auxiliaries,
          processing: f.processing,
          properties: f.properties,
          tips: f.tips,
          safetyNotes: f.safetyNotes,
          updatedAt: new Date(),
        },
      });
  }

  // Standards
  console.log(`📋 standards: ${standards.length}`);
  for (const s of standards) {
    await db
      .insert(standardsTable)
      .values({
        id: s.id,
        code: s.code,
        title: s.title,
        titleEn: s.titleEn,
        country: s.country,
        countryCode: s.countryCode,
        category: s.category,
        process: s.process,
        year: s.year,
        status: s.status,
        description: s.description,
      })
      .onConflictDoUpdate({
        target: standardsTable.id,
        set: {
          code: s.code,
          title: s.title,
          titleEn: s.titleEn,
          country: s.country,
          countryCode: s.countryCode,
          category: s.category,
          process: s.process,
          year: s.year,
          status: s.status,
          description: s.description,
          updatedAt: new Date(),
        },
      });
  }

  // Standard sections
  console.log(`📑 standard sections: ${standardSectionSeeds.length}`);
  for (const sec of standardSectionSeeds) {
    const id = `${sec.standardId}-${sec.chapterNo}`;
    await db
      .insert(standardSectionsTable)
      .values({
        id,
        standardId: sec.standardId,
        chapterNo: sec.chapterNo,
        title: sec.title,
        body: sec.body,
        keyPoints: sec.keyPoints,
        sortOrder: sec.sortOrder,
      })
      .onConflictDoUpdate({
        target: standardSectionsTable.id,
        set: {
          chapterNo: sec.chapterNo,
          title: sec.title,
          body: sec.body,
          keyPoints: sec.keyPoints,
          sortOrder: sec.sortOrder,
          updatedAt: new Date(),
        },
      });
  }

  // Processes
  console.log(`⚙️  processes: ${processes.length}`);
  for (const p of processes) {
    await db
      .insert(processesTable)
      .values({
        id: p.id,
        name: p.name,
        nameEn: p.nameEn,
        description: p.description,
        advantages: p.advantages,
        disadvantages: p.disadvantages,
        applications: p.applications,
        keyParameters: p.keyParameters,
        imageUrl: p.image,
      })
      .onConflictDoUpdate({
        target: processesTable.id,
        set: {
          name: p.name,
          nameEn: p.nameEn,
          description: p.description,
          advantages: p.advantages,
          disadvantages: p.disadvantages,
          applications: p.applications,
          keyParameters: p.keyParameters,
          imageUrl: p.image,
          updatedAt: new Date(),
        },
      });
  }

  // Supplier listings
  console.log(`🏭 suppliers: ${suppliers.length}`);
  for (const s of suppliers) {
    await db
      .insert(supplierListings)
      .values({
        id: s.id,
        name: s.name,
        location: s.location,
        province: s.province,
        category: s.category,
        products: s.products,
        processList: s.processes,
        established: s.established,
        verified: s.verified,
        description: s.description,
        certifications: s.certifications,
      })
      .onConflictDoUpdate({
        target: supplierListings.id,
        set: {
          name: s.name,
          location: s.location,
          province: s.province,
          category: s.category,
          products: s.products,
          processList: s.processes,
          established: s.established,
          verified: s.verified,
          description: s.description,
          certifications: s.certifications,
          updatedAt: new Date(),
        },
      });
  }

  // Articles (news -> articles with curated author)
  console.log(`📰 articles (from news): ${newsList.length}`);
  const [house] = await db
    .insert(authors)
    .values({ name: "复材站编辑部", title: "官方", bio: "复材站编辑部" })
    .onConflictDoNothing()
    .returning({ id: authors.id });
  const houseAuthorId = house?.id;

  for (const n of newsList) {
    const slug = slugify(n.title, `news-${n.id}`);
    const body = articleBodies[n.id] ?? n.summary;
    await db
      .insert(articles)
      .values({
        slug,
        title: n.title,
        excerpt: n.summary,
        body,
        category: n.category,
        coverUrl: n.image,
        authorId: houseAuthorId,
        readTime: n.readTime,
        hot: !!n.hot,
        publishedAt: n.date ? new Date(n.date) : null,
      })
      .onConflictDoUpdate({
        target: articles.slug,
        set: {
          title: n.title,
          excerpt: n.summary,
          body,
          category: n.category,
          coverUrl: n.image,
          readTime: n.readTime,
          hot: !!n.hot,
          publishedAt: n.date ? new Date(n.date) : null,
          updatedAt: new Date(),
        },
      });
  }

  // Papers
  console.log(`📄 papers: ${paperSeeds.length}`);
  for (const p of paperSeeds) {
    const values = {
      id: p.id,
      slug: paperSlug(p.title, p.id),
      title: p.title,
      titleEn: p.titleEn,
      authors: p.authors,
      affiliation: p.affiliation,
      journal: p.journal,
      year: p.year,
      volume: p.volume,
      issue: p.issue,
      pages: p.pages,
      doi: p.doi,
      abstract: p.abstract,
      keywords: p.keywords,
      category: p.category,
      language: p.language,
      citationCount: p.citationCount,
      sourceUrl: p.sourceUrl,
    };
    await db
      .insert(papersTable)
      .values(values)
      .onConflictDoUpdate({
        target: papersTable.id,
        set: { ...values, updatedAt: new Date() },
      });
  }

  // Patents
  console.log(`🛡️  patents: ${patentSeeds.length}`);
  for (const p of patentSeeds) {
    const values = {
      id: p.id,
      slug: patentSlug(p.title, p.id),
      title: p.title,
      titleEn: p.titleEn,
      applicationNo: p.applicationNo,
      publicationNo: p.publicationNo,
      grantNo: p.grantNo,
      applicant: p.applicant,
      inventors: p.inventors,
      filingDate: p.filingDate,
      publicationDate: p.publicationDate,
      grantDate: p.grantDate,
      classification: p.classification,
      status: p.status,
      country: p.country,
      countryCode: p.countryCode,
      abstract: p.abstract,
      claims: p.claims,
      category: p.category,
      sourceUrl: p.sourceUrl,
    };
    await db
      .insert(patentsTable)
      .values(values)
      .onConflictDoUpdate({
        target: patentsTable.id,
        set: { ...values, updatedAt: new Date() },
      });
  }

  console.log("✅ Seed complete.");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
