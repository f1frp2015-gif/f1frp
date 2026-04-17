import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">欢迎回来</h1>
        <p className="text-sm text-muted-foreground">
          管理您的供需信息、企业资料和消息
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">我的发布</div>
            <div className="mt-1 text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">收到询盘</div>
            <div className="mt-1 text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">浏览量</div>
            <div className="mt-1 text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">会员等级</div>
            <div className="mt-1 text-2xl font-bold">免费版</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Link href="/dashboard/posts/new" className={buttonVariants({ variant: "default", size: "sm" })}>
              发布采购需求
            </Link>
            <Link href="/dashboard/posts/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              发布供应信息
            </Link>
            <Link href="/dashboard/enterprise" className={buttonVariants({ variant: "outline", size: "sm" })}>
              完善企业资料
            </Link>
            <Link href="/dashboard/posts/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              发布技术问答
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">平台规则</CardTitle>
            <CardDescription>发布信息前请仔细阅读</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">1</Badge>
              <span>实名认证用户可发布供需信息，企业认证后可获得更多展示权益</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">2</Badge>
              <span>供需信息有效期30天，过期自动关闭，可续期</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">3</Badge>
              <span>禁止发布虚假信息、重复刷屏、恶意竞争，违规将被封号</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">4</Badge>
              <span>技术问答社区鼓励专业回答，优质内容获得积分和排名提升</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">5</Badge>
              <span>平台提供信息撮合服务，交易双方需自行确认对方资质和产品质量</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
