"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { TransferRow } from "@/lib/types/database";
import { saveTransfer, type TransferFormState } from "./actions";

const EXISTING_TRIP_IMAGES = [
  { label: "Jeddah Airport → Makkah Hotel", path: "/trips/private-transfers-card-home.webp" },
  { label: "Makkah Hotel → Jeddah Airport", path: "/trips/Makkah Hotel → Jeddah Airport.webp" },
  { label: "Jeddah Airport → Madinah Hotel", path: "/trips/Jeddah Airport → Madinah Hotel.webp" },
  { label: "Madinah Hotel → Jeddah Airport", path: "/trips/Madinah Hotel → Jeddah Airport.webp" },
  { label: "Madinah Airport → Madinah Hotel", path: "/trips/Madinah Airport → Madinah Hotel.webp" },
  { label: "Madinah Hotel → Madinah Airport", path: "/trips/Madinah Hotel → Madinah Airport.webp" },
  { label: "Makkah Hotel ↔ Madinah Hotel", path: "/trips/Makkah Hotel ↔ Madinah Hotel.webp" },
  { label: "Makkah ↔ Madinah (via Badr)", path: "/trips/Makkah ↔ Madinah via Badr Rawdah Well.webp" },
  { label: "Makkah / Madinah Ziyarat", path: "/trips/MAKKAH MADHIN - HOTEL.webp" },
  { label: "Haramain Train Station", path: "/trips/Makkah  Madinah ↔ Train Station.webp" },
  { label: "Jeddah → Taif → Return", path: "/trips/Jeddah → Taif → Return.webp" },
  { label: "Makkah → Taif → Return", path: "/trips/Makkah → Taif → Return.webp" },
  { label: "Default Banner", path: "/brand/banners/default.webp" },
  { label: "Airport Banner", path: "/brand/banners/Airport Banner.webp" },
  { label: "Intercity Banner", path: "/brand/banners/Intercity Transfers.webp" },
  { label: "Ziyarat Banner", path: "/brand/banners/Ziyarat Transfers.webp" },
  { label: "Train Banner", path: "/brand/banners/Haramain Train Transfers.webp" },
  { label: "Day Trips Banner", path: "/brand/banners/Day Trips & Return Journeys.webp" },
];

interface Props {
  transferId?: string;
  initial?: Partial<TransferRow>;
}

