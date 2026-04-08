"use client";

export function PortalMessageUsButton(props: { scrollToId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        document.getElementById(props.scrollToId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="shrink-0 rounded-full border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:border-zinc-800 hover:bg-zinc-800"
    >
      Message us
    </button>
  );
}
