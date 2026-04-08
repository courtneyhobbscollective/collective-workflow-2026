"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerClientSelfServe } from "./actions";

const schema = z
  .object({
    companyName: z.string().min(2, "Company name is required"),
    fullName: z.string().min(1, "Your name is required"),
    email: z.string().email("Enter a valid email"),
    phoneNumber: z.string().optional(),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

/** Matches login form inputs (`login-form.tsx`). */
const inputClass =
  "mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300";

const labelClass = "block text-sm font-medium text-zinc-900";

const sectionLabelClass = "text-xs font-semibold uppercase tracking-wide text-zinc-500";

export function ClientOnboardForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: "" },
  });

  return (
    <form
      ref={formRef}
      className="space-y-6"
      onSubmit={handleSubmit(() => {
        setServerError(null);
        const form = formRef.current;
        if (!form) return;
        const fd = new FormData(form);
        startTransition(() => {
          void (async () => {
            const result = await registerClientSelfServe(fd);
            if (result && !result.ok) setServerError(result.error);
          })();
        });
      })}
    >
      {serverError ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {serverError}
        </div>
      ) : null}

      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-4">
        <p className={sectionLabelClass}>Company</p>
        <div>
          <label htmlFor="companyName" className={labelClass}>
            Company or project name
          </label>
          <input
            id="companyName"
            {...register("companyName")}
            className={inputClass}
            autoComplete="organization"
          />
          {errors.companyName ? <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p> : null}
        </div>
      </div>

      <div className="space-y-4">
        <p className={sectionLabelClass}>Contact</p>
        <div>
          <label htmlFor="fullName" className={labelClass}>
            Your full name
          </label>
          <input id="fullName" {...register("fullName")} className={inputClass} autoComplete="name" />
          {errors.fullName ? <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p> : null}
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Work email
          </label>
          <input id="email" type="email" {...register("email")} className={inputClass} autoComplete="email" />
          {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
        <div>
          <label htmlFor="phoneNumber" className={labelClass}>
            Phone <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <input id="phoneNumber" type="tel" {...register("phoneNumber")} className={inputClass} autoComplete="tel" />
        </div>
      </div>

      <div className="space-y-4">
        <p className={sectionLabelClass}>Account</p>
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className={inputClass}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-zinc-500">
            At least 8 characters. You&apos;ll use this to sign in after approval.
          </p>
          {errors.password ? <p className="mt-1 text-sm text-red-600">{errors.password.message}</p> : null}
        </div>
        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            className={inputClass}
            autoComplete="new-password"
          />
          {errors.confirmPassword ? (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        Already have access?{" "}
        <Link href="/login" className="font-medium text-sky-700 hover:text-sky-900">
          Team login
        </Link>
      </p>
    </form>
  );
}
