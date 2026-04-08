"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitFeedbackTicket } from "@/app/feedback/actions";

export function FeedbackForm() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("pagePath", pathname ?? "");
    startTransition(() => {
      void (async () => {
        const result = await submitFeedbackTicket(fd);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        form.reset();
        setSuccess("Thanks — your feedback has been logged.");
        router.refresh();
      })();
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}
      <div>
        <label htmlFor="fb-title" className="block text-sm font-medium text-zinc-900">
          Title
        </label>
        <input
          id="fb-title"
          name="title"
          required
          className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Short summary of the bug, issue, or suggestion"
        />
      </div>
      <div>
        <label htmlFor="fb-area" className="block text-sm font-medium text-zinc-900">
          What section of Workflow does this relate to?
        </label>
        <select
          id="fb-area"
          name="area"
          required
          defaultValue=""
          className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a section…
          </option>
          <option value="home">Home</option>
          <option value="sales">Sales</option>
          <option value="delivery">Delivery</option>
          <option value="comms">Comms</option>
          <option value="business">Business</option>
          <option value="settings">Settings</option>
          <option value="portal">Portal</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="fb-message" className="block text-sm font-medium text-zinc-900">
          Details
        </label>
        <textarea
          id="fb-message"
          name="message"
          required
          rows={6}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          placeholder="What happened, what you expected, and any context/screens involved"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit feedback"}
      </button>
    </form>
  );
}

