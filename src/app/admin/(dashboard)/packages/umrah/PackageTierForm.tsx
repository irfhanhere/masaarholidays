"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { HotelRow, PackageRow } from "@/lib/types/database";
import type { AddonRow } from "./inclusions-addons/InclusionsAddonsManager";
import { savePackageTierMaster } from "./actions";

interface Props {
  packageData: PackageRow;
  hotels: HotelRow[];
  addonsCatalog?: AddonRow[];
}

export function PackageTierForm({ packageData, hotels, addonsCatalog = [] }: Props) {
  const [title, setTitle] = useState(packageData.title || "");
  const [isFeatured, setIsFeatured] = useState(packageData.is_featured || false);
  const [badgeLabel, setBadgeLabel] = useState(packageData.is_featured ? "Most Popular" : "None");
  const [shortDescription, setShortDescription] = useState(
    packageData.short_description ||
      "A seamless, budget-smart spiritual experience designed for a meaningful Umrah journey."
  );

  const [makkahHotel, setMakkahHotel] = useState(packageData.makkah_hotel_name || "VOCO Makkah");
  const [madinahHotel, setMadinahHotel] = useState(packageData.madinah_hotel_name || "Zowar International");

  // Inclusions state
  const initialInclusions = packageData.inclusions_text
    ? packageData.inclusions_text.split("\n").filter(Boolean)
    : ["Accommodation", "Private transfers", "Haram shuttle", "Guest support"];

  const [inclusions, setInclusions] = useState<string[]>(initialInclusions);

  // Available add-ons from catalog (filtered to published only)
  const publishedAddons = addonsCatalog.length > 0
    ? addonsCatalog.filter((a) => a.status === "published")
    : [
        { id: "1", name: "Visa", key_slug: "visa", price_type_label: "Allow customers to add Umrah visa." },
        { id: "2", name: "Makkah Ziyarat", key_slug: "makkah_ziyarat", price_type_label: "Private Makkah sightseeing." },
        { id: "3", name: "Madinah Ziyarat", key_slug: "madinah_ziyarat", price_type_label: "Private Madinah sightseeing." },
        { id: "4", name: "Flights", key_slug: "flights", price_type_label: "Add flight services." },
        { id: "5", name: "Private Trips", key_slug: "private_trips", price_type_label: "Allow selection of private trips." },
      ];

  const [selectedAddonSlugs, setSelectedAddonSlugs] = useState<string[]>(
    packageData.default_addon_slugs?.length ? packageData.default_addon_slugs : publishedAddons.map((a) => a.key_slug)
  );

  const makkahHotelsList = hotels.filter((h) => h.city.toLowerCase().includes("makkah"));
  const madinahHotelsList = hotels.filter((h) => h.city.toLowerCase().includes("madinah"));

  function handleAddInclusion() {
    setInclusions([...inclusions, ""]);
  }

  function handleInclusionChange(index: number, val: string) {
    const updated = [...inclusions];
    updated[index] = val;
    setInclusions(updated);
  }

  function handleRemoveInclusion(index: number) {
    setInclusions(inclusions.filter((_, i) => i !== index));
  }

  function toggleAddonSlug(slug: string) {
    if (selectedAddonSlugs.includes(slug)) {
      setSelectedAddonSlugs(selectedAddonSlugs.filter((s) => s !== slug));
    } else {
      setSelectedAddonSlugs([...selectedAddonSlugs, slug]);
    }
  }

  return (
    <form action={savePackageTierMaster} className="space-y-6">
      <input type="hidden" name="id" value={packageData.id} />
      <input type="hidden" name="inclusions_text" value={inclusions.join("\n")} />
      <input type="hidden" name="default_addon_slugs" value={selectedAddonSlugs.join(",")} />
      {isFeatured && <input type="hidden" name="is_featured" value="on" />}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin/packages" className="hover:underline">Packages</Link>
            <span>&rsaquo;</span>
            <Link href="/admin/packages/umrah" className="hover:underline">Umrah</Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">Edit {title}</span>
          </div>
          <h1 className="text-2xl font-bold text-masaar-black mt-1">Edit {title}</h1>
          <p className="text-xs text-masaar-black/60">Update the details for this Umrah package tier.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/packages/umrah">
            <SecondaryButton type="button">Cancel</SecondaryButton>
          </Link>
          <PrimaryButton type="submit" id="save_package_tier_btn">Save Changes</PrimaryButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Form Cards */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information Card */}
          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📜</span>
              <h3 className="font-bold text-base text-masaar-black">Basic Information</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Package Name" required>
                <input
                  type="text"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Badge (Optional)" hint="Show a badge on package cards (e.g. Popular, Best Value).">
                <select
                  value={badgeLabel}
                  onChange={(e) => {
                    setBadgeLabel(e.target.value);
                    setIsFeatured(e.target.value !== "None");
                  }}
                  className={inputClass}
                >
                  <option value="None">None</option>
                  <option value="Most Popular">Most Popular</option>
                  <option value="Best Value">Best Value</option>
                  <option value="Popular">Popular</option>
                </select>
              </Field>
            </div>

            <Field label="Short Description">
              <textarea
                name="short_description"
                rows={3}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A seamless, budget-smart spiritual experience designed for a meaningful Umrah journey."
                className={inputClass}
              />
              <p className="text-right text-[10px] text-masaar-black/40 pt-1">
                {shortDescription.length}/200
              </p>
            </Field>
          </div>

          {/* Default Hotels Card (2 Side-by-Side Cards) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-black/10 bg-white p-5 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">🕋</span>
                <h4 className="font-bold text-sm text-masaar-black">Makkah Package</h4>
              </div>

              <Field label="Default Hotel">
                <select
                  name="makkah_hotel_name"
                  value={makkahHotel}
                  onChange={(e) => setMakkahHotel(e.target.value)}
                  className={inputClass}
                >
                  {makkahHotelsList.length > 0 ? (
                    makkahHotelsList.map((h) => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))
                  ) : (
                    <option value="VOCO Makkah">VOCO Makkah</option>
                  )}
                </select>
              </Field>
              <p className="text-[10px] text-masaar-black/50">This hotel will be shown as the default for this tier.</p>
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-5 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">🕌</span>
                <h4 className="font-bold text-sm text-masaar-black">Madinah Package</h4>
              </div>

              <Field label="Default Hotel">
                <select
                  name="madinah_hotel_name"
                  value={madinahHotel}
                  onChange={(e) => setMadinahHotel(e.target.value)}
                  className={inputClass}
                >
                  {madinahHotelsList.length > 0 ? (
                    madinahHotelsList.map((h) => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))
                  ) : (
                    <option value="Zowar International">Zowar International</option>
                  )}
                </select>
              </Field>
              <p className="text-[10px] text-masaar-black/50">This hotel will be shown as the default for this tier.</p>
            </div>
          </div>

          {/* Inclusions Card */}
          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">☑</span>
              <div>
                <h3 className="font-bold text-base text-masaar-black">Inclusions</h3>
                <p className="text-[11px] text-masaar-black/50">Add the key inclusions for this package tier.</p>
              </div>
            </div>

            <div className="space-y-3">
              {inclusions.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="cursor-grab text-masaar-black/30">:::</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleInclusionChange(index, e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Accommodation"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveInclusion(index)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-black/10 text-masaar-black/50 hover:bg-rose-50 hover:text-rose-600"
                  >
                    🗑
                  </button>
                </div>
              ))}

              <SecondaryButton type="button" onClick={handleAddInclusion} className="mt-2">
                + Add inclusion
              </SecondaryButton>
            </div>
          </div>

          {/* Add-ons Card (Live Wired to Screen 4 Catalog) */}
          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎁</span>
                <div>
                  <h3 className="font-bold text-base text-masaar-black">Add-ons</h3>
                  <p className="text-[11px] text-masaar-black/50">
                    Enable the optional add-ons available for this package (dynamically synced with Global Catalog).
                  </p>
                </div>
              </div>
              <Link href="/admin/packages/umrah/inclusions-addons" className="text-xs font-semibold text-deep-gold underline">
                Manage Catalog &rsaquo;
              </Link>
            </div>

            <div className="space-y-3 divide-y divide-black/5 text-xs">
              {publishedAddons.map((item) => {
                const isChecked = selectedAddonSlugs.includes(item.key_slug);
                return (
                  <label key={item.key_slug} className="flex items-center justify-between pt-3 first:pt-0 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAddonSlug(item.key_slug)}
                        className="rounded border-black/20 text-deep-gold focus:ring-deep-gold"
                      />
                      <span className="font-bold text-masaar-black">{item.name}</span>
                    </div>
                    <span className="text-masaar-black/50">{item.price_type_label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Package Preview Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-deep-gold">
              <span>👁</span>
              <h4 className="font-bold text-base text-masaar-black">Package Preview</h4>
            </div>

            <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
              <img
                src="/images/umrah-hero.jpg"
                alt="Package Hero"
                className="h-44 w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="p-4 space-y-3">
                <div>
                  <h5 className="font-bold text-lg text-masaar-black">{title}</h5>
                  <p className="text-xs text-masaar-black/70 leading-relaxed mt-1">{shortDescription}</p>
                </div>

                <div className="space-y-2 pt-1 border-t border-black/5 text-xs">
                  <div className="flex items-center gap-3 rounded-lg bg-warm-ivory/50 p-2">
                    <span className="text-base">🏨</span>
                    <div>
                      <p className="font-bold text-masaar-black">{makkahHotel}</p>
                      <p className="text-[10px] text-masaar-black/60">5-Star accommodation</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-warm-ivory/50 p-2">
                    <span className="text-base">🏨</span>
                    <div>
                      <p className="font-bold text-masaar-black">{madinahHotel}</p>
                      <p className="text-[10px] text-masaar-black/60">4-Star accommodation</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-black/5 space-y-1 text-xs">
                  {inclusions.filter(Boolean).map((inc, i) => (
                    <p key={i} className="flex items-center gap-2 text-emerald-800 font-medium">
                      <span>✓</span> {inc}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
