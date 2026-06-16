import type { Response } from "express";

export type AISensitivity = "local" | "cloud";

const SENSITIVE_SIGNALS = [
  "my portfolio", "my asset", "my net worth", "my account", "my entity",
  "my trust", "my company", "my transaction", "my investment", "my property",
  "my document", "my tax", "tax deductible", "capital gain", "how much do i",
  "what is my", "analyze my", "summarize my", "my balance", "my holding",
  "our portfolio", "our asset", "our entity", "our trust",
];

const RESEARCH_SIGNALS = [
  "research", "latest news", "market analysis", "sector analysis",
  "economic outlook", "interest rate", "inflation", "regulatory update",
  "industry trend", "global market", "asx outlook", "what is the",
  "how does the", "explain the concept", "define", "best practice",
];

export function classifyQuery(message: string): AISensitivity {
  const lower = message.toLowerCase();
  if (SENSITIVE_SIGNALS.some((s) => lower.includes(s))) return "local";
  const researchCount = RESEARCH_SIGNALS.filter((s) => lower.includes(s)).length;
  if (researchCount >= 2) return "cloud";
  return "local"; // fail-secure default
}

export function sanitizeForCloud(text: string): string {
  return text
    .replace(/\$[\d,]+(\.\d{1,2})?/g, "[amount]")
    .replace(/\b\d{6,}\b/g, "[number]")
    .replace(/\b(ABN|ACN|TFN)[\s:]*[\d\s]+/gi, "[identifier]")
    .replace(/trust|entity|holding company/gi, "[structure]");
}

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function streamLocalLLM(
  messages: ChatMessage[],
  system: string,
  res: Response
): Promise<void> {
  const baseUrl = process.env.LOCAL_LLM_URL || "http://localhost:11434/v1";
  const model = process.env.LOCAL_LLM_MODEL || "llama3.2";

  let response: globalThis.Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer ollama" },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: `Local LLM unreachable: ${err.message}. Is Ollama running at ${baseUrl}?` })}\n\n`);
    return;
  }

  if (!response.ok) {
    const txt = await response.text();
    res.write(`data: ${JSON.stringify({ error: `Local LLM error ${response.status}: ${txt.slice(0, 200)}` })}\n\n`);
    return;
  }

  await pipeSSEStream(response, res);
}

export async function streamCloudLLM(
  messages: ChatMessage[],
  res: Response
): Promise<void> {
  const apiKey = process.env.CLOUD_AI_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ error: "Cloud AI not configured. Add CLOUD_AI_KEY secret." })}\n\n`);
    return;
  }

  const model = process.env.CLOUD_AI_MODEL || "gpt-4o-mini";
  const baseUrl = process.env.CLOUD_AI_URL || "https://api.openai.com/v1";

  const CLOUD_SYSTEM = `You are a financial research assistant for a family office. 
Your role is strictly non-sensitive: provide market research, economic analysis, industry trends, 
regulatory information, and general investment concepts. 
Do NOT ask for, store, or reference any specific portfolio details, account numbers, or client PII.
Responses should be educational and general in nature.`;

  let response: globalThis.Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        stream: true,
        messages: [{ role: "system", content: CLOUD_SYSTEM }, ...messages],
      }),
    });
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: `Cloud AI unreachable: ${err.message}` })}\n\n`);
    return;
  }

  if (!response.ok) {
    const txt = await response.text();
    res.write(`data: ${JSON.stringify({ error: `Cloud AI error ${response.status}: ${txt.slice(0, 200)}` })}\n\n`);
    return;
  }

  await pipeSSEStream(response, res);
}

async function pipeSSEStream(response: globalThis.Response, res: Response): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
        } catch {}
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function checkLocalLLMStatus(): Promise<{ online: boolean; models: string[] }> {
  const baseUrl = process.env.LOCAL_LLM_URL || "http://localhost:11434/v1";
  try {
    const r = await fetch(`${baseUrl}/models`, {
      signal: AbortSignal.timeout(2000),
      headers: { Authorization: "Bearer ollama" },
    });
    if (!r.ok) return { online: false, models: [] };
    const data = await r.json() as { data?: Array<{ id: string }> };
    return { online: true, models: (data.data ?? []).map((m) => m.id) };
  } catch {
    return { online: false, models: [] };
  }
}
