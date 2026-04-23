import { generatePaperCommentary } from "../src/lib/ingest/commentary";

async function main() {
  const r = await generatePaperCommentary({
    title: "碳纤维增强复合材料回收技术进展",
    abstract:
      "本文综述了碳纤维增强复合材料（CFRP）的回收技术研究进展，包括热解、化学溶剂、机械破碎等主流工艺，分析各方法的回收率、纤维性能保留和经济性。结果表明溶剂解法可保留 90% 以上纤维强度。",
    journal: "复合材料学报",
    year: 2024,
    keywords: ["回收", "碳纤维", "热解"],
  });
  console.log("===== result =====");
  console.log(r ?? "(null)");
  console.log("===== length =====", r?.length ?? 0);
}
main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
