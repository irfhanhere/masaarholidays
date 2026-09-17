"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, Field, inputClass } from "@/components/admin/ui";
import type {
  PrivateTripDestination,
  PrivateTripPickupPoint,
  PrivateTripRow,
  PrivateTripStatus,
  PrivateTripStopRow,
  PrivateTripStopVisitType,
} from "@/lib/types/database";
import { savePrivateTrip } from "./actions";

interface StopDraft {
  id?: string;
  stop_number: number;
  stop_name: string;
  image_url?: string;
  visit_duration?: string;
  visit_type: PrivateTripStopVisitType;
  short_description?: string;
}

const DEFAULT_TIME_SLOTS = ["7:00 AM", "8:00 AM", "9:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];

const PRESET_IMAGES = [
  { label: "Makkah Card", url: "/trips/PRIVATE-TRIP-MAKKAH-CARD.png" },
  { label: "Madinah Card", url: "/trips/PRIVATE-TRIP-MADINAH-CARD.png" },
  { label: "Makkah Hero", url: "/trips/PRIVATE-TRIP-MAKKAH-HERO.png" },
  { label: "Madinah Hero", url: "/trips/PRIVATE-TRIP-MADINAH-HERO.jpg" },
  { label: "Transport", url: "/trips/PRIVATE-TRIP-TRANSPORT.png" },
  { label: "Taif / Destination", url: "/trips/DESTINATION IMAGE.png" },
];

const PRESET_STOP_IMAGES = [
  { label: "Mount Uhud", url: "/trips/STOP-MADINAH-MOUNT-UHUD.png" },
  { label: "Shuhada Uhud", url: "/trips/STOP-MADINAH-SHUHADA-UHUD.png" },
  { label: "Mount Rumah", url: "/trips/STOP-MADINAH-MOUNT-RUMAH.png" },
];

export function PrivateTripForm({
  tripId,
  initialTrip,
  initialStops = [],
}: {
  tripId?: string;
  initialTrip?: PrivateTripRow | null;
  initialStops?: PrivateTripStopRow[];
}) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  // Form Fields State
  const [name, setName] = useState(initialTrip?.name ?? "");
  const [slug, setSlug] = useState(initialTrip?.slug ?? "");
  const [destination, setDestination] = useState<PrivateTripDestination>(
    initialTrip?.destination ?? "Makkah"
  );
  const [shortDescription, setShortDescription] = useState(initialTrip?.short_description ?? "");
  const [duration, setDuration] = useState(initialTrip?.duration ?? "2 – 2.5 hours");
  const [tripType, setTripType] = useState(initialTrip?.trip_type ?? "Private Sightseeing");
  const [featuredImageUrl, setFeaturedImageUrl] = useState(
    initialTrip?.featured_image_url ??
      (destination === "Madinah"
        ? "/trips/PRIVATE-TRIP-MADINAH-CARD.png"
        : "/trips/PRIVATE-TRIP-MAKKAH-CARD.png")
  );
  const [heroImageUrl, setHeroImageUrl] = useState(
    initialTrip?.hero_image_url ??
      (destination === "Madinah"
        ? "/trips/PRIVATE-TRIP-MADINAH-HERO.jpg"
        : "/trips/PRIVATE-TRIP-MAKKAH-HERO.png")
  );
  const [pickupPoint, setPickupPoint] = useState<PrivateTripPickupPoint>(
    initialTrip?.pickup_point ?? "hotel_lobby"
  );
  const [timeSlots, setTimeSlots] = useState<string[]>(
    initialTrip?.time_slots && initialTrip.time_slots.length > 0
      ? initialTrip.time_slots
      : DEFAULT_TIME_SLOTS
  );
  const [newTimeSlotInput, setNewTimeSlotInput] = useState("");
  const [showAddTimeSlot, setShowAddTimeSlot] = useState(false);

  const [importantNote, setImportantNote] = useState(
    initialTrip?.important_note ??
      "Please be ready in your hotel lobby 10 minutes before the trip starts. Driver will meet you in the lobby."
  );
  const [whatsappTemplateKey, setWhatsappTemplateKey] = useState(
    initialTrip?.whatsapp_template_key ?? "privateTripEnquiry"
  );
  const [metaTitle, setMetaTitle] = useState(initialTrip?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(initialTrip?.meta_description ?? "");

  // Stops State
  const [stops, setStops] = useState<StopDraft[]>(
    initialStops.length > 0
      ? initialStops.map((s) => ({
          id: s.id,
          stop_number: s.stop_number,
          stop_name: s.stop_name,
          image_url: s.image_url ?? "",
          visit_duration: s.visit_duration ?? "",
          visit_type: s.visit_type,
          short_description: s.short_description ?? "",
        }))
      : [
          {
            stop_number: 1,
            stop_name: "Hotel",
            visit_type: "Pickup",
            short_description: "Pickup from your hotel lobby",
          },
          {
            stop_number: 2,
            stop_name: "Mount Uhud",
            visit_type: "Visit",
            visit_duration: "25 – 30 min",
            short_description: "Explore the historic Uhud mountain.",
            image_url: "/trips/STOP-MADINAH-MOUNT-UHUD.png",
          },
          {
            stop_number: 3,
            stop_name: "Shuhada Uhud Cemetery",
            visit_type: "Pass By",
            short_description: "Drive past the cemetery of martyrs.",
            image_url: "/trips/STOP-MADINAH-SHUHADA-UHUD.png",
          },
          {
            stop_number: 4,
            stop_name: "Mount Rumah",
            visit_type: "Pass By",
            short_description: "View Mount Rumah from the route.",
            image_url: "/trips/STOP-MADINAH-MOUNT-RUMAH.png",
          },
        ]
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Time slot toggling
  function toggleTimeSlot(slot: string) {
    if (timeSlots.includes(slot)) {
      setTimeSlots(timeSlots.filter((s) => s !== slot));
    } else {
      setTimeSlots([...timeSlots, slot]);
    }
  }

  function handleAddNewTimeSlot() {
    if (!newTimeSlotInput.trim()) return;
    const slot = newTimeSlotInput.trim();
    if (!timeSlots.includes(slot)) {
      setTimeSlots([...timeSlots, slot]);
    }
    setNewTimeSlotInput("");
    setShowAddTimeSlot(false);
  }

  // Stops management
  function addStop() {
    const nextNumber = stops.length + 1;
    setStops([
      ...stops,
      {
        stop_number: nextNumber,
        stop_name: "",
        visit_type: "Visit",
        visit_duration: "20 – 30 min",
        short_description: "",
      },
    ]);
  }

  function removeStop(index: number) {
    const next = stops.filter((_, i) => i !== index).map((s, i) => ({ ...s, stop_number: i + 1 }));
    setStops(next);
  }

  function updateStop(index: number, patch: Partial<StopDraft>) {
    const next = [...stops];
    next[index] = { ...next[index], ...patch };
    setStops(next);
  }

  function moveStop(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === stops.length - 1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const next = [...stops];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setStops(next.map((s, i) => ({ ...s, stop_number: i + 1 })));
  }

  // Save handler
  async function handleSubmit(saveStatus: PrivateTripStatus) {
    if (!name.trim()) {
      setErrorMsg("Please enter a Trip Name in Basic Information.");
      setCurrentStep(1);
      return;
    }

    setErrorMsg(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("slug", slug);
    formData.set("destination", destination);
    formData.set("short_description", shortDescription);
    formData.set("duration", duration);
    formData.set("trip_type", tripType);
    formData.set("featured_image_url", featuredImageUrl);
    formData.set("hero_image_url", heroImageUrl);
    formData.set("status", saveStatus);
    formData.set("pickup_point", pickupPoint);
    formData.set("time_slots_json", JSON.stringify(timeSlots));
    formData.set("important_note", importantNote);
    formData.set("whatsapp_template_key", whatsappTemplateKey);
    formData.set("meta_title", metaTitle);
    formData.set("meta_description", metaDescription);
    formData.set("stops_json", JSON.stringify(stops));

    startTransition(async () => {
      try {
        const res = await savePrivateTrip(tripId ?? null, { status: "idle" }, formData);
        if (res.status === "error") {
          setErrorMsg(res.error || "An error occurred while saving.");
        }
      } catch (err: unknown) {
        // Next.js redirect throws, so ignore redirect errors
        const message = err instanceof Error ? err.message : "Failed to save trip.";
        if (!message.includes("NEXT_REDIRECT")) {
          setErrorMsg(message);
        }
      }
    });
  }

  const stepTitles = [
    { num: 1, title: "Basic Information" },
    { num: 2, title: "Featured Image" },
    { num: 3, title: "Itinerary / Stops" },
    { num: 4, title: "Trip Details" },
    { num: 5, title: "Review & Publish" },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/private-trips"
            className="inline-flex items-center gap-1 text-xs font-semibold text-masaar-black/60 hover:text-masaar-black"
          >
            ← Back to Private Trips
          </Link>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black">
            {tripId ? "Edit Private Trip" : "Add Private Trip"}
          </h1>
          <p className="mt-0.5 text-sm text-masaar-black/60">
            {tripId
              ? "Update sightseeing experience details, itinerary stops, and settings."
              : "Create a new sightseeing experience for your travellers."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={isPending}
            className="rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black transition-colors hover:bg-warm-ivory disabled:opacity-60"
          >
            Save Draft
          </button>

          {slug && (
            <Link
              href={`/private-trips/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-masaar-black transition-colors hover:bg-warm-ivory"
            >
              <svg className="size-4 text-masaar-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleSubmit("published")}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#A87F12] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C9A227] disabled:opacity-60"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {isPending ? "Saving..." : "Publish"}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Step Indicator Tabs */}
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white p-2 shadow-xs">
        <div className="flex min-w-[640px] items-center justify-between">
          {stepTitles.map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`relative flex flex-1 items-center justify-center gap-2.5 py-2.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "text-[#A87F12]"
                    : isCompleted
                    ? "text-masaar-black/80 hover:text-masaar-black"
                    : "text-masaar-black/40 hover:text-masaar-black/60"
                }`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-[#A87F12] text-white"
                      : isCompleted
                      ? "bg-warm-ivory text-[#A87F12]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {s.num}
                </span>
                <span>{s.title}</span>
                {isActive && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-[#A87F12]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 1: Basic Information */}
      <div className={currentStep === 1 ? "space-y-6" : "hidden"}>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex size-8 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div>
              <h2 className="font-semibold text-masaar-black">Basic Information</h2>
              <p className="text-xs text-masaar-black/50">Add the main details about this private trip.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trip Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug || slug === initialTrip?.slug) {
                    setSlug(e.target.value.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"));
                  }
                }}
                placeholder="e.g. Madinah Private Sightseeing"
                className={inputClass}
                required
              />
            </Field>

            <Field label="Destination" required>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value as PrivateTripDestination)}
                className={inputClass}
              >
                <option value="Makkah">Makkah</option>
                <option value="Madinah">Madinah</option>
                <option value="Other">Other</option>
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Short Description" required hint="Brief summary shown on cards and overview listings.">
                <div className="relative">
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value.slice(0, 250))}
                    rows={3}
                    placeholder="A guided visit to the blessed places of Madinah with a private vehicle. Explore historical and spiritual landmarks at your own pace."
                    className={inputClass}
                    maxLength={250}
                  />
                  <span className="absolute right-2 bottom-2 text-xs text-masaar-black/40">
                    {shortDescription.length}/250
                  </span>
                </div>
              </Field>
            </div>

            <Field label="Duration" required hint="e.g. 2 – 2.5 hours">
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="2 – 2.5 hours"
                className={inputClass}
                required
              />
            </Field>

            <Field label="Trip Type" required>
              <select
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                className={inputClass}
              >
                <option value="Private Sightseeing">Private Sightseeing</option>
                <option value="Day Trip">Day Trip</option>
                <option value="Historical Tour">Historical Tour</option>
                <option value="Custom Experience">Custom Experience</option>
              </select>
            </Field>

            <Field label="Slug (URL identifier)" hint="auto-generated from name or custom">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="madinah-private-sightseeing"
                className={inputClass}
              />
            </Field>
          </div>
        </Card>
      </div>

      {/* Step 2: Featured Image */}
      <div className={currentStep === 2 ? "space-y-6" : "hidden"}>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex size-8 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <h2 className="font-semibold text-masaar-black">Featured Image</h2>
              <p className="text-xs text-masaar-black/50">This image will be used on the website and in enquiry sections.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Image Preview */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-black/10 bg-warm-ivory">
              {featuredImageUrl ? (
                <Image
                  src={featuredImageUrl}
                  alt="Featured Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-sm text-masaar-black/40">
                  No image selected
                </div>
              )}
            </div>

            {/* Selector & Presets */}
            <div className="space-y-4">
              <Field label="Card Image URL" hint="Recommended size: 1200 × 800 (Max 5 MB)">
                <input
                  type="text"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="/trips/PRIVATE-TRIP-MADINAH-CARD.png"
                  className={inputClass}
                />
              </Field>

              <div>
                <p className="mb-2 text-xs font-medium text-masaar-black/70">Quick Select Supplied Assets:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_IMAGES.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => setFeaturedImageUrl(p.url)}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        featuredImageUrl === p.url
                          ? "border-deep-gold bg-[#FAF5E8] text-deep-gold font-semibold"
                          : "border-black/15 bg-white text-masaar-black/70 hover:bg-warm-ivory"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Hero Banner Image URL (Detail Page)" hint="Full width header photo">
                <input
                  type="text"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="/trips/PRIVATE-TRIP-MADINAH-HERO.jpg"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </Card>
      </div>

      {/* Step 3: Itinerary / Stops */}
      <div className={currentStep === 3 ? "space-y-6" : "hidden"}>
        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              <div>
                <h2 className="font-semibold text-masaar-black">Itinerary / Stops</h2>
                <p className="text-xs text-masaar-black/50">
                  Add the places included in this trip. You can reorder, edit or remove stops.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addStop}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#A87F12] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#C9A227]"
            >
              + Add Stop
            </button>
          </div>

          {/* Stops List */}
          <div className="space-y-3">
            {stops.map((stop, index) => {
              const isPassBy = stop.visit_type === "Pass By";
              const isPickupOrDrop = stop.visit_type === "Pickup" || stop.visit_type === "Drop Off";

              return (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-xl border border-black/10 bg-warm-ivory/20 p-4 transition-shadow hover:shadow-xs"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Drag / Reorder handle */}
                    <div className="flex items-center gap-1 text-masaar-black/30">
                      <button
                        type="button"
                        onClick={() => moveStop(index, "up")}
                        disabled={index === 0}
                        className="rounded p-1 hover:bg-white hover:text-masaar-black disabled:opacity-30"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStop(index, "down")}
                        disabled={index === stops.length - 1}
                        className="rounded p-1 hover:bg-white hover:text-masaar-black disabled:opacity-30"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Stop Number */}
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white font-mono text-xs font-bold text-masaar-black shadow-xs">
                      {String(stop.stop_number).padStart(2, "0")}
                    </div>

                    {/* Stop Thumbnail */}
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-black/10 bg-white">
                      {stop.image_url ? (
                        <Image src={stop.image_url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[10px] text-masaar-black/30">
                          Icon
                        </div>
                      )}
                    </div>

                    {/* Stop Name */}
                    <div className="min-w-[140px] flex-1">
                      <label className="text-[10px] font-medium text-masaar-black/50 uppercase">Stop Name *</label>
                      <input
                        type="text"
                        value={stop.stop_name}
                        onChange={(e) => updateStop(index, { stop_name: e.target.value })}
                        placeholder="e.g. Mount Uhud"
                        className="w-full rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                        required
                      />
                    </div>

                    {/* Visit Type */}
                    <div className="w-28">
                      <label className="text-[10px] font-medium text-masaar-black/50 uppercase">Visit Type *</label>
                      <select
                        value={stop.visit_type}
                        onChange={(e) =>
                          updateStop(index, {
                            visit_type: e.target.value as PrivateTripStopVisitType,
                            visit_duration:
                              e.target.value === "Pass By" ||
                              e.target.value === "Pickup" ||
                              e.target.value === "Drop Off"
                                ? ""
                                : stop.visit_duration,
                          })
                        }
                        className="w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                      >
                        <option value="Visit">Visit</option>
                        <option value="Pass By">Pass By</option>
                        <option value="Pickup">Pickup</option>
                        <option value="Drop Off">Drop Off</option>
                      </select>
                    </div>

                    {/* Duration */}
                    <div className="w-28">
                      <label className="text-[10px] font-medium text-masaar-black/50 uppercase">Duration</label>
                      <input
                        type="text"
                        value={isPassBy || isPickupOrDrop ? "—" : stop.visit_duration ?? ""}
                        disabled={isPassBy || isPickupOrDrop}
                        onChange={(e) => updateStop(index, { visit_duration: e.target.value })}
                        placeholder="25 – 30 min"
                        className="w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-xs text-masaar-black disabled:bg-gray-100 disabled:text-masaar-black/40 focus:border-deep-gold focus:outline-none"
                      />
                    </div>

                    {/* Short Description */}
                    <div className="min-w-[180px] flex-1">
                      <label className="text-[10px] font-medium text-masaar-black/50 uppercase">Short Description (Optional)</label>
                      <input
                        type="text"
                        value={stop.short_description ?? ""}
                        onChange={(e) => updateStop(index, { short_description: e.target.value })}
                        placeholder="e.g. Explore the historic Uhud mountain."
                        className="w-full rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                      />
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => removeStop(index)}
                      className="mt-4 flex size-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                      title="Remove stop"
                    >
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Stop Image selection strip */}
                  <div className="flex flex-wrap items-center gap-2 pl-12 text-xs">
                    <span className="text-masaar-black/50">Stop image:</span>
                    <input
                      type="text"
                      value={stop.image_url ?? ""}
                      onChange={(e) => updateStop(index, { image_url: e.target.value })}
                      placeholder="Image URL (e.g. /trips/STOP-MADINAH-MOUNT-UHUD.png)"
                      className="rounded border border-black/15 bg-white px-2 py-0.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none min-w-[260px]"
                    />
                    {PRESET_STOP_IMAGES.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => updateStop(index, { image_url: preset.url })}
                        className="rounded border border-black/15 bg-white px-2 py-0.5 text-[11px] text-masaar-black/70 hover:bg-white hover:text-deep-gold"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Another Stop button */}
          <button
            type="button"
            onClick={addStop}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 bg-warm-ivory/40 py-3 text-xs font-semibold text-[#A87F12] transition-colors hover:bg-warm-ivory"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-[#A87F12] text-white">
              +
            </span>
            Add Another Stop
          </button>
        </Card>
      </div>

      {/* Step 4: Trip Details & Operations */}
      <div className={currentStep === 4 ? "space-y-6" : "hidden"}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Available Time Slots */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex size-8 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <h2 className="font-semibold text-masaar-black">Available Time Slots</h2>
                <p className="text-xs text-masaar-black/50">Select the available time slots for this trip.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DEFAULT_TIME_SLOTS.map((slot) => {
                const isSelected = timeSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleTimeSlot(slot)}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-[#A87F12] bg-[#FAF5E8] text-masaar-black shadow-xs"
                        : "border-black/15 bg-white text-masaar-black/70 hover:bg-warm-ivory"
                    }`}
                  >
                    <span
                      className={`flex size-4 items-center justify-center rounded text-[10px] ${
                        isSelected ? "bg-[#A87F12] text-white" : "border border-black/20"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                    {slot}
                  </button>
                );
              })}

              {/* Custom added slots */}
              {timeSlots
                .filter((s) => !DEFAULT_TIME_SLOTS.includes(s))
                .map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleTimeSlot(slot)}
                    className="flex items-center gap-2 rounded-lg border border-[#A87F12] bg-[#FAF5E8] p-3 text-xs font-semibold text-masaar-black shadow-xs"
                  >
                    <span className="flex size-4 items-center justify-center rounded bg-[#A87F12] text-white text-[10px]">
                      ✓
                    </span>
                    {slot}
                  </button>
                ))}
            </div>

            {/* Add Custom Time Slot */}
            <div className="mt-4">
              {showAddTimeSlot ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTimeSlotInput}
                    onChange={(e) => setNewTimeSlotInput(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="rounded-md border border-black/15 px-3 py-1.5 text-xs text-masaar-black focus:border-deep-gold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewTimeSlot}
                    className="rounded-md bg-[#A87F12] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#C9A227]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTimeSlot(false)}
                    className="rounded-md border border-black/15 px-2.5 py-1.5 text-xs text-masaar-black/60 hover:bg-warm-ivory"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddTimeSlot(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-masaar-black/70 hover:bg-warm-ivory"
                >
                  + Add Time Slot
                </button>
              )}
            </div>
          </Card>

          {/* Pickup Point */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex size-8 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <div>
                <h2 className="font-semibold text-masaar-black">Pickup Point</h2>
                <p className="text-xs text-masaar-black/50">Select where the travellers will be picked up from.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-masaar-black cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="pickup_point_radio"
                    checked={pickupPoint === "hotel_lobby"}
                    onChange={() => setPickupPoint("hotel_lobby")}
                    className="text-deep-gold focus:ring-deep-gold"
                  />
                  Hotel Lobby
                </label>

                <label className="flex items-center gap-2 text-sm text-masaar-black cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="pickup_point_radio"
                    checked={pickupPoint === "custom"}
                    onChange={() => setPickupPoint("custom")}
                    className="text-deep-gold focus:ring-deep-gold"
                  />
                  Custom Pickup
                </label>

                <label className="flex items-center gap-2 text-sm text-masaar-black cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="pickup_point_radio"
                    checked={pickupPoint === "both"}
                    onChange={() => setPickupPoint("both")}
                    className="text-deep-gold focus:ring-deep-gold"
                  />
                  Both
                </label>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-warm-ivory/60 p-3 text-xs text-masaar-black/70">
                <svg className="size-4 shrink-0 text-deep-gold mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Hotel lobby is the most common pickup point. You can also allow custom pickup or both options.</span>
              </div>
            </div>
          </Card>

          {/* Important Information */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex size-8 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <div>
                <h2 className="font-semibold text-masaar-black">Important Information</h2>
                <p className="text-xs text-masaar-black/50">Add important notes or instructions for travellers.</p>
              </div>
            </div>

            <Field label="Important Note *" required>
              <div className="relative">
                <textarea
                  value={importantNote}
                  onChange={(e) => setImportantNote(e.target.value.slice(0, 500))}
                  rows={4}
                  className={inputClass}
                  maxLength={500}
                />
                <span className="absolute right-2 bottom-2 text-xs text-masaar-black/40">
                  {importantNote.length}/500
                </span>
              </div>
            </Field>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-warm-ivory/60 p-3 text-xs text-masaar-black/70">
              <svg className="size-4 shrink-0 text-deep-gold mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>This information will be shown on the website and included in enquiries. You can update it anytime.</span>
            </div>
          </Card>

          {/* WhatsApp / Enquiry Template */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex size-8 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              <div>
                <h2 className="font-semibold text-masaar-black">WhatsApp / Enquiry</h2>
                <p className="text-xs text-masaar-black/50">Choose the enquiry template to use when this trip is selected.</p>
              </div>
            </div>

            <Field label="Enquiry Template *" required>
              <select
                value={whatsappTemplateKey}
                onChange={(e) => setWhatsappTemplateKey(e.target.value)}
                className={inputClass}
              >
                <option value="privateTripEnquiry">Private Trip Enquiry (Default)</option>
                <option value="general">General Enquiry</option>
              </select>
            </Field>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-warm-ivory/60 p-3 text-xs text-masaar-black/70">
              <svg className="size-4 shrink-0 text-deep-gold mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>The selected template will automatically include this trip&apos;s details when the customer enquires via WhatsApp.</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Step 5: Review & Publish */}
      <div className={currentStep === 5 ? "space-y-6" : "hidden"}>
        <Card>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black mb-4">
            Review Trip Details
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-masaar-black/50 uppercase">Trip Name</span>
                <p className="font-semibold text-masaar-black text-base">{name || "—"}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-masaar-black/50 uppercase">Destination & Duration</span>
                <p className="text-masaar-black">{destination} &middot; {duration}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-masaar-black/50 uppercase">Trip Type</span>
                <p className="text-masaar-black">{tripType}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-masaar-black/50 uppercase">Short Description</span>
                <p className="text-masaar-black/80">{shortDescription || "—"}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-masaar-black/50 uppercase">Itinerary Stops ({stops.length})</span>
                <ul className="mt-1 space-y-1 text-xs text-masaar-black/80">
                  {stops.map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#A87F12]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-medium">{s.stop_name}</span>
                      <span className="text-masaar-black/50">({s.visit_type}{s.visit_duration ? ` · ${s.visit_duration}` : ""})</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-semibold text-masaar-black/50 uppercase">Time Slots</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {timeSlots.map((slot) => (
                    <span key={slot} className="rounded-md bg-warm-ivory px-2 py-0.5 text-xs font-medium text-masaar-black">
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-black/10 pt-6">
            <h3 className="text-sm font-semibold text-masaar-black mb-3">SEO Override (Optional)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Meta Title" hint='Falls back to "[Name] | Masaar Holidays"'>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={`${name || "Private Trip"} | Masaar Holidays`}
                  className={inputClass}
                />
              </Field>
              <Field label="Meta Description" hint="Falls back to Short Description">
                <input
                  type="text"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={shortDescription || "Masaar Holidays private sightseeing"}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </Card>
      </div>

      {/* Step Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-black/10 pt-4">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep - 1)}
            className="rounded-lg border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-masaar-black transition-colors hover:bg-warm-ivory"
          >
            ← Previous
          </button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            className="rounded-lg bg-[#A87F12] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C9A227]"
          >
            Next: {stepTitles[currentStep].title} →
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={isPending}
              className="rounded-lg border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-masaar-black hover:bg-warm-ivory disabled:opacity-60"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("published")}
              disabled={isPending}
              className="rounded-lg bg-[#A87F12] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#C9A227] disabled:opacity-60"
            >
              {isPending ? "Publishing..." : "Publish Trip"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
