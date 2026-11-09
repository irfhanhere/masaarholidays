import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge, PageHeader, StatCard } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { INITIAL_ADDITIONAL_SERVICES } from "@/lib/data/additional-services";
import type { AdditionalServiceRow } from "@/lib/types/database";
import { setServiceStatus, toggleServiceFeatured } from "./actions";

export const metadata: Metadata = {
  title: "Additional Services | Masaar Admin",
  robots: { index: false },
};

export default async function AdminAdditionalServicesPage() {
  let services: AdditionalServiceRow[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        services = data as AdditionalServiceRow[];
      }
    } catch (e) {
      console.warn("Failed to query additional_services in admin, using initial catalogue:", e);
    }
  }

  if (services.length === 0) {
    services = INITIAL_ADDITIONAL_SERVICES;
  }

  const publishedCount = services.filter((s) => s.status === "published").length;
  const draftCount = services.filter((s) => s.status === "draft").length;
  const featuredCount = services.filter((s) => s.is_featured && s.status === "published").length;

  return (
    <div>
      <PageHeader
        title="Additional Services"
        description="Manage value-added services like Umrah Guide, Ziyarah, Wheelchair Assistance, and control homepage featured placement."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Additional Services" },
        ]}
      />

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard label="Total Services" value={services.length} />
        <StatCard label="Published" value={publishedCount} />
        <StatCard label="Draft / Inactive" value={draftCount} />
        <StatCard label="Featured on Home" value={featuredCount} />
      </div>

      {/* Services Table */}
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
            <tr>
              <th className="px-4 py-3.5">Service</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Price Type</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-center">Featured on Home</th>
              <th className="px-4 py-3.5 text-center">Order</th>
              <th className="px-4 py-3.5 text-right">View Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {services.map((service) => {
              const toggleFeaturedAction = toggleServiceFeatured.bind(
                null,
                service.id,
                !service.is_featured
              );

              const toggleStatusAction = setServiceStatus.bind(
                null,
                service.id,
                service.status === "published" ? "draft" : "published"
              );

              return (
                <tr key={service.id} className="hover:bg-warm-ivory/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-warm-ivory border border-black/10">
                        <Image
                          src={service.image_url}
                          alt={service.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-masaar-black">{service.name}</p>
                        <p className="text-[11px] text-masaar-black/50 font-mono">
                          /additional-services/{service.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-masaar-black/75">
                      {service.category}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="text-xs text-masaar-black/80">
                      {service.price_type === "fixed" && service.price_aed
                        ? `AED ${service.price_aed}`
                        : service.price_type === "from" && service.price_aed
                        ? `From AED ${service.price_aed}`
                        : "On request"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <form action={toggleStatusAction} className="inline-block">
                      <button
                        type="submit"
                        className="cursor-pointer transition-transform hover:scale-105"
                        title="Click to toggle status"
                      >
                        {service.status === "published" ? (
                          <Badge tone="green">Published</Badge>
                        ) : (
                          <Badge tone="gray">Draft</Badge>
                        )}
                      </button>
                    </form>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <form action={toggleFeaturedAction} className="inline-block">
                      <button
                        type="submit"
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition-all ${
                          service.is_featured
                            ? "bg-pure-gold/25 text-[#936E0F] border border-pure-gold/40 shadow-2xs"
                            : "bg-black/5 text-black/40 hover:bg-black/10"
                        }`}
                        title="Click to toggle featured on homepage"
                      >
                        <span>{service.is_featured ? "★ Featured" : "☆ Hidden"}</span>
                      </button>
                    </form>
                  </td>

                  <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-masaar-black/70">
                    {service.display_order}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/additional-services/${service.slug}`}
                      target="_blank"
                      className="inline-flex items-center text-xs font-semibold text-deep-gold hover:underline"
                    >
                      View Live ↗
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
