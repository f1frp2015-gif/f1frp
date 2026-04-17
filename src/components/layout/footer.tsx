import Link from "next/link";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "数据",
    links: [
      { label: "材料数据库", href: "/materials" },
      { label: "配方数据库", href: "/formulas" },
      { label: "标准数据库", href: "/standards" },
    ],
  },
  {
    title: "服务",
    links: [
      { label: "交易市场", href: "/trade" },
      { label: "供应商目录", href: "/suppliers" },
      { label: "复材AI", href: "/ai" },
    ],
  },
  {
    title: "技术",
    links: [
      { label: "工艺百科", href: "/tech" },
      { label: "型材计算器", href: "/tech/calculator" },
      { label: "U值计算器", href: "/tech/u-value-calculator" },
    ],
  },
  {
    title: "关于",
    links: [
      { label: "平台介绍", href: "/about" },
      { label: "行业资讯", href: "/news" },
      { label: "社区", href: "/community" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Logo />
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              AI赋能的纤维复合材料数字平台
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              contact@f1frp.com
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {col.title}
              </h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t pt-6 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} 复材站 f1frp.com
        </div>
      </div>
    </footer>
  );
}
