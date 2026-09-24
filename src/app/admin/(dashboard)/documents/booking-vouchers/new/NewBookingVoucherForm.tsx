"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClass, PrimaryButton, SecondaryButton, Card } from "@/components/admin/ui";
import { createDocumentFromSource, createManualBookingVoucher, type CreateManualBookingVoucherInput } from "../../actions";
import type { DocumentRow } from "@/lib/types/database";

export function NewBookingVoucherForm({
  quotations,
  invoices,
}: {
  quotations: DocumentRow[];
  invoices: DocumentRow[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"import" | "manual">("manual");
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    quotations[0]?.id || invoices[0]?.id || ""
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Checkboxes for add-ons
  const [includeVisa, setIncludeVisa] = useState(true);
  const [includeZiyarat, setIncludeZiyarat] = useState(true);
  const [includeVip, setIncludeVip] = useState(true);
  const [includeAssistance, setIncludeAssistance] = useState(true);

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSourceId) {
      setError("Please select a quotation or invoice to import from.");
      return;
    }
    setError(null);
    setIsPending(true);
    try {
      const res = await createDocumentFromSource(selectedSourceId, "booking_voucher");
      if (!res.success) {
        setError(res.error || "Failed to import document.");
        setIsPending(false);
        return;
      }
      if (res.id) {
        router.push(`/admin/documents/booking-vouchers/${res.id}`);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to import document.");
      setIsPending(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const clientName = String(formData.get("client_name") ?? "").trim();
    if (!clientName) {
      setError("Client name is required.");
      return;
    }

    const input: CreateManualBookingVoucherInput = {
      client_name: clientName,
      client_phone: String(formData.get("client_phone") ?? "").trim() || undefined,
      client_email: String(formData.get("client_email") ?? "").trim() || undefined,
      client_country: String(formData.get("client_country") ?? "").trim() || undefined,
      travel_date: String(formData.get("travel_date") ?? "").trim() || undefined,
      return_date: String(formData.get("return_date") ?? "").trim() || undefined,
      adults: Number(formData.get("adults")) || 2,
      children: Number(formData.get("children")) || 0,
      infants: Number(formData.get("infants")) || 0,
      destination: String(formData.get("destination") ?? "Makkah & Madinah").trim(),
      booking_reference: String(formData.get("booking_reference") ?? "").trim() || undefined,
      special_requirements: String(formData.get("special_requirements") ?? "").trim() || undefined,
      // Accommodation
      makkah_hotel: String(formData.get("makkah_hotel") ?? "").trim() || undefined,
      makkah_nights: Number(formData.get("makkah_nights")) || 5,
      makkah_room: String(formData.get("makkah_room") ?? "Twin Sharing").trim(),
      madinah_hotel: String(formData.get("madinah_hotel") ?? "").trim() || undefined,
      madinah_nights: Number(formData.get("madinah_nights")) || 5,
      madinah_room: String(formData.get("madinah_room") ?? "Twin Sharing").trim(),
      // Transportation
      transfer_vehicle: String(formData.get("transfer_vehicle") ?? "").trim() || undefined,
      transfer_route: String(formData.get("transfer_route") ?? "").trim() || undefined,
      // Flight
      flight_airline: String(formData.get("flight_airline") ?? "").trim() || undefined,
      flight_class: String(formData.get("flight_class") ?? "Economy").trim(),
      flight_route: String(formData.get("flight_route") ?? "").trim() || undefined,
      // Add-ons
      include_visa: includeVisa,
      visa_type: String(formData.get("visa_type") ?? "Saudi Tourist / Umrah Visa"),
      include_ziyarat: includeZiyarat,
      include_vip: includeVip,
      include_assistance: includeAssistance,
      custom_addons: String(formData.get("custom_addons") ?? "").trim() || undefined,
    };

    setIsPending(true);
    try {
      const res = await createManualBookingVoucher(input);
      if (!res.success) {
        setError(res.error || "Failed to create booking voucher.");
        setIsPending(false);
        return;
      }
      if (res.id) {
        router.push(`/admin/documents/booking-vouchers/${res.id}`);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to create booking voucher.");
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode selection tabs */}
      <div className="flex border-b border-black/10">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            mode === "manual"
              ? "border-admin-primary text-admin-primary"
              : "border-transparent text-masaar-black/60 hover:text-masaar-black"
          }`}
        >
          Create from Scratch
        </button>
        <button
          type="button"
          onClick={() => setMode("import")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            mode === "import"
              ? "border-admin-primary text-admin-primary"
              : "border-transparent text-masaar-black/60 hover:text-masaar-black"
          }`}
        >
          Import from Quotation / Invoice
        </button>
      </div>

      {mode === "import" ? (
        <form onSubmit={handleImportSubmit}>
          <Card>
            <h2 className="mb-2 font-semibold text-masaar-black">Select Source Document</h2>
            <p className="text-xs text-masaar-black/60 mb-5">
              Select an accepted quotation or invoice. All client information, hotels, transfers, and services will be automatically copied into the new booking confirmation.
            </p>

            <Field label="Choose Document" required>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className={inputClass}
                disabled={isPending}
              >
                {quotations.length > 0 && (
                  <optgroup label="Quotations">
                    {quotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.document_number} — {q.client_name} ({q.status})
                      </option>
                    ))}
                  </optgroup>
                )}
                {invoices.length > 0 && (
                  <optgroup label="Invoices">
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.document_number} — {inv.client_name} ({inv.status})
                      </option>
                    ))}
                  </optgroup>
                )}
                {quotations.length === 0 && invoices.length === 0 && (
                  <option value="">No existing quotations or invoices available</option>
                )}
              </select>
            </Field>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton type="button" onClick={() => window.history.back()}>
                Cancel
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                disabled={isPending || !selectedSourceId}
              >
                {isPending ? "Generating…" : "Generate Booking Confirmation →"}
              </PrimaryButton>
            </div>
          </Card>
        </form>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          {/* 1. Guest & Travel Information */}
          <Card>
            <h2 className="mb-4 font-semibold text-masaar-black">1. Guest &amp; Travel Information</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client / Guest Name" required>
                <input name="client_name" required className={inputClass} placeholder="e.g. Mrs Mohammed" />
              </Field>

              <Field label="Custom Booking Reference" hint="e.g. MH-BKG-4587 (leave blank to auto-generate)">
                <input name="booking_reference" className={inputClass} placeholder="MH-BKG-XXXX" />
              </Field>

              <Field label="Client Phone">
                <input name="client_phone" className={inputClass} placeholder="+971 50 123 4567" />
              </Field>

              <Field label="Client Email">
                <input name="client_email" type="email" className={inputClass} placeholder="client@email.com" />
              </Field>

              <Field label="Country / City">
                <input name="client_country" className={inputClass} placeholder="Dubai, UAE" />
              </Field>

              <Field label="Destination">
                <input name="destination" className={inputClass} defaultValue="Makkah & Madinah" />
              </Field>

              <Field label="Departure Date">
                <input name="travel_date" type="date" className={inputClass} />
              </Field>

              <Field label="Return Date">
                <input name="return_date" type="date" className={inputClass} />
              </Field>

              <div className="sm:col-span-2 grid grid-cols-3 gap-3">
                <Field label="Adults">
                  <input name="adults" type="number" min="1" defaultValue="2" className={inputClass} />
                </Field>
                <Field label="Children">
                  <input name="children" type="number" min="0" defaultValue="0" className={inputClass} />
                </Field>
                <Field label="Infants">
                  <input name="infants" type="number" min="0" defaultValue="0" className={inputClass} />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Special Requirements or Notes">
                  <textarea
                    name="special_requirements"
                    rows={2}
                    className={inputClass}
                    placeholder="e.g. High floor room preferred, wheelchair assistance required at airport"
                  />
                </Field>
              </div>
            </div>
          </Card>

          {/* 2. Accommodation Box (Hotels) */}
          <Card>
            <div className="flex items-center gap-2 mb-4 font-semibold text-masaar-black">
              <span>🏨</span>
              <h2>2. Accommodation Details (Hotels)</h2>
            </div>

            <div className="space-y-4">
              {/* Makkah Hotel */}
              <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-pure-gold mb-3">Makkah Hotel</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <Field label="Hotel Name">
                      <input
                        name="makkah_hotel"
                        className={inputClass}
                        defaultValue="Swissôtel Makkah"
                        placeholder="e.g. Swissôtel Makkah"
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="Nights">
                      <input
                        name="makkah_nights"
                        type="number"
                        min="1"
                        defaultValue="5"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="Room Type">
                      <input
                        name="makkah_room"
                        className={inputClass}
                        defaultValue="Twin Sharing"
                        placeholder="e.g. Twin Sharing / Haram View"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Madinah Hotel */}
              <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-pure-gold mb-3">Madinah Hotel</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <Field label="Hotel Name">
                      <input
                        name="madinah_hotel"
                        className={inputClass}
                        defaultValue="Anwar Al Madinah Mövenpick"
                        placeholder="e.g. Anwar Al Madinah"
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="Nights">
                      <input
                        name="madinah_nights"
                        type="number"
                        min="1"
                        defaultValue="5"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="Room Type">
                      <input
                        name="madinah_room"
                        className={inputClass}
                        defaultValue="Twin Sharing"
                        placeholder="e.g. Twin Sharing / City View"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 3. Transportation Box (Transfers) */}
          <Card>
            <div className="flex items-center gap-2 mb-4 font-semibold text-masaar-black">
              <span>🚐</span>
              <h2>3. Transportation / Transfer Details</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vehicle Type">
                <select name="transfer_vehicle" className={inputClass} defaultValue="GMC Yukon / Suburban">
                  <option value="GMC Yukon / Suburban">GMC Yukon / Suburban (Private VIP)</option>
                  <option value="Hyundai Staria">Hyundai Staria (7 Seats)</option>
                  <option value="Toyota HiAce">Toyota HiAce (10-12 Seats)</option>
                  <option value="Toyota Coaster">Toyota Coaster (18-22 Seats)</option>
                  <option value="Luxury Sedan">Luxury Sedan (Camry / Lexus)</option>
                  <option value="High-Speed Haramain Train">High-Speed Haramain Train (Business Class)</option>
                </select>
              </Field>

              <Field label="Transfer Route Coverage">
                <input
                  name="transfer_route"
                  className={inputClass}
                  defaultValue="Airport – Makkah – Madinah – Airport"
                  placeholder="e.g. Airport – Makkah – Madinah – Airport"
                />
              </Field>
            </div>
          </Card>

          {/* 4. Flights Box */}
          <Card>
            <div className="flex items-center gap-2 mb-4 font-semibold text-masaar-black">
              <span>✈️</span>
              <h2>4. Flights (Optional)</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Airline">
                <input
                  name="flight_airline"
                  className={inputClass}
                  defaultValue="Emirates"
                  placeholder="e.g. Emirates / Saudia / flydubai"
                />
              </Field>
              <Field label="Cabin Class">
                <select name="flight_class" className={inputClass} defaultValue="Business Class">
                  <option value="Business Class">Business Class</option>
                  <option value="Economy Class">Economy Class</option>
                  <option value="First Class">First Class</option>
                </select>
              </Field>
              <Field label="Flight Route">
                <input
                  name="flight_route"
                  className={inputClass}
                  defaultValue="DXB – JED – MED – DXB"
                  placeholder="e.g. DXB – JED – MED – DXB"
                />
              </Field>
            </div>
          </Card>

          {/* 5. Visa & Add-ons Box */}
          <Card>
            <div className="flex items-center gap-2 mb-4 font-semibold text-masaar-black">
              <span>⭐</span>
              <h2>5. Visa &amp; Additional Services (Add-ons)</h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-black/10 bg-[#FAF9F6] cursor-pointer hover:bg-black/[0.02]">
                <input
                  type="checkbox"
                  checked={includeVisa}
                  onChange={(e) => setIncludeVisa(e.target.checked)}
                  className="mt-1 size-4 rounded border-black/20 text-admin-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-sm text-masaar-black">Saudi Tourist / Umrah Visa</span>
                  <p className="text-xs text-masaar-black/60">Includes full electronic visa filing, authorization and medical insurance coverage.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-black/10 bg-[#FAF9F6] cursor-pointer hover:bg-black/[0.02]">
                <input
                  type="checkbox"
                  checked={includeZiyarat}
                  onChange={(e) => setIncludeZiyarat(e.target.checked)}
                  className="mt-1 size-4 rounded border-black/20 text-admin-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-sm text-masaar-black">Historical Ziyarat in Makkah &amp; Madinah</span>
                  <p className="text-xs text-masaar-black/60">Jabal Al-Noor, Cave of Hira, Mount Arafat, Masjid Quba, Mount Uhud, and Seven Mosques with private chauffeur.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-black/10 bg-[#FAF9F6] cursor-pointer hover:bg-black/[0.02]">
                <input
                  type="checkbox"
                  checked={includeVip}
                  onChange={(e) => setIncludeVip(e.target.checked)}
                  className="mt-1 size-4 rounded border-black/20 text-admin-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-sm text-masaar-black">VIP Meet &amp; Assist at Airport</span>
                  <p className="text-xs text-masaar-black/60">Dedicated representative greeting guests at arrivals with baggage assistance.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-black/10 bg-[#FAF9F6] cursor-pointer hover:bg-black/[0.02]">
                <input
                  type="checkbox"
                  checked={includeAssistance}
                  onChange={(e) => setIncludeAssistance(e.target.checked)}
                  className="mt-1 size-4 rounded border-black/20 text-admin-primary"
                />
                <div className="flex-1">
                  <span className="font-semibold text-sm text-masaar-black">24/7 Dedicated On-Ground Travel Assistance</span>
                  <p className="text-xs text-masaar-black/60">24/7 bilingual concierge desk throughout your stay in the Holy Cities.</p>
                </div>
              </label>

              <div className="pt-2">
                <Field label="Custom Add-ons / Additional Notes (Optional)">
                  <textarea
                    name="custom_addons"
                    rows={2}
                    className={inputClass}
                    placeholder="e.g. Complimentary 5L Zamzam water provided on departure, wheelchair assistance arranged"
                  />
                </Field>
              </div>
            </div>
          </Card>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-3">
            <SecondaryButton type="button" onClick={() => window.history.back()}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isPending}>
              {isPending ? "Creating Booking Confirmation…" : "Create Booking Confirmation & Vouchers →"}
            </PrimaryButton>
          </div>
        </form>
      )}
    </div>
  );
}
