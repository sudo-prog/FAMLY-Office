import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Inline hook: @/hooks/use-media-query does not exist in this repo (Vite would fail to
// resolve the import), so a minimal matchMedia hook lives here instead.
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

// NOTE: ai-panel.tsx's streamChat is component-scoped (a useCallback inside AIPanel that
// closes over component state), so it cannot be imported. Minimal standalone copy lives here.
const SYSTEM_PROMPT = "You are a helpful financial assistant. Never return code or eval blocks.";

async function streamChat(
  proxyUrl: string,
  model: string,
  history: { role: string; content: string }[],
  text: string,
  _providerLabel: string
): Promise<{ ok: boolean; content: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (proxyUrl.includes("inference-api.nousresearch.com")) {
    const key = import.meta.env.VITE_NOUS_API_KEY || "";
    if (key) headers["Authorization"] = `Bearer ${key}`;
  }

  const res = await fetch(proxyUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [...history, { role: "user", content: text }],
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
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    done = readerDone;
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === "[DONE]") {
        done = true;
        break;
      }
      try {
        const data = JSON.parse(dataStr);
        const delta = data.choices?.[0]?.delta?.content;
        if (delta) content += delta;
      } catch {
        // ignore malformed SSE frames
      }
    }
  }

  return { ok: true, content };
}

interface QuickAskPopoverProps {
  open: boolean;
  onClose: () => void;
  onReplayTour: () => void;
}

type AIMessage = { role: "user" | "assistant"; content: string; routing?: string; model?: string; provider?: string };

export function QuickAskPopover({ open, onClose, onReplayTour }: QuickAskPopoverProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!open) {
      setMessages([]);
      setInput("");
    }
  }, [open]);

  const suggestionChips = [
    "Where do I add an asset?",
    "How does the AI keep my data private?",
    "Show me the document vault",
    "What is net worth?"
  ];

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    
    const userMessage: AIMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await streamChat(
        import.meta.env.VITE_AI_PROXY_URL || 'http://localhost:4000/api/ai/chat',
        "gemini-3.5-flash",
        messages.map(m => ({ role: m.role, content: m.content })),
        text,
        "Gemini"
      );

      if (result.ok) {
        const assistantMessage: AIMessage = {
          role: "assistant",
          content: result.content,
          routing: "cloud",
          model: "gemini-3.5-flash",
          provider: "Gemini"
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: AIMessage = {
          role: "assistant",
          content: result.content || "Sorry, I encountered an error. Please try again.",
          routing: "error"
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: AIMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        routing: "error"
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[70vh] max-h-[70vh] rounded-t-2xl pb-4" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 1rem)` }}>
          <div className="flex flex-col h-full">
            {/* Header with Replay Tour button */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <SheetTitle className="text-sm font-semibold">Ask AI Anything</SheetTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={onReplayTour}
                  className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Replay Tour
                </button>
                <SheetTrigger asChild>
                  <button className="p-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Close">
                    <X className="w-5 h-5" />
                  </button>
                </SheetTrigger>
              </div>
            </div>

            {/* Chat content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">Tap a prompt or type your own:</p>
                  {suggestionChips.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="w-full text-left text-xs px-3.5 py-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 hover:border-primary/40 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/40 border border-border text-foreground rounded-bl-sm"}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-border flex-shrink-0" style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 1rem)` }}>
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything…"
                  disabled={loading}
                  className="bg-muted/30 border-border text-sm h-11 flex-1"
                />
                <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} size="icon" className="bg-primary text-primary-foreground h-11 w-11 flex-shrink-0">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop popover
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50"
        >
          <div className="w-[360px] bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
            {/* Header with Replay Tour button */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Ask AI Anything</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onReplayTour}
                  className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Replay Tour
                </button>
                <button onClick={onClose} className="p-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat content */}
            <div ref={scrollRef} className="flex-1 max-h-[70vh] overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">Tap a prompt or type your own:</p>
                  {suggestionChips.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="w-full text-left text-xs px-3.5 py-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 hover:border-primary/40 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/40 border border-border text-foreground rounded-bl-sm"}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything…"
                  disabled={loading}
                  className="bg-muted/30 border-border text-sm h-11 flex-1"
                />
                <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} size="icon" className="bg-primary text-primary-foreground h-11 w-11 flex-shrink-0">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
