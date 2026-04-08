import Link from "next/link";
import { ClientAuthShell } from "@/components/client-public/client-auth-shell";
import { ClientOnboardForm } from "./client-onboard-form";

export default function ClientJoinPage() {
  return (
    <ClientAuthShell
      eyebrow="Client access"
      title="Welcome to Collective 🥳"
      subtitle={
        <p>Fill out the below form to get started and we&apos;ll get you onboarded.</p>
      }
      footer={
        <p className="text-center text-sm text-zinc-500 sm:text-left">
          Team member?{" "}
          <Link href="/login" className="font-medium text-sky-700 hover:text-sky-900">
            Sign in here
          </Link>
        </p>
      }
    >
      <ClientOnboardForm />
    </ClientAuthShell>
  );
}
