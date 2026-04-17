"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { getMessageText } from "@/lib/ai/utils";
import { AiMessage } from "@/components/ai-message";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const scenarios = [
  { icon: "🧪", title: "AI选材推荐", prompts: ["化工储罐内衬用什么树脂？介质30%盐酸", "海上石油平台格栅用什么材料？", "碳纤维和玻纤各有什么优劣？"] },
  { icon: "📋", title: "AI配方设计", prompts: ["手糊成型玻璃钢水箱配方", "拉挤阻燃配方怎么配？", "真空导入船体用什么树脂？"] },
  { icon: "📐", title: "AI工艺指导", prompts: ["手糊制品表面发粘不固化怎么办？", "缠绕管道最佳角度？", "真空导入树脂流速太慢？"] },
  { icon: "📖", title: "AI标准查询", prompts: ["拉挤型材出口欧洲要什么标准？", "弯曲性能中美标准对照？", "玻璃钢储罐参考哪些标准？"] },
  { icon: "💰", title: "AI价格咨询", prompts: ["196#树脂华东什么价格？", "T300碳纤维多少钱？", "ECR玻纤比E-玻纤贵多少？"] },
  { icon: "🏭", title: "AI供应商", prompts: ["江苏做格栅的厂家？", "国内碳纤维企业？", "哪里买乙烯基酯树脂？"] },
];

export function AiAssistantClient() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send(text?: string) {
    const msg = text || input.trim();
    if (!msg || busy) return;
    setInput("");
    await sendMessage({ text: msg });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <Badge variant="secondary" className="mb-3">Beta</Badge>
        <h1 className="text-3xl font-bold">复材AI</h1>
        <p className="mt-2 text-muted-foreground">纤维复合材料专业智能助手 — 选材 · 配方 · 工艺 · 标准 · 价格 · 供应商</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col">
          <div ref={scrollRef} className="min-h-[400px] max-h-[600px] flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center py-16">
                <div className="text-center">
                  <div className="text-5xl">🤖</div>
                  <h3 className="mt-4 text-lg font-semibold">你好，我是复材AI</h3>
                  <p className="mt-1 text-sm text-muted-foreground">问我任何关于纤维复合材料的问题</p>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-foreground text-background" : "bg-background border"}`}>
                  {m.role === "assistant" ? (
                    <AiMessage content={getMessageText(m)} />
                  ) : getMessageText(m)}
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
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="描述你的需求，例如：我需要做化工防腐储罐..."
              className="flex-1 rounded-md border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <Button type="button" size="lg" disabled={busy || !input.trim()} className="shrink-0" onClick={() => send()}>
              发送
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">AI回答基于平台知识库，仅供参考</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">选择场景</h3>
          {scenarios.map((s) => (
            <Card key={s.title}>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="flex items-center gap-1.5 text-sm"><span>{s.icon}</span>{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1">
                {s.prompts.map((p) => (
                  <button key={p} onClick={() => send(p)} className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    {p}
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
