"use client";

import { useRef, useState, useTransition, type RefObject } from "react";
import { ChatEmojiPicker } from "./chat-emoji-picker";
import { ChatGiphyPicker } from "./chat-giphy-picker";

export function ChatComposer(props: {
  action: (formData: FormData) => void | Promise<void>;
  channelId?: string;
  threadId?: string;
  placeholder?: string;
  onSent?: () => void | Promise<void>;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [metadata, setMetadata] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      className="border-t border-zinc-200 bg-white p-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const form = e.currentTarget;
        const fd = new FormData(form);
        startTransition(() => {
          void (async () => {
            try {
              await props.action(fd);
              if (taRef.current) taRef.current.value = "";
              setMetadata("");
              await props.onSent?.();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not send message.");
            }
          })();
        });
      }}
    >
      <input type="hidden" name="metadata" value={metadata} readOnly />
      {props.channelId ? <input type="hidden" name="channelId" value={props.channelId} readOnly /> : null}
      {props.threadId ? <input type="hidden" name="threadId" value={props.threadId} readOnly /> : null}
      <div className="flex flex-wrap items-end gap-2">
        <textarea
          ref={taRef}
          name="body"
          rows={2}
          disabled={pending}
          placeholder={props.placeholder ?? "Write a message…"}
          className="min-h-[44px] min-w-0 flex-1 resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-60"
        />
        <div className="flex shrink-0 items-center gap-1">
          <ChatEmojiPicker onInsert={(emoji) => insertAtCursor(taRef, emoji)} />
          <ChatGiphyPicker
            onSelect={(gifUrl) => {
              setMetadata(JSON.stringify({ gifUrl }));
            }}
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {props.channelId ? (
        <p className="mt-2 text-[11px] text-zinc-400">
          Mention someone with <span className="font-medium text-zinc-600">@</span> and their full name as it appears in
          the app (e.g. @Alex Morgan)—they get a dashboard notification.
        </p>
      ) : null}
      {metadata ? (
        <p className="mt-2 text-xs text-zinc-500">
          GIF attached — add a caption above or send as-is.{" "}
          <button type="button" className="font-medium text-zinc-800 underline" onClick={() => setMetadata("")}>
            Clear GIF
          </button>
        </p>
      ) : null}
    </form>
  );
}

function insertAtCursor(taRef: RefObject<HTMLTextAreaElement | null>, text: string) {
  const el = taRef.current;
  if (!el) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const next = el.value.slice(0, start) + text + el.value.slice(end);
  el.value = next;
  requestAnimationFrame(() => {
    el.focus();
    const pos = start + text.length;
    el.setSelectionRange(pos, pos);
  });
}
