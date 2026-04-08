"use client";

import { createBooking } from "@/app/actions";
import { Badge } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type CalendarScheduleItem = {
  id: string;
  title: string;
  startsAt: string;
  visibleToClient: boolean;
};

type Modal = "none" | "new" | "schedule";

const backdrop =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]";
const panel =
  "w-full max-w-md rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xl";
const inputCls = "w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm";

export function CalendarHeaderActions({
  viewerId,
  schedule,
}: {
  viewerId: string | null;
  schedule: CalendarScheduleItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Modal>("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open === "none") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen("none");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleNewBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSaving(true);
    try {
      const fd = new FormData(form);
      await createBooking(fd);
      router.refresh();
      form.reset();
      setOpen("none");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {viewerId ? (
          <button
            type="button"
            onClick={() => setOpen("schedule")}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Your schedule
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen("new")}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
        >
          New booking
        </button>
      </div>

      {open === "new" ? (
        <div
          className={backdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cal-new-title"
          onClick={() => setOpen("none")}
        >
          <div className={panel} onClick={(e) => e.stopPropagation()}>
            <h2 id="cal-new-title" className="text-lg font-semibold tracking-tight text-zinc-900">
              New booking
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Add a calendar entry</p>
            <form onSubmit={handleNewBooking} className="mt-5 space-y-3">
              {viewerId ? <input type="hidden" name="viewerUserId" value={viewerId} /> : null}
              <input name="title" required placeholder="Title" className={inputCls} />
              <input type="datetime-local" name="startsAt" required className={inputCls} />
              <input type="datetime-local" name="endsAt" required className={inputCls} />
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-700">Visible to client</span>
                <input type="checkbox" name="visibleToClient" />
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen("none")}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {open === "schedule" && viewerId ? (
        <div
          className={backdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cal-schedule-title"
          onClick={() => setOpen("none")}
        >
          <div className={`${panel} max-h-[min(32rem,85vh)] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <h2 id="cal-schedule-title" className="text-lg font-semibold tracking-tight text-zinc-900">
              Your schedule
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Bookings tied to you (including brief onboarding handoffs)</p>
            <div className="mt-5 space-y-2 text-sm">
              {schedule.length ? (
                schedule.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">{b.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-600">{new Date(b.startsAt).toLocaleString()}</p>
                    </div>
                    <div className="shrink-0">
                      {b.visibleToClient ? (
                        <Badge>Client-visible</Badge>
                      ) : (
                        <Badge className="bg-zinc-100 text-zinc-500">Internal</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Nothing assigned to you yet.</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen("none")}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
