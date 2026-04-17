import type { Metadata } from "next";
import { AiAssistantClient } from "./ai-client";

export const metadata: Metadata = {
  title: "复材AI - 纤维复合材料智能助手",
  description:
    "复材AI是专业的纤维复合材料智能助手，可以查询材料数据、推荐配方、解答工艺问题、查找标准和匹配供应商。",
};

export default function AiPage() {
  return <AiAssistantClient />;
}
