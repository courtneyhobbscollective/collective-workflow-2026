"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, BookOpen } from "lucide-react";
import {
  HELP_CATEGORIES,
  type HelpArticle,
  type HelpAudience,
  type HelpCategory,
  searchArticles,
} from "@/lib/help/content";
import { cn } from "@/lib/utils";

function categoryForAudience(audience: HelpAudience): HelpCategory[] {
  if (audience === "client") {
    return ["Portal", "Getting started"];
  }
  return HELP_CATEGORIES.filter((c) => c !== "Portal");
}

export function HelpCenter({ audience }: { audience: HelpAudience }) {
  const basePath = audience === "client" ? "/portal/help" : "/help";
  const categories = categoryForAudience(audience);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategory | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const results = useMemo(() => searchArticles(query, audience), [query, audience]);

  const filtered = useMemo(() => {
    if (category === "All") return results;
    return results.filter((a) => a.category === category);
  }, [results, category]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    if (!hash) return;
    const match = filtered.find((a) => a.id === hash) ?? results.find((a) => a.id === hash);
    if (match) setOpenId(match.id);
    const el = document.getElementById(`help-article-${hash}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [filtered, results]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        document.getElementById("help-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="help-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides…"
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>
        <p className="text-xs text-zinc-500">
          Press <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-mono text-[10px]">/</kbd> to
          focus search
        </p>
        <div className="flex flex-wrap gap-1.5">
          <CategoryChip active={category === "All"} onClick={() => setCategory("All")} label="All" count={results.length} />
          {categories.map((cat) => {
            const count = results.filter((a) => a.category === cat).length;
            if (!count && !query) return null;
            return (
              <CategoryChip
                key={cat}
                active={category === cat}
                onClick={() => setCategory(cat)}
                label={cat}
                count={count}
              />
            );
          })}
        </div>
        {audience === "staff" ? (
          <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-3 text-xs text-sky-950">
            <p className="font-medium">Tip</p>
            <p className="mt-1 text-sky-900/90">
              Look for <span className="inline-flex align-middle">?</span> icons across the app for contextual hints
              linked to these guides.
            </p>
          </div>
        ) : null}
      </aside>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-3 text-sm font-medium text-zinc-900">No guides match your search</p>
            <p className="mt-1 text-sm text-zinc-500">Try different keywords or clear the category filter.</p>
          </div>
        ) : (
          filtered.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              basePath={basePath}
              open={openId === article.id}
              onToggle={() => setOpenId((id) => (id === article.id ? null : article.id))}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
      )}
    >
      {label}
      <span className={cn("ml-1 tabular-nums", active ? "text-zinc-300" : "text-zinc-400")}>{count}</span>
    </button>
  );
}

function ArticleCard({
  article,
  basePath,
  open,
  onToggle,
}: {
  article: HelpArticle;
  basePath: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      id={`help-article-${article.id}`}
      className="scroll-mt-6 overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-zinc-50/80"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-900">{article.title}</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
              {article.category}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{article.summary}</p>
        </div>
        <ChevronDown
          className={cn("mt-1 h-5 w-5 shrink-0 text-zinc-400 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="space-y-3 text-sm leading-relaxed text-zinc-700">
            {article.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {article.relatedLinks?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  {link.label} →
                </Link>
              ))}
            </div>
          ) : null}
          <p className="mt-4 text-xs text-zinc-400">
            Link:{" "}
            <Link href={`${basePath}#${article.id}`} className="text-sky-700 hover:underline">
              {basePath}#{article.id}
            </Link>
          </p>
        </div>
      ) : null}
    </article>
  );
}
