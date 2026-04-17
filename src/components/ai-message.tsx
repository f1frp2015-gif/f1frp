"use client";

import React from "react";

function parseLine(line: string): React.ReactNode {
  // Inline: links [text](url)
  const parts = line.split(/(\[.*?\]\(.*?\))/g);
  const rendered = parts.map((part, i) => {
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
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
        return <React.Fragment key={`${i}-${j}`}>{cp}</React.Fragment>;
      });
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
  return <>{rendered}</>;
}

export function AiMessage({ content }: { content: string }) {
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
          {parseLine(line.slice(1).trim())}
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
          {parseLine(line)}
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
            <span className="text-muted-foreground">{parseLine(value)}</span>
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
              <span>{parseLine(item)}</span>
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
                        {parseLine(cell)}
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
        {parseLine(line)}
      </div>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}
