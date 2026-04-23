"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

type Citation = { index: number; title: string; url: string };

export function AskBox({ locale }: { locale: string }) {
  const t = useTranslations("CommunityAsk");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    setCitations([]);
    setError(null);

    try {
      const res = await fetch("/api/community/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unknown error");
      } else {
        setAnswer(data.answer);
        setCitations(data.citations ?? []);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleAskAnother() {
    setAnswer(null);
    setCitations([]);
    setError(null);
    setQuestion("");
  }

  return (
    <Card className="mb-8 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles size={16} className="text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!answer && !loading && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              className="min-h-[80px] w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={t("inputPlaceholder")}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={1000}
              disabled={loading}
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              size="sm"
              className="self-end"
              disabled={!question.trim() || loading}
            >
              {t("submit")}
            </Button>
          </form>
        )}

        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <span className="animate-pulse">{t("aiAnswering")}</span>
          </div>
        )}

        {answer && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                {t("answerLabel")}
              </p>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {answer}
              </div>
            </div>

            {citations.length > 0 && (
              <div className="border-t pt-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("citationsLabel")}
                </p>
                <ul className="space-y-1">
                  {citations.map((c) => (
                    <li key={c.index} className="text-xs">
                      <span className="text-muted-foreground">[#{c.index}]</span>{" "}
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {c.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAskAnother}
            >
              {t("askAnother")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
