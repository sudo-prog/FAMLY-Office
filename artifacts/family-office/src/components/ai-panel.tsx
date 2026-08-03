import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Sparkles, Lock, Cloud, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// SECURITY NOTE: executeAIFix (raw eval) was removed on 2026-08-02. AI responses are now dispatched through a closed allow-list (dispatchAIAction). Do not reintroduce arbitrary code execution from LLM output — see FAMLY-OFFICE-AUDIT-IMPLEMENTATION-PLAN.md P0 for rationale.

// ─── AI Action Dispatch (Closed Allow-List) ────────────────────────────────
type AllowedAction =
  | { action: 'DISMISS_TOAST'; target: string }
  | { action: 'NAVIGATE'; route: string }
  | { action: 'SCROLL_TO'; selector: string }
  | { action: 'TOGGLE_THEME' }
  | { action: 'OPEN_PANEL'; panel: string };

function dispatchAIAction(action: AllowedAction) {
  switch (action.action) {
    case 'DISMISS_TOAST':
      document.querySelector(action.target)?.remove();
      break;
    case 'NAVIGATE':
      window.location.hash = action.route;
      break;
    case 'SCROLL_TO':
      document.querySelector(action.selector)?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'TOGGLE_THEME':
      document.documentElement.classList.toggle('dark');
      break;
    case 'OPEN_PANEL':
      // dispatch custom event
      document.dispatchEvent(new CustomEvent('openPanel', { detail: { panel: action.panel } }));
      break;
  }
}

// Minimal DOM snapshot for debugging (only used when user opts in)
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

const SYSTEM_PROMPT = 'You are a helpful financial assistant. You can request UI actions by returning JSON blocks like {"type":"ACTION","action":"NAVIGATE","route":"/assets"}. Never return code or eval blocks.';

// SECURITY: VITE_NOUS_API_KEY is visible in client bundle. TODO: Route through api-server proxy to keep key server-side.
const PRIMARY_PROXY = import.meta.env.VITE_AI_PROXY_URL || '/api/ai/chat';
const PRIMARY_MODEL = "gemini-3.5-flash";

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
  const [domOptIn, setDomOptIn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!open) { setMessages([]); setInput(""); }
  }, [open]);

  // Detect mobile devices
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileDevice = window.matchMedia('(max-width: 767px)').matches;
      setIsMobile(isMobileDevice);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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
    
    // Only include DOM snapshot if user has opted in
    let enrichedText = text;
    if (domOptIn) {
      // Build minimal DOM snapshot for debugging
      const domSnapshot = buildDomSnapshot();
      enrichedText = text + "\n\n[DOM_SNAPSHOT]\n" + domSnapshot + "\n[/DOM_SNAPSHOT]";
    }

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        stream: true,
        system: SYSTEM_PROMPT,
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

    // Parse AI actions from streamed content
    const actionMatch = content.match(/```(?:json|JSON)\s*\n?([\s\S]*?)\n?```/);
    if (actionMatch) {
      try {
        const actionData = JSON.parse(actionMatch[1]);
        if (actionData.type === "ACTION") {
          dispatchAIAction(actionData);
        }
      } catch (e) {
        console.warn("Failed to parse AI action:", e);
      }
    }

    return { ok: true, content };
  }, [domOptIn]);

  const sendMessage = useCallback(async (msg: string) => {
    const text = msg.trim();
    if (!text || loading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    // Placeholder message while streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "▌", routing: "cloud", model: PRIMARY_MODEL, provider: "Hermes" }]);

    // Try primary proxy only
    const result = await streamChat(PRIMARY_PROXY, PRIMARY_MODEL, history, text, "Hermes");

    if (!result.ok) {
      // Both failed — show error
      setMessages((prev) => [...prev.slice(0, -1), {
        role: "assistant", content: result.content, routing: "error",
      }]);
    }

    setLoading(false);
  }, [loading, messages, streamChat, domOptIn]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className={`${isMobile ? 'fixed inset-x-0 bottom-0 top-auto max-h-[85vh] w-full rounded-t-2xl pb-[env(safe-area-inset-bottom)]' : 'fixed right-0 top-0 h-full w-[440px]'} bg-card border-l border-border z-50 flex flex-col shadow-2xl`}>
        {isMobile && (
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-2 mb-2 sm:hidden"></div>
        )}
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
          <button onClick={onClose} className="flex items-center justify-center text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && null}
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
              className="bg-primary text-primary-foreground h-11 w-11 flex-shrink-0">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Switch id="dom-opt-in" checked={domOptIn} onCheckedChange={setDomOptIn} />
            <Label htmlFor="dom-opt-in" className="text-xs text-muted-foreground">
              Include screen context for debugging
            </Label>
          </div>
        </div>
      </div>
    </>
  );
}
