import React from "react";
import Link from "next/link";

function renderInline(line: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  const parts = line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  parts.forEach((part, i) => {
    const bold = part.match(/^\*\*(.+)\*\*$/);
    if (bold) {
      out.push(
        <strong key={i} className="font-semibold text-foreground">
          {bold[1]}
        </strong>
      );
      return;
    }
    const link = part.match(/^\[(.+?)\]\((.+?)\)$/);
    if (link) {
      const href = link[2];
      const isInternal = href.startsWith("/");
      out.push(
        isInternal ? (
          <Link
            key={i}
            href={href}
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            {link[1]}
          </Link>
        ) : (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            {link[1]}
          </a>
        )
      );
      return;
    }
    out.push(part);
  });
  return out;
}

export function ArticleBody({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (line === "" || line === "---") {
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      nodes.push(
        <h2
          key={i}
          className="mt-10 scroll-mt-24 border-l-4 border-primary pl-3 text-xl font-bold leading-snug"
        >
          {renderInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={i} className="mt-6 text-base font-semibold leading-snug">
          {renderInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      nodes.push(
        <blockquote
          key={`q-${i}`}
          className="my-5 border-l-4 border-muted-foreground/30 bg-muted/30 px-4 py-3 text-[15px] italic leading-relaxed text-muted-foreground"
        >
          {quoteLines.map((q, j) => (
            <p key={j}>{renderInline(q)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      nodes.push(
        <ul
          key={`ul-${i}`}
          className="my-4 space-y-2 pl-5 text-[15px] leading-relaxed"
        >
          {items.map((it, j) => (
            <li key={j} className="list-disc marker:text-primary/60">
              {renderInline(it)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+[\.\)]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[\.\)]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[\.\)]\s+/, ""));
        i++;
      }
      nodes.push(
        <ol
          key={`ol-${i}`}
          className="my-4 list-decimal space-y-2 pl-6 text-[15px] leading-relaxed marker:text-primary/60"
        >
          {items.map((it, j) => (
            <li key={j}>{renderInline(it)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph — merge consecutive non-empty, non-special lines
    const para: string[] = [raw];
    i++;
    while (i < lines.length) {
      const next = lines[i];
      const t = next.trim();
      if (
        t === "" ||
        t === "---" ||
        t.startsWith("## ") ||
        t.startsWith("### ") ||
        t.startsWith("> ") ||
        /^[-*]\s/.test(t) ||
        /^\d+[\.\)]\s/.test(t)
      )
        break;
      para.push(next);
      i++;
    }
    nodes.push(
      <p
        key={`p-${i}`}
        className="my-4 text-[15px] leading-[1.9] text-foreground/90"
      >
        {renderInline(para.join(" ").trim())}
      </p>
    );
  }
  return <div className="space-y-1">{nodes}</div>;
}
