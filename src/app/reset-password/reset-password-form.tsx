"use client";

import Link from "next/link";
import { useActionState } from "react";
import { WorkflowBrandMark } from "@/components/workflow-brand-mark";
import { completePasswordReset, type ResetPasswordState } from "./actions";

export function ResetPasswordForm(props: { token: string }) {
  const [state, formAction, pending] = useActionState(
    completePasswordReset,
    null as ResetPasswordState
  );

  return (
    <div className="mx-auto mt-12 max-w-md space-y-8">
      <div className="flex flex-col items-center">
        <WorkflowBrandMark href="/login" variant="zinc" />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Choose a new password</h1>
        <p className="mt-1 text-sm text-zinc-500">Use at least 8 characters.</p>

        <form className="mt-5 space-y-4" action={formAction}>
          <input type="hidden" name="token" value={props.token} />

          {state?.error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {state.error}
            </div>
          ) : null}

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-zinc-900">
              New password
            </label>
            <input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="mt-1.5 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-900">
              Confirm password
            </label>
            <input
              id="confirm-password"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="mt-1.5 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-zinc-500">
        <Link href="/forgot-password" className="font-medium text-sky-700 hover:text-sky-900">
          Request a new link
        </Link>
      </p>
    </div>
  );
}
