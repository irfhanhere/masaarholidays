"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import { createStaffUser, updateStaffUser, type StaffUser, type StaffUserFormState } from "./actions";

export function UserForm({ user }: { user?: StaffUser }) {
  const action = user ? updateStaffUser.bind(null, user.id) : createStaffUser;
  const [state, formAction, isPending] = useActionState<StaffUserFormState, FormData>(action, { status: "idle" });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <span className="mx-1">&rsaquo;</span>
            <Link href="/admin/users" className="hover:underline">Admin Users</Link>
            <span className="mx-1">&rsaquo;</span>
            <span className="font-semibold text-masaar-black">{user ? "Edit Staff User" : "Add Staff User"}</span>
          </p>
          <h1 className="text-2xl font-bold text-masaar-black">{user ? "Edit Staff User" : "Add Staff User"}</h1>
        </div>
        <Link href="/admin/users">
          <SecondaryButton type="button">&larr; Back to Users</SecondaryButton>
        </Link>
      </div>

      <Card className="max-w-2xl">
        <form action={formAction} className="space-y-4">
          <Field label="Name" required>
            <input name="name" defaultValue={user?.name ?? ""} required placeholder="Enter full name" className={inputClass} />
          </Field>

          <Field
            label="Email"
            required
            hint={user ? undefined : "An invite email is sent to this address so they can set their own password."}
          >
            <input
              type="email"
              name="email"
              defaultValue={user?.email ?? ""}
              required
              placeholder="Enter email address"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
            <Field label="Role" required>
              <select name="role" defaultValue={user?.role ?? "Staff"} className={inputClass}>
                <option value="Staff">Staff</option>
                <option value="Administrator">Administrator</option>
              </select>
            </Field>

            <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-masaar-black">
              <span>Status</span>
              <span className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={user?.isActive ?? true}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-emerald-600" />
                <span className="absolute left-1 size-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
              </span>
              <span className="text-xs text-masaar-black/60">Active</span>
            </label>
          </div>

          {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin/users">
              <SecondaryButton type="button">Cancel</SecondaryButton>
            </Link>
            <PrimaryButton type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save User"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
