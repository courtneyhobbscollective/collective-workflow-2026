"use client";

import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getArticle } from "@/lib/help/content";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = 288;
const PANEL_GAP = 6;

type HelpHintProps = {
  /** Loads summary + link from help center content */
  articleId?: string;
  /** Override tooltip body (still shows Learn more if articleId set) */
  children?: React.ReactNode;
  label?: string;
  learnMoreHref?: string;
  helpBasePath?: string;
  className?: string;
};

type PanelCoords = {
  top: number;
  left: number;
  placement: "above" | "below";
};

function clampPanelLeft(triggerLeft: number) {
  const maxLeft = window.innerWidth - PANEL_WIDTH - 8;
  return Math.min(Math.max(8, triggerLeft), Math.max(8, maxLeft));
}

export function HelpHint({
  articleId,
  children,
  label,
  learnMoreHref,
  helpBasePath = "/help",
  className,
}: HelpHintProps) {
  const article = articleId ? getArticle(articleId) : undefined;
  const helpHref = learnMoreHref ?? (articleId ? `${helpBasePath}#${articleId}` : undefined);
  const body = children ?? article?.summary;
  const ariaLabel = label ?? article?.title ?? "Help";

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight ?? 140;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement =
      spaceBelow < panelHeight + PANEL_GAP && spaceAbove > spaceBelow ? "above" : "below";

    const top =
      placement === "below" ? rect.bottom + PANEL_GAP : Math.max(PANEL_GAP, rect.top - PANEL_GAP);

    setCoords({
      top,
      left: clampPanelLeft(rect.left),
      placement,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(frame);
  }, [open, body, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!body) return null;

  const panel =
    open && mounted && coords
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="tooltip"
            className="fixed z-[200] w-72 max-w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-lg ring-1 ring-black/5"
            style={{
              top: coords.top,
              left: coords.left,
              transform: coords.placement === "above" ? "translateY(-100%)" : undefined,
            }}
          >
            {article?.title ? <p className="text-xs font-semibold text-zinc-900">{article.title}</p> : null}
            <p className={cn("text-xs leading-relaxed text-zinc-600", article?.title && "mt-1")}>{body}</p>
            {helpHref ? (
              <Link
                href={helpHref}
                className="mt-2 inline-block text-xs font-medium text-sky-700 hover:text-sky-900"
                onClick={() => setOpen(false)}
              >
                Learn more in Help →
              </Link>
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span className={cn("relative inline-flex align-middle", className)}>
        <button
          ref={buttonRef}
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((v) => !v)}
        >
          <CircleHelp className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </span>
      {panel}
    </>
  );
}
