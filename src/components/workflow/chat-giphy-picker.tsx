"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type GifItem = { id: string; previewUrl: string; url: string };

export function ChatGiphyPicker(props: { onSelect: (gifUrl: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("celebrate");
  const [loading, setLoading] = useState(false);
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/giphy?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { gifs?: GifItem[]; message?: string; error?: string };
      if (!res.ok) {
        setError(data.message || data.error || "GIF search unavailable");
        setGifs([]);
        return;
      }
      setGifs(data.gifs ?? []);
    } catch {
      setError("Could not load GIFs");
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when opening / query changes intentionally
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
        title="GIF"
      >
        GIF
      </button>
      {open ? (
        <div className="absolute bottom-full right-0 z-50 mb-1 w-[320px] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Giphy</p>
          <div className="mt-2 flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void load())}
              placeholder="Search…"
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
            />
            <button type="button" onClick={() => void load()} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">
              Search
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-amber-700">{error}</p> : null}
          <div className="mt-2 grid max-h-48 grid-cols-3 gap-1 overflow-y-auto">
            {loading ? (
              <p className="col-span-3 py-6 text-center text-xs text-zinc-500">Loading…</p>
            ) : (
              gifs.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={cn("overflow-hidden rounded-md border border-zinc-100 bg-zinc-50 hover:ring-2 hover:ring-zinc-900/20")}
                  onClick={() => {
                    props.onSelect(g.url);
                    setOpen(false);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.previewUrl} alt="" className="h-20 w-full object-cover" />
                </button>
              ))
            )}
          </div>
          <p className="mt-2 text-[10px] text-zinc-400">Requires GIPHY_API_KEY in .env.local</p>
        </div>
      ) : null}
    </div>
  );
}
