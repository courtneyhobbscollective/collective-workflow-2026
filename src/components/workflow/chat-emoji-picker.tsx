"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Curated emoji set — no extra npm deps. */
const EMOJI_GRID = [
  "😀", "😃", "😄", "😁", "😅", "🤣", "😂", "🙂", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😋",
  "👍", "👎", "👏", "🙌", "🤝", "🙏", "💪", "✨", "🔥", "💯", "⭐", "❤️", "💙", "💚", "💛", "🧡", "💜",
  "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "✅", "❌", "⚠️", "📌", "📎", "🔗", "📝", "📣", "💬", "🔖",
  "☕", "🍕", "🍰", "🚀", "💻", "📱", "🎬", "📸", "🎨", "✏️", "📅", "⏰", "🔔", "💡", "🧠", "📊",
];

export function ChatEmojiPicker(props: { onInsert: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        title="Emoji"
      >
        😊
      </button>
      {open ? (
        <div
          className={cn(
            "absolute bottom-full right-0 z-50 mb-1 w-[280px] rounded-xl border border-zinc-200 bg-white p-2 shadow-lg",
            "max-h-56 overflow-y-auto"
          )}
        >
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Emoji</p>
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_GRID.map((e) => (
              <button
                key={e}
                type="button"
                className="flex h-8 w-full items-center justify-center rounded-md text-lg hover:bg-zinc-100"
                onClick={() => {
                  props.onInsert(e);
                  setOpen(false);
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
