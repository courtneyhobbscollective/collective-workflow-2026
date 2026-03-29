"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    return `${a ?? ""}${b ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export function ChatSenderAvatar(props: {
  fullName: string;
  avatarUrl: string | null;
  className?: string;
}) {
  const px = 32;
  if (props.avatarUrl) {
    return (
      <Image
        src={props.avatarUrl}
        alt=""
        width={px}
        height={px}
        className={cn(
          "h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-zinc-200/80",
          props.className
        )}
        unoptimized
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-zinc-200 text-xs font-semibold text-zinc-800 ring-1 ring-zinc-200/80",
        props.className
      )}
      aria-hidden
    >
      {initialsFromName(props.fullName)}
    </div>
  );
}
