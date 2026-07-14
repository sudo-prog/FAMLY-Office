import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Sparkles, Lock, Cloud, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── AI Self-Heal ──────────────────────────────────────────────────────
function buildDomSnapshot(): string {
  const els: string[] = [];
  const walk = (el: Element, depth: number) => {
    if (depth > 3) return;
    if (!el || el.nodeType !== 1) return;
    const tag = el.tagName?.toLowerCase();
    if (!tag || tag === "script" || tag === "style" || tag === "meta") return;
    const cls = el.getAttribute("class") || "";
    const id = el.id || "";
    if (id || cls) {
      els.push("<" + tag + (id ? ' id="' + id + '"' : "") + (cls ? ' class="' + cls.split(/\s+/).filter(c => c.length < 30).join(" ") + '"' : "") + ">");
    }
    for (let i = 0; i < el.children.length; i++) walk(el.children[i], depth + 1);
  };
  walk(document.body, 0);
  return els.slice(0, 50).join("\n");
}

function executeAIFix(code: string): string {
  try { const r = new Function(code)(); return "Fixed: " + (r !== undefined ? String(r) : "done"); }
  catch (e: any) { return "Fix error: " + e.message; }
}

const SELF_HEAL_PROMPT = `

━━━ SELF-HEAL CAPABILITY ━━━
When the user reports a bug, you can fix it in the DOM.
The user message includes a DOM_SNAPSHOT. Use it to target real elements.
To fix issues, include a JSON block in your response like:
\`\`\`fix
{"type":"EVAL","code":"document.querySelectorAll('.stale').forEach(el=>el.remove())"}
\`\`\`
Operations: EVAL (run JS), FIX_NOTIFICATIONS (clear stuck toasts), CLEAR_STALE (remove by selector).
RULES: Check DOM_SNAPSHOT first — NEVER guess selectors. Use EVAL for immediate fixes.`;

const PRIMARY_PROXY = "https://textbooks-careful-shut-dev.trycloudflare.com/v1/chat/completions";
const PRIMARY_MODEL = "gemini-3.5-flash";
const FALLBACK_PROXY = "https://textbooks-careful-shut-dev.trycloudflare.com/v1/chat/completions";
const FALLBACK_MODEL = "gemini-3.5-flash";

type AIMessage = { role: "user" | "assistant"; content: string; routing?: string; model?: string; provider?: string };

interface AIPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  suggestions: string[];
  mode?: "auto" | "local" | "cloud";
}

