"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { WorkflowBrandMark } from "@/components/workflow-brand-mark";
import { loginWithPassword } from "./actions";

const passwordSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type PasswordValues = z.infer<typeof passwordSchema>;

export function LoginForm(props: { error?: string; resetSuccess?: boolean }) {
  const [pwPending, startPw] = useTransition();

  const pwForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="mx-auto mt-12 max-w-md space-y-8">
      <div className="flex flex-col items-center">
        <WorkflowBrandMark href="/login" variant="zinc" />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">Use the email and password for your account.</p>
        {props.error === "password" ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            Invalid email or password.
          </div>
        ) : null}
        <form
          className="mt-5 space-y-4"
          onSubmit={pwForm.handleSubmit((values) =>
            startPw(() => {
              const fd = new FormData();
              fd.set("email", values.email);
              fd.set("password", values.password);
              void loginWithPassword(fd);
            })
          )}
        >
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-zinc-900">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="mt-1.5 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              {...pwForm.register("email")}
            />
            {pwForm.formState.errors.email ? (
              <p className="mt-1 text-sm text-red-600">{pwForm.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-zinc-900">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              {...pwForm.register("password")}
            />
            {pwForm.formState.errors.password ? (
              <p className="mt-1 text-sm text-red-600">{pwForm.formState.errors.password.message}</p>
            ) : null}
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-sky-700 hover:text-sky-900">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={pwPending}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pwPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-zinc-500">
        New client company?{" "}
        <Link href="/join" className="font-medium text-sky-700 hover:text-sky-900">
          Request access
        </Link>
      </p>
    </div>
  );
}
