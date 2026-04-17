import type { Metadata } from "next";
import { StandardsClient } from "./standards-client";

export const metadata: Metadata = {
  title: "标准数据库 - FRP复合材料国内外标准查询",
  description:
    "FRP���合材料行业标准数据库，涵盖中国GB/HG/JC、国际ISO、美国ASTM、欧洲EN、德国DIN等80+项试验标准和产品标准。",
};

export default function StandardsPage() {
  return <StandardsClient />;
}