export function AIPanel({ open, onClose, title, suggestions, mode = "local" }: AIPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!open) { setMessages([]); setInput(""); }
  }, [open]);

  const streamChat = useCallback(async (
    proxyUrl: string,
    model: string,
    history: { role: string; content: string }[],
    text: string,
    providerLabel: string,
  ): Promise<{ ok: boolean; content: string }> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (proxyUrl.includes("inference-api.nousresearch.com")) {
      const key = import.meta.env.VITE_NOUS_API_KEY || "";
      if (key) headers["Authorization"] = `Bearer ${key}`;
    }
    // Inject DOM snapshot for self-heal capability
    const domSnapshot = buildDomSnapshot();
    const enrichedText = text + "\n\n[DOM_SNAPSHOT]\n" + domSnapshot + "\n[/DOM_SNAPSHOT]";

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        stream: true,
        system: SELF_HEAL_PROMPT,
        messages: [
          ...history,
          { role: "user", content: enrichedText },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return { ok: false, content: `Error: ${errText}` };
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    let respRouting = "cloud";
    let respModel = model;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === "[DONE]") break;
        try {
          const data = JSON.parse(dataStr);
          // Surface backend routing/model (first SSE event may be { routing, model, content:"" })
          if (typeof data.routing === "string") respRouting = data.routing;
          if (typeof data.model === "string") respModel = data.model;
          const delta = data.choices?.[0]?.delta?.content;
          if (delta) {
            content += delta;
            setMessages((prev) => [
              ...prev.slice(0, -1),
              { role: "assistant", content: content + "▌", routing: respRouting, model: respModel, provider: providerLabel },
            ]);
          }
        } catch {}
      }
    }

    // Parse self-heal fix blocks from streamed content
    const fixMatch = content.match(/```fix\s*\n?([\s\S]*?)\n?```/);
    if (fixMatch) {
      try {
        const fixOps = JSON.parse(fixMatch[1]);
        const ops = Array.isArray(fixOps) ? fixOps : [fixOps];
        for (const op of ops) {
          if (op.type === "EVAL" && op.code) executeAIFix(op.code);
          else if (op.type === "FIX_NOTIFICATIONS")
            document.querySelectorAll('[class*="notification"],[class*="toast"],[role="alert"]').forEach(e => e.remove());
          else if (op.type === "CLEAR_STALE" && op[0])
            document.querySelectorAll(op[0]).forEach(e => e.remove());
        }
        content = content.replace(/```fix\s*\n?[\s\S]*?\n?```/g, "").trim();
        content += "\n\n🔧 Auto-fix applied";
      } catch (_) { /* ignore */ }
    }

    // Final update: remove cursor
    setMessages((prev) => [
      ...prev.slice(0, -1),
      { role: "assistant", content, routing: respRouting, model: respModel, provider: providerLabel },
    ]);

    return { ok: true, content };
  }, []);

  const sendMessage = useCallback(async (msg: string) => {
    const text = msg.trim();
    if (!text || loading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    // Placeholder message while streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "▌", routing: "cloud", model: PRIMARY_MODEL, provider: "Hermes" }]);

    // Try primary (Nous/Hermes) first
    let result = await streamChat(PRIMARY_PROXY, PRIMARY_MODEL, history, text, "Hermes");

    if (!result.ok) {
      // Update placeholder to indicate fallback
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "▌", routing: "cloud", model: FALLBACK_MODEL, provider: "Gemini" },
      ]);
      // Try fallback (Gemini)
      result = await streamChat(FALLBACK_PROXY, FALLBACK_MODEL, history, text, "Gemini");
    }

    if (!result.ok) {
      // Both failed — show error
      setMessages((prev) => [...prev.slice(0, -1), {
        role: "assistant", content: result.content, routing: "error",
      }]);
    }

    setLoading(false);
  }, [loading, messages, streamChat]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[440px] bg-card border-l border-border z-50 flex flex-col shadow-2xl">
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{title}</span>
            {mode !== "cloud" && (
              <div className="flex items-center gap-1 ml-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-emerald-500 uppercase tracking-wider">Local · Private</span>
              </div>
            )}
            {mode === "cloud" && (
              <div className="flex items-center gap-1 ml-1">
                <Cloud className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-blue-400 uppercase tracking-wider">Cloud · Sanitized</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">Tap a prompt or type your own:</p>
              {suggestions.map((s) => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="w-full text-left text-xs px-3.5 py-2.5 rounded-xl bg-muted/20 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/30 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/40 border border-border text-foreground rounded-bl-sm"}`}>
                {msg.routing && msg.role === "assistant" && msg.routing !== "error" && (
                  <div className="flex items-center gap-1 mb-1.5 opacity-70">
                    {msg.provider === "Hermes" ? (
                      <><Sparkles className="w-2.5 h-2.5 text-amber-400" /><span className="text-[9px] text-amber-400 uppercase tracking-wider">via Hermes</span></>
                    ) : (
                      <><Cloud className="w-2.5 h-2.5 text-blue-400" /><span className="text-[9px] text-blue-400 uppercase tracking-wider">via Gemini</span></>
                    )}
                  </div>
                )}
                {msg.role === "assistant" && (msg.model === "demo" || msg.routing === "demo") && (
                  <div className="inline-flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                    <span className="text-[9px] text-amber-400 tracking-wide">Demo response — configure an AI provider in Settings</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask anything…" disabled={loading}
              className="bg-muted/30 border-border text-sm h-9" />
            <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} size="icon"
              className="bg-primary text-primary-foreground h-9 w-9 flex-shrink-0">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