export function TransferForm({ transferId, initial }: Props) {
  const router = useRouter();
  const formKey = useId();
  const action = saveTransfer.bind(null, transferId ?? null);
  const [state, formAction, isPending] = useActionState<TransferFormState, FormData>(
    action,
    { status: "idle" }
  );

  const [imageUrl, setImageUrl] = useState(initial?.image_url || "/trips/private-transfers-card-home.webp");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [routeName, setRouteName] = useState(initial?.route_name || "");
  const [seoTitle, setSeoTitle] = useState((initial as any)?.seo_title || "");
  const [metaDesc, setMetaDesc] = useState((initial as any)?.meta_description || "");
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Auto-fill slug from route name if slug was empty
  const handleRouteNameChange = (val: string) => {
    setRouteName(val);
    if (!initial?.id && !slug) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Dashboard</Link>
            <span>&rsaquo;</span>
            <Link href="/admin/transfers" className="hover:underline">Transfers</Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">
              {transferId ? "Edit Transfer Route" : "Add Transfer Route"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-masaar-black mt-1">
            {transferId ? `Edit ${initial?.route_name || "Route"}` : "Add Transfer Route"}
          </h1>
          <p className="text-xs text-masaar-black/60">
            Update route details, service information and media. Use the Rate Card to manage per-vehicle pricing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/transfers"
            className="rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black shadow-2xs hover:bg-black/5"
          >
            ← Back
          </Link>

          {initial?.slug && (
            <Link
              href={`/transfers/${initial.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black shadow-2xs hover:bg-black/5"
            >
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Preview</span>
            </Link>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-deep-gold px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-deep-gold/90 disabled:opacity-50"
          >
            {isPending ? "Saving..." : transferId ? "Save Changes" : "Create Transfer Route"}
          </button>
        </div>
      </div>

      {state.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {state.message}
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Core Form Fields */}
        <div className="space-y-6 lg:col-span-8">
          {/* 1. Basic Information */}
          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-black/5 pb-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-warm-ivory text-xs">
                🏷️
              </span>
              <h2 className="text-sm font-bold text-masaar-black">Basic Information</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-masaar-black">
                  Route Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="route_name"
                  value={routeName}
                  onChange={(e) => handleRouteNameChange(e.target.value)}
                  placeholder="e.g. Jeddah Airport → Makkah Hotel"
                  required
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="transfer_type"
                  defaultValue={initial?.transfer_type || "airport"}
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                >
                  <option value="airport">Airport Transfers</option>
                  <option value="intercity">Intercity Transfers</option>
                  <option value="ziyarat">Ziyarat</option>
                  <option value="train">Train Station Transfers</option>
                  <option value="day-trip">Day Trips</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black">
                  Pickup Location / Origin <span className="text-red-500">*</span>
                </label>
                <input
                  name="pickup_location"
                  defaultValue={(initial as any)?.pickup_location || "King Abdulaziz Airport (JED) Arrivals"}
                  required
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black">
                  Destination / Drop-off <span className="text-red-500">*</span>
                </label>
                <input
                  name="dropoff_location"
                  defaultValue={(initial as any)?.dropoff_location || "Makkah Hotel"}
                  required
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                />
              </div>
            </div>

            {/* Route Type Radios */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-masaar-black">
                Journey Type
              </label>
              <div className="mt-2 flex gap-5 text-xs text-masaar-black">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="route_type"
                    value="one-way"
                    defaultChecked={((initial as any)?.route_type || "one-way") === "one-way"}
                  />
                  <span>One-way Transfer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="route_type"
                    value="round-trip"
                    defaultChecked={(initial as any)?.route_type === "round-trip"}
                  />
                  <span>Round Trip / Day Tour</span>
                </label>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <div className="flex justify-between">
                <label className="block text-xs font-semibold text-masaar-black">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-masaar-black/50">Used on route cards</span>
              </div>
              <textarea
                name="description"
                defaultValue={initial?.description || ""}
                rows={2}
                maxLength={300}
                required
                placeholder="Brief summary of the transfer route..."
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-white p-3 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <div className="flex justify-between">
                <label className="block text-xs font-semibold text-masaar-black">
                  Detailed Description (Optional)
                </label>
                <span className="text-[10px] text-masaar-black/50">Displayed on route detail page</span>
              </div>
              <textarea
                name="long_description"
                defaultValue={(initial as any)?.long_description || ""}
                rows={3}
                maxLength={1000}
                placeholder="Comprehensive description of the service, arrival procedures, vehicle comfort..."
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-white p-3 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Service Details */}
          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-black/5 pb-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-warm-ivory text-xs">
                ⏱️
              </span>
              <h2 className="text-sm font-bold text-masaar-black">Service Details</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-masaar-black">
                  Estimated Journey Duration
                </label>
                <input
                  name="duration"
                  defaultValue={(initial as any)?.duration || "1.5 to 2 hours"}
                  placeholder="e.g. 1.5 to 2 hours"
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black">
                  Availability Schedule
                </label>
                <input
                  defaultValue="Daily (24/7 on advance booking)"
                  disabled
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-black/5 px-3 py-2 text-xs text-masaar-black/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-masaar-black">
                Special Instructions / Route Notes (Optional)
              </label>
              <textarea
                name="route_notes"
                defaultValue={(initial as any)?.route_notes || ""}
                rows={2}
                placeholder="e.g. Driver will meet you at arrivals with a personalized name board..."
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-white p-3 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Display & Status */}
          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-black/5 pb-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-warm-ivory text-xs">
                ⚙️
              </span>
              <h2 className="text-sm font-bold text-masaar-black">Display &amp; Status</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-masaar-black">Status</label>
                <label className="mt-2 flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={initial?.is_active ?? true}
                  />
                  <span>Active (Visible on Website)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black">Featured</label>
                <label className="mt-2 flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={(initial as any)?.featured ?? false}
                  />
                  <span>Featured on Homepage</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-masaar-black">Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  defaultValue={initial?.display_order ?? 0}
                  className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Route Media & SEO */}
        <div className="space-y-6 lg:col-span-4">
          {/* Route Image Card */}
          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <h2 className="text-sm font-bold text-masaar-black">Route Image</h2>
              <span className="text-[10px] text-masaar-black/50">16:9 WebP</span>
            </div>

            <div className="relative aspect-16/10 w-full overflow-hidden rounded-lg border border-black/10 bg-warm-ivory">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Route preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-xs text-masaar-black/40">
                  No Image Selected
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-masaar-black">Image Asset URL</label>
              <input
                name="image_url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/trips/... or URL"
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowImagePicker(!showImagePicker)}
                className="w-full rounded-lg border border-black/15 bg-warm-ivory/50 py-2 text-xs font-semibold text-masaar-black hover:bg-warm-ivory"
              >
                {showImagePicker ? "Close Asset Selector" : "Choose from Approved Masaar Images"}
              </button>

              {showImagePicker && (
                <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-black/10 bg-white p-2 divide-y divide-black/5">
                  {EXISTING_TRIP_IMAGES.map((img) => (
                    <button
                      key={img.path}
                      type="button"
                      onClick={() => {
                        setImageUrl(img.path);
                        setShowImagePicker(false);
                      }}
                      className="flex w-full items-center gap-2.5 p-1.5 text-left text-xs hover:bg-warm-ivory/50 rounded"
                    >
                      <div className="relative size-8 shrink-0 overflow-hidden rounded border border-black/10 bg-warm-ivory">
                        <Image src={img.path} alt="" fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 truncate">
                        <span className="font-semibold block truncate text-[11px]">{img.label}</span>
                        <span className="text-[9px] text-masaar-black/40 font-mono truncate">{img.path}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SEO Settings Card */}
          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-black/5 pb-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-warm-ivory text-xs">
                🔍
              </span>
              <h2 className="text-sm font-bold text-masaar-black">SEO Metadata</h2>
            </div>

            <div>
              <div className="flex justify-between">
                <label className="block text-xs font-semibold text-masaar-black">Meta Title</label>
                <span className={`text-[10px] ${seoTitle.length > 60 ? "text-red-500 font-bold" : "text-masaar-black/50"}`}>
                  {seoTitle.length}/60
                </span>
              </div>
              <input
                name="seo_title"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="e.g. Jeddah Airport to Makkah Hotel Transfer | Masaar Holidays"
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between">
                <label className="block text-xs font-semibold text-masaar-black">Meta Description</label>
                <span className={`text-[10px] ${metaDesc.length > 160 ? "text-red-500 font-bold" : "text-masaar-black/50"}`}>
                  {metaDesc.length}/160
                </span>
              </div>
              <textarea
                name="meta_description"
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                rows={3}
                placeholder="Clear 120-155 character description with enquiry CTA..."
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-white p-3 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-masaar-black">Focus Keyword</label>
              <input
                name="focus_keyword"
                defaultValue={(initial as any)?.focus_keyword || ""}
                placeholder="e.g. Jeddah Airport to Makkah transfer"
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-masaar-black">URL Slug</label>
              <input
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. jeddah-airport-to-makkah-hotel"
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-masaar-black font-mono focus:border-deep-gold focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-masaar-black/50 font-mono truncate">
                https://masaarholidays.com/transfers/{slug || "route-slug"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
