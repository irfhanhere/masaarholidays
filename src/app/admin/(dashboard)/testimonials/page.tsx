import Link from "next/link";
import type { Metadata } from "next";
import { Badge, EmptyRow, GoldButton, PageHeader, StatCard } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { TestimonialRow } from "@/lib/types/database";
import { deleteTestimonial, setTestimonialStatus } from "./actions";

export const metadata: Metadata = { title: "Testimonials | Masaar Admin", robots: { index: false } };

export default async function AdminTestimonialsPage() {
  let testimonials: TestimonialRow[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("testimonials").select("*").order("display_order", { ascending: true });
    testimonials = data ?? [];
  }

  const published = testimonials.filter((t) => t.status === "published").length;
  const draft = testimonials.filter((t) => t.status === "draft").length;

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Manage customer testimonials displayed across the Masaar Holidays website."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Testimonials" }]}
        actions={
          <Link href="/admin/testimonials/new">
            <GoldButton>+ Add Testimonial</GoldButton>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="All Testimonials" value={testimonials.length} />
        <StatCard label="Published" value={published} />
        <StatCard label="Drafts" value={draft} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs uppercase text-masaar-black/50">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Testimonial</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {testimonials.length === 0 && (
              <EmptyRow colSpan={5}>
                No testimonials yet — never add fake ones, leave empty until real reviews exist.
              </EmptyRow>
            )}
            {testimonials.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-masaar-black">{t.customer_name}</p>
                  {t.location && <p className="text-xs text-masaar-black/50">{t.location}</p>}
                </td>
                <td className="max-w-sm px-4 py-3 text-masaar-black/70">
                  <p className="line-clamp-2">&ldquo;{t.testimonial_text}&rdquo;</p>
                </td>
                <td className="px-4 py-3 text-masaar-black/70">{t.service}</td>
                <td className="px-4 py-3">
                  <Badge tone={t.status === "published" ? "green" : "amber"}>{t.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/testimonials/${t.id}`} className="text-sm font-medium text-admin-primary">
                      Edit
                    </Link>
                    <form action={setTestimonialStatus.bind(null, t.id, t.status === "published" ? "draft" : "published")}>
                      <button type="submit" className="text-sm text-masaar-black/60 underline">
                        {t.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <form action={deleteTestimonial.bind(null, t.id)}>
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
