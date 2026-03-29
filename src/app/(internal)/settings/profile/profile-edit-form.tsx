"use client";

import { updateTeamProfile } from "@/app/actions";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type User = {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
};

export function ProfileEditForm(props: { user: User }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(() => {
      void (async () => {
        const result = await updateTeamProfile(fd);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push("/settings/profile?saved=1");
      })();
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        {props.user.avatarUrl ? (
          <Image
            src={props.user.avatarUrl}
            alt=""
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover ring-1 ring-zinc-200/80"
            unoptimized
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-zinc-200 text-lg font-semibold text-zinc-800 ring-1 ring-zinc-200/80">
            {initials(props.user.fullName)}
          </div>
        )}
        <div className="min-w-0">
          <label className="block text-sm font-medium text-zinc-900">Profile photo</label>
          <p className="mt-0.5 text-xs text-zinc-500">JPEG, PNG, WebP or GIF — up to 2&nbsp;MB.</p>
          <input
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mt-2 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
          />
        </div>
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-zinc-900">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          defaultValue={props.user.fullName}
          className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={props.user.email}
          className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-zinc-900">
          Phone <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          autoComplete="tel"
          defaultValue={props.user.phoneNumber ?? ""}
          className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    return `${a ?? ""}${b ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}
