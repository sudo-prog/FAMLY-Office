import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Sparkles, Lock, Cloud, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type AIMessage = { role: "user" | "assistant"; content: string; routing?: string; model?: string };

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

  const sendMessage = useCallback(async (msg: string) => {
    const text = msg.trim();
    if (!text || loading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    let content = "";
    let routing = "";
    let model = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "▌", routing, model }]);

    try {
      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, mode }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: `Error: ${err.error ?? "Unknown error"}`, routing: "error" }]);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.routing) routing = data.routing;
            if (data.model) model = data.model;
            if (data.content) content += data.content;
            if (data.done || data.content) {
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: content + (data.done ? "" : "▌"), routing, model },
              ]);
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => [...prev.slice(0, -1), {
        role: "assistant", content: "Connection error. Ensure the API server is running and Local LLM is configured.", routing: "error",
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, mode]);

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
                    {msg.routing === "local" ? (
                      <><Lock className="w-2.5 h-2.5 text-emerald-500" /><span className="text-[9px] text-emerald-500 uppercase tracking-wider">{msg.model}</span></>
                    ) : (
                      <><Cloud className="w-2.5 h-2.5 text-blue-400" /><span className="text-[9px] text-blue-400 uppercase tracking-wider">{msg.model} · sanitized</span></>
                    )}
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
