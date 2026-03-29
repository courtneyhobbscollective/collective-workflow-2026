"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserRole } from "@prisma/client";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginAsRole } from "./actions";

const schema = z.object({
  role: z.enum([UserRole.admin, UserRole.team_member, UserRole.client])
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: UserRole.admin }
  });

  return (
    <form
      onSubmit={handleSubmit((values) => startTransition(() => loginAsRole(values.role)))}
      className="mx-auto mt-24 max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h1 className="text-2xl font-semibold">Workflow Login</h1>
      <p className="mt-1 text-sm text-zinc-500">MVP role switcher for seeded accounts.</p>
      <label className="mt-5 block text-sm font-medium">Role</label>
      <select {...register("role")} className="mt-2 w-full rounded-lg border border-zinc-300 p-2 text-sm">
        <option value={UserRole.admin}>Admin</option>
        <option value={UserRole.team_member}>Team member</option>
        <option value={UserRole.client}>Client</option>
      </select>
      <button
        disabled={pending}
        className="mt-5 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
