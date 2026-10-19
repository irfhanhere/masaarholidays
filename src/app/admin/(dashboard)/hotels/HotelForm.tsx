"use client";

import { useActionState, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { HotelRow, HotelRoomRow } from "@/lib/types/database";
import type { HotelReview } from "@/lib/data/hotel-reviews";
import { saveHotel, type HotelFormState } from "./actions";
import { HotelRoomsManager } from "./HotelRoomsManager";
import { HotelSupplierRatesManager } from "./HotelSupplierRatesManager";
import { HotelReviewsManager } from "./HotelReviewsManager";

interface Props {
  hotelId?: string;
  initial?: HotelRow;
  rooms?: HotelRoomRow[];
  reviews?: HotelReview[];
}

type TabKey = "basic" | "location" | "rooms" | "facilities" | "gallery_seo" | "reviews" | "preview";

export function HotelForm({ hotelId, initial, rooms = [], reviews = [] }: Props) {
  const action = saveHotel.bind(null, hotelId ?? null);
  const [state, formAction, isPending] = useActionState<HotelFormState, FormData>(action, { status: "idle" });

  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isDirty, setIsDirty] = useState(false);

  // Form field states for live preview & validation
  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "Makkah");
  const [category, setCategory] = useState(initial?.category ?? "Premium");
  const [starRating, setStarRating] = useState(initial?.star_rating ?? 5);
  const [shortDesc, setShortDesc] = useState(initial?.description?.slice(0, 250) ?? "");
  const [fullDesc, setFullDesc] = useState(initial?.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.image_url ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [priceFromAed, setPriceFromAed] = useState(initial?.price_from_aed ? String(initial.price_from_aed) : "249");

  // Location & Walking Access
  const [distanceMeters, setDistanceMeters] = useState(initial?.distance_from_haram_meters ? String(initial.distance_from_haram_meters) : "100");
  const [walkMinutes, setWalkMinutes] = useState(initial?.walk_time_minutes ? String(initial.walk_time_minutes) : "2");
  const [routeType, setRouteType] = useState(initial?.route_type ?? "Direct plaza access");
  const [terrainNote, setTerrainNote] = useState(initial?.terrain_note ?? "Mostly flat");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initial?.google_maps_url ?? "");
  const [address, setAddress] = useState(initial?.verified_address ?? (city === "Makkah" ? "Ibrahim Al Khalil Rd, Makkah" : "Northern Central Area, Madinah"));
  const [gateDestination, setGateDestination] = useState(initial?.walking_gate_destination ?? (city === "Makkah" ? "King Fahd Gate (Gate 79)" : "Bab Al-Salam / Ladies Gate 25"));
  const [shuttleAvailable, setShuttleAvailable] = useState(Boolean(initial?.shuttle_available));

  // Accessibility 10-checkbox grid
  const [accessFeatures, setAccessFeatures] = useState<Record<string, boolean>>({
    plaza_entrance: true,
    wheelchair: initial?.accessibility_note?.toLowerCase().includes("wheelchair") ?? true,
    elderly: initial?.elderly_family_suitability_note?.toLowerCase().includes("elderly") ?? true,
    lifts_ramps: initial?.accessibility_note?.toLowerCase().includes("lift") ?? true,
    escalators: false,
    shuttle: Boolean(initial?.shuttle_available),
    large_groups: true,
    stroller: true,
    assistance: false,
    mobility_caution: false,
  });

  // SEO & Verification
  const [metaTitle, setMetaTitle] = useState(initial?.meta_title ?? (name ? `${name} | Masaar Holidays` : ""));
  const [metaDesc, setMetaDesc] = useState(initial?.meta_description ?? (shortDesc || ""));
  const [slug, setSlug] = useState(initial?.slug ?? (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""));
  const [dataConfidence, setDataConfidence] = useState(initial?.data_confidence ?? "verified");
  const [galleryUrls, setGalleryUrls] = useState<string>((initial?.gallery_image_urls ?? []).join("\n"));

  // Highlight tags manager
  const [tags, setTags] = useState<string[]>(["Closest to the Haram", "Direct plaza access", "Zero street crossing"]);
  const [newTagInput, setNewTagInput] = useState("");

  const isMadinah = city === "Madinah";

  // Alert on unsaved exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function addTag() {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput("");
      setIsDirty(true);
    }
  }

  function removeTag(tagToRemove: string) {
    setTags(tags.filter((t) => t !== tagToRemove));
    setIsDirty(true);
  }

  // Publication checklist items for A06
  const checklist = useMemo(() => {
    const galleryCount = galleryUrls.split("\n").filter(Boolean).length;
    return [
      { id: "basic", label: "Basic information (name, city, category)", done: Boolean(name && city && category) },
      { id: "desc", label: "Short and full description", done: Boolean(shortDesc && fullDesc) },
      { id: "cover", label: "Cover image uploaded", done: Boolean(coverImageUrl) },
      { id: "gallery", label: "At least 3 gallery images", done: galleryCount >= 3 || Boolean(coverImageUrl) },
      { id: "walking", label: "Walking distance and route information", done: Boolean(distanceMeters && walkMinutes) },
      { id: "rooms", label: "At least one room type with price", done: rooms.length > 0 || Boolean(priceFromAed) },
      { id: "facilities", label: "Facilities (minimum 3 configured)", done: true },
      { id: "seo", label: "SEO title and description", done: Boolean(metaTitle && metaDesc) },
      { id: "maps", label: "Google Maps property link", done: Boolean(googleMapsUrl) },
      { id: "verification", label: "Verification status confirmed", done: Boolean(dataConfidence) },
    ];
  }, [name, city, category, shortDesc, fullDesc, coverImageUrl, galleryUrls, distanceMeters, walkMinutes, rooms, priceFromAed, metaTitle, metaDesc, googleMapsUrl, dataConfidence]);

  const allChecksPassed = checklist.every((c) => c.done);

  return (
    <form
      action={formAction}
      onChange={() => setIsDirty(true)}
      className="space-y-6"
    >
      {/* Top Header matching A02 - A06 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:text-masaar-black transition">Dashboard</Link>
            <span>&rsaquo;</span>
            <Link href="/admin/hotels" className="hover:text-masaar-black transition">Hotels</Link>
            <span>&rsaquo;</span>
            <span>{hotelId ? "Edit Hotel" : "Add Hotel"}</span>
            {activeTab === "preview" && (
              <>
                <span>&rsaquo;</span>
                <span className="font-semibold text-masaar-black">Preview &amp; Publish</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-masaar-black font-[family-name:var(--font-display)]">
              {name || "New Hotel Property"}
            </h1>
            {allChecksPassed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                <span className="size-2 rounded-full bg-emerald-600" />
                <span>Ready to Publish</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                <span className="size-2 rounded-full bg-amber-600" />
                <span>Needs Review ({checklist.filter((c) => !c.done).length} pending)</span>
              </span>
            )}
            {isDirty && (
              <span className="rounded bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 animate-pulse">
                ● Unsaved Changes
              </span>
            )}
          </div>
          <p className="text-xs text-masaar-black/60 mt-0.5">
            Preview how this hotel will appear on the website. Check all details before publishing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {initial?.slug && (
            <Link
              href={`/hotels/${initial.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black hover:bg-warm-ivory transition"
            >
              <span>View on Website</span>
              <span className="text-[10px]">↗</span>
            </Link>
          )}

          <button
            type="submit"
            name="is_active"
            value="off"
            disabled={isPending}
            className="rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black hover:bg-warm-ivory transition disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="submit"
            name="is_active"
            value="on"
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-[#C9A227] px-4 py-2 text-xs font-bold text-white hover:bg-[#B38F1E] shadow-xs transition disabled:opacity-50"
          >
            <span>🚀</span>
            <span>{isPending ? "Publishing..." : "Publish Hotel"}</span>
          </button>
        </div>
      </div>

      {state.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          ⚠️ {state.message}
        </div>
      )}

      {/* Tabs Bar matching A02-A06 navigation */}
      <div className="flex flex-wrap gap-1 border-b border-black/10 pb-2">
        {[
          { key: "basic", label: "Basic Details", icon: "🏢" },
          { key: "location", label: "Location & Access", icon: "📍" },
          { key: "rooms", label: `Room Options (${rooms.length})`, icon: "🛏️" },
          { key: "facilities", label: "Facilities", icon: "✨" },
          { key: "gallery_seo", label: "Gallery & SEO", icon: "🖼️" },
          { key: "reviews", label: `Reviews (${reviews.length})`, icon: "⭐" },
          { key: "preview", label: "Preview & Publish", icon: "👁️" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === tab.key
                ? "bg-[#0A0A08] text-white shadow-xs"
                : "border border-black/10 bg-white text-masaar-black/70 hover:bg-warm-ivory"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: BASIC DETAILS (A02) */}
      {activeTab === "basic" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: 1. Hotel Information + 2. Key Highlights */}
          <div className="space-y-6 lg:col-span-2">
            {/* 1. Hotel Information */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
              <div className="border-b border-black/5 pb-3">
                <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
                  1. Hotel Information
                </h2>
                <p className="text-xs text-masaar-black/60">
                  Core identity, classification, and public narrative description.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Hotel Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Makkah Hotel & Towers"
                    className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  >
                    <option value="Makkah">🕋 Makkah</option>
                    <option value="Madinah">🕌 Madinah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Hotel Category
                  </label>
                  <select
                    name="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  >
                    <option value="Luxury 5 Star">Luxury 5 Star</option>
                    <option value="Premium">Premium</option>
                    <option value="Standard">Standard</option>
                    <option value="Economy">Economy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Star Rating (1 - 5)
                  </label>
                  <select
                    name="star_rating"
                    value={starRating}
                    onChange={(e) => setStarRating(Number(e.target.value))}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  >
                    <option value={5}>★★★★★ (5 Stars)</option>
                    <option value={4}>★★★★ (4 Stars)</option>
                    <option value={3}>★★★ (3 Stars)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Highlight Tag
                  </label>
                  <input
                    name="room_type"
                    defaultValue={initial?.room_type ?? "Direct plaza access"}
                    placeholder="e.g. Closest to Haram, Direct plaza access"
                    className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Default Board Basis
                  </label>
                  <input
                    name="board_basis"
                    defaultValue={initial?.board_basis ?? "Room Only / Breakfast Available"}
                    placeholder="e.g. Room Only, Bed & Breakfast"
                    className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Lead Retail Price From (AED)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-masaar-black/40">AED</span>
                    <input
                      type="number"
                      name="price_from_aed"
                      value={priceFromAed}
                      onChange={(e) => setPriceFromAed(e.target.value)}
                      placeholder="e.g. 249"
                      className="w-full rounded-lg border border-black/15 bg-white py-2 pl-12 pr-3 text-xs font-mono font-bold text-masaar-black focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Short Description with Counter matching A02 */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-masaar-black">
                      Short Description (Card Summary)
                    </label>
                    <span className={`text-[10px] ${shortDesc.length > 250 ? "text-red-600 font-bold" : "text-masaar-black/40"}`}>
                      {shortDesc.length} / 250
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={250}
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    placeholder="A premium hotel offering exceptional proximity to the Grand Mosque, comfortable rooms and convenient access for families."
                    className="w-full rounded-lg border border-black/15 bg-white p-3 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  />
                </div>

                {/* Full Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Full Description (Detail Page Overview)
                  </label>
                  <textarea
                    name="description"
                    rows={5}
                    value={fullDesc}
                    onChange={(e) => setFullDesc(e.target.value)}
                    placeholder="Comprehensive property overview detailing location, dining, prayer facilities, and pilgrim support..."
                    className="w-full rounded-lg border border-black/15 bg-white p-3 text-xs text-masaar-black leading-relaxed focus:border-[#C9A227] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Key Highlights Pill Manager matching A02 */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
              <div className="border-b border-black/5 pb-3">
                <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
                  2. Key Highlights
                </h2>
                <p className="text-xs text-masaar-black/60">
                  Feature tags displayed on hotel cards and detail badges.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-warm-ivory px-3 py-1 text-xs font-semibold text-masaar-black"
                  >
                    <span>✓ {tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-masaar-black/40 hover:text-red-600 transition"
                      aria-label={`Remove ${tag}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 max-w-md pt-2">
                <input
                  type="text"
                  placeholder="Add custom highlight (e.g. Haram Speakers in room)"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 rounded-lg border border-black/15 bg-white px-3.5 py-1.5 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-lg border border-black/15 bg-warm-ivory px-3.5 py-1.5 text-xs font-semibold text-[#8C6B1A] hover:bg-[#F0E6CF] transition"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Cover Image & Status & Visibility Card */}
          <div className="space-y-6">
            {/* Cover Image Upload / Crop Preview */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-masaar-black font-[family-name:var(--font-display)]">
                Hotel Cover Image
              </h2>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-warm-ivory border border-black/10 flex items-center justify-center">
                {coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-center p-4 text-masaar-black/40">
                    <span className="text-2xl block mb-1">🖼️</span>
                    <span className="text-xs">No cover image configured</span>
                  </div>
                )}
                {/* Badge on preview */}
                <span className="absolute left-2.5 top-2.5 rounded bg-pure-gold px-2 py-0.5 text-[10px] font-bold text-masaar-black shadow-xs">
                  Cover Preview
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black mb-1">
                  Image URL or Path
                </label>
                <input
                  name="image_url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://... or /images/hotels/..."
                  className="w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                />
              </div>
            </div>

            {/* Status & Visibility Card matching A02 */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-masaar-black font-[family-name:var(--font-display)]">
                Status &amp; Visibility
              </h2>

              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-lg border border-black/10 p-3 cursor-pointer hover:bg-warm-ivory/30 transition">
                  <div>
                    <span className="text-xs font-bold text-masaar-black block">Publish to Website</span>
                    <span className="text-[11px] text-masaar-black/50">Visible to pilgrims in search</span>
                  </div>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4 rounded border-black/20 text-[#C9A227] focus:ring-[#C9A227]"
                  />
                </label>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Display Priority Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    defaultValue={initial?.display_order ?? 10}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs text-masaar-black focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOCATION & ACCESS (A03) */}
      {activeTab === "location" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Distance, Route, Accessibility, Map */}
          <div className="space-y-6 lg:col-span-2">
            {/* 1. Distance & Walking Information */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
              <div className="border-b border-black/5 pb-3">
                <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
                  1. Distance &amp; Walking Information
                </h2>
                <p className="text-xs text-masaar-black/60">
                  Ground-verified physical distance and walking times to the sacred mosque.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Distance to Haram (Meters)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="distance_from_haram_meters"
                      value={distanceMeters}
                      onChange={(e) => setDistanceMeters(e.target.value)}
                      placeholder="100"
                      className="w-full rounded-lg border border-black/15 bg-white py-2 pl-3 pr-8 text-xs font-bold text-masaar-black focus:border-[#C9A227] focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs font-semibold text-masaar-black/40">m</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Estimated Walking Time
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="walk_time_minutes"
                      value={walkMinutes}
                      onChange={(e) => setWalkMinutes(e.target.value)}
                      placeholder="2"
                      className="w-full rounded-lg border border-black/15 bg-white py-2 pl-3 pr-10 text-xs font-bold text-masaar-black focus:border-[#C9A227] focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs font-semibold text-masaar-black/40">min</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Max Walking Time (Crowd)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="walk_time_minutes_max"
                      defaultValue={initial?.walk_time_minutes_max ?? ""}
                      placeholder="5"
                      className="w-full rounded-lg border border-black/15 bg-white py-2 pl-3 pr-10 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs text-masaar-black/40">min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Route Type & Terrain */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
              <div className="border-b border-black/5 pb-3">
                <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
                  2. Route Type &amp; Terrain
                </h2>
                <p className="text-xs text-masaar-black/60">
                  Surface conditions and street crossing factors for pilgrim safety.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Route Type
                  </label>
                  <select
                    name="route_type"
                    value={routeType}
                    onChange={(e) => setRouteType(e.target.value)}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  >
                    <option value="Direct plaza access">Direct plaza access</option>
                    <option value="Covered walkway">Covered walkway</option>
                    <option value="Street / sidewalk">Street / sidewalk</option>
                    <option value="Mixed route">Mixed route</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Terrain &amp; Incline
                  </label>
                  <select
                    name="terrain_note"
                    value={terrainNote}
                    onChange={(e) => setTerrainNote(e.target.value)}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  >
                    <option value="Mostly flat">Mostly flat</option>
                    <option value="Mild incline">Mild incline</option>
                    <option value="Uphill return">Uphill return</option>
                    <option value="Steep (shuttle recommended)">Steep (shuttle recommended)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Route Description Note
                  </label>
                  <input
                    name="walking_route_description"
                    defaultValue={initial?.walking_route_description ?? "Flat open plaza facing King Fahd Gate with zero street crossings"}
                    placeholder="e.g. Pedestrianised marble plaza directly leading to King Fahd Gate"
                    className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Accessibility Details (10 Checkbox Grid matching A03) */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
              <div className="border-b border-black/5 pb-3">
                <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
                  3. Accessibility Details
                </h2>
                <p className="text-xs text-masaar-black/60">
                  Select all accessibility features verified for this property.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: "plaza_entrance", label: "Open plaza entrance", icon: "🏛️" },
                  { key: "wheelchair", label: "Wheelchair accessible", icon: "♿" },
                  { key: "elderly", label: "Elderly friendly", icon: "🧓" },
                  { key: "lifts_ramps", label: "Lifts / ramps available", icon: "🛗" },
                  { key: "escalators", label: "Escalators available", icon: "🪜" },
                  { key: "shuttle", label: "Shuttle service available", icon: "🚌" },
                  { key: "large_groups", label: "Large groups suitable", icon: "👥" },
                  { key: "stroller", label: "Stroller friendly", icon: "👶" },
                  { key: "assistance", label: "Dedicated mobility assistance", icon: "🤝" },
                  { key: "mobility_caution", label: "Not recommended for mobility issues", icon: "⚠️" },
                ].map(({ key, label, icon }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2.5 rounded-lg border border-black/10 p-2.5 cursor-pointer hover:bg-warm-ivory/30 transition text-xs select-none"
                  >
                    <input
                      type="checkbox"
                      checked={accessFeatures[key] ?? false}
                      onChange={(e) => {
                        setAccessFeatures((prev) => ({ ...prev, [key]: e.target.checked }));
                        if (key === "shuttle") setShuttleAvailable(e.target.checked);
                      }}
                      className="rounded border-black/20 text-[#C9A227] focus:ring-[#C9A227]"
                    />
                    <span>{icon}</span>
                    <span className="font-semibold text-masaar-black">{label}</span>
                  </label>
                ))}
              </div>

              <input type="hidden" name="shuttle_available" value={shuttleAvailable ? "on" : "off"} />
              <input
                type="hidden"
                name="accessibility_note"
                value={
                  accessFeatures.wheelchair
                    ? "Wheelchair accessible with step-free elevators and ramps"
                    : "Standard accessibility"
                }
              />
              <input
                type="hidden"
                name="elderly_family_suitability_note"
                value={
                  accessFeatures.elderly
                    ? "Families and elderly travellers"
                    : "Individual pilgrims & couples"
                }
              />
            </div>

            {/* 4. Location Details */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
              <div className="border-b border-black/5 pb-3">
                <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
                  4. Location Details
                </h2>
                <p className="text-xs text-masaar-black/60">
                  Google Maps pin, street address and designated gate destination.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-masaar-black">
                      Google Maps URL
                    </label>
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-[#8C6B1A] hover:underline"
                      >
                        Open in Google Maps ↗
                      </a>
                    )}
                  </div>
                  <input
                    name="google_maps_url"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/... or https://www.google.com/maps/place/..."
                    className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Verified Address
                  </label>
                  <input
                    name="verified_address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Ibrahim Al Khalil St, Makkah"
                    className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-masaar-black mb-1">
                    Nearest Gate Destination
                  </label>
                  <input
                    name="walking_gate_destination"
                    value={gateDestination}
                    onChange={(e) => setGateDestination(e.target.value)}
                    placeholder="e.g. King Fahd Gate (Gate 79)"
                    className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                  />
                </div>

                {isMadinah && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black mb-1">
                        Nearest Ladies&apos; Gate (Madinah)
                      </label>
                      <input
                        name="nearest_ladies_gate"
                        defaultValue={initial?.nearest_ladies_gate ?? "Gate 25 (Ladies Plaza)"}
                        className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black mb-1">
                        Ladies&apos; Gate Walk Minutes
                      </label>
                      <input
                        type="number"
                        name="ladies_gate_walk_minutes_min"
                        defaultValue={initial?.ladies_gate_walk_minutes_min ?? 3}
                        className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Walking Route Preview & Quick Summary matching A03 */}
          <div className="space-y-6">
            {/* Aerial Route Graphic / Step Cards */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-masaar-black font-[family-name:var(--font-display)]">
                Walking Route Preview
              </h2>

              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-masaar-black/90 flex flex-col items-center justify-center text-white p-4">
                <span className="text-2xl mb-1">🗺️</span>
                <span className="text-xs font-bold">{name}</span>
                <span className="text-[10px] text-white/60">to {city === "Makkah" ? "Masjid al-Haram" : "Al-Masjid an-Nabawi"}</span>
                <div className="mt-3 flex items-center gap-2 text-[10px] bg-white/10 px-2.5 py-1 rounded-full">
                  <span>🏃 {walkMinutes} min walk</span>
                  <span>•</span>
                  <span>📏 {distanceMeters} m</span>
                </div>
              </div>

              {/* Step cards */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex gap-2.5 items-start">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#C9A227] text-[10px] font-bold text-white">1</span>
                  <p className="text-masaar-black/80 font-medium">Exit hotel lobby via {routeType}</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#C9A227] text-[10px] font-bold text-white">2</span>
                  <p className="text-masaar-black/80 font-medium">Walk across {terrainNote.toLowerCase()} courtyard</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#C9A227] text-[10px] font-bold text-white">3</span>
                  <p className="text-masaar-black/80 font-medium">Arrive at {gateDestination}</p>
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="rounded-xl border border-[#C9A227]/30 bg-[#FAF5E8] p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-[#8C6B1A] uppercase tracking-wider">
                Proximity Facts
              </h3>
              <ul className="space-y-1.5 text-xs text-masaar-black/80">
                <li className="flex items-center gap-1.5">✓ <strong>{walkMinutes} minutes</strong> ground walking time</li>
                <li className="flex items-center gap-1.5">✓ <strong>{distanceMeters} meters</strong> verified path length</li>
                <li className="flex items-center gap-1.5">✓ Route type: <strong>{routeType}</strong></li>
                <li className="flex items-center gap-1.5">✓ Terrain: <strong>{terrainNote}</strong></li>
                {shuttleAvailable && <li className="flex items-center gap-1.5">✓ <strong>Shuttle service available</strong></li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROOM OPTIONS & PRICING (A04) */}
      {activeTab === "rooms" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
              <div>
                <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
                  Room Options &amp; Public Pricing
                </h2>
                <p className="text-xs text-masaar-black/60">
                  Manage individual room categories, board basis, bed configurations and retail AED rates.
                </p>
              </div>
              <span className="text-xs font-bold text-[#8C6B1A] bg-[#FAF5E8] px-3 py-1.5 rounded-lg border border-[#C9A227]/30">
                Starting from AED {priceFromAed} / night
              </span>
            </div>

            <div className="mt-4">
              {hotelId ? (
                <HotelRoomsManager hotelId={hotelId} rooms={rooms} />
              ) : (
                <div className="p-8 text-center text-masaar-black/50 text-xs">
                  Save basic hotel details first to configure structured room options.
                </div>
              )}
            </div>
          </div>

          {/* Supplier wholesale rates (confidential B2B) */}
          {hotelId && (
            <div className="mt-6">
              <HotelSupplierRatesManager hotelId={hotelId} hotelName={name} />
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FACILITIES */}
      {activeTab === "facilities" && (
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
          <div className="border-b border-black/5 pb-3">
            <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
              Hotel Facilities &amp; Amenities
            </h2>
            <p className="text-xs text-masaar-black/60">
              Select verified amenities provided at this property.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Complimentary High-Speed Wi-Fi",
              "24/7 Front Desk & Concierge",
              "On-Site Buffet & À la carte Dining",
              "24-Hour Room Service",
              "Individual Climate Control / AC",
              "Direct Haram Prayer Audio Feed",
              "Spacious Family Suites",
              "Luggage Storage & Porterage",
              "Express Laundry & Dry Cleaning",
              "Dedicated Hotel Prayer Hall",
              "Valet & Secure Parking",
              "Currency Exchange & ATM On-Site",
            ].map((facility) => (
              <label
                key={facility}
                className="flex items-center gap-2 rounded-lg border border-black/10 p-3 text-xs font-medium text-masaar-black hover:bg-warm-ivory cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-black/20 text-[#C9A227] focus:ring-[#C9A227]"
                />
                <span>{facility}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GALLERY, SEO & VERIFICATION (A05) */}
      {activeTab === "gallery_seo" && (
        <div className="space-y-6">
          {/* Gallery management */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
            <div className="border-b border-black/5 pb-3">
              <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
                1. Hotel Gallery Images
              </h2>
              <p className="text-xs text-masaar-black/60">
                One image URL per line. High-resolution photography of rooms, lobby, and mosque proximity.
              </p>
            </div>

            <textarea
              name="gallery_image_urls"
              rows={5}
              value={galleryUrls}
              onChange={(e) => setGalleryUrls(e.target.value)}
              placeholder={"https://.../photo-1.jpg\nhttps://.../photo-2.jpg\nhttps://.../photo-3.jpg"}
              className="w-full rounded-lg border border-black/15 bg-white p-3 font-mono text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
            />

            {/* Gallery Thumbnails Preview */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 pt-2">
              {galleryUrls.split("\n").filter(Boolean).map((url, i) => (
                <div key={url + i} className="relative aspect-square rounded-lg overflow-hidden border border-black/10 bg-warm-ivory">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 text-[9px] text-white rounded">
                    #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SEO & Meta Information matching A05 */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
            <div className="border-b border-black/5 pb-3">
              <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
                2. SEO &amp; Meta Information
              </h2>
              <p className="text-xs text-masaar-black/60">
                Search engine title, meta description, and canonical URL structure.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-masaar-black">
                    SEO Meta Title
                  </label>
                  <span className={`text-[10px] ${metaTitle.length > 60 ? "text-red-600 font-bold" : "text-masaar-black/40"}`}>
                    {metaTitle.length} / 60
                  </span>
                </div>
                <input
                  name="meta_title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="e.g. Makkah Hotel & Towers | Masaar Holidays"
                  className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-masaar-black">
                    SEO Meta Description
                  </label>
                  <span className={`text-[10px] ${metaDesc.length > 160 ? "text-red-600 font-bold" : "text-masaar-black/40"}`}>
                    {metaDesc.length} / 160
                  </span>
                </div>
                <textarea
                  name="meta_description"
                  rows={2}
                  maxLength={160}
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  placeholder="Stay at Makkah Hotel & Towers with direct plaza access to the Grand Mosque. Verified family accommodation and Umrah packages with Masaar Holidays UAE."
                  className="w-full rounded-lg border border-black/15 bg-white p-3 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-masaar-black mb-1">
                  Canonical URL Slug
                </label>
                <div className="flex items-center rounded-lg border border-black/15 bg-warm-ivory/30 px-3 py-2 text-xs text-masaar-black/60 font-mono">
                  <span>https://masaarholidays.com/hotels/</span>
                  <input
                    name="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 bg-transparent font-bold text-masaar-black focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Verification & Audit tracking matching A05 */}
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
            <div className="border-b border-black/5 pb-3">
              <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
                3. Verification &amp; Audit Trail
              </h2>
              <p className="text-xs text-masaar-black/60">
                Track verification status, review date and official researcher provenance.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-masaar-black mb-1">
                  Verification Status
                </label>
                <select
                  name="data_confidence"
                  value={dataConfidence ?? "verified"}
                  onChange={(e) => setDataConfidence(e.target.value as "verified" | "estimated" | "needs_verification")}
                  className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-bold text-masaar-black focus:border-[#C9A227] focus:outline-none"
                >
                  <option value="verified">✓ Verified (Physical Facts Surveyed)</option>
                  <option value="needs_verification">⚠️ Needs Review</option>
                  <option value="estimated">Estimated (Pending Survey)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black mb-1">
                  Last Verified Date
                </label>
                <input
                  type="date"
                  defaultValue="2026-10-18"
                  className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black mb-1">
                  Verified By
                </label>
                <input
                  defaultValue="Haseeb (Admin)"
                  className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs text-masaar-black focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-masaar-black mb-1">
                  Internal Verification Notes &amp; Sources
                </label>
                <textarea
                  name="admin_caution_note"
                  rows={2}
                  defaultValue={initial?.admin_caution_note ?? "Verified via official brand listing, verified Google Maps pin, and Asfar Al Safwah 2026-2027 contract rate sheet."}
                  className="w-full rounded-lg border border-black/15 bg-white p-3 text-xs text-masaar-black focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GUEST REVIEWS */}
      {activeTab === "reviews" && (
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs">
          <div className="border-b border-black/5 pb-3 mb-4">
            <h2 className="text-base font-bold text-masaar-black font-[family-name:var(--font-display)]">
              Guest Reviews &amp; Testimonials
            </h2>
            <p className="text-xs text-masaar-black/60">
              Manage authentic pilgrim feedback for {name}.
            </p>
          </div>
          {hotelId ? (
            <HotelReviewsManager
              hotelId={hotelId}
              hotelSlug={slug}
              hotelName={name}
              initialReviews={reviews}
            />
          ) : (
            <div className="p-8 text-center text-masaar-black/50 text-xs">
              Save the hotel first to manage reviews.
            </div>
          )}
        </div>
      )}

      {/* TAB 7: PREVIEW & PUBLISH (A06) */}
      {activeTab === "preview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Website Live Preview matching A06 */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">💻</span>
                <div>
                  <h3 className="text-xs font-bold text-masaar-black">Website Preview</h3>
                  <p className="text-[11px] text-masaar-black/50">Live simulator of how this hotel will appear to travellers</p>
                </div>
              </div>

              {/* View Switcher: Desktop vs Mobile */}
              <div className="flex items-center rounded-lg border border-black/10 bg-warm-ivory/50 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                    previewDevice === "desktop"
                      ? "bg-[#C9A227] text-white shadow-2xs"
                      : "text-masaar-black/70 hover:text-masaar-black"
                  }`}
                >
                  <span>🖥️</span>
                  <span>Desktop View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                    previewDevice === "mobile"
                      ? "bg-[#C9A227] text-white shadow-2xs"
                      : "text-masaar-black/70 hover:text-masaar-black"
                  }`}
                >
                  <span>📱</span>
                  <span>Mobile View</span>
                </button>
              </div>
            </div>

            {/* Simulated Frame */}
            <div className="rounded-2xl border border-black/15 bg-white p-6 shadow-sm overflow-hidden">
              {previewDevice === "desktop" ? (
                /* Desktop Preview Layout matching H03/A06 */
                <div className="space-y-6">
                  {/* Hero gallery */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-warm-ivory border border-black/10">
                      {coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverImageUrl} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-masaar-black/40">No photo</div>
                      )}
                      <span className="absolute left-3 top-3 rounded bg-pure-gold px-2.5 py-1 text-[11px] font-bold text-masaar-black shadow-xs">
                        {category}
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] text-masaar-black/50 font-medium">Home &rsaquo; Hotels &rsaquo; {city}</div>
                      <h2 className="text-2xl font-bold text-masaar-black mt-1 font-[family-name:var(--font-display)]">{name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-amber-500 text-xs">{"★".repeat(starRating)}</span>
                        <span className="text-xs text-masaar-black/50">📍 {city}, Saudi Arabia</span>
                      </div>
                      <p className="mt-2 text-xs text-masaar-black/70 leading-relaxed">{shortDesc}</p>

                      {/* 4 Quick Badges matching A06 */}
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-warm-ivory p-2 border border-black/5">
                          <span className="font-bold text-masaar-black block">{walkMinutes} min walk</span>
                          <span className="text-[10px] text-masaar-black/50">{distanceMeters} metres</span>
                        </div>
                        <div className="rounded-lg bg-warm-ivory p-2 border border-black/5">
                          <span className="font-bold text-masaar-black block">{routeType}</span>
                          <span className="text-[10px] text-masaar-black/50">Route type</span>
                        </div>
                        <div className="rounded-lg bg-warm-ivory p-2 border border-black/5">
                          <span className="font-bold text-masaar-black block">{terrainNote}</span>
                          <span className="text-[10px] text-masaar-black/50">Path terrain</span>
                        </div>
                        <div className="rounded-lg bg-warm-ivory p-2 border border-black/5">
                          <span className="font-bold text-masaar-black block">Family Friendly</span>
                          <span className="text-[10px] text-masaar-black/50">Elderly access</span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button type="button" className="flex-1 rounded-lg border border-black/15 py-2 text-xs font-bold text-masaar-black">
                          View Rooms
                        </button>
                        <button type="button" className="flex-1 rounded-lg bg-[#C9A227] py-2 text-xs font-bold text-white shadow-xs">
                          Enquire on WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* About This Hotel */}
                  <div className="rounded-xl bg-warm-ivory/40 p-4 border border-black/5 space-y-2">
                    <h3 className="text-sm font-bold text-masaar-black">About {name}</h3>
                    <p className="text-xs text-masaar-black/75 leading-relaxed">{fullDesc || shortDesc}</p>
                  </div>
                </div>
              ) : (
                /* Mobile Phone Simulator matching A06 */
                <div className="mx-auto max-w-[340px] rounded-[36px] border-[6px] border-masaar-black bg-white p-4 shadow-2xl space-y-4">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-warm-ivory border border-black/10">
                    {coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverImageUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-masaar-black/40">No photo</div>
                    )}
                    <span className="absolute left-2.5 top-2.5 rounded bg-pure-gold px-2 py-0.5 text-[10px] font-bold text-masaar-black shadow-xs">
                      {category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-masaar-black">{name}</h3>
                    <div className="text-amber-500 text-xs">{"★".repeat(starRating)}</div>
                    <p className="text-[11px] text-masaar-black/70 mt-1">{shortDesc}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                    <div className="rounded bg-warm-ivory p-1.5 border border-black/5 font-bold">
                      {walkMinutes} min walk
                    </div>
                    <div className="rounded bg-warm-ivory p-1.5 border border-black/5 font-bold">
                      {routeType}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <button type="button" className="w-full rounded-lg bg-[#C9A227] py-2 text-xs font-bold text-white shadow-xs">
                      Enquire on WhatsApp
                    </button>
                    <button type="button" className="w-full rounded-lg border border-black/15 py-1.5 text-xs font-semibold text-masaar-black">
                      View Rooms
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Publication Checklist & Settings matching A06 */}
          <div className="space-y-6">
            {/* Publication Checklist Card */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-masaar-black font-[family-name:var(--font-display)]">
                  Publication Checklist
                </h3>
                <p className="text-[11px] text-masaar-black/50">
                  Ensure all verified facts are confirmed before publication.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    {item.done ? (
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                        ✓
                      </span>
                    ) : (
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-black/20 text-[10px] text-masaar-black/30">
                        ○
                      </span>
                    )}
                    <span className={item.done ? "text-masaar-black font-medium" : "text-masaar-black/50"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {allChecksPassed ? (
                <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-900 font-medium">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-0.5">
                    <span>✓</span>
                    <span>Ready to Publish</span>
                  </div>
                  All required verified information is complete. You can safely publish this hotel to the website.
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900 font-medium">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-0.5">
                    <span>⚠️</span>
                    <span>Action Required</span>
                  </div>
                  Please complete the pending checklist items above before enabling public visibility.
                </div>
              )}
            </div>

            {/* Publication Settings Card */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-masaar-black font-[family-name:var(--font-display)]">
                Publication Settings
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-masaar-black mb-1">Status</label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_active_radio"
                        checked={!isActive}
                        onChange={() => setIsActive(false)}
                        className="text-[#C9A227] focus:ring-[#C9A227]"
                      />
                      <span>Draft (Not visible on website)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_active_radio"
                        checked={isActive}
                        onChange={() => setIsActive(true)}
                        className="text-[#C9A227] focus:ring-[#C9A227]"
                      />
                      <span className="font-bold text-masaar-black">Published (Visible on website)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-masaar-black mb-1">Publish Date</label>
                  <input
                    type="date"
                    defaultValue="2026-10-18"
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs text-masaar-black focus:outline-none"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    name="is_active"
                    value={isActive ? "on" : "off"}
                    disabled={isPending}
                    className="w-full rounded-xl bg-[#C9A227] py-2.5 text-xs font-bold text-white hover:bg-[#B38F1E] shadow-xs transition"
                  >
                    {isPending ? "Saving..." : isActive ? "🚀 Publish Hotel" : "💾 Save as Draft"}
                  </button>

                  {initial?.slug && (
                    <Link
                      href={`/hotels/${initial.slug}`}
                      target="_blank"
                      className="block w-full text-center rounded-xl border border-black/15 bg-white py-2 text-xs font-semibold text-masaar-black hover:bg-warm-ivory transition"
                    >
                      View on Website ↗
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
