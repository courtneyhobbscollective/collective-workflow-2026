"use client";

import { useMemo, useState } from "react";
import { createLead } from "./actions";

type ClientOption = { id: string; name: string };

export function AddLeadForm(props: {
  clients: ClientOption[];
  error?: string;
}) {
  const [isExistingClient, setIsExistingClient] = useState<"yes" | "no" | "">("");
  const [existingClientId, setExistingClientId] = useState("");

  const selectedClient = useMemo(
    () => props.clients.find((c) => c.id === existingClientId) ?? null,
    [props.clients, existingClientId]
  );
  const canShowMainForm = isExistingClient === "no" || (isExistingClient === "yes" && Boolean(selectedClient));

  return (
    <form action={createLead} className="space-y-4">
      {props.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {renderLeadFormError(props.error)}
        </div>
      ) : null}

      <h2 className="text-base font-semibold text-zinc-900">Add lead</h2>
      <p className="text-sm text-zinc-600">Capture details and set the follow-up reminder.</p>

      <fieldset className="space-y-2 rounded-lg border border-zinc-200 p-3">
        <legend className="px-1 text-sm font-medium text-zinc-900">Is this lead an existing client?</legend>
        <label className="mr-5 inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="radio"
            name="existingClientAnswer"
            value="yes"
            checked={isExistingClient === "yes"}
            onChange={() => setIsExistingClient("yes")}
          />
          Yes
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="radio"
            name="existingClientAnswer"
            value="no"
            checked={isExistingClient === "no"}
            onChange={() => setIsExistingClient("no")}
          />
          No
        </label>
      </fieldset>

      {isExistingClient === "yes" ? (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-900" htmlFor="existing-client-id">
            Choose client
          </label>
          <select
            id="existing-client-id"
            name="existingClientId"
            required
            value={existingClientId}
            onChange={(e) => setExistingClientId(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm"
          >
            <option value="">Select a client…</option>
            {props.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {canShowMainForm ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900" htmlFor="lead-name">
                Name
              </label>
              <input id="lead-name" name="name" required className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900" htmlFor="lead-email">
                Email
              </label>
              <input id="lead-email" name="email" type="email" required className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900" htmlFor="lead-position">
                Position
              </label>
              <input id="lead-position" name="position" required className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" />
            </div>

            {isExistingClient === "no" ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-900" htmlFor="lead-company">
                  Company
                </label>
                <input id="lead-company" name="companyName" required className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-900">Company</label>
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-sm text-zinc-700">{selectedClient?.name ?? "—"}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900" htmlFor="lead-telephone">
                Telephone
              </label>
              <input
                id="lead-telephone"
                name="phoneNumber"
                type="tel"
                required
                className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm"
                placeholder="+44 7700 900321"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900" htmlFor="lead-potential-value">
                Potential deal value
              </label>
              <input
                id="lead-potential-value"
                name="potentialDealValue"
                type="number"
                step="0.01"
                required
                className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm"
                placeholder="15000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900" htmlFor="lead-work-type">
                Type of work
              </label>
              <select id="lead-work-type" name="workType" required className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" defaultValue="">
                <option value="" disabled>
                  Select a type…
                </option>
                <option value="web_design_dev">Web design / dev</option>
                <option value="app_dev">App dev</option>
                <option value="video">Video</option>
                <option value="photo">Photo</option>
                <option value="design">Design</option>
                <option value="content">Content</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-900" htmlFor="lead-reminder">
                Follow-up reminder
              </label>
              <select id="lead-reminder" name="reminderDays" required className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" defaultValue="3">
                <option value="1">1 day</option>
                <option value="2">2 days</option>
                <option value="3">3 days</option>
                <option value="4">4 days</option>
                <option value="5">5 days</option>
                <option value="6">6 days</option>
                <option value="7">7 days</option>
              </select>
              <p className="text-xs text-zinc-500">We&apos;ll calculate the due date automatically and place it on the calendar.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-900" htmlFor="lead-notes">
              Notes
            </label>
            <textarea
              id="lead-notes"
              name="notes"
              required
              className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm"
              placeholder="Context, next steps, what you need from the lead…"
            />
          </div>

          <button className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Create lead</button>
        </>
      ) : null}
    </form>
  );
}

function renderLeadFormError(code: string) {
  switch (code) {
    case "missing-name":
      return "Please enter a name.";
    case "invalid-email":
      return "Please enter a valid email address.";
    case "missing-position":
      return "Please enter a position.";
    case "missing-company":
      return "Please enter a company.";
    case "missing-existing-client":
      return "Please choose the existing client.";
    case "missing-telephone":
      return "Please enter a telephone number.";
    case "missing-deal-value":
      return "Please enter a potential deal value.";
    case "missing-work-type":
      return "Please select a type of work.";
    case "missing-reminder-days":
      return "Please select a follow-up reminder window.";
    default:
      return "Could not create the lead. Please check the form.";
  }
}
