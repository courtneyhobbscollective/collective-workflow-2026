import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ClientAuthShell } from "@/components/client-public/client-auth-shell";

export default function JoinThanksPage() {
  return (
    <ClientAuthShell
      headerExtra={
        <div className="success-check flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/20">
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} aria-hidden />
          </div>
        </div>
      }
      eyebrow="You're almost there"
      title="Request received"
      subtitle={
        <p>
          We&apos;ll notify you once an administrator has reviewed your company. You won&apos;t be able to sign in until
          then.
        </p>
      }
      footer={
        <div className="flex justify-center sm:justify-start">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Back to login
          </Link>
        </div>
      }
    >
      <div className="space-y-4 text-center text-sm leading-relaxed text-zinc-600 sm:text-left">
        <p>
          After approval, sign in with the <span className="font-medium text-zinc-900">same email and password</span> you
          chose on the form.
        </p>
        <p className="text-sm text-zinc-500">Questions? Reply to the invite or contact your agency team directly.</p>
      </div>
    </ClientAuthShell>
  );
}
