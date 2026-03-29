"use client";

import type { AssignmentRole, BriefStatus, UserRole } from "@prisma/client";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  completeBriefWithTimeLog,
  promoteBriefToInProgressWithOnboarding,
  updateBriefStatus,
} from "@/app/actions";
import { requiresAdminContractConfirmationForInProgress } from "@/lib/workflow/contract-gate";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

type TeamUserOption = { id: string; fullName: string };

type Props = {
  briefId: string;
  currentStatus: BriefStatus;
  actingUserId: string;
  viewerRole: UserRole;
  teamUsers: TeamUserOption[];
};

type ContractModal = "closed" | "ask" | "blocked" | "dates" | "assign";

export function BriefStatusForm({
  briefId,
  currentStatus,
  actingUserId,
  viewerRole,
  teamUsers,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<BriefStatus>(currentStatus);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [contractModal, setContractModal] = useState<ContractModal>("closed");
  const [serverError, setServerError] = useState<string | null>(null);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [internalDeliveryDate, setInternalDeliveryDate] = useState("");
  const [clientDeliveryDate, setClientDeliveryDate] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState(() => teamUsers[0]?.id ?? "");
  const [assignmentRole, setAssignmentRole] = useState<AssignmentRole>("producer");
  const formRef = useRef<HTMLFormElement>(null);
  const contractGateApprovedRef = useRef(false);
  /** After promote succeeds, RSC may still show draft briefly; don't snap the select back to draft. */
  const promoteAwaitingServerRef = useRef(false);
  const [promoteSubmitting, setPromoteSubmitting] = useState(false);

  useEffect(() => {
    if (currentStatus === "completed") {
      setCompleteOpen(false);
    }

    const inContractFlow =
      contractModal === "ask" ||
      contractModal === "dates" ||
      contractModal === "assign" ||
      contractModal === "blocked";
    if (inContractFlow) {
      return;
    }

    if (promoteAwaitingServerRef.current && currentStatus === "draft") {
      return;
    }
    if (currentStatus === "in_progress") {
      promoteAwaitingServerRef.current = false;
    }

    setStatus(currentStatus);
    contractGateApprovedRef.current = false;
    setPromoteError(null);
  }, [currentStatus, contractModal]);

  useEffect(() => {
    if (teamUsers.length && !teamUsers.some((u) => u.id === assigneeUserId)) {
      setAssigneeUserId(teamUsers[0].id);
    }
  }, [teamUsers, assigneeUserId]);

  useEffect(() => {
    if (contractModal === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setContractModal("closed");
      setStatus(currentStatus);
      contractGateApprovedRef.current = false;
      setPromoteError(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contractModal, currentStatus]);

  const adminMustConfirmContract = (target: BriefStatus) =>
    viewerRole === "admin" &&
    requiresAdminContractConfirmationForInProgress(currentStatus, target);

  const dateLabelCls = "block text-left text-xs font-medium uppercase tracking-wide text-zinc-500";
  const inputCls = "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900";

  return (
    <>
      <form
        ref={formRef}
        action={async (formData) => {
          setServerError(null);
          try {
            if (contractGateApprovedRef.current) {
              formData.set("contractConfirmed", "true");
            } else {
              formData.set("contractConfirmed", "false");
            }
            const res = await updateBriefStatus(formData);
            if (res?.error === "CONTRACT_REQUIRED") {
              setServerError(
                "Contract confirmation is required before moving this brief to in progress."
              );
            }
            setContractModal("closed");
          } catch {
            setServerError("Could not update status. Try again.");
            setContractModal("closed");
          } finally {
            contractGateApprovedRef.current = false;
          }
        }}
        className="mt-4 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          if (status === "completed" && currentStatus !== "completed") {
            e.preventDefault();
            setCompleteOpen(true);
            return;
          }
          if (adminMustConfirmContract(status)) {
            e.preventDefault();
            setPromoteError(null);
            setInternalDeliveryDate("");
            setClientDeliveryDate("");
            setAssigneeUserId(teamUsers[0]?.id ?? "");
            setAssignmentRole("producer");
            setContractModal("ask");
          }
        }}
      >
        <input type="hidden" name="briefId" value={briefId} />
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as BriefStatus)}
          className="min-w-52 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="awaiting_internal_start">Awaiting internal start</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In progress</option>
          <option value="awaiting_client_review">Awaiting client review</option>
          <option value="amends_requested">Amends requested</option>
          <option value="first_round_amends">First round of amends</option>
          <option value="second_round_amends">Second round of amends</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <SubmitButton label="Update status" />
      </form>
      {serverError ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {serverError}
        </p>
      ) : null}

      {contractModal === "ask" ||
      contractModal === "dates" ||
      contractModal === "assign" ? (
        <div
          className={
            contractModal === "ask"
              ? "modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
              : "fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          }
          role="dialog"
          aria-modal="true"
          aria-labelledby={
            contractModal === "ask"
              ? "contract-gate-title"
              : contractModal === "dates"
                ? "delivery-dates-title"
                : "assign-team-title"
          }
        >
          {contractModal === "ask" ? (
            <div className="modal-panel-enter w-full max-w-md rounded-2xl border border-zinc-200/90 bg-white p-8 text-center shadow-xl">
              <h2 id="contract-gate-title" className="text-lg font-semibold tracking-tight text-zinc-900">
                Contract confirmation
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                Have you sent a contract and has the contract been signed and received?
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <button
                  type="button"
                  className="min-w-[5rem] rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                  onClick={() => setContractModal("blocked")}
                >
                  No
                </button>
                <button
                  type="button"
                  className="min-w-[5rem] rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
                  onClick={() => setContractModal("dates")}
                >
                  Yes
                </button>
              </div>
            </div>
          ) : contractModal === "dates" ? (
            <div className="modal-panel-enter w-full max-w-md rounded-2xl border border-zinc-200/90 bg-white p-8 text-center shadow-xl">
              <h2 id="delivery-dates-title" className="text-lg font-semibold tracking-tight text-zinc-900">
                Delivery dates
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                Set the internal handoff date and the date promised to the client.
              </p>
              <div className="mt-6 grid gap-4 text-left">
                <label className={dateLabelCls}>
                  Internal delivery date
                  <input
                    type="date"
                    className={inputCls}
                    value={internalDeliveryDate}
                    onChange={(e) => setInternalDeliveryDate(e.target.value)}
                    required
                  />
                </label>
                <label className={dateLabelCls}>
                  Client delivery date
                  <input
                    type="date"
                    className={inputCls}
                    value={clientDeliveryDate}
                    onChange={(e) => setClientDeliveryDate(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="mt-8 flex justify-center gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                  onClick={() => setContractModal("ask")}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
                  onClick={() => {
                    if (!internalDeliveryDate.trim() || !clientDeliveryDate.trim()) return;
                    if (!teamUsers.length) {
                      setPromoteError("Add at least one team member in Settings before assigning.");
                      return;
                    }
                    setPromoteError(null);
                    setContractModal("assign");
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <form
              className="modal-panel-enter w-full max-w-md rounded-2xl border border-zinc-200/90 bg-white p-8 text-center shadow-xl"
              onSubmit={(e) => {
                e.preventDefault();
                setPromoteError(null);
                const fd = new FormData();
                fd.set("briefId", briefId);
                fd.set("contractConfirmed", "true");
                fd.set("internalDeliveryDate", internalDeliveryDate);
                fd.set("clientDeliveryDate", clientDeliveryDate);
                fd.set("assigneeUserId", assigneeUserId);
                fd.set("assignmentRole", assignmentRole);
                void (async () => {
                  setPromoteSubmitting(true);
                  try {
                    const res = await promoteBriefToInProgressWithOnboarding(fd);
                    if (res?.error === "ASSIGNMENT_EXISTS") {
                      setPromoteError(
                        "That person is already assigned with this role. Pick another role or team member."
                      );
                      return;
                    }
                    if (res?.error === "INTERNAL" && res.message) {
                      setPromoteError(res.message);
                      return;
                    }
                    if (res?.error) {
                      setPromoteError("Could not complete setup. Check your selections and try again.");
                      return;
                    }
                    promoteAwaitingServerRef.current = true;
                    setContractModal("closed");
                    setStatus("in_progress");
                    router.refresh();
                  } catch (err) {
                    if (isRedirectError(err)) {
                      throw err;
                    }
                    setPromoteError(
                      err instanceof Error ? err.message : "Something went wrong. Try again."
                    );
                  } finally {
                    setPromoteSubmitting(false);
                  }
                })();
              }}
            >
              <h2 id="assign-team-title" className="text-lg font-semibold tracking-tight text-zinc-900">
                Assign a team member
              </h2>
              <p className="mt-2 text-sm text-zinc-600">They’ll be notified and see these dates on their calendar.</p>
              <div className="mt-6 grid gap-4 text-left">
                <label className={dateLabelCls}>
                  Team member
                  <select
                    name="assigneeUserId"
                    className={`${inputCls} cursor-pointer`}
                    value={assigneeUserId}
                    onChange={(e) => setAssigneeUserId(e.target.value)}
                    required
                  >
                    {teamUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={dateLabelCls}>
                  Role
                  <select
                    name="assignmentRole"
                    className={`${inputCls} cursor-pointer`}
                    value={assignmentRole}
                    onChange={(e) => setAssignmentRole(e.target.value as AssignmentRole)}
                  >
                    <option value="producer">producer</option>
                    <option value="editor">editor</option>
                    <option value="shooter">shooter</option>
                    <option value="designer">designer</option>
                    <option value="pm">pm</option>
                    <option value="other">other</option>
                  </select>
                </label>
              </div>
              {promoteError ? (
                <p className="mt-4 text-sm text-red-600" role="alert">
                  {promoteError}
                </p>
              ) : null}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                  disabled={promoteSubmitting}
                  onClick={() => setContractModal("dates")}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={promoteSubmitting}
                  className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
                >
                  {promoteSubmitting ? "Saving…" : "Confirm & move to in progress"}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {contractModal === "blocked" ? (
        <div
          className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contract-blocked-title"
        >
          <div className="modal-panel-enter w-full max-w-md rounded-2xl border border-zinc-200/90 bg-white p-8 text-center shadow-xl">
            <h2 id="contract-blocked-title" className="text-lg font-semibold tracking-tight text-zinc-900">
              Cannot move to in progress
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              All work must have a signed contract before entering live work.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                className="min-w-[6rem] rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
                onClick={() => {
                  setContractModal("closed");
                  setStatus(currentStatus);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {completeOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="brief-complete-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg">
            <h2 id="brief-complete-title" className="text-base font-semibold text-zinc-900">
              Log time to complete
            </h2>
            <p className="mt-1 text-sm text-zinc-600">Record hours, optional days, and any notes before marking this brief complete.</p>
            <form action={completeBriefWithTimeLog} className="mt-4 grid gap-2">
              <input type="hidden" name="briefId" value={briefId} />
              <input type="hidden" name="userId" value={actingUserId} />
              <input
                name="hoursSpent"
                type="number"
                step="0.25"
                min="0.25"
                required
                placeholder="Hours spent"
                className="rounded-lg border border-zinc-200 bg-white p-2 text-sm"
              />
              <input
                name="daysSpent"
                type="number"
                step="0.25"
                min="0"
                placeholder="Days (optional)"
                className="rounded-lg border border-zinc-200 bg-white p-2 text-sm"
              />
              <textarea
                name="notes"
                placeholder="Notes (optional)"
                rows={3}
                className="rounded-lg border border-zinc-200 bg-white p-2 text-sm"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                  onClick={() => {
                    setCompleteOpen(false);
                    setStatus(currentStatus);
                  }}
                >
                  Cancel
                </button>
                <SubmitButton label="Mark complete" />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
