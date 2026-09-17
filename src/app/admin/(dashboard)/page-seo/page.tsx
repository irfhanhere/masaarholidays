import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PageSeoRow } from "@/lib/types/database";
import { PageSeoRowForm } from "./PageSeoRowForm";

export const metadata = { title: "Page SEO | Masaar Admin", robots: { index: false } };

export default async function PageSeoPage() {
  let rows: PageSeoRow[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("page_seo").select("*").order("path");
    rows = data ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Page SEO"
        description="Meta title, description, OG image and noindex for every static top-level page. Dynamic content (packages, hotels, visa types, departure months) has its own SEO fields on that content's own edit form instead."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Page SEO" }]}
      />

      <div className="space-y-4">
        {rows.length === 0 && (
          <p className="text-sm text-masaar-black/50">
            No page_seo rows found — run the seed migration, or connect Supabase.
          </p>
        )}
        {rows.map((row) => (
          <PageSeoRowForm key={row.path} row={row} />
        ))}
      </div>
    </div>
  );
}
