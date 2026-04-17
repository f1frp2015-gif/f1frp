import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">消息与询盘</h1>
        <p className="text-sm text-muted-foreground">查看收到的询盘和系统通知</p>
      </div>

      <Tabs defaultValue="inquiries">
        <TabsList>
          <TabsTrigger value="inquiries">询盘消息</TabsTrigger>
          <TabsTrigger value="system">系统通知</TabsTrigger>
        </TabsList>

        <TabsContent value="inquiries" className="mt-4">
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <div className="text-4xl">💬</div>
              <p className="mt-3 text-sm font-medium">暂无询盘消息</p>
              <p className="mt-1 text-xs">
                当其他用户对您发布的信息感兴趣时，询盘消息会出现在这里
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <div className="text-4xl">🔔</div>
              <p className="mt-3 text-sm font-medium">暂无系统通知</p>
              <p className="mt-1 text-xs">
                企业认证审核结果、供需信息状态变更等通知会出现在这里
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
