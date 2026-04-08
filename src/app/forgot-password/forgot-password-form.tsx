"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { WorkflowBrandMark } from "@/components/workflow-brand-mark";
import { requestPasswordReset } from "./actions";

export function ForgotPasswordForm() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto mt-12 max-w-md space-y-8">
      <div className="flex flex-col items-center">
        <WorkflowBrandMark href="/login" variant="zinc" />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Reset password</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your account email and we&apos;ll send you a link to choose a new password.
        </p>

        {done ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
              If an account exists for that address, we&apos;ve sent reset instructions. Check your inbox (and spam).
            </div>
            {devUrl ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                <p className="font-medium">Development mode (no Resend key)</p>
                <p className="mt-1 break-all">
                  <a href={devUrl} className="text-sky-800 underline hover:text-sky-950">
                    Open reset link
                  </a>
                </p>
              </div>
            ) : null}
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              const fd = new FormData(e.currentTarget);
              start(async () => {
                const r = await requestPasswordReset(fd);
                if (!r.ok) {
                  setError(r.error);
                  return;
                }
                setDone(true);
                if (r.devResetUrl) setDevUrl(r.devResetUrl);
              });
            }}
          >
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {error}
              </div>
            ) : null}
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-zinc-900">
                Email
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1.5 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-zinc-500">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-sky-700 hover:text-sky-900">
          Sign in
        </Link>
      </p>
    </div>
  );
}
