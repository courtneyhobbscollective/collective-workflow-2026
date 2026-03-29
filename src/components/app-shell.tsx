"use client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { PropsWithChildren } from "react";

const internalLinks = [
  ["/dashboard", "Dashboard"],
  ["/live-work", "Live work"],
  ["/briefs", "Briefs"],
  ["/clients", "Clients"],
  ["/crm", "CRM"],
  ["/services", "Services"],
  ["/calendar", "Calendar"],
  ["/messages", "Team chat"],
  ["/reports", "Reports"],
  ["/settings/profile", "Profile"]
];

const portalLinks = [
  ["/portal", "Overview"],
  ["/portal/briefs", "Briefs"],
  ["/portal/calendar", "Calendar"],
  ["/portal/messages", "Messages"],
  ["/portal/completed", "Completed"],
  ["/portal/account", "Account"]
];

export function AppShell({ children, portal = false }: PropsWithChildren<{ portal?: boolean }>) {
  const [navOpen, setNavOpen] = useState(false);
  const links = portal ? portalLinks : internalLinks;
  const brandLabel = portal ? "Workflow Portal" : "Workflow";
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Mobile header + drawer */}
      <header className="lg:hidden sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700" />
            <span className="text-base font-semibold tracking-tight text-zinc-900">Workflow</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/60 px-3 py-2 text-sm text-zinc-700 hover:bg-white"
              aria-label={navOpen ? "Close navigation" : "Open navigation"}
            >
              <span className="text-base leading-none">{navOpen ? "×" : "≡"}</span>
              Menu
            </button>
          </div>
        </div>
      </header>

      {navOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/20"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] overflow-auto border-r border-zinc-200 bg-white/95 backdrop-blur p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-sm font-semibold text-zinc-900">{brandLabel}</div>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                aria-label="Close navigation"
              >
                Close
              </button>
            </div>
            <nav className="space-y-1">
              {links.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setNavOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 pt-4 border-t border-zinc-200/70">
              <a href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                Switch user
              </a>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block h-full w-64 border-r border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">{brandLabel}</h2>
          <nav className="space-y-1">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 pt-4 border-t border-zinc-200/70">
            <a href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
              Switch user
            </a>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
