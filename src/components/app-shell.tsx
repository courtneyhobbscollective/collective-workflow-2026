"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, type PropsWithChildren } from "react";
import {
  ArrowLeftRight,
  Briefcase,
  ChartLine,
  ChevronDown,
  FolderKanban,
  Home,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/ui/motion";
import { WorkflowBrandMark } from "@/components/workflow-brand-mark";

const SIDEBAR_COLLAPSED_KEY = "workflow-sidebar-collapsed";

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
    links: [["/crm", "CRM"], ["/crm/deals", "Deal boards"], ["/crm/leads", "Leads"], ["/clients", "Clients"]],
  },
  {
    title: "Delivery",
    icon: FolderKanban,
    links: [["/briefs", "Briefs"], ["/live-work", "Live work"], ["/calendar", "Calendar"]],
  },
  { title: "Comms", icon: MessageSquare, links: [["/messages", "Team chat"]] },
  { title: "Business", icon: ChartLine, links: [["/services", "Services"], ["/reports", "Reports"]] },
  {
    title: "Settings",
    icon: Settings2,
    links: [
      ["/settings/profile", "Profile"],
      ["/help", "Help & guides"],
    ],
  },
];

const portalLinks: readonly NavLink[] = [
  ["/portal", "Overview"],
  ["/portal/briefs", "Briefs"],
  ["/portal/messages", "Messages"],
  ["/portal/completed", "Completed"],
  ["/portal/help", "Help"],
  ["/portal/account", "Profile"],
];

/** Staff users (`team_member`) — hidden in sidebar; also blocked in middleware. */
const staffHiddenSectionTitles = new Set(["Sales", "Business"]);

function isNavLinkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getActiveHref(pathname: string, links: readonly NavLink[]) {
  let best: string | null = null;
  for (const [href] of links) {
    if (!isNavLinkActive(pathname, href)) continue;
    if (!best || href.length > best.length) best = href;
  }
  return best;
}

function getActiveSectionTitle(sections: readonly NavSection[], pathname: string) {
  const active = sections.find(
    (section) => section.links.length > 1 && section.links.some(([href]) => isNavLinkActive(pathname, href))
  );
  return active?.title ?? null;
}

function navItemClass(active: boolean, compact?: boolean) {
  return cn(
    "flex items-center rounded-lg text-sm font-medium transition-colors",
    compact ? "justify-center p-2.5" : "gap-2 px-3 py-2",
    active ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
  );
}

