"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge, PageHeader, PrimaryButton, SecondaryButton, Card, StatCard } from "@/components/admin/ui";
import type { PremiumPackage } from "@/lib/types/premium-package";
import {
  duplicateUmrahPackageAction,
  togglePublishPackageAction,
  archivePackageAction,
} from "./actions";

interface Props {
  initialPackages: PremiumPackage[];
}

export function UmrahPackagesListClient({ initialPackages }: Props) {
  const [packages, setPackages] = useState<PremiumPackage[]>(initialPackages);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Stats
  const totalCount = packages.length;
  const publishedCount = packages.filter((p) => p.status === "published").length;
  const homepageCount = packages.filter((p) => p.show_on_homepage && p.status === "published").length;
  const umrahPageCount = packages.filter((p) => p.show_on_umrah_page && p.status === "published").length;

  // Filtered packages
  const filtered = packages.filter((p) => {
    const matchesSearch =
      search.trim() === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStartingPrice = (pkg: PremiumPackage) => {
    if (!pkg.pricing || pkg.pricing.length === 0) return "N/A";
    const minPrice = Math.min(...pkg.pricing.map((r) => r.price_aed || 0));
    return `AED ${minPrice.toLocaleString()}`;
  };

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      const res = await duplicateUmrahPackageAction(id);
      if (res.success) {
        showToast(res.message, "success");
        // Reload list
        window.location.reload();
      } else {
        showToast(res.message, "error");
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    startTransition(async () => {
      const res = await togglePublishPackageAction(id, nextStatus as any);
      if (res.success) {
        setPackages((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: nextStatus as any } : p))
        );
        showToast(res.message, "success");
      } else {
        showToast(res.message, "error");
      }
    });
  };

  const handleArchive = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to archive "${title}"? It will be hidden from public view while preserving all historical references.`)) {
      return;
    }

    startTransition(async () => {
      const res = await archivePackageAction(id);
      if (res.success) {
        setPackages((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "archived" } : p))
        );
        showToast(res.message, "success");
      } else {
        showToast(res.message, "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-xs font-semibold shadow-lg transition-all ${
            toast.type === "success" ? "bg-emerald-900 text-white" : "bg-red-800 text-white"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠"}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Umrah Packages"
        description="Manage, edit, publish and configure packages shown across the homepage, main Umrah directory, and standalone package detail pages."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Website Management" },
          { label: "Umrah Packages" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/umrah-packages/new">
              <PrimaryButton>+ Add New Package</PrimaryButton>
            </Link>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Packages" value={totalCount} />
        <StatCard label="Published Packages" value={publishedCount} />
        <StatCard label="Homepage Visible" value={homepageCount} />
        <StatCard label="Umrah Directory Visible" value={umrahPageCount} />
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by package name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-black/15 bg-white px-3 py-1.5 text-xs text-masaar-black placeholder:text-black/40 focus:border-admin-primary focus:outline-none"
            />
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <span className="text-xs text-masaar-black/60 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-xs text-masaar-black focus:border-admin-primary focus:outline-none"
            >
              <option value="all">All Packages ({totalCount})</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Packages Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/10 bg-admin-surface/75 text-[11px] font-bold uppercase tracking-wider text-masaar-black/60">
              <tr>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Badge</th>
                <th className="py-3 px-4">Starting Price</th>
                <th className="py-3 px-4">Homepage</th>
                <th className="py-3 px-4">Umrah Page</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-masaar-black/50">
                    No packages match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const startingPrice = getStartingPrice(p);
                  const publicUrl = `/umrah/${p.slug}`;
                  const isBestSelling = p.slug === "masaar-best-selling-umrah";
                  const badgeText = p.package_badge || (isBestSelling ? "BEST SELLING" : p.is_featured ? "FEATURED" : "STANDARD");

                  return (
                    <tr key={p.id || p.slug} className="hover:bg-black/[0.015] transition-colors">
                      {/* Title */}
                      <td className="py-3.5 px-4 font-semibold text-masaar-black max-w-[220px]">
                        <div className="truncate font-medium">{p.title}</div>
                        <div className="text-[10px] text-masaar-black/50 font-normal">
                          {p.hotels.length} Hotel{p.hotels.length === 1 ? "" : "s"} · {p.inclusions.length} Inclusions
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-masaar-black/70">
                        {p.slug}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 text-masaar-black/80 whitespace-nowrap">
                        {p.duration_days}D / {p.duration_nights}N
                      </td>

                      {/* Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isBestSelling
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : p.is_featured
                              ? "bg-purple-100 text-purple-900 border border-purple-200"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {badgeText}
                        </span>
                      </td>

                      {/* Starting Price */}
                      <td className="py-3.5 px-4 font-semibold text-emerald-800 whitespace-nowrap">
                        {startingPrice}
                      </td>

                      {/* Homepage Visibility */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.show_on_homepage && p.status === "published" ? (
                          <Badge tone="green">Visible</Badge>
                        ) : (
                          <Badge tone="gray">Hidden</Badge>
                        )}
                      </td>

                      {/* Umrah Directory Visibility */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.show_on_umrah_page && p.status === "published" ? (
                          <Badge tone="green">Visible</Badge>
                        ) : (
                          <Badge tone="gray">Hidden</Badge>
                        )}
                      </td>

                      {/* Publication Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            p.status === "published"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : p.status === "draft"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              p.status === "published"
                                ? "bg-emerald-600"
                                : p.status === "draft"
                                ? "bg-amber-500"
                                : "bg-gray-400"
                            }`}
                          />
                          <span className="capitalize">{p.status}</span>
                        </span>
                      </td>

                      {/* Updated Date */}
                      <td className="py-3.5 px-4 text-masaar-black/50 whitespace-nowrap text-[11px]">
                        {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "Default"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded border border-black/15 bg-white px-2 py-1 text-[11px] font-medium text-masaar-black hover:bg-admin-surface transition-colors"
                            title="Preview public package page"
                          >
                            View
                          </a>

                          {/* Edit */}
                          <Link
                            href={`/admin/umrah-packages/${p.id || p.slug}`}
                            className="rounded bg-admin-primary px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-admin-primary-dark transition-colors"
                          >
                            Edit
                          </Link>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p.id)}
                            disabled={isPending}
                            className="rounded border border-black/15 bg-white px-2 py-1 text-[11px] font-medium text-masaar-black hover:bg-admin-surface disabled:opacity-50 transition-colors"
                            title="Duplicate package as a draft copy"
                          >
                            Copy
                          </button>

                          {/* Publish / Unpublish */}
                          {p.status !== "archived" && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p.id, p.status)}
                              disabled={isPending}
                              className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                                p.status === "published"
                                  ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                  : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              }`}
                            >
                              {p.status === "published" ? "Unpublish" : "Publish"}
                            </button>
                          )}

                          {/* Archive */}
                          {p.status !== "archived" && (
                            <button
                              type="button"
                              onClick={() => handleArchive(p.id, p.title)}
                              disabled={isPending}
                              className="rounded border border-black/10 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                              title="Archive package (safe retention)"
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
