import Link from "next/link";
import { Logo } from "@/components/logo";

const footerLinks = [
  {
    title: "平台服务",
    links: [
      { label: "材料数据库", href: "/materials" },
      { label: "交易市场", href: "/trade" },
      { label: "供应商目录", href: "/suppliers" },
      { label: "技术中心", href: "/tech" },
    ],
  },
  {
    title: "资源",
    links: [
      { label: "行业资讯", href: "/news" },
      { label: "工艺百科", href: "/tech" },
      { label: "标准文库", href: "/tech#standards" },
      { label: "在线工具", href: "/tech#tools" },
    ],
  },
  {
    title: "关于我们",
    links: [
      { label: "关于复材在线", href: "/about" },
      { label: "联系我们", href: "/about#contact" },
      { label: "广告合作", href: "/about#ad" },
      { label: "加入我们", href: "/about#join" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              中国纤维复合材料一站式数字平台
              <br />
              玻纤 · 碳纤 · 玄武岩 · 芳纶 · 生物基纤维
            </p>
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
              <span>客服微信: f1frp_com</span>
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
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

        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} 复材在线 F1FRP.COM — 中国纤维复合材料一站式数字平台
          </p>
          <p className="mt-1">
            ICP备案号: 待申请 | 增值电信业务经营许可证: 待申请
          </p>
        </div>
      </div>
    </footer>
  );
}
