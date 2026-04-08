import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    return `${a ?? ""}${b ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export function UserHeaderBadge(props: {
  fullName: string;
  avatarUrl?: string | null;
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={props.href ?? "/settings/profile"}
      className={cn(
        "group flex items-center gap-3 rounded-xl p-1.5 -m-1.5 transition-colors hover:bg-zinc-100/90",
        props.className
      )}
      aria-label="Edit profile"
    >
      <p className="max-w-[12rem] truncate text-right text-sm font-medium leading-tight text-zinc-900 sm:max-w-xs">
        {props.fullName}
      </p>
      {props.avatarUrl ? (
        <Image
          src={props.avatarUrl}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-zinc-200/80"
          unoptimized
        />
      ) : (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-zinc-200 text-xs font-semibold text-zinc-800 ring-1 ring-zinc-200/80"
          aria-hidden
        >
          {initialsFromName(props.fullName)}
        </div>
      )}
    </Link>
  );
}
