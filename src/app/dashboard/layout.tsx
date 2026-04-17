import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "用户中心",
};

const sidebarItems = [
  { href: "/dashboard", label: "总览", icon: "📊" },
  { href: "/dashboard/posts/new", label: "发布信息", icon: "✏️" },
  { href: "/dashboard/posts", label: "我的发布", icon: "📋" },
  { href: "/dashboard/messages", label: "消息询盘", icon: "💬" },
  { href: "/dashboard/enterprise", label: "企业管理", icon: "🏭" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <div className="mb-4 px-3">
            <h2 className="text-lg font-bold">用户中心</h2>
            <p className="text-xs text-muted-foreground">管理您的账户和业务</p>
          </div>
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
