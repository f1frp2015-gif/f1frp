"use client";

import React from "react";

export type Citation = {
  n: number;
  title: string;
  url: string | null;
  sourceType?: string;
  sourceId?: string;
};

// Replace all inline [#N] markers in a string with citation pills.
function renderWithCitations(
  text: string,
  citations?: Citation[]
): React.ReactNode[] {
  if (!citations?.length) return [text];
  const map = new Map(citations.map((c) => [c.n, c]));
  const out: React.ReactNode[] = [];
  const re = /\[#(\d+)\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const n = Number(match[1]);
    const c = map.get(n);
    if (match.index > last) out.push(text.slice(last, match.index));
    if (c?.url) {
      out.push(
        <a
          key={`cite-${match.index}`}
          href={c.url}
          title={c.title}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-0.5 inline-flex h-4 min-w-[18px] items-center justify-center rounded-sm border border-signal/30 bg-signal/10 px-1 font-mono text-[10px] leading-none text-signal hover:bg-signal/20"
        >
          {n}
        </a>
      );
    } else {
      out.push(
        <span
          key={`cite-${match.index}`}
          className="mx-0.5 inline-flex h-4 items-center rounded-sm border border-border px-1 font-mono text-[10px] text-muted-foreground"
        >
          {n}
        </span>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function parseLine(line: string, citations?: Citation[]): React.ReactNode {
  // Inline: links [text](url)
  const parts = line.split(/(\[[^\]#][^\]]*?\]\([^)]*?\))/g);
  const rendered = parts.map((part, i) => {
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          {linkMatch[1]}
        </a>
      );
    }
    // Inline code `code`
    const codeParts = part.split(/(`[^`]+`)/g);
    if (codeParts.length > 1) {
      return codeParts.map((cp, j) => {
        if (cp.startsWith("`") && cp.endsWith("`")) {
          return (
            <code
              key={`${i}-${j}`}
              className="rounded bg-muted px-1 py-0.5 text-xs font-mono"
            >
              {cp.slice(1, -1)}
            </code>
          );
        }
        return (
          <React.Fragment key={`${i}-${j}`}>
            {renderWithCitations(cp, citations)}
          </React.Fragment>
        );
      });
    }
    return (
      <React.Fragment key={i}>
        {renderWithCitations(part, citations)}
      </React.Fragment>
    );
  });
  return <>{rendered}</>;
}

export function AiMessage({
  content,
  citations,
}: {
  content: string;
  citations?: Citation[];
}) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line → spacer
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // H3: ### heading
    if (line.startsWith("### ")) {
      elements.push(
        <div key={i} className="mt-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {line.slice(4)}
        </div>
      );
      i++;
      continue;
    }

    // H2: ## heading
    if (line.startsWith("## ")) {
      elements.push(
        <div key={i} className="mt-3 mb-1.5 text-sm font-semibold">
          {line.slice(3)}
        </div>
      );
      i++;
      continue;
    }

    // Highlight: 〉recommendation
    if (line.startsWith("〉")) {
      elements.push(
        <div
          key={i}
          className="my-1.5 rounded-md border-l-2 border-primary bg-primary/5 px-3 py-2 text-sm"
        >
          {parseLine(line.slice(1).trim(), citations)}
        </div>
      );
      i++;
      continue;
    }

    // Warning: ⚠
    if (line.startsWith("⚠")) {
      elements.push(
        <div
          key={i}
          className="my-1.5 rounded-md border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950"
        >
          {parseLine(line, citations)}
        </div>
      );
      i++;
      continue;
    }

    // Arrow comparison: xxx → yyy
    if (line.includes("→") && !line.startsWith("·") && !line.startsWith("-") && !line.startsWith("〉")) {
      const [label, ...rest] = line.split("→");
      const value = rest.join("→").trim();
      if (label.trim() && value) {
        elements.push(
          <div key={i} className="flex items-baseline gap-2 py-0.5 text-sm">
            <span className="shrink-0 font-medium">{label.trim()}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-muted-foreground">{parseLine(value, citations)}</span>
          </div>
        );
        i++;
        continue;
      }
    }

    // List items: · or - or * or numbered
    if (/^[·\-\*]\s/.test(line) || /^\d+[\.\)]\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && (/^[·\-\*]\s/.test(lines[i]) || /^\d+[\.\)]\s/.test(lines[i]))) {
        listItems.push(lines[i].replace(/^[·\-\*]\s+/, "").replace(/^\d+[\.\)]\s+/, ""));
        i++;
      }
      elements.push(
        <div key={`list-${i}`} className="space-y-1 py-1">
          {listItems.map((item, j) => (
            <div key={j} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
              <span>{parseLine(item, citations)}</span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Markdown table: | col | col |
    if (line.startsWith("|") && line.includes("|", 1)) {
      const tableRows: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!lines[i].match(/^\|[\s\-:]+\|/)) {
          tableRows.push(lines[i]);
        }
        i++;
      }
      if (tableRows.length > 0) {
        const header = tableRows[0]
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim());
        const body = tableRows.slice(1).map((row) =>
          row
            .split("|")
            .filter((c) => c.trim())
            .map((c) => c.trim())
        );
        elements.push(
          <div key={`table-${i}`} className="my-2 overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  {header.map((h, j) => (
                    <th key={j} className="px-3 py-1.5 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, j) => (
                  <tr key={j} className="border-b last:border-0">
                    {row.map((cell, k) => (
                      <td key={k} className="px-3 py-1.5">
                        {parseLine(cell, citations)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Regular paragraph
    elements.push(
      <div key={i} className="text-sm leading-relaxed">
        {parseLine(line, citations)}
      </div>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}
