"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge, PageHeader, PrimaryButton, SecondaryButton, GoldButton } from "@/components/admin/ui";
import { TrainIcon, PlaneIcon, BusIcon, CompassIcon, DocumentIcon, FamilyIcon, CheckIcon } from "@/components/site/icons";
import type {
  PremiumPackage,
  PremiumPackageHotel,
  PremiumPackageInclusion,
  PremiumPackageTransport,
  PremiumPackagePricing,
  PremiumPackageItineraryDay,
  TransportMode,
} from "@/lib/types/premium-package";
import { saveMasaarPremiumPackageAction } from "./actions";
import { MasaarPremiumUmrahSpotlight } from "@/components/site/MasaarPremiumUmrahSpotlight";
import { PremiumItineraryAccordion } from "@/components/site/PremiumItineraryAccordion";

interface Props {
  initialPackage: PremiumPackage;
}

type ActiveTab = "general" | "hotels" | "inclusions" | "transport" | "pricing" | "itinerary" | "preview";

export function PremiumPackageManagerClient({ initialPackage }: Props) {
  const [pkg, setPkg] = useState<PremiumPackage>(initialPackage);
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");
  const [previewMode, setPreviewMode] = useState<"card" | "detail" | "itinerary">("card");
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals for deletes
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "inclusion" | "itinerary";
    index: number;
    title: string;
  } | null>(null);

  // Helper to show temporary toast
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Save handler
  const handleSave = (statusOverride?: "published" | "draft") => {
    const dataToSave = {
      ...pkg,
      status: statusOverride ?? pkg.status,
    };

    startTransition(async () => {
      const res = await saveMasaarPremiumPackageAction(dataToSave);
      if (res.success && res.data) {
        setPkg(res.data);
        showToast(res.message, "success");
      } else {
        showToast(res.message || "Failed to save package", "error");
      }
    });
  };

  // General Field Updates
  const updateGeneralField = <K extends keyof PremiumPackage>(key: K, value: PremiumPackage[K]) => {
    setPkg((prev) => ({ ...prev, [key]: value }));
  };

  // Hotel Updates
  const updateHotel = (index: number, field: keyof PremiumPackageHotel, value: any) => {
    setPkg((prev) => {
      const updated = [...prev.hotels];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, hotels: updated };
    });
  };

  // Inclusions Updates
  const updateInclusion = (index: number, field: keyof PremiumPackageInclusion, value: any) => {
    setPkg((prev) => {
      const updated = [...prev.inclusions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, inclusions: updated };
    });
  };

  const addInclusion = () => {
    const newInc: PremiumPackageInclusion = {
      id: `inc-${Date.now()}`,
      title: "New Package Inclusion",
      icon: "check",
      description: "Description of the inclusion service",
      enabled: true,
      is_train: false,
    };
    setPkg((prev) => ({ ...prev, inclusions: [...prev.inclusions, newInc] }));
  };

  const moveInclusion = (index: number, direction: "up" | "down") => {
    setPkg((prev) => {
      const updated = [...prev.inclusions];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= updated.length) return prev;
      const temp = updated[index];
      updated[index] = updated[target];
      updated[target] = temp;
      return { ...prev, inclusions: updated };
    });
  };

  const confirmDeleteInclusion = (index: number) => {
    setDeleteConfirm({
      type: "inclusion",
      index,
      title: pkg.inclusions[index].title,
    });
  };

  // Transport Updates
  const updateTransport = (index: number, field: keyof PremiumPackageTransport, value: any) => {
    setPkg((prev) => {
      const updated = [...prev.transport];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, transport: updated };
    });
  };

  // Pricing Updates
  const updatePricing = (index: number, field: keyof PremiumPackagePricing, value: any) => {
    setPkg((prev) => {
      const updated = [...prev.pricing];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, pricing: updated };
    });
  };

  // Itinerary Updates
  const updateItineraryDay = (index: number, field: keyof PremiumPackageItineraryDay, value: any) => {
    setPkg((prev) => {
      const updated = [...prev.itinerary];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, itinerary: updated };
    });
  };

  const updateItineraryActivity = (dayIndex: number, actIndex: number, text: string) => {
    setPkg((prev) => {
      const updated = [...prev.itinerary];
      const acts = [...updated[dayIndex].activities];
      acts[actIndex] = text;
      updated[dayIndex] = { ...updated[dayIndex], activities: acts };
      return { ...prev, itinerary: updated };
    });
  };

  const addItineraryActivity = (dayIndex: number) => {
    setPkg((prev) => {
      const updated = [...prev.itinerary];
      const acts = [...updated[dayIndex].activities, "New planned activity"];
      updated[dayIndex] = { ...updated[dayIndex], activities: acts };
      return { ...prev, itinerary: updated };
    });
  };

  const removeItineraryActivity = (dayIndex: number, actIndex: number) => {
    setPkg((prev) => {
      const updated = [...prev.itinerary];
      const acts = updated[dayIndex].activities.filter((_, i) => i !== actIndex);
      updated[dayIndex] = { ...updated[dayIndex], activities: acts };
      return { ...prev, itinerary: updated };
    });
  };

  const addItineraryDay = () => {
    const nextDayNum = pkg.itinerary.length + 1;
    const newDay: PremiumPackageItineraryDay = {
      day_number: nextDayNum,
      weekday: "Sunday",
      title: `Day ${nextDayNum} Itinerary`,
      subtitle: "Scheduled activities",
      transport_mode: "Bus",
      image_url: "/brand/banners/umrah.webp",
      image_alt: `Day ${nextDayNum} Umrah schedule`,
      is_published: true,
      activities: ["Arrival and scheduled prayers."],
    };
    setPkg((prev) => ({ ...prev, itinerary: [...prev.itinerary, newDay] }));
  };

  const moveItineraryDay = (index: number, direction: "up" | "down") => {
    setPkg((prev) => {
      const updated = [...prev.itinerary];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= updated.length) return prev;
      const temp = updated[index];
      updated[index] = updated[target];
      updated[target] = temp;
      // Re-normalize day_number
      updated.forEach((d, i) => (d.day_number = i + 1));
      return { ...prev, itinerary: updated };
    });
  };

  const confirmDeleteItineraryDay = (index: number) => {
    setDeleteConfirm({
      type: "itinerary",
      index,
      title: `Day ${pkg.itinerary[index].day_number}: ${pkg.itinerary[index].title}`,
    });
  };

  // Execute Confirmed Delete
  const executeDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "inclusion") {
      setPkg((prev) => ({
        ...prev,
        inclusions: prev.inclusions.filter((_, i) => i !== deleteConfirm.index),
      }));
    } else if (deleteConfirm.type === "itinerary") {
      setPkg((prev) => {
        const remaining = prev.itinerary.filter((_, i) => i !== deleteConfirm.index);
        remaining.forEach((d, i) => (d.day_number = i + 1));
        return { ...prev, itinerary: remaining };
      });
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-xl transition-all ${
            toastMessage.type === "success" ? "bg-emerald-700" : "bg-red-700"
          }`}
        >
          <span>{toastMessage.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-masaar-black">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-masaar-black/70">
              Are you sure you want to delete <strong>{deleteConfirm.title}</strong>? This will be removed upon saving.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton onClick={() => setDeleteConfirm(null)}>Cancel</SecondaryButton>
              <button
                type="button"
                onClick={executeDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Masaar Premium Umrah Package Manager"
        description="Centrally manage the featured 6-Day Masaar Premium Umrah package across the Homepage, Umrah Page, and Dedicated Detail Page."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Packages", href: "/admin/packages" },
          { label: "Masaar Premium Umrah" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/umrah/masaar-premium-umrah" target="_blank" rel="noopener noreferrer">
              <SecondaryButton className="text-xs">👁️ View Live Page</SecondaryButton>
            </Link>
            {pkg.status === "published" ? (
              <SecondaryButton
                onClick={() => handleSave("draft")}
                disabled={isPending}
                className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                Unpublish to Draft
              </SecondaryButton>
            ) : (
              <GoldButton onClick={() => handleSave("published")} disabled={isPending} className="text-xs">
                Publish Package
              </GoldButton>
            )}
            <PrimaryButton onClick={() => handleSave()} disabled={isPending} className="text-xs">
              {isPending ? "Saving..." : "Save Changes"}
            </PrimaryButton>
          </div>
        }
      />

      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <Badge tone={pkg.status === "published" ? "green" : "amber"}>
            {pkg.status.toUpperCase()}
          </Badge>
          <span className="text-xs text-masaar-black/60">
            {pkg.duration_days} Days / {pkg.duration_nights} Nights
          </span>
          <span className="text-xs text-masaar-black/40">•</span>
          <span className="text-xs font-semibold text-deep-gold">
            Starting from AED {Math.min(...pkg.pricing.map((p) => p.price_aed)).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-masaar-black/70">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pkg.show_on_homepage}
              onChange={(e) => updateGeneralField("show_on_homepage", e.target.checked)}
              className="rounded text-pure-gold focus:ring-pure-gold"
            />
            <span>Featured on Homepage</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pkg.show_on_umrah_page}
              onChange={(e) => updateGeneralField("show_on_umrah_page", e.target.checked)}
              className="rounded text-pure-gold focus:ring-pure-gold"
            />
            <span>Display on Umrah Page</span>
          </label>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-black/10 text-sm">
        {(
          [
            { id: "general", label: "A. General Info" },
            { id: "hotels", label: "B. Hotels (Makkah & Madinah)" },
            { id: "inclusions", label: "C. Inclusions" },
            { id: "transport", label: "D. Transport Journeys" },
            { id: "pricing", label: "E. Room Pricing" },
            { id: "itinerary", label: "F. 6-Day Itinerary" },
            { id: "preview", label: "G. Live Previews" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2.5 font-medium transition-colors ${
              activeTab === tab.id
                ? "border-pure-gold text-pure-gold"
                : "border-transparent text-masaar-black/60 hover:text-masaar-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB A: GENERAL INFORMATION */}
      {activeTab === "general" && (
        <div className="grid gap-6 rounded-xl border border-black/10 bg-white p-6 shadow-2xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                Package Title
              </label>
              <input
                type="text"
                value={pkg.title}
                onChange={(e) => updateGeneralField("title", e.target.value)}
                className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                Route Slug
              </label>
              <input
                type="text"
                value={pkg.slug}
                disabled
                className="mt-1 w-full rounded-md border border-black/10 bg-neutral-100 p-2 text-sm text-masaar-black/50 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
              Short Description (Homepage Card & Highlights)
            </label>
            <textarea
              rows={2}
              value={pkg.short_description}
              onChange={(e) => updateGeneralField("short_description", e.target.value)}
              className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
              Full Description (Detail Page Hero)
            </label>
            <textarea
              rows={3}
              value={pkg.full_description}
              onChange={(e) => updateGeneralField("full_description", e.target.value)}
              className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                Duration (Days)
              </label>
              <input
                type="number"
                value={pkg.duration_days}
                onChange={(e) => updateGeneralField("duration_days", Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                Duration (Nights)
              </label>
              <input
                type="number"
                value={pkg.duration_nights}
                onChange={(e) => updateGeneralField("duration_nights", Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                Status
              </label>
              <select
                value={pkg.status}
                onChange={(e) => updateGeneralField("status", e.target.value as any)}
                className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="border-t border-black/10 pt-4">
            <h4 className="font-bold text-sm text-masaar-black mb-3">SEO & Metadata</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={pkg.seo_title}
                  onChange={(e) => updateGeneralField("seo_title", e.target.value)}
                  className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                  Canonical URL
                </label>
                <input
                  type="text"
                  value={pkg.canonical_url}
                  onChange={(e) => updateGeneralField("canonical_url", e.target.value)}
                  className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                  Meta Description
                </label>
                <textarea
                  rows={2}
                  value={pkg.meta_description}
                  onChange={(e) => updateGeneralField("meta_description", e.target.value)}
                  className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: HOTEL MANAGEMENT */}
      {activeTab === "hotels" && (
        <div className="space-y-6">
          <p className="text-xs text-masaar-black/60">
            Manage the designated hotels in Makkah and Madinah. Updates reflect live on the Homepage Spotlight card, Umrah page, and Detail page.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {pkg.hotels.map((hotel, idx) => (
              <div key={idx} className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-black/5 pb-3">
                  <span className="rounded-full bg-pure-gold/20 px-3 py-0.5 text-xs font-bold text-deep-gold">
                    {hotel.city} Stays
                  </span>
                  <span className="text-xs font-medium text-masaar-black/60">
                    {hotel.nights} Nights
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                    Hotel Name
                  </label>
                  <input
                    type="text"
                    value={hotel.hotel_name}
                    onChange={(e) => updateHotel(idx, "hotel_name", e.target.value)}
                    className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                      Number of Nights
                    </label>
                    <input
                      type="number"
                      value={hotel.nights}
                      onChange={(e) => updateHotel(idx, "nights", Number(e.target.value))}
                      className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                      Star Rating
                    </label>
                    <input
                      type="number"
                      value={hotel.star_rating ?? 5}
                      onChange={(e) => updateHotel(idx, "star_rating", Number(e.target.value))}
                      className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                    Walking Distance / Proximity Note
                  </label>
                  <input
                    type="text"
                    value={hotel.distance_note || ""}
                    onChange={(e) => updateHotel(idx, "distance_note", e.target.value)}
                    className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                    Hotel Image URL
                  </label>
                  <input
                    type="text"
                    value={hotel.image_url}
                    onChange={(e) => updateHotel(idx, "image_url", e.target.value)}
                    className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={hotel.description}
                    onChange={(e) => updateHotel(idx, "description", e.target.value)}
                    className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB C: INCLUSIONS MANAGEMENT */}
      {activeTab === "inclusions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-masaar-black/60">
              Manage the 6 essential package inclusions. The Haramain Speed Train inclusion must maintain its distinct high-speed train identity.
            </p>
            <PrimaryButton onClick={addInclusion} className="text-xs">
              + Add Inclusion
            </PrimaryButton>
          </div>

          <div className="space-y-3">
            {pkg.inclusions.map((inc, idx) => (
              <div
                key={inc.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border p-4 ${
                  inc.is_train
                    ? "border-emerald-300 bg-emerald-50/40"
                    : "border-black/10 bg-white"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold shrink-0">
                    {inc.is_train ? (
                      <TrainIcon className="size-5 text-emerald-700" />
                    ) : inc.icon === "plane" ? (
                      <PlaneIcon className="size-5 text-deep-gold" />
                    ) : inc.icon === "compass" ? (
                      <CompassIcon className="size-5 text-deep-gold" />
                    ) : inc.icon === "users" ? (
                      <FamilyIcon className="size-5 text-deep-gold" />
                    ) : inc.icon === "visa" ? (
                      <DocumentIcon className="size-5 text-deep-gold" />
                    ) : (
                      <CheckIcon className="size-5 text-deep-gold" />
                    )}
                  </span>
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={inc.title}
                      onChange={(e) => updateInclusion(idx, "title", e.target.value)}
                      className="w-full rounded-md border border-black/15 p-1.5 text-sm font-semibold"
                    />
                    <input
                      type="text"
                      value={inc.description || ""}
                      onChange={(e) => updateInclusion(idx, "description", e.target.value)}
                      className="w-full rounded-md border border-black/10 p-1 text-xs text-masaar-black/70"
                      placeholder="Optional brief description"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <input
                      type="checkbox"
                      checked={inc.is_train ?? false}
                      onChange={(e) => updateInclusion(idx, "is_train", e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-600"
                    />
                    <span>Train Service</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-masaar-black/70">
                    <input
                      type="checkbox"
                      checked={inc.enabled}
                      onChange={(e) => updateInclusion(idx, "enabled", e.target.checked)}
                      className="rounded text-pure-gold focus:ring-pure-gold"
                    />
                    <span>Enabled</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveInclusion(idx, "up")}
                      disabled={idx === 0}
                      className="rounded p-1 text-xs hover:bg-black/5 disabled:opacity-30"
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveInclusion(idx, "down")}
                      disabled={idx === pkg.inclusions.length - 1}
                      className="rounded p-1 text-xs hover:bg-black/5 disabled:opacity-30"
                      title="Move Down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDeleteInclusion(idx)}
                      className="rounded p-1 text-xs text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB D: TRANSPORT MANAGEMENT */}
      {activeTab === "transport" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory p-4 text-xs text-masaar-black/80">
            <strong>Important Transport Configuration:</strong> This package includes 5 dedicated journey legs.
            Journey 2 is specifically operated by the <strong>Haramain Speed Train</strong>. Do not replace the train with bus or private transfer.
          </div>

          <div className="space-y-4">
            {pkg.transport.map((tr, idx) => (
              <div
                key={tr.id}
                className={`rounded-xl border p-5 shadow-2xs space-y-4 ${
                  tr.mode === "Haramain Speed Train"
                    ? "border-emerald-300 bg-emerald-50/30"
                    : "border-black/10 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-masaar-black px-2.5 py-0.5 text-xs font-bold text-white">
                      Journey {tr.journey_number}
                    </span>
                    <span className="font-bold text-masaar-black text-sm">
                      {tr.origin} → {tr.destination}
                    </span>
                  </div>
                  {tr.mode === "Haramain Speed Train" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                      <TrainIcon className="size-3.5 text-emerald-700" />
                      <span>Haramain Speed Train</span>
                    </span>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-masaar-black/60">
                      Origin
                    </label>
                    <input
                      type="text"
                      value={tr.origin}
                      onChange={(e) => updateTransport(idx, "origin", e.target.value)}
                      className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-masaar-black/60">
                      Destination
                    </label>
                    <input
                      type="text"
                      value={tr.destination}
                      onChange={(e) => updateTransport(idx, "destination", e.target.value)}
                      className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-masaar-black/60">
                      Transport Mode
                    </label>
                    <select
                      value={tr.mode}
                      onChange={(e) => updateTransport(idx, "mode", e.target.value as TransportMode)}
                      className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                    >
                      <option value="Flight">Flight</option>
                      <option value="Haramain Speed Train">Haramain Speed Train</option>
                      <option value="Bus">Bus</option>
                      <option value="Walking">Walking</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-masaar-black/60">
                      Airline / Provider
                    </label>
                    <input
                      type="text"
                      value={tr.airline_or_provider}
                      onChange={(e) => updateTransport(idx, "airline_or_provider", e.target.value)}
                      className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-masaar-black/60">
                      Departure Time
                    </label>
                    <input
                      type="text"
                      value={tr.departure_time || ""}
                      placeholder="To be confirmed"
                      onChange={(e) => updateTransport(idx, "departure_time", e.target.value)}
                      className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-masaar-black/60">
                      Arrival Time
                    </label>
                    <input
                      type="text"
                      value={tr.arrival_time || ""}
                      placeholder="To be confirmed"
                      onChange={(e) => updateTransport(idx, "arrival_time", e.target.value)}
                      className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-masaar-black/60">
                      Status
                    </label>
                    <select
                      value={tr.status}
                      onChange={(e) => updateTransport(idx, "status", e.target.value as any)}
                      className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="to_be_confirmed">To be confirmed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-masaar-black/60">
                    Notes & Details
                  </label>
                  <input
                    type="text"
                    value={tr.notes || ""}
                    onChange={(e) => updateTransport(idx, "notes", e.target.value)}
                    className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB E: PRICING MANAGEMENT */}
      {activeTab === "pricing" && (
        <div className="space-y-6">
          <p className="text-xs text-masaar-black/60">
            Approved room prices in UAE Dirhams (AED). Rates remain the source currency and convert automatically via the live currency switcher.
          </p>

          <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-2xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 bg-admin-surface text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                <tr>
                  <th className="p-3">Room Type</th>
                  <th className="p-3">Price (AED)</th>
                  <th className="p-3">Pricing Basis</th>
                  <th className="p-3">Popular Badge</th>
                  <th className="p-3">Active</th>
                  <th className="p-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-xs">
                {pkg.pricing.map((price, idx) => (
                  <tr key={price.room_type} className="hover:bg-warm-ivory/20">
                    <td className="p-3 font-bold text-masaar-black">
                      <input
                        type="text"
                        value={price.room_type}
                        onChange={(e) => updatePricing(idx, "room_type", e.target.value)}
                        className="rounded border border-black/15 p-1 text-xs font-bold"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={price.price_aed}
                        onChange={(e) => updatePricing(idx, "price_aed", Number(e.target.value))}
                        className="w-24 rounded border border-black/15 p-1 text-xs font-bold text-emerald-700"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={price.pricing_basis}
                        onChange={(e) => updatePricing(idx, "pricing_basis", e.target.value)}
                        className="rounded border border-black/15 p-1 text-xs"
                      >
                        <option value="per person">per person</option>
                        <option value="per room">per room</option>
                        <option value="per child">per child</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={price.popular ?? false}
                        onChange={(e) => updatePricing(idx, "popular", e.target.checked)}
                        className="rounded text-pure-gold focus:ring-pure-gold"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={price.is_active}
                        onChange={(e) => updatePricing(idx, "is_active", e.target.checked)}
                        className="rounded text-pure-gold focus:ring-pure-gold"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={price.note || ""}
                        onChange={(e) => updatePricing(idx, "note", e.target.value)}
                        className="w-full rounded border border-black/15 p-1 text-xs"
                        placeholder="Description note"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB F: ITINERARY EDITOR */}
      {activeTab === "itinerary" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-masaar-black/60">
              Manage the 6-day pilgrimage schedule. Each day expands into activities with associated transport modes.
            </p>
            <PrimaryButton onClick={addItineraryDay} className="text-xs">
              + Add Day
            </PrimaryButton>
          </div>

          <div className="space-y-6">
            {pkg.itinerary.map((day, dIdx) => (
              <div key={dIdx} className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-masaar-black px-3 py-1 text-xs font-bold text-white uppercase">
                      Day {day.day_number}
                    </span>
                    <input
                      type="text"
                      value={day.weekday}
                      onChange={(e) => updateItineraryDay(dIdx, "weekday", e.target.value)}
                      className="rounded border border-black/15 p-1 text-xs font-semibold text-deep-gold w-28"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-masaar-black/70">
                      <input
                        type="checkbox"
                        checked={day.is_published}
                        onChange={(e) => updateItineraryDay(dIdx, "is_published", e.target.checked)}
                        className="rounded text-pure-gold focus:ring-pure-gold"
                      />
                      <span>Published</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => moveItineraryDay(dIdx, "up")}
                      disabled={dIdx === 0}
                      className="rounded p-1 text-xs hover:bg-black/5 disabled:opacity-30"
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItineraryDay(dIdx, "down")}
                      disabled={dIdx === pkg.itinerary.length - 1}
                      className="rounded p-1 text-xs hover:bg-black/5 disabled:opacity-30"
                      title="Move Down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDeleteItineraryDay(dIdx)}
                      className="rounded p-1 text-xs text-red-600 hover:bg-red-50"
                      title="Delete Day"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                      Day Title
                    </label>
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => updateItineraryDay(dIdx, "title", e.target.value)}
                      className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                      Transport Mode
                    </label>
                    <select
                      value={day.transport_mode}
                      onChange={(e) => updateItineraryDay(dIdx, "transport_mode", e.target.value as TransportMode)}
                      className="mt-1 w-full rounded-md border border-black/15 p-2 text-sm"
                    >
                      <option value="Flight">Flight</option>
                      <option value="Haramain Speed Train">Haramain Speed Train</option>
                      <option value="Bus">Bus</option>
                      <option value="Walking">Walking</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={day.image_url}
                      onChange={(e) => updateItineraryDay(dIdx, "image_url", e.target.value)}
                      className="mt-1 w-full rounded-md border border-black/15 p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                      Image Alt Text
                    </label>
                    <input
                      type="text"
                      value={day.image_alt || ""}
                      onChange={(e) => updateItineraryDay(dIdx, "image_alt", e.target.value)}
                      className="mt-1 w-full rounded-md border border-black/15 p-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                    Transport Note (e.g. Train / Bus instruction)
                  </label>
                  <input
                    type="text"
                    value={day.transport_note || ""}
                    onChange={(e) => updateItineraryDay(dIdx, "transport_note", e.target.value)}
                    className="mt-1 w-full rounded-md border border-black/15 p-1.5 text-xs"
                    placeholder="Specific transport instruction for pilgrims"
                  />
                </div>

                {/* Activities List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-masaar-black uppercase tracking-wider">
                      Activities ({day.activities.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => addItineraryActivity(dIdx)}
                      className="text-xs text-pure-gold hover:underline font-bold"
                    >
                      + Add Activity
                    </button>
                  </div>
                  <div className="space-y-2">
                    {day.activities.map((act, actIdx) => (
                      <div key={actIdx} className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-deep-gold shrink-0" />
                        <input
                          type="text"
                          value={act}
                          onChange={(e) => updateItineraryActivity(dIdx, actIdx, e.target.value)}
                          className="flex-1 rounded border border-black/15 p-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeItineraryActivity(dIdx, actIdx)}
                          className="text-xs text-red-500 hover:text-red-700 p-1"
                          title="Remove activity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB G: LIVE PREVIEWS */}
      {activeTab === "preview" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-masaar-black/60">
                Preview Mode:
              </span>
              <button
                type="button"
                onClick={() => setPreviewMode("card")}
                className={`rounded px-3 py-1.5 text-xs font-semibold ${
                  previewMode === "card"
                    ? "bg-masaar-black text-white"
                    : "bg-neutral-100 text-masaar-black hover:bg-neutral-200"
                }`}
              >
                Homepage Spotlight Card
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("itinerary")}
                className={`rounded px-3 py-1.5 text-xs font-semibold ${
                  previewMode === "itinerary"
                    ? "bg-masaar-black text-white"
                    : "bg-neutral-100 text-masaar-black hover:bg-neutral-200"
                }`}
              >
                6-Day Itinerary Accordion
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("detail")}
                className={`rounded px-3 py-1.5 text-xs font-semibold ${
                  previewMode === "detail"
                    ? "bg-masaar-black text-white"
                    : "bg-neutral-100 text-masaar-black hover:bg-neutral-200"
                }`}
              >
                Full Package Preview
              </button>
            </div>

            <PrimaryButton onClick={() => handleSave()} disabled={isPending} className="text-xs">
              {isPending ? "Saving..." : "Save & Publish Changes"}
            </PrimaryButton>
          </div>

          {previewMode === "card" && (
            <div className="rounded-xl border border-black/10 bg-warm-ivory/50 p-6">
              <p className="text-xs font-bold text-masaar-black/50 uppercase tracking-wider mb-4">
                Interactive Preview: Homepage & Umrah Page Spotlight Card
              </p>
              <MasaarPremiumUmrahSpotlight pkg={pkg} />
            </div>
          )}

          {previewMode === "itinerary" && (
            <div className="rounded-xl border border-black/10 bg-white p-6">
              <p className="text-xs font-bold text-masaar-black/50 uppercase tracking-wider mb-4">
                Interactive Preview: 6-Day Expandable Itinerary Accordion
              </p>
              <PremiumItineraryAccordion itinerary={pkg.itinerary} />
            </div>
          )}

          {previewMode === "detail" && (
            <div className="rounded-xl border border-black/10 bg-white p-6 space-y-8">
              <div>
                <span className="text-xs font-bold text-deep-gold uppercase tracking-wider">
                  Hero Preview
                </span>
                <h2 className="text-3xl font-bold font-[family-name:var(--font-display)] text-masaar-black mt-1">
                  {pkg.title}
                </h2>
                <p className="text-sm text-masaar-black/70 mt-2 max-w-2xl">{pkg.full_description}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-deep-gold uppercase tracking-wider">
                  Hotel Accommodation Preview
                </span>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {pkg.hotels.map((h, i) => (
                    <div key={i} className="rounded-lg border p-4 bg-warm-ivory/20">
                      <p className="text-xs font-bold uppercase text-deep-gold">{h.city} ({h.nights} Nights)</p>
                      <p className="text-base font-bold text-masaar-black mt-1">{h.hotel_name}</p>
                      <p className="text-xs text-masaar-black/60 mt-1">{h.distance_note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-deep-gold uppercase tracking-wider">
                  Room Pricing Preview
                </span>
                <div className="mt-3 grid grid-cols-5 gap-3">
                  {pkg.pricing.map((p) => (
                    <div key={p.room_type} className="rounded-lg border p-3 text-center bg-white shadow-2xs">
                      <p className="text-xs font-bold text-masaar-black">{p.room_type}</p>
                      <p className="text-lg font-bold text-emerald-700 mt-1">AED {p.price_aed.toLocaleString()}</p>
                      <p className="text-[10px] text-masaar-black/50">/ {p.pricing_basis}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

