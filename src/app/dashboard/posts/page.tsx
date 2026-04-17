import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function MyPostsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">我的发布</h1>
          <p className="text-sm text-muted-foreground">管理您发布的供需信息和问答</p>
        </div>
        <Link href="/dashboard/posts/new" className={buttonVariants()}>
          发布新信息
        </Link>
      </div>

      <div className="flex gap-2">
        <Badge variant="default" className="cursor-pointer px-3 py-1">全部</Badge>
        <Badge variant="outline" className="cursor-pointer px-3 py-1">采购需求</Badge>
        <Badge variant="outline" className="cursor-pointer px-3 py-1">供应信息</Badge>
        <Badge variant="outline" className="cursor-pointer px-3 py-1">技术问答</Badge>
      </div>

      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <div className="text-4xl">📋</div>
          <p className="mt-3 text-sm font-medium">暂无发布记录</p>
          <p className="mt-1 text-xs">
            发布您的第一条供需信息或技术问答吧
          </p>
          <Link href="/dashboard/posts/new" className={buttonVariants({ size: "sm", className: "mt-4" })}>
            立即发布
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
