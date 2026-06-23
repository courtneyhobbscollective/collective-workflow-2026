"use client";

import Link from "next/link";
import type { DealStage } from "@prisma/client";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  DEAL_BILLING_STATUS_OPTIONS,
  DEAL_STAGE_OPTIONS,
  billingStatusMeta,
  dealStageMeta,
} from "@/lib/deals/config";
import { updateDealBillingStatus, updateDealStage } from "@/app/(internal)/crm/deals/actions";
import { DealBillingStatusPill } from "@/components/deals/deal-billing-status-pill";
import { DealStagePill } from "@/components/deals/deal-stage-pill";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DealBoardRow = {
  id: string;
  name: string;
  stage: DealStage;
  billingStatus: string | null;
  dealValue: number | null;
  contactName: string | null;
  clientName: string | null;
  updateCount: number;
};

export function DealBoardTable({
  deals,
  canEdit = false,
}: {
  boardId: string;
  deals: DealBoardRow[];
  canEdit?: boolean;
}) {
  const total = deals.reduce((sum, d) => sum + (d.dealValue ?? 0), 0);
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className={cn("space-y-0", pending && "opacity-70")}>
      <Table>
        <TableHeader>
          <div className="flex gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <TableHeadCell className="flex-[2.2] min-w-[12rem]">Deal</TableHeadCell>
            <TableHeadCell className="flex-[1.3] min-w-[8rem]">Account</TableHeadCell>
            <TableHeadCell className="flex-[1.1] min-w-[7rem]">Contact</TableHeadCell>
            <TableHeadCell className="flex-[1.1] min-w-[8rem]">Stage</TableHeadCell>
            <TableHeadCell className="flex-[1.2] min-w-[9rem]">Billing</TableHeadCell>
            <TableHeadCell className="flex-[0.8] min-w-[5rem] text-right">Value</TableHeadCell>
            <TableHeadCell className="flex-[0.7] min-w-[5rem] text-center">Updates</TableHeadCell>
          </div>
        </TableHeader>

        <TableBody>
          {deals.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-zinc-500">No deals on this board yet.</div>
          ) : (
            deals.map((deal) => (
              <TableRow
                key={deal.id}
                className="group gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50/90"
              >
                <TableCell className="flex-[2.2] min-w-[12rem]">
                  <Link
                    href={`/crm/deals/deal/${deal.id}`}
                    className="block font-medium text-zinc-900 transition-colors group-hover:text-sky-800"
                  >
                    {deal.name}
                  </Link>
                </TableCell>

                <TableCell className="flex-[1.3] min-w-[8rem]">
                  <span className="block truncate text-sm text-zinc-600">{deal.clientName ?? "—"}</span>
                </TableCell>

                <TableCell className="flex-[1.1] min-w-[7rem]">
                  <span className="block truncate text-sm text-zinc-600">{deal.contactName ?? "—"}</span>
                </TableCell>

                <TableCell className="flex-[1.1] min-w-[8rem]">
                  {canEdit ? (
                    <select
                      className={cn(
                        "max-w-full cursor-pointer rounded-md px-2 py-1 text-xs font-semibold shadow-sm ring-1 ring-inset ring-black/5",
                        dealStageMeta(deal.stage).className
                      )}
                      value={deal.stage}
                      onChange={(e) =>
                        start(async () => {
                          await updateDealStage(deal.id, e.target.value as DealStage);
                          router.refresh();
                        })
                      }
                    >
                      {DEAL_STAGE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value} className="bg-white text-zinc-900">
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <DealStagePill stage={deal.stage} />
                  )}
                </TableCell>

                <TableCell className="flex-[1.2] min-w-[9rem]">
                  {canEdit ? (
                    <select
                      className={cn(
                        "max-w-full cursor-pointer rounded-md px-2 py-1 text-xs font-semibold shadow-sm ring-1 ring-inset ring-black/5",
                        billingStatusMeta(deal.billingStatus).className
                      )}
                      value={deal.billingStatus ?? ""}
                      onChange={(e) =>
                        start(async () => {
                          await updateDealBillingStatus(deal.id, e.target.value);
                          router.refresh();
                        })
                      }
                    >
                      <option value="" className="bg-white text-zinc-900">
                        —
                      </option>
                      {DEAL_BILLING_STATUS_OPTIONS.map((o) => (
                        <option key={o.label} value={o.label} className="bg-white text-zinc-900">
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <DealBillingStatusPill status={deal.billingStatus} />
                  )}
                </TableCell>

                <TableCell className="flex-[0.8] min-w-[5rem] text-right">
                  <span className="text-sm font-medium tabular-nums text-zinc-900">
                    {deal.dealValue != null
                      ? deal.dealValue.toLocaleString("en-GB", {
                          style: "currency",
                          currency: "GBP",
                          maximumFractionDigits: 0,
                        })
                      : "—"}
                  </span>
                </TableCell>

                <TableCell className="flex-[0.7] min-w-[5rem] text-center">
                  <Link
                    href={`/crm/deals/deal/${deal.id}`}
                    className="inline-flex items-center justify-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
                  >
                    <MessageSquare className="h-3.5 w-3.5 opacity-70" />
                    {deal.updateCount > 0 ? deal.updateCount : "Add"}
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {deals.length > 0 ? (
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm">
          <span className="font-medium text-zinc-700">
            {deals.length} deal{deals.length === 1 ? "" : "s"}
          </span>
          <span className="font-semibold tabular-nums text-zinc-900">
            {total.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })}{" "}
            <span className="font-normal text-zinc-500">total value</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
