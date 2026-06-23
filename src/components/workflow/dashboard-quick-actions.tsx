import Link from "next/link";
import type { UserRole } from "@prisma/client";
import {
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  FolderKanban,
  MessageSquare,
  Plus,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

type QuickAction = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

const ADMIN_ACTIONS: QuickAction[] = [
  {
    href: "/briefs/new",
    label: "Create brief",
    description: "Start production for a client",
    icon: Plus,
    accent: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  {
    href: "/live-work",
    label: "Live work",
    description: "See what's in the pipeline",
    icon: FolderKanban,
    accent: "bg-violet-50 text-violet-700 ring-violet-100",
  },
  {
    href: "/crm/leads?new=1",
    label: "Add lead",
    description: "Log a new sales opportunity",
    icon: UserPlus,
    accent: "bg-amber-50 text-amber-800 ring-amber-100",
  },
  {
    href: "/clients/new",
    label: "New client",
    description: "Add a client record",
    icon: Users,
    accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    href: "/messages",
    label: "Team chat",
    description: "Message the team",
    icon: MessageSquare,
    accent: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  },
  {
    href: "/calendar",
    label: "Calendar",
    description: "Bookings and schedule",
    icon: Calendar,
    accent: "bg-rose-50 text-rose-700 ring-rose-100",
  },
  {
    href: "/briefs",
    label: "All briefs",
    description: "Browse every brief",
    icon: Briefcase,
    accent: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  },
  {
    href: "/crm",
    label: "CRM",
    description: "Leads and check-ins",
    icon: Building2,
    accent: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100",
  },
];

const TEAM_ACTIONS: QuickAction[] = [
  {
    href: "/live-work",
    label: "Live work",
    description: "Your active production board",
    icon: FolderKanban,
    accent: "bg-violet-50 text-violet-700 ring-violet-100",
  },
  {
    href: "/briefs/new",
    label: "Create brief",
    description: "Start a new production job",
    icon: Plus,
    accent: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  {
    href: "/briefs",
    label: "All briefs",
    description: "Assignments and deadlines",
    icon: Briefcase,
    accent: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  },
  {
    href: "/messages",
    label: "Team chat",
    description: "Channels and DMs",
    icon: MessageSquare,
    accent: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  },
  {
    href: "/calendar",
    label: "Calendar",
    description: "Your schedule",
    icon: Calendar,
    accent: "bg-rose-50 text-rose-700 ring-rose-100",
  },
  {
    href: "/help",
    label: "Help & guides",
    description: "How Workflow works",
    icon: BookOpen,
    accent: "bg-teal-50 text-teal-700 ring-teal-100",
  },
];

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardQuickActions({
  role,
  firstName,
}: {
  role: UserRole | null;
  firstName?: string | null;
}) {
  const actions = role === "admin" ? ADMIN_ACTIONS : TEAM_ACTIONS;
  const greeting = greetingForHour(new Date().getHours());
  const nameBit = firstName?.trim() ? `, ${firstName.trim().split(/\s+/)[0]}` : "";

  return (
    <Card className="overflow-hidden border-zinc-200/90 p-0">
      <div className="border-b border-zinc-100 bg-gradient-to-br from-zinc-50 to-white px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{greeting}{nameBit}</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">What would you like to do today?</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 sm:gap-3 sm:p-4 lg:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            prefetch
            className={cn(
              "group flex flex-col gap-2 rounded-xl border border-zinc-200/80 bg-white p-3 transition",
              "hover:border-zinc-300 hover:bg-zinc-50/80 hover:shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            )}
          >
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset",
                action.accent
              )}
            >
              <action.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-zinc-900 group-hover:text-zinc-950">
                {action.label}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-zinc-500">{action.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
