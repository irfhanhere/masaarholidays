"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type StaffRole = "Administrator" | "Staff";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

/**
 * Guards every action in this file: the caller must be a real, signed-in
 * admin session, or (dev only) the same ALLOW_DEV_AUTH_BYPASS escape hatch
 * every other admin actions file uses. The Supabase Auth Admin API itself
 * only ever accepts the service-role key — there's no per-user "your own
 * RLS-scoped client" variant of it the way there is for a regular table —
 * so this guard is what stands in for that check here: same intent (never
 * let an unauthenticated caller reach a privileged action, but allow local
 * testing without a real session) as hotels/actions.ts's getClient(), just
 * applied as a gate in front of createAdminClient() instead of a branch
 * that picks between two client instances.
 */
async function requireAdminSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return;

  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") return;

  throw new Error("You must be signed in as an admin to do this.");
}

async function getAdminClient() {
  await requireAdminSession();
  return createAdminClient();
}

function roleFromMetadata(appMetadata: Record<string, unknown> | undefined): StaffRole {
  const role = appMetadata?.role;
  return role === "Staff" ? "Staff" : "Administrator";
}

function nameFromMetadata(appMetadata: Record<string, unknown> | undefined, email: string | undefined): string {
  const name = appMetadata?.name;
  return typeof name === "string" && name.trim() ? name.trim() : (email ?? "Unknown");
}

export async function listStaffUsers(): Promise<StaffUser[]> {
  const admin = await getAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) {
    console.error("listStaffUsers", error.message);
    return [];
  }

  return data.users
    .map((u) => ({
      id: u.id,
      name: nameFromMetadata(u.app_metadata, u.email),
      email: u.email ?? "",
      role: roleFromMetadata(u.app_metadata),
      isActive: !u.banned_until || new Date(u.banned_until) <= new Date(),
      createdAt: u.created_at,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStaffUser(id: string): Promise<StaffUser | null> {
  const admin = await getAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error || !data.user) return null;

  const u = data.user;
  return {
    id: u.id,
    name: nameFromMetadata(u.app_metadata, u.email),
    email: u.email ?? "",
    role: roleFromMetadata(u.app_metadata),
    isActive: !u.banned_until || new Date(u.banned_until) <= new Date(),
    createdAt: u.created_at,
  };
}

export interface StaffUserFormState {
  status: "idle" | "error";
  message?: string;
}

function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function createStaffUser(
  _prevState: StaffUserFormState,
  formData: FormData
): Promise<StaffUserFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "Staff").trim() === "Administrator" ? "Administrator" : "Staff";
  const isActive = formData.get("is_active") === "on";

  if (!name || !email) {
    return { status: "error", message: "Name and email are required." };
  }

  const admin = await getAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteOrigin()}/admin/login`,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  // inviteUserByEmail's own `data` option only maps to user_metadata (which
  // the user could edit themselves once signed in) — name/role are
  // admin-controlled authorization fields, so they belong in app_metadata,
  // set here via a follow-up updateUserById call instead. Also where the
  // "Inactive" status toggle applies (inviteUserByEmail always creates the
  // user active; ban_duration is a second, separate call either way).
  if (data.user) {
    const { error: metaError } = await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { name, role },
      ...(isActive ? {} : { ban_duration: "876000h" }), // ~100 years — effectively indefinite, matches "Inactive"
    });
    if (metaError) {
      return { status: "error", message: `User invited, but couldn't finish setting them up: ${metaError.message}` };
    }
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateStaffUser(
  userId: string,
  _prevState: StaffUserFormState,
  formData: FormData
): Promise<StaffUserFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "Staff").trim() === "Administrator" ? "Administrator" : "Staff";
  const isActive = formData.get("is_active") === "on";

  if (!name || !email) {
    return { status: "error", message: "Name and email are required." };
  }

  if (!isActive) {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id === userId) {
      return { status: "error", message: "You can't deactivate your own account from here." };
    }
  }

  const admin = await getAdminClient();

  const { error } = await admin.auth.admin.updateUserById(userId, {
    email,
    app_metadata: { name, role },
    ban_duration: isActive ? "none" : "876000h",
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function setStaffUserActive(userId: string, isActive: boolean) {
  if (!isActive) {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id === userId) {
      throw new Error("You can't deactivate your own account from here.");
    }
  }

  const admin = await getAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: isActive ? "none" : "876000h",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function deleteStaffUser(userId: string) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (currentUser?.id === userId) {
    throw new Error("You can't delete your own account from here.");
  }

  const admin = await getAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

/** Used by the list/edit screens to disable self-delete/self-deactivate in the UI, not just block it server-side. */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
