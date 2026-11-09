"use client";

import React, { useState, useMemo } from "react";
import type { LineItemPricingInput } from "@/lib/documents/calculations";
import type { SelectableAdditionalService } from "@/lib/data/document-products";

interface AdditionalServicesSectionProps {
  lineItems: LineItemPricingInput[];
  availableServices: SelectableAdditionalService[];
  onUpdateLineItems: (items: LineItemPricingInput[]) => void;
  onPersist: (items: LineItemPricingInput[]) => void;
}

export function AdditionalServicesSection({
  lineItems,
  availableServices,
  onUpdateLineItems,
  onPersist,
}: AdditionalServicesSectionProps) {
  // Identify items that are additional services
  // Exclude primary packages, hotels, flights, and ziyarat items (which have their own dedicated sections)
  const isAdditionalService = (it: LineItemPricingInput) => {
    if (it.item_type === "service") return true;
    if (it.item_type === "custom") {
      const desc = it.description.toLowerCase();
      // Exclude visa or flights
      if (desc.includes("visa") || desc.includes("flight") || desc.includes("airline")) return false;
      return true;
    }
    return false;
  };

  const currentServices = lineItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isAdditionalService(item));

  // Search & Catalog state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal / Editor state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form states for selected/editing service
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formQuantity, setFormQuantity] = useState(1);
  const [formUnitPrice, setFormUnitPrice] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState("AED");
  const [formServiceDate, setFormServiceDate] = useState("");
  const [formServiceNotes, setFormServiceNotes] = useState("");
  const [formIsIncluded, setFormIsIncluded] = useState(false);

  // Filter available services
  const filteredCatalog = useMemo(() => {
    return availableServices.filter((s) => {
      // Only quotation-enabled / published services
      if (s.status !== "published") return false;

      const matchesCategory =
        selectedCategory === "all" || s.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.short_description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [availableServices, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    availableServices.forEach((s) => {
      if (s.status === "published" && s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [availableServices]);

  // Open modal to add a fresh service from catalogue
  const handleSelectFromCatalog = (service: SelectableAdditionalService) => {
    setEditingIndex(null);
    setFormName(service.name);
    setFormDescription(service.short_description || "");
    setFormQuantity(1);
    setFormUnitPrice(service.price_aed || 0);
    setFormCurrency(service.currency || "AED");
    setFormServiceDate("");
    setFormServiceNotes("");
    setFormIsIncluded(service.price_aed === 0 || service.price_type === "on_request");
    setIsModalOpen(true);
  };

  // Open modal to edit existing line item
  const handleEditExisting = (item: LineItemPricingInput, originalIndex: number) => {
    setEditingIndex(originalIndex);
    setFormName(item.description);

    const details = item.details || "";

    // Parse service date tag: [service_date: YYYY-MM-DD]
    const dateMatch = details.match(/\[service_date:\s*([^\]]+)\]/i);
    setFormServiceDate(dateMatch ? dateMatch[1].trim() : "");

    // Parse service notes tag: [service_notes: ...]
    const notesMatch = details.match(/\[service_notes:\s*([^\]]+)\]/i);
    setFormServiceNotes(notesMatch ? notesMatch[1].trim() : "");

    // Clean description/details of metadata tags
    const cleanDetails = details
      .replace(/\[service_date:[^\]]+\]/gi, "")
      .replace(/\[service_notes:[^\]]+\]/gi, "")
      .replace(/•?\s*\[price_[^\]]+\]/g, "")
      .replace(/\s*•\s*•\s*/g, " • ")
      .replace(/^•\s*|\s*•$/g, "")
      .trim();

    setFormDescription(cleanDetails);
    setFormQuantity(item.quantity || 1);
    setFormUnitPrice(Number(item.unit_price_aed) || 0);
    setFormCurrency("AED");
    setFormIsIncluded(Boolean(item.is_included || Number(item.unit_price_aed) === 0));
    setIsModalOpen(true);
  };

  // Save form
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    // Construct clean details string with embedded metadata tags
    const detailsParts: string[] = [];
    if (formDescription.trim()) detailsParts.push(formDescription.trim());
    if (formServiceDate.trim()) detailsParts.push(`[service_date: ${formServiceDate.trim()}]`);
    if (formServiceNotes.trim()) detailsParts.push(`[service_notes: ${formServiceNotes.trim()}]`);

    const updatedItem: LineItemPricingInput = {
      item_type: "service",
      description: formName.trim(),
      details: detailsParts.join(" • "),
      quantity: Math.max(1, formQuantity),
      unit: "service",
      unit_price_aed: formIsIncluded ? 0 : Math.max(0, formUnitPrice),
      catalog_unit_price_aed: formUnitPrice,
      is_overridden: true,
      discount_aed: 0,
      is_price_on_request: false,
      is_included: formIsIncluded,
      display_order: editingIndex !== null ? lineItems[editingIndex]?.display_order ?? lineItems.length : lineItems.length,
    };

    let nextItems = [...lineItems];
    if (editingIndex !== null) {
      nextItems[editingIndex] = updatedItem;
    } else {
      nextItems.push(updatedItem);
    }

    onUpdateLineItems(nextItems);
    onPersist(nextItems);
    setIsModalOpen(false);
  };

  // Delete service item
  const handleDeleteService = (indexToRemove: number) => {
    const nextItems = lineItems.filter((_, idx) => idx !== indexToRemove);
    onUpdateLineItems(nextItems);
    onPersist(nextItems);
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/10 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-pure-gold/15 text-lg border border-pure-gold/30">
            ✨
          </span>
          <div>
            <h3 className="font-serif text-base font-bold text-masaar-black flex items-center gap-2">
              Additional Services Catalogue
            </h3>
            <p className="text-xs text-masaar-black/60">
              Attach optional or included pilgrimage services (Umrah Guide, Wheelchair Assistance, Private Tours, etc.) with custom rates.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingIndex(null);
            setFormName("");
            setFormDescription("");
            setFormQuantity(1);
            setFormUnitPrice(0);
            setFormCurrency("AED");
            setFormServiceDate("");
            setFormServiceNotes("");
            setFormIsIncluded(false);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/15 bg-warm-ivory/60 px-3.5 py-2 text-xs font-bold text-masaar-black hover:bg-warm-ivory shadow-2xs transition-all cursor-pointer"
        >
          <span>+</span>
          <span>Add Custom Service</span>
        </button>
      </div>

      {/* Catalogue Search & Quick Picker */}
      <div className="rounded-xl border border-black/10 bg-warm-ivory/20 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-xs text-black/40">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services (e.g. Umrah Guide, Wheelchair, Tours, Transport)..."
              className="w-full rounded-lg border border-black/15 bg-white pl-8 pr-3 py-2 text-xs text-black placeholder:text-black/40 focus:border-pure-gold focus:outline-hidden"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`rounded-lg px-2.5 py-1.5 font-semibold text-xs whitespace-nowrap transition-colors ${
                selectedCategory === "all"
                  ? "bg-masaar-black text-white"
                  : "bg-white border border-black/10 text-masaar-black hover:bg-black/5"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-2.5 py-1.5 font-semibold text-xs whitespace-nowrap transition-colors ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-masaar-black text-white"
                    : "bg-white border border-black/10 text-masaar-black hover:bg-black/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Service Cards Carousel/Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
          {filteredCatalog.slice(0, 8).map((srv) => (
            <div
              key={srv.id}
              onClick={() => handleSelectFromCatalog(srv)}
              className="group flex flex-col justify-between rounded-xl border border-black/10 bg-white p-3 hover:border-pure-gold hover:shadow-xs transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-1.5">
                  <span className="font-semibold text-xs text-masaar-black group-hover:text-deep-gold transition-colors">
                    {srv.name}
                  </span>
                  <span className="text-[10px] font-bold text-deep-gold shrink-0">
                    {srv.price_aed ? `AED ${srv.price_aed}` : "On Request"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-tight text-masaar-black/60 line-clamp-2">
                  {srv.short_description}
                </p>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-black/5 pt-1.5 text-[10px]">
                <span className="text-masaar-black/50">{srv.category}</span>
                <span className="font-bold text-deep-gold group-hover:underline">+ Add to Quote</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Currently Attached Additional Services */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/70 mb-2.5 flex items-center gap-1.5">
          <span>Attached Services in this Quotation</span>
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-masaar-black/70">
            {currentServices.length}
          </span>
        </h4>

        {currentServices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 bg-neutral-50/50 p-6 text-center text-xs text-masaar-black/60">
            No additional services selected yet. Choose from the catalogue above or click &ldquo;+ Add Custom Service&rdquo;.
          </div>
        ) : (
          <div className="divide-y divide-black/5 rounded-xl border border-black/10 bg-white overflow-hidden shadow-2xs">
            {currentServices.map(({ item, index }) => {
              const details = item.details || "";
              const dateMatch = details.match(/\[service_date:\s*([^\]]+)\]/i);
              const notesMatch = details.match(/\[service_notes:\s*([^\]]+)\]/i);
              const cleanDetails = details
                .replace(/\[service_date:[^\]]+\]/gi, "")
                .replace(/\[service_notes:[^\]]+\]/gi, "")
                .replace(/•?\s*\[price_[^\]]+\]/g, "")
                .trim();

              const isInc = Boolean(item.is_included || Number(item.unit_price_aed) === 0);

              return (
                <div
                  key={item.id || index}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-masaar-black">{item.description}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isInc
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-pure-gold/20 text-[#865d1d] border border-pure-gold/40"
                        }`}
                      >
                        {isInc ? "✓ Included in Package" : "Optional Add-on"}
                      </span>
                    </div>

                    {cleanDetails && (
                      <p className="text-[11px] text-masaar-black/70 leading-relaxed">
                        {cleanDetails}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-masaar-black/50">
                      {dateMatch && (
                        <span>📅 Date: <strong className="text-black">{dateMatch[1]}</strong></span>
                      )}
                      {notesMatch && (
                        <span>📝 Notes: <strong className="text-black">{notesMatch[1]}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-black/5">
                    <div className="text-right">
                      <span className="block text-xs font-bold text-masaar-black">
                        {isInc ? (
                          <span className="text-emerald-700">Included (AED 0)</span>
                        ) : (
                          `AED ${(Number(item.unit_price_aed || 0) * (item.quantity || 1)).toLocaleString()}`
                        )}
                      </span>
                      <span className="block text-[10px] text-masaar-black/50">
                        Qty: {item.quantity || 1} {item.unit_price_aed && !isInc ? `× AED ${item.unit_price_aed}` : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditExisting(item, index)}
                        className="rounded-lg border border-black/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-masaar-black hover:bg-black/5 transition-all cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(index)}
                        className="rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Service Edit / Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-black/10 my-8">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="font-serif text-base font-bold text-black">
                {editingIndex !== null ? "Edit Quotation Service" : "Add Service to Quotation"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-black/50 hover:bg-black/5 hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="mt-4 space-y-3.5 text-xs">
              {/* Service Name */}
              <div>
                <label className="block font-semibold text-black mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Umrah Guide / Wheelchair Assistance"
                  className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold focus:outline-hidden"
                />
              </div>

              {/* Service Description */}
              <div>
                <label className="block font-semibold text-black mb-1">
                  Description / Service Scope
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Details of guidance, assistance, or tour inclusions..."
                  className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold focus:outline-hidden"
                />
              </div>

              {/* Quantity & Unit Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-black mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-black mb-1">
                    Unit Price ({formCurrency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    disabled={formIsIncluded}
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-xl border border-black/15 p-2.5 text-xs font-mono font-bold text-black bg-white focus:border-pure-gold disabled:bg-neutral-100 disabled:text-black/40"
                  />
                </div>
              </div>

              {/* Pricing Status (Included vs Optional) */}
              <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-3">
                <label className="block font-semibold text-black mb-1.5">
                  Quotation Pricing Arrangement
                </label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-masaar-black">
                    <input
                      type="radio"
                      name="pricing_status"
                      checked={formIsIncluded}
                      onChange={() => setFormIsIncluded(true)}
                      className="text-deep-gold focus:ring-deep-gold"
                    />
                    <span>Included in Base Package (No extra charge)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-masaar-black">
                    <input
                      type="radio"
                      name="pricing_status"
                      checked={!formIsIncluded}
                      onChange={() => setFormIsIncluded(false)}
                      className="text-deep-gold focus:ring-deep-gold"
                    />
                    <span>Optional Add-on (Billable price)</span>
                  </label>
                </div>
              </div>

              {/* Service Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-black mb-1">
                    Service Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formServiceDate}
                    onChange={(e) => setFormServiceDate(e.target.value)}
                    className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-black mb-1">
                    Service Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formServiceNotes}
                    onChange={(e) => setFormServiceNotes(e.target.value)}
                    placeholder="e.g. Makkah hotel lobby meet"
                    className="w-full rounded-xl border border-black/15 p-2.5 text-xs text-black bg-white focus:border-pure-gold"
                  />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-black/10 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-pure-gold text-masaar-black font-bold px-5 py-2 text-xs shadow-md hover:bg-light-gold cursor-pointer"
                >
                  {editingIndex !== null ? "Save Changes" : "Attach to Quotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

