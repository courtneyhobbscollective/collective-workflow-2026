"use client";

import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteUserFromForm, updateUserRoleFromForm } from "./actions";

type RowUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  clientId: string | null;
  clientName: string | null;
};

type ClientOption = { id: string; name: string };

export function UserRoleRow(props: {
  user: RowUser;
  clients: ClientOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();
  const [rowError, setRowError] = useState<string | null>(null);
  const disabled = props.user.id === props.currentUserId;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRowError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(() => {
      void (async () => {
        const result = await updateUserRoleFromForm(fd);
        if (!result.ok) {
          setRowError(result.error);
          return;
        }
        router.refresh();
      })();
    });
  }

  function onDelete() {
    if (disabled) return;
    const ok = window.confirm(`Delete user ${props.user.fullName} (${props.user.email})? This cannot be undone.`);
    if (!ok) return;
    setRowError(null);
    const fd = new FormData();
    fd.set("userId", props.user.id);
    startDeleteTransition(() => {
      void (async () => {
        const result = await deleteUserFromForm(fd);
        if (!result.ok) {
          setRowError(result.error);
          return;
        }
        router.refresh();
      })();
    });
  }

  return (
    <tr className="border-t border-zinc-100">
      <td className="px-3 py-3 text-sm">
        <div className="font-medium text-zinc-900">{props.user.fullName}</div>
        <div className="text-xs text-zinc-500">{props.user.email}</div>
      </td>
      <td className="px-3 py-3 text-sm text-zinc-600">
        {props.user.role === "client" && props.user.clientName ? props.user.clientName : "—"}
      </td>
      <td className="px-3 py-3">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="userId" value={props.user.id} />
            <RoleFields user={props.user} clients={props.clients} disabled={disabled} />
            <button
              type="submit"
              disabled={pending || disabled}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting || disabled}
              className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
          {rowError ? (
            <p className="text-xs text-red-600" role="alert">
              {rowError}
            </p>
          ) : null}
        </form>
        {disabled ? <p className="mt-1 text-xs text-zinc-500">Use another admin to change your role.</p> : null}
      </td>
    </tr>
  );
}

function RoleFields(props: {
  user: RowUser;
  clients: ClientOption[];
  disabled: boolean;
}) {
  const [role, setRole] = useState<UserRole>(props.user.role);

  return (
    <>
      <select
        name="role"
        value={role}
        disabled={props.disabled}
        onChange={(e) => setRole(e.target.value as UserRole)}
        className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm disabled:opacity-60"
      >
        <option value={UserRole.admin}>Admin</option>
        <option value={UserRole.team_member}>Team member</option>
        <option value={UserRole.client}>Client</option>
      </select>
      {role === UserRole.client ? (
        <select
          name="clientId"
          defaultValue={props.user.clientId ?? ""}
          required
          disabled={props.disabled}
          className="max-w-[200px] rounded-lg border border-zinc-300 px-2 py-1.5 text-sm disabled:opacity-60"
        >
          <option value="" disabled>
            Company…
          </option>
          {props.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ) : null}
    </>
  );
}
