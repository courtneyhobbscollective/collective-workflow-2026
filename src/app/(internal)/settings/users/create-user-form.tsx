"use client";

import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createUser } from "./actions";

type ClientOption = { id: string; name: string };

export function CreateUserForm(props: { clients: ClientOption[] }) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(UserRole.team_member);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("role", role);
    startTransition(() => {
      void (async () => {
        const result = await createUser(fd);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        e.currentTarget.reset();
        setRole(UserRole.team_member);
        router.refresh();
      })();
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}
      <div>
        <label htmlFor="new-email" className="block text-sm font-medium text-zinc-900">
          Email
        </label>
        <input
          id="new-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          placeholder="name@company.com"
        />
      </div>
      <div>
        <label htmlFor="new-name" className="block text-sm font-medium text-zinc-900">
          Full name
        </label>
        <input
          id="new-name"
          name="fullName"
          type="text"
          required
          className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="new-role" className="block text-sm font-medium text-zinc-900">
          Role
        </label>
        <select
          id="new-role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value={UserRole.admin}>Admin</option>
          <option value={UserRole.team_member}>Team member</option>
          <option value={UserRole.client}>Client</option>
        </select>
      </div>
      {role === UserRole.client ? (
        <div>
          <label htmlFor="new-client" className="block text-sm font-medium text-zinc-900">
            Company (client)
          </label>
          <select
            id="new-client"
            name="clientId"
            required={role === UserRole.client}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Select a client…
            </option>
            {props.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add user"}
      </button>
    </form>
  );
}
