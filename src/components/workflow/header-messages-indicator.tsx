import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeaderMessagesIndicator(props: {
  href: string;
  unreadCount: number;
  className?: string;
}) {
  return (
    <Link
      href={props.href}
      className={cn(
        "group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900",
        props.className
      )}
      aria-label={`Open messages${props.unreadCount > 0 ? ` (${props.unreadCount} unread)` : ""}`}
    >
      <MessageSquare className="h-[18px] w-[18px]" strokeWidth={2} />
      {props.unreadCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 min-w-[1.125rem] rounded-full bg-zinc-900 px-1 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
          {props.unreadCount > 99 ? "99+" : props.unreadCount}
        </span>
      ) : null}
    </Link>
  );
}

