"use client";

import { useRef, useState } from "react";
import { ChatEmojiPicker } from "./chat-emoji-picker";
import { ChatGiphyPicker } from "./chat-giphy-picker";

export function ChatComposer(props: {
  action: (formData: FormData) => void | Promise<void>;
  channelId?: string;
  threadId?: string;
  placeholder?: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [metadata, setMetadata] = useState("");

  function insertAtCursor(text: string) {
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

  return (
    <form
      action={props.action}
      className="border-t border-zinc-200 bg-white p-3"
    >
      <input type="hidden" name="metadata" value={metadata} readOnly />
      {props.channelId ? <input type="hidden" name="channelId" value={props.channelId} readOnly /> : null}
      {props.threadId ? <input type="hidden" name="threadId" value={props.threadId} readOnly /> : null}
      <div className="flex flex-wrap items-end gap-2">
        <textarea
          ref={taRef}
          name="body"
          rows={2}
          placeholder={props.placeholder ?? "Write a message…"}
          className="min-h-[44px] min-w-0 flex-1 resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
        <div className="flex shrink-0 items-center gap-1">
          <ChatEmojiPicker onInsert={(emoji) => insertAtCursor(emoji)} />
          <ChatGiphyPicker
            onSelect={(gifUrl) => {
              setMetadata(JSON.stringify({ gifUrl }));
            }}
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Send
          </button>
        </div>
      </div>
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
