import React from "react";

interface Props { content: string; className?: string }

export function MarkdownReport({ content, className = "" }: Props) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H2
    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-xl font-serif text-foreground mt-8 mb-3 pb-2 border-b border-border/50">{inline(line.slice(3))}</h2>);
      i++; continue;
    }
    // H3
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-base font-semibold text-foreground/90 mt-5 mb-2">{inline(line.slice(4))}</h3>);
      i++; continue;
    }
    // H1
    if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-2xl font-serif text-foreground mt-6 mb-4">{inline(line.slice(2))}</h1>);
      i++; continue;
    }

    // Table — collect contiguous table rows
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<ReportTable key={`table-${i}`} lines={tableLines} />);
      continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      const lang = line.slice(3).trim();
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      i++; // skip closing ```
      elements.push(
        <div key={i} className="my-4 rounded-lg overflow-hidden border border-border/60">
          {lang && <div className="px-3 py-1 bg-muted/60 text-[10px] font-mono text-muted-foreground border-b border-border/40">{lang}</div>}
          <pre className="bg-muted/30 p-4 text-xs font-mono text-foreground/80 overflow-x-auto leading-relaxed">{codeLines.join("\n")}</pre>
        </div>
      );
      continue;
    }

    // Bullet list
    if (line.match(/^[-*•]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*•]\s/)) { items.push(lines[i].slice(2)); i++; }
      elements.push(
        <ul key={`ul-${i}`} className="my-3 space-y-1 ml-4">
          {items.map((it, j) => <li key={j} className="text-sm text-foreground/80 flex gap-2"><span className="text-primary mt-1.5 flex-shrink-0">▸</span><span>{inline(it)}</span></li>)}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-3 space-y-1.5 ml-4 list-none">
          {items.map((it, j) => (
            <li key={j} className="text-sm text-foreground/80 flex gap-3">
              <span className="text-primary font-mono text-xs mt-0.5 flex-shrink-0 w-4 text-right">{j+1}.</span>
              <span>{inline(it)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      elements.push(<hr key={i} className="my-5 border-border/40" />);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="my-3 pl-4 border-l-2 border-primary/50 text-muted-foreground text-sm italic">
          {inline(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // Empty line
    if (line.trim() === "") { i++; continue; }

    // Paragraph
    elements.push(<p key={i} className="text-sm text-foreground/80 leading-relaxed my-2">{inline(line)}</p>);
    i++;
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

function ReportTable({ lines }: { lines: string[] }) {
  const rows = lines.map(l => l.split("|").map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1));
  if (rows.length < 2) return null;
  const headers = rows[0];
  const isSepar = (r: string[]) => r.every(c => /^[-:]+$/.test(c));
  const bodyRows = rows.slice(1).filter(r => !isSepar(r));

  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>{headers.map((h, i) => <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{inline(h)}</th>)}</tr>
        </thead>
        <tbody>
          {bodyRows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-transparent" : "bg-muted/10"}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-foreground/85 border-t border-border/30">{inline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function inline(text: string): React.ReactNode {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    const matches = [
      boldMatch ? { idx: remaining.indexOf(boldMatch[0]), type: "bold", match: boldMatch } : null,
      codeMatch ? { idx: remaining.indexOf(codeMatch[0]), type: "code", match: codeMatch } : null,
      linkMatch ? { idx: remaining.indexOf(linkMatch[0]), type: "link", match: linkMatch } : null,
    ].filter(Boolean) as { idx: number; type: string; match: RegExpMatchArray }[];

    if (matches.length === 0) { parts.push(remaining); break; }
    matches.sort((a, b) => a.idx - b.idx);
    const first = matches[0];

    if (first.idx > 0) parts.push(remaining.slice(0, first.idx));

    if (first.type === "bold") parts.push(<strong key={key++} className="font-semibold text-foreground">{first.match[1]}</strong>);
    else if (first.type === "code") parts.push(<code key={key++} className="font-mono text-xs bg-muted/50 border border-border/40 rounded px-1 py-0.5 text-primary">{first.match[1]}</code>);
    else if (first.type === "link") parts.push(<a key={key++} href={first.match[2]} target="_blank" rel="noreferrer" className="text-primary hover:underline">{first.match[1]}</a>);

    remaining = remaining.slice(first.idx + first.match[0].length);
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}
