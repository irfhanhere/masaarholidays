"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  GoldButton,
  Card,
  Field,
  inputClass,
} from "@/components/admin/ui";
import type {
  PremiumPackage,
  PremiumPackageHotel,
  PremiumPackageInclusion,
  PremiumPackagePricing,
  PremiumPackageItineraryDay,
  TransportMode,
} from "@/lib/types/premium-package";
import { saveUmrahPackageAction } from "./actions";

interface Props {
  initialPackage: PremiumPackage;
  isNew?: boolean;
}

type TabKey =
  | "basic"
  | "hotels"
  | "pricing"
  | "inclusions"
  | "itinerary"
  | "media"
  | "display"
  | "seo";

const AVAILABLE_ICONS = [
  { key: "plane", label: "Flight / Plane" },
  { key: "hotel", label: "Hotel / Bed" },
  { key: "coffee", label: "Breakfast / Dining" },
  { key: "car", label: "Car / Ground Transfer" },
  { key: "train", label: "High-Speed Train" },
  { key: "visa", label: "Visa / Passport" },
  { key: "wheelchair", label: "Wheelchair Assistance" },
  { key: "signal", label: "eSIM / Data Connectivity" },
  { key: "users", label: "Guide / Group" },
  { key: "compass", label: "Ziyarah / Heritage" },
  { key: "check", label: "Standard Check" },
];

