import type { Metadata } from "next";
import { FormulasClient } from "./formulas-client";

export const metadata: Metadata = {
  title: "配方数据库 - FRP复合材料工艺配方查询",
  description:
    "FRP复合材料配方数据库，涵盖手糊、缠绕、拉挤、模压、RTM、真空导入等工艺的完整树脂体系、增强材料配比和工艺参数。",
};

export default function FormulasPage() {
  return <FormulasClient />;
}
