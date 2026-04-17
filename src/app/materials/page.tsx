import type { Metadata } from "next";
import { MaterialsClient } from "./materials-client";

export const metadata: Metadata = {
  title: "材料数据库 - 纤维复合材料属性查询",
  description:
    "中国首个结构化纤维复合材料数据库，涵盖玻璃纤维、碳纤维、玄武岩纤维、芳纶、树脂、芯材等300+种材料的力学、热学、物理性能数据。",
};

export default function MaterialsPage() {
  return <MaterialsClient />;
}