export function UmrahPackageEditorClient({ initialPackage, isNew = false }: Props) {
  const router = useRouter();
  const [pkg, setPkg] = useState<PremiumPackage>(initialPackage);
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  // General field updater
  const updateField = <K extends keyof PremiumPackage>(key: K, value: PremiumPackage[K]) => {
    setPkg((prev) => ({ ...prev, [key]: value }));
  };

  // --- HOTELS ---
  const updateHotel = (index: number, field: keyof PremiumPackageHotel, value: any) => {
    setPkg((prev) => {
      const hotels = [...prev.hotels];
      hotels[index] = { ...hotels[index], [field]: value };
      return { ...prev, hotels };
    });
  };

  const addHotel = () => {
    const newHotel: PremiumPackageHotel = {
      city: "Makkah",
      hotel_name: "New Partner Hotel",
      nights: 3,
      image_url: "/hotels/makkah-towers-swissotel.webp",
      description: "Description of hotel amenities and proximity to Haram.",
      star_rating: 4,
      distance_note: "Walking distance to the Holy Mosque",
    };
    setPkg((prev) => ({ ...prev, hotels: [...prev.hotels, newHotel] }));
  };

  const removeHotel = (index: number) => {
    setPkg((prev) => ({
      ...prev,
      hotels: prev.hotels.filter((_, i) => i !== index),
    }));
  };

  // --- PRICING ---
  const updatePricing = (index: number, field: keyof PremiumPackagePricing, value: any) => {
    setPkg((prev) => {
      const pricing = [...prev.pricing];
      pricing[index] = { ...pricing[index], [field]: value };
      return { ...prev, pricing };
    });
  };

  const addPricingTier = () => {
    const newTier: PremiumPackagePricing = {
      room_type: "Double Room",
      price_aed: 4500,
      currency: "AED",
      pricing_basis: "per person",
      display_order: pkg.pricing.length + 1,
      is_active: true,
      popular: false,
      note: "Room sharing arrangement with breakfast included",
    };
    setPkg((prev) => ({ ...prev, pricing: [...prev.pricing, newTier] }));
  };

  const removePricingTier = (index: number) => {
    setPkg((prev) => ({
      ...prev,
      pricing: prev.pricing.filter((_, i) => i !== index),
    }));
  };

  const movePricingTier = (index: number, direction: "up" | "down") => {
    setPkg((prev) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.pricing.length) return prev;
      const copy = [...prev.pricing];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return { ...prev, pricing: copy };
    });
  };

  // --- INCLUSIONS ---
  const updateInclusion = (index: number, field: keyof PremiumPackageInclusion, value: any) => {
    setPkg((prev) => {
      const inclusions = [...prev.inclusions];
      inclusions[index] = { ...inclusions[index], [field]: value };
      return { ...prev, inclusions };
    });
  };

  const addInclusion = () => {
    const newInc: PremiumPackageInclusion = {
      id: `inc-${Date.now()}`,
      title: "New Inclusion",
      icon: "check",
      description: "Description of the included service.",
      enabled: true,
      is_train: false,
    };
    setPkg((prev) => ({ ...prev, inclusions: [...prev.inclusions, newInc] }));
  };

  const removeInclusion = (index: number) => {
    setPkg((prev) => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index),
    }));
  };

  const moveInclusion = (index: number, direction: "up" | "down") => {
    setPkg((prev) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.inclusions.length) return prev;
      const copy = [...prev.inclusions];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return { ...prev, inclusions: copy };
    });
  };

  // --- ITINERARY ---
  const updateItinerary = (index: number, field: keyof PremiumPackageItineraryDay, value: any) => {
    setPkg((prev) => {
      const itinerary = [...prev.itinerary];
      itinerary[index] = { ...itinerary[index], [field]: value };
      return { ...prev, itinerary };
    });
  };

  const addItineraryDay = () => {
    const nextDay = pkg.itinerary.length + 1;
    const newDay: PremiumPackageItineraryDay = {
      day_number: nextDay,
      weekday: `Day ${nextDay}`,
      title: `Day ${nextDay} Itinerary`,
      subtitle: "Scheduled activities & prayers",
      transport_mode: "Walking",
      image_url: "/brand/banners/umrah.webp",
      image_alt: `Day ${nextDay} in Saudi Arabia`,
      is_published: true,
      activities: ["Daily breakfast at hotel", "Prayers at the Holy Mosque"],
    };
    setPkg((prev) => ({ ...prev, itinerary: [...prev.itinerary, newDay] }));
  };

  const removeItineraryDay = (index: number) => {
    setPkg((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index),
    }));
  };

  // --- SAVE ACTION ---
  const handleSave = (statusOverride?: "published" | "draft" | "archived") => {
    const finalStatus = statusOverride ?? pkg.status;

    // Validation
    if (!pkg.title.trim()) {
      showToast("Please enter a package title.", "error");
      setActiveTab("basic");
      return;
    }

    if (!pkg.slug.trim()) {
      showToast("Please enter a package slug.", "error");
      setActiveTab("basic");
      return;
    }

    if (finalStatus === "published") {
      if (pkg.hotels.length === 0) {
        showToast("Please add at least one hotel before publishing.", "error");
        setActiveTab("hotels");
        return;
      }
      if (pkg.pricing.length === 0) {
        showToast("Please add at least one room pricing tier before publishing.", "error");
        setActiveTab("pricing");
        return;
      }
    }

    const payload: Partial<PremiumPackage> = {
      ...pkg,
      status: finalStatus,
    };

    startTransition(async () => {
      const res = await saveUmrahPackageAction(payload);
      if (res.success && res.data) {
        setPkg(res.data);
        showToast(res.message, "success");
        if (isNew) {
          router.push(`/admin/umrah-packages/${res.data.id || res.data.slug}`);
        }
      } else {
        showToast(res.message || "Failed to save package", "error");
      }
    });
  };

  const publicUrl = `/umrah/${pkg.slug}`;

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
        title={isNew ? "Create New Umrah Package" : `Edit: ${pkg.title}`}
        description={`Manage hotel accommodations, room pricing, inclusions, day-by-day itinerary and display settings for ${pkg.slug}.`}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Website Management" },
          { label: "Umrah Packages", href: "/admin/umrah-packages" },
          { label: pkg.title },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-masaar-black hover:bg-admin-surface transition-colors"
            >
              <span>Preview Page</span>
              <span>↗</span>
            </Link>

            <SecondaryButton onClick={() => handleSave("draft")} disabled={isPending}>
              {isPending ? "Saving..." : "Save Draft"}
            </SecondaryButton>

            {pkg.status === "published" ? (
              <SecondaryButton
                onClick={() => handleSave("draft")}
                disabled={isPending}
                className="text-amber-800 border-amber-300 bg-amber-50"
              >
                Unpublish
              </SecondaryButton>
            ) : (
              <GoldButton onClick={() => handleSave("published")} disabled={isPending}>
                {isPending ? "Publishing..." : "Publish Package"}
              </GoldButton>
            )}

            <PrimaryButton onClick={() => handleSave()} disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </PrimaryButton>
          </div>
        }
      />

      {/* Status banner */}
      <div className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-masaar-black">Current Status:</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              pkg.status === "published"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : pkg.status === "draft"
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            ● {pkg.status}
          </span>
          {pkg.is_featured && <Badge tone="gold">Featured Package</Badge>}
          {pkg.show_on_homepage && <Badge tone="blue">On Homepage</Badge>}
          {pkg.show_on_umrah_page && <Badge tone="green">On Umrah Page</Badge>}
        </div>
        <div className="text-masaar-black/50 text-[11px]">
          Authoritative slug: <span className="font-mono text-masaar-black font-semibold">{pkg.slug}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-black/10 bg-white rounded-t-xl px-4 pt-2">
        <div className="flex gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { key: "basic", label: "A. Basic Details" },
            { key: "hotels", label: `B. Hotels (${pkg.hotels.length})` },
            { key: "pricing", label: `C. Room Pricing (${pkg.pricing.length})` },
            { key: "inclusions", label: `D. Inclusions (${pkg.inclusions.length})` },
            { key: "itinerary", label: `E. Itinerary (${pkg.itinerary.length} Days)` },
            { key: "media", label: "F. Images & Media" },
            { key: "display", label: "G. Website Display" },
            { key: "seo", label: "H. SEO Settings" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`border-b-2 py-3 px-3 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-admin-primary text-admin-primary font-bold"
                  : "border-transparent text-masaar-black/60 hover:text-masaar-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* TAB A: BASIC DETAILS */}
        {activeTab === "basic" && (
          <Card className="space-y-5">
            <h2 className="text-base font-bold text-masaar-black border-b border-black/5 pb-2">
              Section A: Basic Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Package Title" required hint="e.g. Masaar Best Selling Umrah Package">
                <input
                  type="text"
                  value={pkg.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="URL Slug" required hint="Used in the browser URL: /umrah/[slug]">
                <input
                  type="text"
                  value={pkg.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Package Badge" hint="e.g. BEST SELLING, PREMIUM, SIGNATURE">
                <input
                  type="text"
                  value={pkg.package_badge || (pkg.slug === "masaar-best-selling-umrah" ? "BEST SELLING" : "PREMIUM")}
                  onChange={(e) => updateField("package_badge", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Duration in Days" required>
                <input
                  type="number"
                  value={pkg.duration_days}
                  onChange={(e) => updateField("duration_days", parseInt(e.target.value) || 1)}
                  className={inputClass}
                />
              </Field>

              <Field label="Duration in Nights" required>
                <input
                  type="number"
                  value={pkg.duration_nights}
                  onChange={(e) => updateField("duration_nights", parseInt(e.target.value) || 1)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Category">
                <input
                  type="text"
                  value={pkg.category || "Umrah"}
                  onChange={(e) => updateField("category", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Departure Country">
                <input
                  type="text"
                  value={pkg.departure_country || "UAE"}
                  onChange={(e) => updateField("departure_country", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Base Currency">
                <select
                  value={pkg.currency || "AED"}
                  onChange={(e) => updateField("currency", e.target.value)}
                  className={inputClass}
                >
                  <option value="AED">AED (United Arab Emirates Dirham)</option>
                  <option value="SAR">SAR (Saudi Riyal)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </Field>
            </div>

            <Field label="Short Description" hint="Displayed in cards and spotlight summaries.">
              <textarea
                rows={2}
                value={pkg.short_description}
                onChange={(e) => updateField("short_description", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Full Description" hint="Detailed overview displayed on the dedicated package page.">
              <textarea
                rows={5}
                value={pkg.full_description}
                onChange={(e) => updateField("full_description", e.target.value)}
                className={inputClass}
              />
            </Field>
          </Card>
        )}

        {/* TAB B: HOTELS */}
        {activeTab === "hotels" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-masaar-black">Section B: Hotel Information</h2>
                <p className="text-xs text-masaar-black/60">
                  Configure accommodations in Makkah, Madinah, or other transit stops.
                </p>
              </div>
              <PrimaryButton onClick={addHotel}>+ Add Hotel</PrimaryButton>
            </div>

            {pkg.hotels.map((hotel, idx) => (
              <Card key={idx} className="space-y-4 relative">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-deep-gold">
                    Hotel #{idx + 1} — {hotel.city}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeHotel(idx)}
                    className="text-xs font-semibold text-red-600 hover:text-red-800"
                  >
                    Delete Hotel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="City" required>
                    <select
                      value={hotel.city}
                      onChange={(e) => updateHotel(idx, "city", e.target.value)}
                      className={inputClass}
                    >
                      <option value="Makkah">Makkah</option>
                      <option value="Madinah">Madinah</option>
                      <option value="Jeddah">Jeddah</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>

                  <Field label="Hotel Name" required>
                    <input
                      type="text"
                      value={hotel.hotel_name}
                      onChange={(e) => updateHotel(idx, "hotel_name", e.target.value)}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Nights Stayed" required>
                    <input
                      type="number"
                      value={hotel.nights}
                      onChange={(e) => updateHotel(idx, "nights", parseInt(e.target.value) || 1)}
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Star Rating (1-5, only if verified)">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={hotel.star_rating || 4}
                      onChange={(e) => updateHotel(idx, "star_rating", parseInt(e.target.value) || undefined)}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Proximity / Distance Note" hint="e.g. 50m from Al-Masjid An-Nabawi">
                    <input
                      type="text"
                      value={hotel.distance_note || ""}
                      onChange={(e) => updateHotel(idx, "distance_note", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Hotel Image URL" hint="Relative path e.g. /hotels/... or full URL">
                  <input
                    type="text"
                    value={hotel.image_url}
                    onChange={(e) => updateHotel(idx, "image_url", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Hotel Description">
                  <textarea
                    rows={2}
                    value={hotel.description}
                    onChange={(e) => updateHotel(idx, "description", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </Card>
            ))}
          </div>
        )}

        {/* TAB C: ROOM PRICING */}
        {activeTab === "pricing" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-masaar-black">Section C: Room Pricing</h2>
                <p className="text-xs text-masaar-black/60">
                  Manage editable room categories, pricing basis, and currency. Initial rates for Best Selling: Quad AED 3,900, Triple AED 4,100, Double AED 4,500, Single AED 6,400, Child with Bed AED 2,700.
                </p>
              </div>
              <PrimaryButton onClick={addPricingTier}>+ Add Room Category</PrimaryButton>
            </div>

            <Card className="overflow-hidden p-0">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/10 bg-admin-surface/75 text-[11px] font-bold uppercase text-masaar-black/60">
                  <tr>
                    <th className="py-2.5 px-3">Order</th>
                    <th className="py-2.5 px-3">Room Category</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Currency</th>
                    <th className="py-2.5 px-3">Basis</th>
                    <th className="py-2.5 px-3">Popular</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {pkg.pricing.map((tier, idx) => (
                    <tr key={idx} className="hover:bg-black/[0.015]">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => movePricingTier(idx, "up")}
                            disabled={idx === 0}
                            className="px-1 py-0.5 rounded border border-black/10 text-[10px] hover:bg-black/5 disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => movePricingTier(idx, "down")}
                            disabled={idx === pkg.pricing.length - 1}
                            className="px-1 py-0.5 rounded border border-black/10 text-[10px] hover:bg-black/5 disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={tier.room_type}
                          onChange={(e) => updatePricing(idx, "room_type", e.target.value)}
                          className="rounded border border-black/15 px-2 py-1 text-xs w-36 font-semibold"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          value={tier.price_aed}
                          onChange={(e) => updatePricing(idx, "price_aed", parseFloat(e.target.value) || 0)}
                          className="rounded border border-black/15 px-2 py-1 text-xs w-24 font-bold text-emerald-800"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-masaar-black/70">{tier.currency || "AED"}</span>
                      </td>

                      <td className="py-2.5 px-3">
                        <select
                          value={tier.pricing_basis || "per person"}
                          onChange={(e) => updatePricing(idx, "pricing_basis", e.target.value)}
                          className="rounded border border-black/15 px-2 py-1 text-xs"
                        >
                          <option value="per person">Per Person</option>
                          <option value="per room">Per Room</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(tier.popular)}
                          onChange={(e) => updatePricing(idx, "popular", e.target.checked)}
                          className="size-4 rounded text-deep-gold"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={tier.note || ""}
                          placeholder="e.g. 4 guests sharing"
                          onChange={(e) => updatePricing(idx, "note", e.target.value)}
                          className="rounded border border-black/15 px-2 py-1 text-xs w-full max-w-xs"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => removePricingTier(idx)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB D: INCLUSIONS */}
        {activeTab === "inclusions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-masaar-black">Section D: Package Inclusions</h2>
                <p className="text-xs text-masaar-black/60">
                  Manage the items included with this package (flights, hotels, breakfast, transfers, visa, eSIM, wheelchair assistance, guide).
                </p>
              </div>
              <PrimaryButton onClick={addInclusion}>+ Add Inclusion</PrimaryButton>
            </div>

            <div className="space-y-3">
              {pkg.inclusions.map((inc, idx) => (
                <Card key={inc.id || idx} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveInclusion(idx, "up")}
                        disabled={idx === 0}
                        className="px-1 py-0.5 rounded border border-black/10 text-[9px] hover:bg-black/5 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveInclusion(idx, "down")}
                        disabled={idx === pkg.inclusions.length - 1}
                        className="px-1 py-0.5 rounded border border-black/10 text-[9px] hover:bg-black/5 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inc.title}
                          onChange={(e) => updateInclusion(idx, "title", e.target.value)}
                          className="font-bold text-xs rounded border border-black/15 px-2 py-1 w-64"
                        />

                        <select
                          value={inc.icon}
                          onChange={(e) => updateInclusion(idx, "icon", e.target.value)}
                          className="rounded border border-black/15 px-2 py-1 text-xs"
                        >
                          {AVAILABLE_ICONS.map((ic) => (
                            <option key={ic.key} value={ic.key}>
                              Icon: {ic.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <input
                        type="text"
                        value={inc.description || ""}
                        placeholder="Inclusion description..."
                        onChange={(e) => updateInclusion(idx, "description", e.target.value)}
                        className="text-xs text-masaar-black/70 rounded border border-black/10 px-2 py-1 w-full max-w-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-masaar-black/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inc.enabled}
                        onChange={(e) => updateInclusion(idx, "enabled", e.target.checked)}
                        className="size-4 rounded text-deep-gold"
                      />
                      <span>Active</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeInclusion(idx)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB E: ITINERARY */}
        {activeTab === "itinerary" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-masaar-black">Section E: Day-by-Day Itinerary</h2>
                <p className="text-xs text-masaar-black/60">
                  Configure daily schedule, travel modes, and pilgrimage activities.
                </p>
              </div>
              <PrimaryButton onClick={addItineraryDay}>+ Add Day</PrimaryButton>
            </div>

            {pkg.itinerary.map((day, idx) => (
              <Card key={idx} className="space-y-3">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-deep-gold">
                    Day #{day.day_number || idx + 1} ({day.weekday})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItineraryDay(idx)}
                    className="text-xs font-semibold text-red-600 hover:text-red-800"
                  >
                    Delete Day
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Weekday / Label">
                    <input
                      type="text"
                      value={day.weekday}
                      onChange={(e) => updateItinerary(idx, "weekday", e.target.value)}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Day Heading">
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => updateItinerary(idx, "title", e.target.value)}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Transport Mode">
                    <select
                      value={day.transport_mode}
                      onChange={(e) => updateItinerary(idx, "transport_mode", e.target.value as TransportMode)}
                      className={inputClass}
                    >
                      <option value="Flight">Flight</option>
                      <option value="Haramain Speed Train">Haramain Speed Train</option>
                      <option value="Bus">Bus</option>
                      <option value="Walking">Walking</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                </div>

                <Field label="Day Subtitle">
                  <input
                    type="text"
                    value={day.subtitle || ""}
                    onChange={(e) => updateItinerary(idx, "subtitle", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Activities (one per line)">
                  <textarea
                    rows={3}
                    value={Array.isArray(day.activities) ? day.activities.join("\n") : ""}
                    onChange={(e) =>
                      updateItinerary(
                        idx,
                        "activities",
                        e.target.value.split("\n").filter((a) => a.trim().length > 0)
                      )
                    }
                    className={inputClass}
                  />
                </Field>
              </Card>
            ))}
          </div>
        )}

        {/* TAB F: MEDIA */}
        {activeTab === "media" && (
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-masaar-black border-b border-black/5 pb-2">
              Section F: Package Images & Media
            </h2>

            <Field label="Main Cover Image URL" hint="Displayed in the hero and spotlight cards.">
              <input
                type="text"
                value={pkg.featured_image}
                onChange={(e) => updateField("featured_image", e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="relative h-44 w-full max-w-sm rounded-lg overflow-hidden border border-black/10 bg-warm-ivory">
              <Image
                src={pkg.featured_image || "/brand/banners/umrah.webp"}
                alt={pkg.title}
                fill
                className="object-cover"
              />
            </div>
          </Card>
        )}

        {/* TAB G: WEBSITE DISPLAY SETTINGS */}
        {activeTab === "display" && (
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-masaar-black border-b border-black/5 pb-2">
              Section G: Website Display Settings
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-black/10 bg-admin-surface/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pkg.show_on_homepage}
                  onChange={(e) => updateField("show_on_homepage", e.target.checked)}
                  className="size-4 rounded text-deep-gold"
                />
                <div>
                  <span className="font-semibold text-xs text-masaar-black block">Show on Homepage</span>
                  <span className="text-[11px] text-masaar-black/60">
                    Display package in the featured spotlight section on the front page.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-black/10 bg-admin-surface/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pkg.show_on_umrah_page}
                  onChange={(e) => updateField("show_on_umrah_page", e.target.checked)}
                  className="size-4 rounded text-deep-gold"
                />
                <div>
                  <span className="font-semibold text-xs text-masaar-black block">Show on Umrah Directory (/umrah)</span>
                  <span className="text-[11px] text-masaar-black/60">
                    Display package prominently on the main Umrah listing page.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-black/10 bg-admin-surface/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pkg.is_featured}
                  onChange={(e) => updateField("is_featured", e.target.checked)}
                  className="size-4 rounded text-deep-gold"
                />
                <div>
                  <span className="font-semibold text-xs text-masaar-black block">Mark as Featured Package</span>
                  <span className="text-[11px] text-masaar-black/60">
                    Give priority positioning in package spotlight carousels.
                  </span>
                </div>
              </label>

              <div className="pt-2">
                <Field label="Display Order (lower numbers appear first)">
                  <input
                    type="number"
                    value={pkg.display_order}
                    onChange={(e) => updateField("display_order", parseInt(e.target.value) || 1)}
                    className="w-32 rounded border border-black/15 px-3 py-1.5 text-xs"
                  />
                </Field>
              </div>
            </div>
          </Card>
        )}

        {/* TAB H: SEO SETTINGS */}
        {activeTab === "seo" && (
          <div className="space-y-6">
            <Card className="space-y-4">
              <h2 className="text-base font-bold text-masaar-black border-b border-black/5 pb-2">
                Section H: Search Engine Optimization (SEO)
              </h2>

              {/* Warning if package is published but marked noindex */}
              {pkg.noindex && pkg.status === "published" && (
                <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-xs text-amber-950 flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <strong className="font-bold block text-sm">Indexing Warning: Noindex Directive Active</strong>
                    <span>
                      This package is currently marked as <strong>Published</strong>, but robots indexing is set to <strong>Noindex</strong>.
                      Search engines like Google will be instructed NOT to index this package in search results.
                    </span>
                  </div>
                </div>
              )}

              {/* SEO Meta Title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-masaar-black">SEO Meta Title</label>
                  <span
                    className={`text-[11px] font-medium ${
                      (pkg.seo_title?.length || 0) >= 50 && (pkg.seo_title?.length || 0) <= 60
                        ? "text-emerald-600 font-bold"
                        : (pkg.seo_title?.length || 0) > 60
                        ? "text-amber-600"
                        : "text-masaar-black/50"
                    }`}
                  >
                    {pkg.seo_title?.length || 0} / 60 characters (Optimal: 50–60)
                  </span>
                </div>
                <input
                  type="text"
                  value={pkg.seo_title}
                  onChange={(e) => updateField("seo_title", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Best Selling Umrah Package from UAE | 6 Days & 5 Nights | Masaar Holidays"
                />
              </div>

              {/* SEO Meta Description */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-masaar-black">SEO Meta Description</label>
                  <span
                    className={`text-[11px] font-medium ${
                      (pkg.meta_description?.length || 0) >= 140 && (pkg.meta_description?.length || 0) <= 160
                        ? "text-emerald-600 font-bold"
                        : (pkg.meta_description?.length || 0) > 160
                        ? "text-amber-600"
                        : "text-masaar-black/50"
                    }`}
                  >
                    {pkg.meta_description?.length || 0} / 160 characters (Optimal: 140–160)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={pkg.meta_description}
                  onChange={(e) => updateField("meta_description", e.target.value)}
                  className={inputClass}
                  placeholder="Summarize package inclusions, duration, hotel stays, and verified features accurately..."
                />
              </div>

              {/* Canonical URL & Breadcrumb Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Canonical URL" hint="Self-referencing HTTPS URL">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pkg.canonical_url}
                      onChange={(e) => updateField("canonical_url", e.target.value)}
                      className={inputClass}
                      placeholder="https://www.masaarholidays.com/umrah/..."
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateField("canonical_url", `https://www.masaarholidays.com/umrah/${pkg.slug}`)
                      }
                      className="whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold rounded border border-black/15 bg-warm-ivory/50 hover:bg-warm-ivory"
                    >
                      Default
                    </button>
                  </div>
                </Field>

                <Field label="Breadcrumb Title" hint="Display label in breadcrumb trail">
                  <input
                    type="text"
                    value={pkg.breadcrumb_title || ""}
                    onChange={(e) => updateField("breadcrumb_title", e.target.value)}
                    className={inputClass}
                    placeholder={pkg.title}
                  />
                </Field>
              </div>

              {/* Robots Crawling Directives */}
              <div className="border-t border-black/5 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-masaar-black/70 mb-3">
                  Robots Indexing &amp; Crawling Directives
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-black/10 bg-warm-ivory/30 p-3 space-y-2">
                    <span className="text-xs font-semibold text-masaar-black block">Indexing Directive</span>
                    <label className="flex items-center gap-2 text-xs text-masaar-black/80 cursor-pointer">
                      <input
                        type="radio"
                        name="robots_index"
                        checked={!pkg.noindex}
                        onChange={() => updateField("noindex", false)}
                        className="text-deep-gold"
                      />
                      <span>Index (Allow search engines to index this package)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-masaar-black/80 cursor-pointer">
                      <input
                        type="radio"
                        name="robots_index"
                        checked={Boolean(pkg.noindex)}
                        onChange={() => updateField("noindex", true)}
                        className="text-deep-gold"
                      />
                      <span>Noindex (Instruct search engines NOT to index)</span>
                    </label>
                  </div>

                  <div className="rounded-lg border border-black/10 bg-warm-ivory/30 p-3 space-y-2">
                    <span className="text-xs font-semibold text-masaar-black block">Follow Directive</span>
                    <label className="flex items-center gap-2 text-xs text-masaar-black/80 cursor-pointer">
                      <input
                        type="radio"
                        name="robots_follow"
                        checked={!pkg.nofollow}
                        onChange={() => updateField("nofollow", false)}
                        className="text-deep-gold"
                      />
                      <span>Follow (Allow crawlers to follow links)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-masaar-black/80 cursor-pointer">
                      <input
                        type="radio"
                        name="robots_follow"
                        checked={Boolean(pkg.nofollow)}
                        onChange={() => updateField("nofollow", true)}
                        className="text-deep-gold"
                      />
                      <span>Nofollow (Instruct crawlers NOT to follow links)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Structured Data / Schema.org Setting */}
              <div className="border-t border-black/5 pt-4">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-black/10 bg-admin-surface/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkg.schema_enabled !== false}
                    onChange={(e) => updateField("schema_enabled", e.target.checked)}
                    className="size-4 rounded text-deep-gold"
                  />
                  <div>
                    <span className="font-semibold text-xs text-masaar-black block">
                      Enable System-Generated Schema.org TouristTrip Structured Data (Recommended)
                    </span>
                    <span className="text-[11px] text-masaar-black/60">
                      Generates validated TouristTrip JSON-LD containing per-occupancy room prices, day-by-day itinerary,
                      hotels, and verified Masaar Holidays travel agency provider credentials.
                    </span>
                  </div>
                </label>
              </div>
            </Card>

            {/* OPEN GRAPH & SOCIAL SHARING */}
            <Card className="space-y-4">
              <h2 className="text-base font-bold text-masaar-black border-b border-black/5 pb-2">
                Open Graph &amp; Social Sharing Metadata
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Open Graph Title (og:title)" hint="Defaults to SEO Title if left blank">
                  <input
                    type="text"
                    value={pkg.og_title || ""}
                    onChange={(e) => updateField("og_title", e.target.value)}
                    className={inputClass}
                    placeholder={pkg.seo_title}
                  />
                </Field>

                <Field label="Social Sharing Image URL (og:image)" hint="Recommended: 1200x630px">
                  <input
                    type="text"
                    value={pkg.social_image || ""}
                    onChange={(e) => updateField("social_image", e.target.value)}
                    className={inputClass}
                    placeholder="/brand/banners/umrah.webp"
                  />
                </Field>
              </div>

              <Field label="Open Graph Description (og:description)" hint="Defaults to SEO Description if blank">
                <textarea
                  rows={2}
                  value={pkg.og_description || ""}
                  onChange={(e) => updateField("og_description", e.target.value)}
                  className={inputClass}
                  placeholder={pkg.meta_description}
                />
              </Field>
            </Card>

            {/* PREVIEWS: GOOGLE SERP & SOCIAL CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Google SERP Snippet Preview */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                    Google Search Result Preview
                  </span>
                  <span className="text-[10px] text-masaar-black/50">Desktop SERP</span>
                </div>

                <div className="rounded-lg border border-black/10 bg-white p-4 font-sans text-left space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#202124]">
                    <span className="size-4 rounded-full bg-warm-ivory text-[10px] font-bold flex items-center justify-center text-deep-gold">
                      M
                    </span>
                    <span className="text-xs text-[#202124]">Masaar Holidays</span>
                    <span className="text-[#5f6368] text-xs">
                      › umrah › {pkg.slug || "package"}
                    </span>
                  </div>

                  <h4 className="text-base font-normal text-[#1a0dab] hover:underline cursor-pointer leading-tight pt-0.5">
                    {pkg.seo_title || `${pkg.title} | Masaar Holidays`}
                  </h4>

                  <p className="text-xs text-[#4d5156] leading-relaxed pt-1">
                    {pkg.meta_description || pkg.short_description || "Explore this thoughtfully planned Umrah package from the UAE with Masaar Holidays."}
                  </p>
                </div>
              </Card>

              {/* Social Card Preview */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                    Social Sharing Card Preview
                  </span>
                  <span className="text-[10px] text-masaar-black/50">Facebook / LinkedIn / Twitter</span>
                </div>

                <div className="rounded-lg border border-black/10 bg-white overflow-hidden text-left shadow-2xs">
                  <div className="relative h-36 w-full bg-warm-ivory flex items-center justify-center text-xs text-masaar-black/50">
                    <img
                      src={pkg.social_image || pkg.featured_image || "/brand/banners/umrah.webp"}
                      alt={pkg.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-3 bg-neutral-50/70 border-t border-black/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-masaar-black/50">
                      masaarholidays.com
                    </span>
                    <h5 className="text-xs font-bold text-masaar-black line-clamp-1">
                      {pkg.og_title || pkg.seo_title || pkg.title}
                    </h5>
                    <p className="text-[11px] text-masaar-black/65 line-clamp-2 leading-relaxed">
                      {pkg.og_description || pkg.meta_description || pkg.short_description}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
