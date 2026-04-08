"use client";
import { useState } from "react";
import Link from "next/link";
import { type ComponentType, type PropsWithChildren } from "react";
import { Briefcase, ChartLine, FolderKanban, Home, MessageSquare, Settings2 } from "lucide-react";
import { WorkflowBrandMark } from "@/components/workflow-brand-mark";

type NavLink = readonly [href: string, label: string];
type NavSection = {
  title: string;
  links: readonly NavLink[];
  icon: ComponentType<{ className?: string }>;
};

const internalSectionsBase: readonly NavSection[] = [
  { title: "Home", icon: Home, links: [["/dashboard", "Dashboard"]] },
  {
    title: "Sales",
    icon: Briefcase,
    links: [["/crm", "CRM"], ["/crm/leads", "Leads"], ["/clients", "Clients"]],
  },
  {
    title: "Delivery",
    icon: FolderKanban,
    links: [["/briefs", "Briefs"], ["/live-work", "Live work"], ["/calendar", "Calendar"]],
  },
  { title: "Comms", icon: MessageSquare, links: [["/messages", "Team chat"]] },
  { title: "Business", icon: ChartLine, links: [["/services", "Services"], ["/reports", "Reports"]] },
  { title: "Settings", icon: Settings2, links: [["/settings/profile", "Profile"]] },
];

const portalLinks: readonly NavLink[] = [
  ["/portal", "Overview"],
  ["/portal/briefs", "Briefs"],
  ["/portal/messages", "Messages"],
  ["/portal/completed", "Completed"],
  ["/portal/account", "Profile"],
];

const teamMemberHiddenSectionTitles = new Set(["Sales", "Business"]);

export function AppShell({
  children,
  portal = false,
  isAdmin = false,
  /** When true, hides Sales (CRM, Leads, Clients) and Business (Services, Reports). */
  isTeamMember = false,
}: PropsWithChildren<{ portal?: boolean; isAdmin?: boolean; isTeamMember?: boolean }>) {
  const [navOpen, setNavOpen] = useState(false);
  const internalSections = isAdmin
    ? internalSectionsBase.map((section) =>
        section.title === "Settings"
          ? {
              ...section,
              links: [
                ...section.links,
                ["/settings/signup-requests", "Client requests"],
                ["/settings/users", "Users"],
                ["/settings/feedback", "Feedback tickets"],
              ] as readonly NavLink[],
            }
          : section
      )
    : isTeamMember
      ? internalSectionsBase.filter((section) => !teamMemberHiddenSectionTitles.has(section.title))
      : internalSectionsBase;
  const sections: readonly NavSection[] = portal
    ? [{ title: "Portal", icon: Home, links: portalLinks }]
    : internalSections;
  const brandLabel = portal ? "Workflow Portal" : "Workflow";
  const feedbackHref = portal ? "/portal/feedback" : "/feedback";
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Mobile header + drawer */}
      <header className="lg:hidden sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          {portal ? (
            <span className="text-base font-semibold tracking-tight text-zinc-900">{brandLabel}</span>
          ) : (
            <WorkflowBrandMark href="/dashboard" variant="zinc" />
          )}
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
              {portal ? (
                <div className="text-sm font-semibold text-zinc-900">{brandLabel}</div>
              ) : (
                <WorkflowBrandMark href="/dashboard" variant="zinc" />
              )}
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                aria-label="Close navigation"
              >
                Close
              </button>
            </div>
            <nav className="space-y-3">
              {sections.map((section) => (
                <div key={section.title} className="pt-1 first:pt-0">
                  <p className="px-3 pb-1 text-sm font-semibold text-zinc-500">
                    <span className="inline-flex items-center gap-2">
                      <section.icon className="h-3.5 w-3.5 text-zinc-400" />
                      {section.title}
                    </span>
                  </p>
                  <div className="ml-2 space-y-0.5 border-l border-zinc-200 pl-2">
                    {section.links.map(([href, label]) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setNavOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                      >
                        <span className="h-px w-3 bg-zinc-300" aria-hidden="true" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
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

      <div className="border-b border-zinc-700/80 bg-zinc-800 px-4 py-2 text-center text-xs font-medium text-white">
        Workflow is Live 🚀  Beta test mode |{" "}
        <Link href={feedbackHref} className="underline decoration-zinc-300/90 underline-offset-2 hover:decoration-white">
          Click here to report any bugs or suggestions here.
        </Link>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block h-full w-64 border-r border-zinc-200 bg-white p-4">
          <div className="mb-4">
            {portal ? (
              <h2 className="text-sm font-semibold text-zinc-900">{brandLabel}</h2>
            ) : (
              <WorkflowBrandMark href="/dashboard" variant="zinc" />
            )}
          </div>
          <nav className="space-y-3">
            {sections.map((section) => (
              <div key={section.title} className="pt-1 first:pt-0">
                <p className="px-3 pb-1 text-sm font-semibold text-zinc-500">
                  <span className="inline-flex items-center gap-2">
                    <section.icon className="h-3.5 w-3.5 text-zinc-400" />
                    {section.title}
                  </span>
                </p>
                <div className="ml-2 space-y-0.5 border-l border-zinc-200 pl-2">
                  {section.links.map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    >
                      <span className="h-px w-3 bg-zinc-300" aria-hidden="true" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
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
