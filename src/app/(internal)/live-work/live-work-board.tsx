"use client";

import { updateBriefReviewLink } from "@/app/actions";
import { PriorityPill, StatusPill } from "@/components/workflow/status-pill";
import {
  LIVE_WORK_FLAT_SECTIONS,
  LIVE_WORK_SECTION_LABELS,
  isInProgressLaneStatus,
  type LiveWorkFlatSection,
} from "@/lib/workflow/live-work-config";
import { LIVE_WORK_PAGE_STATUSES } from "@/lib/workflow/live-work-page-statuses";
import { getBriefStatusMeta } from "@/lib/workflow/status-meta";
import { cn } from "@/lib/utils";
import type { BriefPriority, BriefStatus } from "@prisma/client";
import { ChevronDown, ExternalLink, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

function serviceLabelForBriefType(raw: string): string {
  switch (raw) {
    case "web_design_dev":
      return "Web Design & Dev";
    case "app_dev":
      return "App Dev";
    case "video":
      return "Video";
    case "photo":
      return "Photo";
    case "design":
      return "Design";
    case "content":
      return "Content";
    default:
      return raw.replace(/_/g, " ");
  }
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    return `${a ?? ""}${b ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function LiveWorkAssigneeAvatar({
  fullName,
  avatarUrl,
  sizePx = 24,
  className,
}: {
  fullName: string;
  avatarUrl: string | null;
  sizePx?: number;
  className?: string;
}) {
  const textClass = sizePx <= 22 ? "text-[9px]" : "text-[10px]";
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={sizePx}
        height={sizePx}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-zinc-200/80", className)}
        style={{ width: sizePx, height: sizePx }}
        unoptimized
      />
    );
  }
  return (
    <div
      style={{ width: sizePx, height: sizePx }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-zinc-200 font-semibold text-zinc-800 ring-1 ring-zinc-200/80",
        textClass,
        className
      )}
      aria-hidden
    >
      {initialsFromName(fullName)}
    </div>
  );
}

export type LiveBriefAssignee = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
};

export type LiveBriefRow = {
  id: string;
  status: BriefStatus;
  title: string;
  description: string;
  deadline: string;
  priority: BriefPriority;
  liveWorkOrder: number;
  briefType: string;
  client: { id: string; name: string };
  assignees: LiveBriefAssignee[];
  deliverables: { id: string; title: string }[];
  reviewLink: string | null;
};

type BoardState = {
  inProgress: LiveBriefRow[];
  flat: Record<LiveWorkFlatSection, LiveBriefRow[]>;
};

function buildBoard(rows: LiveBriefRow[]): BoardState {
  const inProgress: LiveBriefRow[] = [];
  const flat = {} as Record<LiveWorkFlatSection, LiveBriefRow[]>;
  for (const s of LIVE_WORK_FLAT_SECTIONS) flat[s] = [];

  for (const r of rows) {
    if (isInProgressLaneStatus(r.status)) {
      inProgress.push(r);
    } else {
      const section = r.status as LiveWorkFlatSection;
      if (LIVE_WORK_FLAT_SECTIONS.includes(section)) {
        flat[section].push(r);
      }
    }
  }

  const sortList = (list: LiveBriefRow[]) =>
    list.sort((a, b) => a.liveWorkOrder - b.liveWorkOrder || a.title.localeCompare(b.title));

  sortList(inProgress);
  for (const s of LIVE_WORK_FLAT_SECTIONS) sortList(flat[s]);

  return { inProgress, flat };
}

function countCards(board: BoardState): number {
  let n = board.inProgress.length;
  for (const s of LIVE_WORK_FLAT_SECTIONS) n += board.flat[s].length;
  return n;
}

function filterRows(
  rows: LiveBriefRow[],
  clientId: string,
  statusFilter: BriefStatus | null,
  assigneeFilter: "all" | "me",
  viewerUserId: string | null
): LiveBriefRow[] {
  return rows.filter((r) => {
    if (clientId && r.client.id !== clientId) return false;
    if (statusFilter !== null && r.status !== statusFilter) return false;
    if (assigneeFilter === "me" && viewerUserId) {
      const assignedToViewer = r.assignees.some((a) => a.userId === viewerUserId);
      if (!assignedToViewer) return false;
    }
    return true;
  });
}

function LiveWorkReviewLinkForm({ briefId, reviewLink }: { briefId: string; reviewLink: string | null }) {
  const router = useRouter();
  const hasLink = Boolean(reviewLink?.trim());
  const [editing, setEditing] = useState(() => !hasLink);

  return (
    <div className="mt-2 space-y-2">
      {hasLink && !editing ? (
        <button
          type="button"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          onClick={() => setEditing(true)}
        >
          Update review link
        </button>
      ) : (
        <form
          className="space-y-2"
          action={async (formData) => {
            await updateBriefReviewLink(formData);
            setEditing(false);
            router.refresh();
          }}
        >
          <input type="hidden" name="briefId" value={briefId} />
          <input
            key={`${briefId}-${reviewLink ?? ""}-${editing}`}
            name="reviewLink"
            type="text"
            inputMode="url"
            autoComplete="off"
            defaultValue={reviewLink ?? ""}
            placeholder="https://…"
            className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              {hasLink ? "Save changes" : "Save review link"}
            </button>
            {hasLink ? (
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}

function clientFacingUpdateHref(brief: LiveBriefRow): string {
  const statusLabel = getBriefStatusMeta(brief.status).label;
  const prefill = `Brief: ${brief.title}\nStatus: ${statusLabel}`;
  return `/briefs/${brief.id}?${new URLSearchParams({ clientSection: "1", prefill }).toString()}`;
}

type BriefCardBodyProps = {
  brief: LiveBriefRow;
  viewerIsAdmin: boolean;
  expandedId: string | null;
  setExpandedId: Dispatch<SetStateAction<string | null>>;
};

function BriefCardBody({ brief, viewerIsAdmin, expandedId, setExpandedId }: BriefCardBodyProps) {
  const dueLabel = `Due ${new Date(brief.deadline).toLocaleDateString()}`;

  const isExpanded = expandedId === brief.id;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div
        className={cn(
          "px-5 py-4 transition-colors",
          isExpanded && "bg-zinc-50"
        )}
      >
        <button
          type="button"
          className="flex w-full min-w-0 items-center gap-3 text-left"
          aria-expanded={isExpanded}
          onClick={() => setExpandedId((id) => (id === brief.id ? null : brief.id))}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className="text-sm font-medium leading-snug text-zinc-900">{brief.title}</span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-800">
              {brief.client.name}
            </span>
            <span className="text-xs text-zinc-600">{dueLabel}</span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {brief.assignees.length > 0 ? (
              <div
                className="flex items-center pr-0.5"
                role="group"
                aria-label={`Assigned: ${brief.assignees.map((a) => a.fullName).join(", ")}`}
              >
                <div className="flex items-center">
                  {brief.assignees.slice(0, 4).map((a, i) => (
                    <div
                      key={a.userId}
                      className={cn("relative rounded-full bg-white ring-2 ring-white", i > 0 && "-ml-2")}
                      style={{ zIndex: i + 1 }}
                      title={a.fullName}
                    >
                      <LiveWorkAssigneeAvatar fullName={a.fullName} avatarUrl={a.avatarUrl} sizePx={22} />
                    </div>
                  ))}
                </div>
                {brief.assignees.length > 4 ? (
                  <span
                    className="-ml-1.5 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-zinc-200 px-1 text-[10px] font-semibold tabular-nums text-zinc-800 ring-2 ring-white"
                    style={{ zIndex: 6 }}
                    title={`${brief.assignees.length - 4} more`}
                  >
                    +{brief.assignees.length - 4}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400" title="No assignees">
                Unassigned
              </span>
            )}
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
              {serviceLabelForBriefType(brief.briefType)}
            </span>
            <PriorityPill priority={brief.priority} />
            <StatusPill status={brief.status} />
            <ChevronDown
              className={cn(
                "h-4 w-4 text-zinc-400 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </button>
      </div>
      {isExpanded ? (
        <div className="space-y-5 border-t border-zinc-100 bg-white px-5 pb-4 pt-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</h3>
            <p className="mt-1.5 text-sm whitespace-pre-wrap text-zinc-700">
              {brief.description?.trim() ? brief.description : "No description provided."}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Deliverables</h3>
            {brief.deliverables.length ? (
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {brief.deliverables.map((d) => (
                  <li key={d.id}>{d.title}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-zinc-500">No deliverables yet.</p>
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Review link</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Paste a URL for review rounds (Frame.io, Google Docs, etc.). You can also edit this on the full
              brief page.
            </p>
            {brief.reviewLink ? (
              <a
                href={brief.reviewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex max-w-full items-center gap-1.5 break-all text-sm font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Open current link
              </a>
            ) : null}
            <LiveWorkReviewLinkForm
              key={`${brief.id}-${brief.reviewLink ?? ""}`}
              briefId={brief.id}
              reviewLink={brief.reviewLink}
            />
          </div>
          {brief.assignees.length ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-600">Assigned team members:</p>
              <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-2 p-0">
                {brief.assignees.map((a) => (
                  <li key={a.userId} className="flex items-center gap-1.5">
                    <LiveWorkAssigneeAvatar fullName={a.fullName} avatarUrl={a.avatarUrl} />
                    <span className="text-xs text-zinc-700">{a.fullName}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No team members assigned yet.</p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              href={`/briefs/${brief.id}`}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Open full brief
            </Link>
            {viewerIsAdmin ? (
              <Link
                href={clientFacingUpdateHref(brief)}
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                Update this client
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  initialRows: LiveBriefRow[];
  clients: { id: string; name: string }[];
  viewerIsAdmin: boolean;
  /** Signed-in internal user; used for “Assigned to me”. */
  viewerUserId: string | null;
};

export function LiveWorkBoard(props: Props) {
  const [clientFilter, setClientFilter] = useState("");
  /** Empty string = all statuses on this board. */
  const [statusFilter, setStatusFilter] = useState<"" | BriefStatus>("");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "me">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const resetFilters = () => {
    setClientFilter("");
    setStatusFilter("");
    setAssigneeFilter("all");
  };

  const statusFilterArg = statusFilter === "" ? null : statusFilter;

  const filteredRows = useMemo(
    () =>
      filterRows(
        props.initialRows,
        clientFilter,
        statusFilterArg,
        assigneeFilter,
        props.viewerUserId
      ),
    [props.initialRows, clientFilter, statusFilterArg, assigneeFilter, props.viewerUserId]
  );

  const displayBoard = useMemo(() => buildBoard(filteredRows), [filteredRows]);

  const totalInDataset = props.initialRows.length;
  const visibleCount = countCards(displayBoard);
  const filtersActive =
    Boolean(clientFilter) || statusFilter !== "" || assigneeFilter === "me";

  useEffect(() => {
    setExpandedId(null);
  }, [clientFilter, statusFilter, assigneeFilter]);

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Filters</h2>
            <p className="text-xs text-zinc-500">Narrow by client, stage, and who the brief is assigned to.</p>
          </div>
          {filtersActive ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset filters
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="client-filter" className="text-sm font-medium text-zinc-700">
              Client
            </label>
            <select
              id="client-filter"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="">All clients</option>
              {props.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-zinc-700">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                const v = e.target.value;
                setStatusFilter(v === "" ? "" : (v as BriefStatus));
              }}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="">All stages</option>
              {LIVE_WORK_PAGE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getBriefStatusMeta(status).label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="assignee-filter" className="text-sm font-medium text-zinc-700">
              Assignment
            </label>
            <select
              id="assignee-filter"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value === "me" ? "me" : "all")}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="all">Assigned to all</option>
              <option value="me" disabled={!props.viewerUserId}>
                Assigned to me
              </option>
            </select>
            {!props.viewerUserId ? (
              <p className="text-xs text-zinc-500">Sign in to filter by your assignments.</p>
            ) : null}
          </div>
        </div>

        <p className="text-xs text-zinc-500">
          Showing <span className="font-medium text-zinc-700">{visibleCount}</span> of{" "}
          <span className="font-medium text-zinc-700">{totalInDataset}</span> briefs on this board
          {filtersActive ? " (filtered)" : ""}.
        </p>
      </div>

      {totalInDataset === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
          Nothing on the live work board yet. Set a brief to a live stage (for example Scheduled or In progress)
          on its detail page to see it here.
        </p>
      ) : visibleCount === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50/80 p-8 text-center text-sm text-zinc-800">
          No briefs match your filters. Try a different client, status, or assignment, or reset filters.
        </p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-base font-semibold text-zinc-900">In progress</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Status appears on each card. Update stage and order from the brief page.
            </p>
            <p className="mt-1 text-xs text-zinc-500">{displayBoard.inProgress.length} briefs</p>
            <div className="mt-3 flex min-h-24 flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
              {displayBoard.inProgress.map((brief) => (
                <BriefCardBody
                  key={brief.id}
                  brief={brief}
                  viewerIsAdmin={props.viewerIsAdmin}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                />
              ))}
            </div>
          </section>
          {LIVE_WORK_FLAT_SECTIONS.map((section) => (
            <section key={section}>
              <h2 className="text-base font-semibold text-zinc-900">
                {LIVE_WORK_SECTION_LABELS[section]}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">{displayBoard.flat[section].length} briefs</p>
              <div className="mt-3 flex min-h-24 flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
                {displayBoard.flat[section].map((brief) => (
                  <div key={brief.id} className="w-full">
                    <BriefCardBody
                      brief={brief}
                      viewerIsAdmin={props.viewerIsAdmin}
                      expandedId={expandedId}
                      setExpandedId={setExpandedId}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
