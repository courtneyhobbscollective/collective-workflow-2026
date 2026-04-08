import Link from "next/link";
import { WorkflowBrandMark } from "@/components/workflow-brand-mark";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t.trim() : "";

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto mt-12 max-w-md space-y-8">
          <div className="flex flex-col items-center">
            <WorkflowBrandMark href="/login" variant="zinc" />
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-zinc-900">Invalid link</h1>
            <p className="mt-1 text-sm text-zinc-500">This password reset link is missing a token.</p>
            <p className="mt-5">
              <Link
                href="/forgot-password"
                className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Request a reset
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <ResetPasswordForm token={token} />
    </div>
  );
}
