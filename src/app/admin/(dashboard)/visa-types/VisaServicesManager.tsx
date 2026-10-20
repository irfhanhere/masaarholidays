"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { VisaTypeRow } from "@/lib/types/database";
import { toggleVisaTypeActive, deleteVisaType } from "./actions";

interface VisaServicesManagerProps {
  initialVisaTypes: VisaTypeRow[];
}

export function VisaServicesManager({ initialVisaTypes }: VisaServicesManagerProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [visaList, setVisaList] = useState<VisaTypeRow[]>(initialVisaTypes);

  // Metrics
  const totalCount = visaList.length;
  const publishedCount = visaList.filter((v) => v.is_active).length;
  const onlineCount = visaList.filter(
    (v) => v.service_mode === "online" || ["uae", "saudi-tourist", "us"].includes(v.slug)
  ).length;
  const enquiryCount = totalCount - onlineCount;

  // Filtered List
  const filteredVisas = useMemo(() => {
    return visaList.filter((v) => {
      const mode =
        v.service_mode ||
        (["uae", "saudi-tourist", "us"].includes(v.slug) ? "online" : "enquiry");

      const category =
        v.category ||
        (v.slug === "uae"
          ? "UAE"
          : v.slug === "saudi-tourist" || v.slug === "umrah"
          ? "Saudi Arabia"
          : v.slug === "us"
          ? "United States"
          : v.slug === "india"
          ? "India"
          : "Global");

      const matchSearch =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        (v.description || "").toLowerCase().includes(search.toLowerCase()) ||
        v.slug.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === "all" ||
        category.toLowerCase() === selectedCategory.toLowerCase();

      const matchMode =
        selectedMode === "all" ||
        (selectedMode === "online" && mode === "online") ||
        (selectedMode === "enquiry" && mode === "enquiry");

      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && v.is_active) ||
        (selectedStatus === "inactive" && !v.is_active);

      return matchSearch && matchCategory && matchMode && matchStatus;
    });
  }, [visaList, search, selectedCategory, selectedMode, selectedStatus]);

  const handleToggle = async (id: string, newStatus: boolean) => {
    setVisaList((prev) =>
      prev.map((v) => (v.id === id ? { ...v, is_active: newStatus } : v))
    );
    try {
      await toggleVisaTypeActive(id, newStatus);
    } catch {
      // rollback on error
      setVisaList(initialVisaTypes);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedMode("all");
    setSelectedStatus("all");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumbs & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:text-masaar-black">Home</Link>
            <span>›</span>
            <span className="font-semibold text-masaar-black">Visa Services</span>
          </div>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black sm:text-3xl">
            Visa Services
          </h1>
          <p className="mt-1 text-xs text-masaar-black/60">
            Manage all visa services, availability, pricing and publication status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/visa-types/landing"
            className="rounded-md border border-black/15 bg-white px-4 py-2.5 text-xs font-semibold text-masaar-black shadow-sm hover:bg-black/5"
          >
            Landing Page Content
          </Link>
          <Link
            href="/admin/visa-types/new"
            className="rounded-md bg-pure-gold px-4 py-2.5 text-xs font-semibold text-masaar-black shadow transition-all hover:bg-light-gold"
          >
            + Add New Visa Service
          </Link>
        </div>
      </div>

      {/* 2. Metric Cards (matching A01.png) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-masaar-black/60">Total Visa Services</p>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                {totalCount}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-masaar-black/50">All configured visa services</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-masaar-black/60">Published</p>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                {publishedCount}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-emerald-600">Live on public website</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-masaar-black/60">Online Application</p>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                {onlineCount}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-masaar-black/50">Instant booking & payment</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-masaar-black/60">Enquiry Based</p>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                {enquiryCount}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-masaar-black/50">WhatsApp & phone inquiry</p>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="relative min-w-[240px] flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visa services..."
            className="w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by Category"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="UAE">UAE</option>
          <option value="Saudi Arabia">Saudi Arabia</option>
          <option value="United States">United States</option>
          <option value="Global">Global</option>
          <option value="India">India</option>
        </select>

        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
          aria-label="Filter by Service Mode"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
        >
          <option value="all">All Service Modes</option>
          <option value="online">Online Application</option>
          <option value="enquiry">Enquiry Based</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="Filter by Status"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Published</option>
          <option value="inactive">Draft / Inactive</option>
        </select>

        <button
          onClick={resetFilters}
          className="rounded-md border border-black/15 px-3 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5"
        >
          Reset
        </button>
      </div>

      {/* 4. Table (matching A01.png) */}
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-black/10 bg-warm-ivory/40 uppercase tracking-wider text-masaar-black/50">
            <tr>
              <th className="px-4 py-3.5">#</th>
              <th className="px-4 py-3.5">Visa Service</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Service Mode</th>
              <th className="px-4 py-3.5">Price Range</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filteredVisas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-masaar-black/50">
                  No visa services match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredVisas.map((v, idx) => {
                const isOnline =
                  v.service_mode === "online" || ["uae", "saudi-tourist", "us"].includes(v.slug);
                const category =
                  v.category ||
                  (v.slug === "uae"
                    ? "UAE"
                    : v.slug === "saudi-tourist" || v.slug === "umrah"
                    ? "Saudi Arabia"
                    : v.slug === "us"
                    ? "United States"
                    : v.slug === "india"
                    ? "India"
                    : "Global");

                const priceRange =
                  v.price_range ||
                  (v.slug === "uae"
                    ? "USD 90 – 140"
                    : v.slug === "saudi-tourist"
                    ? "USD 120 – 180"
                    : v.slug === "us"
                    ? "USD 160 – 250"
                    : "On Request");

                const thumbnail =
                  v.hero_image_url ||
                  (v.slug === "uae"
                    ? "/trips/destination-image.webp"
                    : v.slug === "saudi-tourist"
                    ? "/trips/package-detail-hero-1.webp"
                    : v.slug === "us"
                    ? "/trips/package-detail-hero-3.webp"
                    : v.slug === "umrah"
                    ? "/trips/umrah-banner.webp"
                    : "/trips/visa-assistance-card-home.webp");

                return (
                  <tr key={v.id} className="hover:bg-warm-ivory/20 transition-colors">
                    <td className="px-4 py-3.5 text-masaar-black/50">{idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-warm-ivory">
                          <Image src={thumbnail} alt={v.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold text-masaar-black">{v.name}</p>
                          <p className="text-[11px] text-masaar-black/60 line-clamp-1 max-w-xs">
                            {v.description || `/visa/${v.slug}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-warm-ivory px-2 py-0.5 text-[10px] font-semibold text-deep-gold">
                        {category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded px-2.5 py-0.5 text-[10px] font-semibold ${
                          isOnline
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isOnline ? "Online Application" : "Enquiry Based"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-masaar-black">{priceRange}</td>
                    <td className="px-4 py-3.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={v.is_active}
                          onChange={(e) => handleToggle(v.id, e.target.checked)}
                          className="rounded text-pure-gold"
                        />
                        <span className={v.is_active ? "text-emerald-700 font-semibold" : "text-masaar-black/50"}>
                          {v.is_active ? "Published" : "Draft"}
                        </span>
                      </label>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/visa-types/${v.id}`}
                          title="Edit Service"
                          className="rounded p-1.5 text-masaar-black/60 hover:bg-black/5 hover:text-masaar-black"
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/visa/${v.slug}`}
                          target="_blank"
                          title="Preview Public Page"
                          className="rounded p-1.5 text-masaar-black/60 hover:bg-black/5 hover:text-masaar-black"
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