function CollapsibleNavSection({
  section,
  sectionActive,
  isOpen,
  compact,
  onToggle,
  onNavigate,
}: {
  section: NavSection;
  sectionActive: boolean;
  isOpen: boolean;
  compact?: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  if (compact) {
    return (
      <button
        type="button"
        title={section.title}
        onClick={onToggle}
        className={cn(navItemClass(sectionActive, true), "w-full text-zinc-500 hover:text-zinc-700")}
      >
        <section.icon className="h-5 w-5 shrink-0" />
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
          sectionActive ? "text-zinc-900" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
        )}
      >
        <section.icon className="h-4 w-4 shrink-0 text-zinc-400" />
        <span className="flex-1 text-left">{section.title}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>
      {isOpen ? (
        <div className="nav-collapsible ml-2 mt-0.5 space-y-0.5 border-l border-zinc-200 pl-2">
          {section.links.map(([href, label]) => {
            const linkActive = href === getActiveHref(pathname, section.links);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  linkActive
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <span className="h-px w-3 bg-zinc-300" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SidebarNav({
  sections,
  compact = false,
  onNavigate,
}: {
  sections: readonly NavSection[];
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [openSection, setOpenSection] = useState<string | null>(() =>
    getActiveSectionTitle(sections, pathname)
  );

  useEffect(() => {
    const activeTitle = getActiveSectionTitle(sections, pathname);
    if (activeTitle) setOpenSection(activeTitle);
  }, [pathname, sections]);

  const toggleSection = (title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  };

  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const isCollapsible = section.links.length > 1;
        const sectionActive = section.links.some(([href]) => isNavLinkActive(pathname, href));

        if (!isCollapsible) {
          const [href, label] = section.links[0];
          return (
            <Link
              key={section.title}
              href={href}
              title={compact ? label : undefined}
              onClick={onNavigate}
              className={navItemClass(sectionActive, compact)}
            >
              <section.icon className={cn("shrink-0 text-zinc-400", compact ? "h-5 w-5" : "h-4 w-4")} />
              {compact ? null : label}
            </Link>
          );
        }

        return (
          <CollapsibleNavSection
            key={section.title}
            section={section}
            sectionActive={sectionActive}
            isOpen={openSection === section.title}
            compact={compact}
            onToggle={() => toggleSection(section.title)}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}

function SidebarPanel({
  sections,
  portal,
  brandLabel,
  compact,
  pinnedCollapsed,
  onToggleCollapsed,
  onNavigate,
}: {
  sections: readonly NavSection[];
  portal: boolean;
  brandLabel: string;
  compact: boolean;
  pinnedCollapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("mb-4 shrink-0", compact && "mb-3 flex justify-center")}>
        {portal ? (
          compact ? (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-700"
              title={brandLabel}
            >
              P
            </div>
          ) : (
            <h2 className="text-sm font-semibold text-zinc-900">{brandLabel}</h2>
          )
        ) : (
          <WorkflowBrandMark href="/dashboard" variant="zinc" compact={compact} />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarNav sections={sections} compact={compact} onNavigate={onNavigate} />
      </div>

      <div className="mt-4 shrink-0 space-y-1 border-t border-zinc-200/70 pt-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          title={pinnedCollapsed ? "Pin sidebar open" : "Collapse sidebar"}
          aria-label={pinnedCollapsed ? "Pin sidebar open" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center rounded-lg text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900",
            compact ? "justify-center p-2.5" : "gap-2 px-3 py-2"
          )}
        >
          {pinnedCollapsed ? (
            <PanelLeft className="h-5 w-5 shrink-0 text-zinc-500" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0 text-zinc-400" />
              Collapse
            </>
          )}
        </button>
        <a
          href="/login"
          title="Switch user"
          className={cn(
            "flex items-center rounded-lg text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900",
            compact ? "justify-center p-2.5" : "gap-2 px-3 py-2"
          )}
        >
          <ArrowLeftRight className={cn("shrink-0 text-zinc-500", compact ? "h-5 w-5" : "h-4 w-4")} />
          {compact ? null : "Switch user"}
        </a>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  portal = false,
  isAdmin = false,
  /** When true, hides Sales (CRM, Leads, Clients) and Business (Services, Reports). */
  isTeamMember = false,
}: PropsWithChildren<{ portal?: boolean; isAdmin?: boolean; isTeamMember?: boolean }>) {
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [sidebarTop, setSidebarTop] = useState(0);
  const contentRowRef = useRef<HTMLDivElement>(null);

  const updateSidebarTop = () => {
    setSidebarTop(contentRowRef.current?.getBoundingClientRect().top ?? 0);
  };

  useEffect(() => {
    updateSidebarTop();
    window.addEventListener("resize", updateSidebarTop);
    window.addEventListener("scroll", updateSidebarTop, true);
    return () => {
      window.removeEventListener("resize", updateSidebarTop);
      window.removeEventListener("scroll", updateSidebarTop, true);
    };
  }, []);

  const openHoverFlyout = () => {
    if (!sidebarCollapsed) return;
    updateSidebarTop();
    setSidebarHovered(true);
  };

  const closeHoverFlyout = () => {
    if (sidebarCollapsed) setSidebarHovered(false);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "false") setSidebarCollapsed(false);
      else if (stored === "true") setSidebarCollapsed(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const internalSections = useMemo(
    () =>
      isAdmin
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
          ? internalSectionsBase.filter((section) => !staffHiddenSectionTitles.has(section.title))
          : internalSectionsBase,
    [isAdmin, isTeamMember]
  );

  const sections: readonly NavSection[] = useMemo(
    () => (portal ? [{ title: "Portal", icon: Home, links: portalLinks }] : internalSections),
    [portal, internalSections]
  );

  const brandLabel = portal ? "Workflow Portal" : "Workflow";
  const feedbackHref = portal ? "/portal/feedback" : "/feedback";

  const sidebarPanelProps = {
    sections,
    portal,
    brandLabel,
    pinnedCollapsed: sidebarCollapsed,
    onToggleCollapsed: toggleSidebarCollapsed,
  };

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
            className="animate-overlay-in absolute inset-0 bg-zinc-900/20"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="animate-in-slide-left fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] overflow-auto border-r border-zinc-200 bg-white/95 backdrop-blur p-4 shadow-xl">
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
            <SidebarNav sections={sections} onNavigate={() => setNavOpen(false)} />
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

      <div ref={contentRowRef} className="relative flex flex-1 min-h-0 items-stretch overflow-visible">
        {/* Desktop sidebar — fixed to viewport height below beta banner */}
        {sidebarCollapsed ? (
          <>
            <div className="hidden w-[4.25rem] shrink-0 lg:block" aria-hidden="true" />
            <div
              className="fixed left-0 bottom-0 z-30 hidden w-[4.25rem] border-r border-zinc-200 bg-white lg:block"
              style={{ top: sidebarTop }}
              onMouseEnter={openHoverFlyout}
            >
              <aside className="flex h-full flex-col p-2">
                <SidebarPanel {...sidebarPanelProps} compact />
              </aside>
            </div>

            {sidebarHovered ? (
              <aside
                className="sidebar-flyout fixed left-0 z-50 flex w-64 flex-col overflow-y-auto border-r border-zinc-200 bg-white p-4 shadow-[4px_0_24px_rgba(0,0,0,0.12)]"
                style={{ top: sidebarTop, bottom: 0 }}
                onMouseEnter={openHoverFlyout}
                onMouseLeave={closeHoverFlyout}
              >
                <SidebarPanel {...sidebarPanelProps} compact={false} />
              </aside>
            ) : null}
          </>
        ) : (
          <>
            <div className="hidden w-64 shrink-0 lg:block" aria-hidden="true" />
            <div
              className="fixed left-0 bottom-0 z-30 hidden w-64 border-r border-zinc-200 bg-white lg:block"
              style={{ top: sidebarTop }}
            >
              <aside className="flex h-full flex-col p-4">
                <SidebarPanel {...sidebarPanelProps} compact={false} />
              </aside>
            </div>
          </>
        )}

        <main className="relative z-0 flex-1 p-6 lg:p-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
