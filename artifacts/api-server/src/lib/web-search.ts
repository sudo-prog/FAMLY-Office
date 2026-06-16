export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

async function braveSearch(query: string, max: number): Promise<SearchResult[]> {
  const key = process.env.BRAVE_SEARCH_KEY!;
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${max}&freshness=pd`,
    { headers: { Accept: "application/json", "X-Subscription-Token": key }, signal: AbortSignal.timeout(8000) }
  );
  const data = await res.json() as any;
  return (data.web?.results ?? []).slice(0, max).map((r: any) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    snippet: r.description ?? r.extra_snippets?.[0] ?? "",
    source: "brave",
  }));
}

async function ddgSearch(query: string, max: number): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1&t=family-office-ai`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await res.json() as any;
  const results: SearchResult[] = [];

  if (data.AbstractText) {
    results.push({ title: data.Heading || data.AbstractSource || "Summary", url: data.AbstractURL || "", snippet: data.AbstractText.slice(0, 400), source: "ddg" });
  }
  for (const t of (data.RelatedTopics ?? []).slice(0, max - 1)) {
    if (t.Text && t.FirstURL) results.push({ title: t.Text.slice(0, 80), url: t.FirstURL, snippet: t.Text.slice(0, 300), source: "ddg" });
  }
  return results.slice(0, max);
}

export async function webSearch(query: string, max = 5): Promise<SearchResult[]> {
  try {
    if (process.env.BRAVE_SEARCH_KEY) return await braveSearch(query, max);
    return await ddgSearch(query, max);
  } catch {
    return [];
  }
}

export function buildSearchQueries(mainQuery: string, depth: string): string[] {
  const base = mainQuery.trim();
  const queries = [base];
  if (depth !== "quick") {
    queries.push(`${base} 2025 2026 outlook forecast`);
    queries.push(`${base} risk factors analysis`);
  }
  if (depth === "deep") {
    queries.push(`${base} Australia interest rates impact`);
    queries.push(`${base} investment strategy recommendations`);
  }
  return queries.slice(0, depth === "deep" ? 5 : depth === "standard" ? 3 : 1);
}
