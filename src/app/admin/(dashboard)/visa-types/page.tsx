import Link from "next/link";
import type { Metadata } from "next";
import { Badge, EmptyRow, PageHeader, PrimaryButton, SecondaryButton } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { VisaTypeRow } from "@/lib/types/database";
import { deleteVisaType, toggleVisaTypeActive } from "./actions";

export const metadata: Metadata = { title: "Visa Types | Masaar Admin", robots: { index: false } };

async function getVisaTypes(): Promise<VisaTypeRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("visa_types").select("*").order("display_order", { ascending: true });
  return data ?? [];
}

export default async function AdminVisaTypesPage() {
  const visaTypes = await getVisaTypes();

  return (
    <div>
      <PageHeader
        title="Visa Types"
        description="The 6 visa detail pages under /visa/[slug] — one shared template, different content per type."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Visa Types" }]}
        actions={
          <>
            <Link href="/admin/visa-types/landing">
              <SecondaryButton>Edit Landing Page Content</SecondaryButton>
            </Link>
            <Link href="/admin/visa-types/new">
              <PrimaryButton>+ Add Visa Type</PrimaryButton>
            </Link>
          </>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs uppercase text-masaar-black/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {visaTypes.length === 0 && <EmptyRow colSpan={5}>No visa types yet.</EmptyRow>}
            {visaTypes.map((visa) => (
              <tr key={visa.id}>
                <td className="px-4 py-3 font-medium text-masaar-black">{visa.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-masaar-black/60">/visa/{visa.slug}</td>
                <td className="px-4 py-3 text-masaar-black/70">{visa.display_order}</td>
                <td className="px-4 py-3">
                  <Badge tone={visa.is_active ? "green" : "gray"}>{visa.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/visa-types/${visa.id}`} className="text-sm font-medium text-admin-primary">
                      Edit
                    </Link>
                    <form action={toggleVisaTypeActive.bind(null, visa.id, !visa.is_active)}>
                      <button type="submit" className="text-sm text-masaar-black/60 underline">
                        {visa.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={deleteVisaType.bind(null, visa.id)}>
                      <button type="submit" className="text-sm text-red-600 underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
