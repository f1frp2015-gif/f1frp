"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { getMessageText } from "@/lib/ai/utils";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const scenarios = [
  {
    icon: "🧪", title: "AI选材推荐",
    prompts: [
      "我需要做化工储罐内衬，介质是30%盐酸，60°C长期浸泡，推荐什么树脂和纤维？",
      "海上石油平台走道格栅用什么材料？要求阻燃一级、耐盐雾",
      "碳纤维和玻纤在汽车轻量化方面各有什么优劣势？",
    ],
  },
  {
    icon: "📋", title: "AI配方设计",
    prompts: [
      "给我一个手糊成型的基础玻璃钢配方，用于做水箱",
      "拉挤型材需要阻燃，ATH填料加多少合适？",
      "真空导入大型船体用什么树脂体系？粘度要求多少？",
    ],
  },
  {
    icon: "📐", title: "AI工艺指导",
    prompts: [
      "手糊制品表面发粘不固化是什么原因？怎么解决？",
      "缠绕管道的最佳缠绕角度怎么确定？",
      "真空导入时树脂流速太慢如何优化导流介质布局？",
    ],
  },
  {
    icon: "📖", title: "AI标准查询",
    prompts: [
      "FRP拉挤型材出口欧洲需要满足什么标准？",
      "中国和美国的弯曲性能测试标准有什么对应关系？",
      "玻璃钢储罐设计参考哪些标准？",
    ],
  },
  {
    icon: "💰", title: "AI价格咨询",
    prompts: [
      "目前196#树脂华东地区什么价格？趋势如何？",
      "T300碳纤维现在多少钱一米？",
      "ECR玻纤比普通E-玻纤贵多少？值得用吗？",
    ],
  },
  {
    icon: "🏭", title: "AI供应商匹配",
    prompts: [
      "帮我找江苏地区做玻璃钢格栅的厂家",
      "国内碳纤维主要生产企业有哪些？",
      "哪里能买到乙烯基酯树脂？",
    ],
  },
];

const chatTransport = new DefaultChatTransport({ api: "/api/chat" });

function MarkdownLite({ content }: { content: string }) {
  const parts = content.split(/(\[.*?\]\(.*?\))/g);
  return (
    <span>
      {parts.map((part, i) => {
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          return (
            <a key={i} href={linkMatch[2]} className="text-primary underline underline-offset-2 hover:text-primary/80">
              {linkMatch[1]}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function AiAssistantClient() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localInput, setLocalInput] = useState("");

  const { messages, sendMessage, status } = useChat({ transport: chatTransport });
  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function send(text?: string) {
    const msg = text || localInput.trim();
    if (!msg || busy) return;
    sendMessage({ text: msg });
    setLocalInput("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <Badge variant="secondary" className="mb-3">Beta</Badge>
        <h1 className="text-3xl font-bold">复材AI</h1>
        <p className="mt-2 text-muted-foreground">
          纤维复合材料专业智能助手 — 选材 · 配方 · 工艺 · 标准 · 价格 · 供应商
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col">
          <div ref={scrollRef} className="min-h-[400px] max-h-[600px] flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center py-16">
                <div className="text-center">
                  <div className="text-5xl">🤖</div>
                  <h3 className="mt-4 text-lg font-semibold">你好，我是复材AI</h3>
                  <p className="mt-1 text-sm text-muted-foreground">问我任何关于纤维复合材料的问题</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">从右侧选择场景快速开始，或直接输入问题</p>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-foreground text-background" : "bg-background border"}`}>
                  {m.role === "assistant" ? (
                    <div className="whitespace-pre-wrap"><MarkdownLite content={getMessageText(m)} /></div>
                  ) : (
                    getMessageText(m)
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-lg border bg-background px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/30" style={{ animationDelay: "300ms" }} />
                    </div>
                    复材AI正在思考...
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Textarea
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="描述你的需求，例如：我需要做化工防腐储罐，介质是浓硫酸..."
              rows={2}
              className="min-h-[52px] max-h-[120px] resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <Button type="button" size="lg" disabled={busy || !localInput.trim()} className="shrink-0 self-end" onClick={() => send()}>
              发送
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            AI回答基于平台知识库，仅供参考。涉及工程设计请咨询专业人员验证。
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">选择场景</h3>
          {scenarios.map((s) => (
            <Card key={s.title} className="overflow-hidden">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <span>{s.icon}</span>{s.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-1">
                  {s.prompts.map((p) => (
                    <button key={p} onClick={() => send(p)} className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      {p}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
