"use client";

import { startDmWithUser } from "@/app/actions";

export function StartDmForm(props: { teammates: { id: string; fullName: string }[]; currentUserId: string }) {
  if (!props.currentUserId) return null;
  const others = props.teammates.filter((u) => u.id !== props.currentUserId);
  if (others.length === 0) return null;
  return (
    <form action={startDmWithUser} className="border-b border-zinc-100 px-2 py-2">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Message someone</label>
      <div className="mt-1 flex gap-1">
        <select name="partnerId" required className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs">
          <option value="">Choose teammate…</option>
          {others.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>
        <button type="submit" className="shrink-0 rounded-lg bg-zinc-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">
          Open
        </button>
      </div>
    </form>
  );
}
