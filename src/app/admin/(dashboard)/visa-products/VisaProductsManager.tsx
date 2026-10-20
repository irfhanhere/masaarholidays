"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  FileText,
  CheckCircle2,
  Laptop,
  EyeOff,
  Search,
  Filter,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Check,
  X,
  Sparkles,
} from "@/components/admin/icons";
import type { VisaProductRow } from "@/lib/types/database";
import { toggleVisaProductActive, saveVisaProduct, deleteVisaProduct } from "./actions";

interface VisaProductsManagerProps {
  initialProducts: VisaProductRow[];
}

const COUNTRY_CONFIGS = [
  { slug: "uae", name: "UAE Visa", flag: "🇦🇪", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { slug: "saudi-tourist", name: "Saudi Tourist Visa", flag: "🇸🇦", color: "text-green-700 bg-green-50 border-green-200" },
  { slug: "us", name: "US Visa", flag: "🇺🇸", color: "text-blue-700 bg-blue-50 border-blue-200" },
];

const THUMBNAILS: Record<string, string> = {
  uae: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=160&auto=format&fit=crop&q=80",
  "saudi-tourist": "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=160&auto=format&fit=crop&q=80",
  us: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=160&auto=format&fit=crop&q=80",
};

export default function VisaProductsManager({ initialProducts }: VisaProductsManagerProps) {
  const [products, setProducts] = useState<VisaProductRow[]>(initialProducts);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<VisaProductRow | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [targetSlugForNew, setTargetSlugForNew] = useState<string>("uae");
  const [isPending, startTransition] = useTransition();

  // Metrics
  const totalCount = products.length;
  const publishedCount = products.filter((p) => p.is_active).length;
  const onlineCount = publishedCount;
  const hiddenCount = totalCount - publishedCount;

  // Filtered
  const filteredProducts = products.filter((p) => {
    const matchesTab = selectedTab === "all" || p.visa_type_slug === selectedTab;
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.duration.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleToggleActive = (product: VisaProductRow) => {
    const nextActive = !product.is_active;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: nextActive } : p))
    );
    startTransition(async () => {
      await toggleVisaProductActive(product.id, product.is_active);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this visa product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => {
      await deleteVisaProduct(id);
    });
  };

  const handleDuplicate = (product: VisaProductRow) => {
    const duplicated: VisaProductRow = {
      ...product,
      id: `${product.id}-copy-${Date.now()}`,
      title: `${product.title} (Copy)`,
      is_active: false,
    };
    setProducts((prev) => [...prev, duplicated]);
    startTransition(async () => {
      await saveVisaProduct({
        visa_type_slug: duplicated.visa_type_slug,
        title: duplicated.title,
        subtitle: duplicated.subtitle || "",
        duration: duplicated.duration,
        entry_type: duplicated.entry_type,
        visa_fee_usd: duplicated.visa_fee_usd,
        service_fee_usd: duplicated.service_fee_usd,
        processing_fee_usd: duplicated.processing_fee_usd,
        validity_days: duplicated.validity_days || "30 Days",
        processing_time: duplicated.processing_time || "3-5 Working Days",
        is_popular: duplicated.is_popular,
        is_active: false,
        inclusions: duplicated.inclusions || [],
        exclusions: duplicated.exclusions || [],
      });
    });
  };

  const handleSaveModal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get("id") as string | undefined;
    const visa_type_slug = formData.get("visa_type_slug") as string;
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string;
    const duration = formData.get("duration") as string;
    const entry_type = formData.get("entry_type") as string;
    const visa_fee_usd = Number(formData.get("visa_fee_usd"));
    const service_fee_usd = Number(formData.get("service_fee_usd"));
    const processing_fee_usd = Number(formData.get("processing_fee_usd"));
    const validity_days = formData.get("validity_days") as string;
    const processing_time = formData.get("processing_time") as string;
    const is_popular = formData.get("is_popular") === "on";
    const is_active = formData.get("is_active") === "on";

    const total_usd = visa_fee_usd + service_fee_usd + processing_fee_usd;

    const payload = {
      id: id || undefined,
      visa_type_slug,
      title,
      subtitle,
      duration,
      entry_type,
      visa_fee_usd,
      service_fee_usd,
      processing_fee_usd,
      total_usd,
      validity_days,
      processing_time,
      is_popular,
      is_active,
      inclusions: ["Single/Multi entry", "Tourism / Visit", "Fast processing"],
      exclusions: ["Flight tickets", "Hotel bookings"],
    };

    if (id) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? ({ ...p, ...payload } as VisaProductRow) : p))
      );
    } else {
      const newProd = {
        ...payload,
        id: `prod-${Date.now()}`,
        currency: "USD",
        display_order: products.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as VisaProductRow;
      setProducts((prev) => [...prev, newProd]);
    }

    startTransition(async () => {
      await saveVisaProduct(payload);
      setEditingProduct(null);
      setIsNewModalOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-masaar-black">Online Visa Products</h1>
          <p className="mt-1 text-sm text-masaar-black/60">
            Manage online visa products, variants, pricing and applicable fees.
          </p>
        </div>
        <button
          onClick={() => {
            setTargetSlugForNew("uae");
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-masaar-black/50">Total Products</p>
            <p className="text-2xl font-bold text-masaar-black">{totalCount}</p>
            <p className="text-xs text-masaar-black/60">Across 3 visa services</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-masaar-black/50">Published Products</p>
            <p className="text-2xl font-bold text-masaar-black">{publishedCount}</p>
            <p className="text-xs text-emerald-600 font-medium">Live on website</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Laptop className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-masaar-black/50">Online Application</p>
            <p className="text-2xl font-bold text-masaar-black">{onlineCount}</p>
            <p className="text-xs text-masaar-black/60">With instant booking & payment</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <EyeOff className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-masaar-black/50">Hidden Products</p>
            <p className="text-2xl font-bold text-masaar-black">{hiddenCount}</p>
            <p className="text-xs text-masaar-black/60">Not visible on website</p>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedTab("all")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              selectedTab === "all"
                ? "bg-masaar-black text-white"
                : "text-masaar-black/70 hover:bg-black/5"
            }`}
          >
            All Products ({totalCount})
          </button>
          {COUNTRY_CONFIGS.map((c) => {
            const count = products.filter((p) => p.visa_type_slug === c.slug).length;
            const active = selectedTab === c.slug;
            return (
              <button
                key={c.slug}
                onClick={() => setSelectedTab(c.slug)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-masaar-black text-white"
                    : "text-masaar-black/70 hover:bg-black/5"
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-black/10 text-masaar-black/70"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-black/10 py-2 pl-9 pr-3 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-masaar-black/70 hover:bg-black/5">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Product Groups */}
      {COUNTRY_CONFIGS.filter((c) => selectedTab === "all" || selectedTab === c.slug).map((country) => {
        const countryProducts = filteredProducts.filter((p) => p.visa_type_slug === country.slug);
        if (countryProducts.length === 0 && searchQuery) return null;

        return (
          <div key={country.slug} className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
            {/* Country Group Header */}
            <div className="flex items-center justify-between border-b border-black/10 bg-neutral-50/70 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{country.flag}</span>
                <h2 className="text-lg font-bold text-masaar-black">{country.name}</h2>
                <span className="rounded-full bg-black/10 px-2.5 py-0.5 text-xs font-semibold text-masaar-black/70">
                  {countryProducts.length} Products
                </span>
              </div>
              <button
                onClick={() => {
                  setTargetSlugForNew(country.slug);
                  setIsNewModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/30 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Add {country.name.split(" ")[0]} Product
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-black/5 bg-neutral-50/40 text-xs font-semibold uppercase tracking-wider text-masaar-black/50">
                  <tr>
                    <th className="w-10 px-4 py-3 text-center">#</th>
                    <th className="px-4 py-3">Product Variant</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Entry Type</th>
                    <th className="px-4 py-3">Visa Fee</th>
                    <th className="px-4 py-3">Service Fee</th>
                    <th className="px-4 py-3">Processing Fee</th>
                    <th className="px-4 py-3 font-bold text-masaar-black">Total (USD)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {countryProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-neutral-50/60 transition">
                      <td className="px-4 py-3.5 text-center text-xs font-medium text-masaar-black/40">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-12 flex-shrink-0 overflow-hidden rounded-md border border-black/10 bg-neutral-100">
                            <Image
                              src={THUMBNAILS[p.visa_type_slug] || THUMBNAILS.uae}
                              alt={p.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-masaar-black">{p.title}</span>
                              {p.is_popular && (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                  <Sparkles className="h-2.5 w-2.5" /> Popular
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-masaar-black/50">{p.subtitle || p.validity_days}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-masaar-black/80">{p.duration}</td>
                      <td className="px-4 py-3.5 text-masaar-black/70">{p.entry_type}</td>
                      <td className="px-4 py-3.5 text-masaar-black/70">${p.visa_fee_usd}</td>
                      <td className="px-4 py-3.5 text-masaar-black/70">${p.service_fee_usd}</td>
                      <td className="px-4 py-3.5 text-masaar-black/70">${p.processing_fee_usd}</td>
                      <td className="px-4 py-3.5 font-bold text-masaar-black">${p.total_usd}</td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            p.is_active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              p.is_active ? "bg-emerald-600" : "bg-neutral-400"
                            }`}
                          />
                          {p.is_active ? "Published" : "Hidden"}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingProduct(p)}
                            title="Edit Product"
                            className="rounded p-1.5 text-masaar-black/50 hover:bg-black/5 hover:text-masaar-black transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p)}
                            title="Duplicate Variant"
                            className="rounded p-1.5 text-masaar-black/50 hover:bg-black/5 hover:text-masaar-black transition"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            title="Delete Product"
                            className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Edit / Create Modal */}
      {(editingProduct || isNewModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-masaar-black">
                  {editingProduct ? "Edit Visa Product" : "Add Online Visa Product"}
                </h3>
                <p className="text-xs text-masaar-black/60">
                  Configure variant pricing, duration, and fees visible in the customer checkout.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsNewModalOpen(false);
                }}
                className="rounded-lg p-1.5 text-masaar-black/40 hover:bg-black/5 hover:text-masaar-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              {editingProduct && <input type="hidden" name="id" value={editingProduct.id} />}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-masaar-black/70">
                    Visa Service
                  </label>
                  <select
                    name="visa_type_slug"
                    defaultValue={editingProduct?.visa_type_slug || targetSlugForNew}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  >
                    <option value="uae">UAE Visa</option>
                    <option value="saudi-tourist">Saudi Tourist Visa</option>
                    <option value="us">US Visa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-masaar-black/70">
                    Entry Type
                  </label>
                  <select
                    name="entry_type"
                    defaultValue={editingProduct?.entry_type || "Single"}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Single">Single Entry</option>
                    <option value="Multiple">Multiple Entry</option>
                    <option value="Single/Multi">Single / Multi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-masaar-black/70">
                    Product Title
                  </label>
                  <input
                    name="title"
                    defaultValue={editingProduct?.title || ""}
                    placeholder="e.g. 30 Days Single Entry"
                    required
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-masaar-black/70">
                    Subtitle / Variant
                  </label>
                  <input
                    name="subtitle"
                    defaultValue={editingProduct?.subtitle || ""}
                    placeholder="e.g. Standard UAE Visit Visa"
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-masaar-black/70">
                    Stay Duration
                  </label>
                  <input
                    name="duration"
                    defaultValue={editingProduct?.duration || "30 Days"}
                    required
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-masaar-black/70">
                    Validity
                  </label>
                  <input
                    name="validity_days"
                    defaultValue={editingProduct?.validity_days || "30 Days"}
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-masaar-black/70">
                    Processing Time
                  </label>
                  <input
                    name="processing_time"
                    defaultValue={editingProduct?.processing_time || "3-5 Working Days"}
                    className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Fee Breakdown (USD per Applicant)
                </h4>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-masaar-black/70">Visa Authority Fee</label>
                    <input
                      name="visa_fee_usd"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct?.visa_fee_usd || 90}
                      required
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-masaar-black/70">Masaar Service Fee</label>
                    <input
                      name="service_fee_usd"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct?.service_fee_usd || 20}
                      required
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-masaar-black/70">Processing Fee</label>
                    <input
                      name="processing_fee_usd"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct?.processing_fee_usd || 10}
                      required
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-masaar-black cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={editingProduct ? editingProduct.is_active : true}
                    className="h-4 w-4 rounded border-black/20 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Publish product (Visible on website)</span>
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-masaar-black cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_popular"
                    defaultChecked={editingProduct?.is_popular || false}
                    className="h-4 w-4 rounded border-black/20 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Mark as "Most Popular"</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-black/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsNewModalOpen(false);
                  }}
                  className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-masaar-black/70 hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-masaar-black px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
