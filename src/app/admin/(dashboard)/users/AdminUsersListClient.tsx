"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, PrimaryButton } from "@/components/admin/ui";
import { deleteStaffUser, setStaffUserActive, type StaffUser } from "./actions";

function KebabMenu({
  user,
  isSelf,
  onToggleActive,
  onDelete,
}: {
  user: StaffUser;
  isSelf: boolean;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex size-7 items-center justify-center rounded-md text-masaar-black/50 hover:bg-black/5"
      >
        &bull;&bull;&bull;
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-10 w-44 rounded-lg border border-black/10 bg-white py-1 text-sm shadow-lg">
          <button
            type="button"
            onClick={onToggleActive}
            disabled={isSelf}
            title={isSelf ? "You can't deactivate your own account" : undefined}
            className="block w-full px-3 py-2 text-left hover:bg-warm-ivory disabled:cursor-not-allowed disabled:text-masaar-black/30 disabled:hover:bg-transparent"
          >
            {user.isActive ? "🚫 Deactivate" : "✅ Activate"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isSelf}
            title={isSelf ? "You can't delete your own account" : undefined}
            className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300 disabled:hover:bg-transparent"
          >
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminUsersListClient({
  users: initialUsers,
  currentUserId,
}: {
  users: StaffUser[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleToggleConfirm() {
    if (!deactivateTarget) return;
    setIsPending(true);
    setActionError(null);
    try {
      const nextActive = !deactivateTarget.isActive;
      await setStaffUserActive(deactivateTarget.id, nextActive);
      setUsers((prev) => prev.map((u) => (u.id === deactivateTarget.id ? { ...u, isActive: nextActive } : u)));
      setDeactivateTarget(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsPending(true);
    setActionError(null);
    try {
      await deleteStaffUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <span className="mx-1">&rsaquo;</span>
            <span>Settings</span>
            <span className="mx-1">&rsaquo;</span>
            <span className="font-semibold text-masaar-black">Admin Users</span>
          </p>
          <h1 className="text-2xl font-bold text-masaar-black">Admin Users</h1>
          <p className="mt-1 text-sm text-masaar-black/60">Manage staff access to the admin portal.</p>
        </div>
        <Link href="/admin/users/new">
          <PrimaryButton type="button">+ Add Staff User</PrimaryButton>
        </Link>
      </div>

      {actionError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-warm-ivory/50 text-xs font-bold uppercase text-masaar-black/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-masaar-black/50">
                  No staff users yet.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-warm-ivory/20">
                <td className="px-4 py-3 font-medium text-masaar-black">
                  {user.name}
                  {user.id === currentUserId && <span className="ml-1.5 text-xs text-masaar-black/40">(you)</span>}
                </td>
                <td className="px-4 py-3 text-masaar-black/70">{user.email}</td>
                <td className="px-4 py-3 text-masaar-black/70">{user.role}</td>
                <td className="px-4 py-3">
                  <Badge tone={user.isActive ? "green" : "gray"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="rounded border border-black/10 px-3 py-1 text-xs font-semibold text-admin-primary hover:bg-black/5"
                    >
                      Edit
                    </Link>
                    <KebabMenu
                      user={user}
                      isSelf={user.id === currentUserId}
                      onToggleActive={() => setDeactivateTarget(user)}
                      onDelete={() => setDeleteTarget(user)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deactivateTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#FAF5E8] text-[#A87F12]">
              <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
              {deactivateTarget.isActive ? "Deactivate this user?" : "Activate this user?"}
            </h3>
            <p className="mt-2 text-sm text-masaar-black/60">
              {deactivateTarget.isActive
                ? `${deactivateTarget.name} will no longer be able to sign in to the admin portal.`
                : `${deactivateTarget.name} will be able to sign in to the admin portal again.`}
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeactivateTarget(null)} disabled={isPending} className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory">Cancel</button>
              <button type="button" onClick={handleToggleConfirm} disabled={isPending} className="flex-1 rounded-lg bg-[#8C6B1A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#A87F12] disabled:opacity-60">
                {isPending ? "Saving..." : deactivateTarget.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-masaar-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">Delete this user?</h3>
            <p className="mt-2 text-sm text-masaar-black/60">
              &quot;{deleteTarget.name}&quot; will permanently lose access to the admin portal. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isPending} className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory">Cancel</button>
              <button type="button" onClick={handleDeleteConfirm} disabled={isPending} className="flex-1 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
