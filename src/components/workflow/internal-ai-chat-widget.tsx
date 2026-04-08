"use client";

import { FormEvent, useMemo, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function InternalAiChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        hint?: string;
        detail?: string;
        conversationId?: string;
      };
      if (!res.ok || !data.reply) {
        const parts = [data.hint, process.env.NODE_ENV === "development" ? data.detail : null].filter(Boolean);
        throw new Error(parts.join(" ") || data.error || "Assistant failed to respond.");
      }

      if (data.conversationId) setConversationId(data.conversationId);
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setMessages(nextMessages);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Workflow AI</p>
              <p className="text-xs text-zinc-500">Internal assistant</p>
            </div>
            <button
              type="button"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-80 overflow-y-auto space-y-3 px-4 py-3 bg-zinc-50/60">
            {!hasMessages ? (
              <p className="text-sm text-zinc-500">
                Ask me about clients, briefs, recent updates, and delivery risks.
              </p>
            ) : null}
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user" ? "ml-6 bg-zinc-900 text-white" : "mr-6 border border-zinc-200 bg-white text-zinc-800"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {busy ? <p className="text-xs text-zinc-500">Thinking...</p> : null}
            {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          </div>

          <form onSubmit={onSubmit} className="border-t border-zinc-200 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Give me the latest on Acme client..."
              className="min-h-20 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            />
            <div className="mt-2 flex justify-end">
              <Button type="submit" disabled={busy || !input.trim()}>
                Send
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-zinc-800"
          aria-label="Open assistant"
        >
          <MessageSquare className="h-4 w-4" />
          Ask AI
        </button>
      )}
    </div>
  );
}
