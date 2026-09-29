"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Card,
  Field,
  inputClass,
  Badge,
} from "@/components/admin/ui";
import {
  addLineItem,
  deleteDocument,
  deleteLineItem,
  duplicateDocument,
  saveDocumentVersion,
  updateDocumentBasics,
  updateDocumentStatus,
  createDocumentFromSource,
} from "../../actions";
import type {
  DocumentItemRow,
  DocumentRow,
  DocumentShareRow,
  DocumentTemplateRow,
  DocumentVersionRow,
  DocumentItemType,
} from "@/lib/types/database";
import { CustomPackageBuilderModal } from "./CustomPackageBuilderModal";
import { ShareQuotationModal } from "@/components/documents/ShareQuotationModal";
import { getHotelImage, getTransportImage } from "@/lib/documents/images";

const STATUS_OPTS = [
  { id: "draft", label: "Draft", tone: "blue" },
  { id: "sent", label: "Awaiting Client", tone: "gold" },
  { id: "viewed", label: "Viewed by Client", tone: "gold" },
  { id: "revision_requested", label: "Revision Requested", tone: "amber" },
  { id: "accepted", label: "Accepted", tone: "green" },
  { id: "rejected", label: "Declined", tone: "gray" },
  { id: "expired", label: "Expired", tone: "gray" },
] as const;

export function QuotationBuilder({
  document,
  items,
  template,
  versions,
  shares,
  activeShareToken,
  products,
}: {
  document: DocumentRow;
  items: DocumentItemRow[];
  template: DocumentTemplateRow | null;
  versions: DocumentVersionRow[];
  shares: DocumentShareRow[];
  activeShareToken?: string;
  products: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  // Editable basics
  const [docNumber, setDocNumber] = useState(document.document_number);
  const [clientName, setClientName] = useState(document.client_name);
  const [clientPhone, setClientPhone] = useState(document.client_phone ?? "");
  const [clientEmail, setClientEmail] = useState(document.client_email ?? "");
  const [clientCountry, setClientCountry] = useState(document.client_country ?? "Dubai, UAE");
  const [journeyType, setJourneyType] = useState(document.journey_type ?? "umrah");
  const [travelDate, setTravelDate] = useState(document.travel_date ?? "");
  const [returnDate, setReturnDate] = useState(document.return_date ?? "");
  const [adults, setAdults] = useState<number>(document.adults ?? 2);
  const [children, setChildren] = useState<number>(document.children ?? 0);
  const [infants, setInfants] = useState<number>(document.infants ?? 0);
  const [origin, setOrigin] = useState(document.origin ?? "Dubai (DXB)");
  const [destination, setDestination] = useState(document.destination ?? "Jeddah (JED)");
  const [validUntil, setValidUntil] = useState(document.valid_until ?? "");
  const [status, setStatus] = useState(document.status ?? "draft");
  const [notes, setNotes] = useState(document.notes ?? "");
  const [terms, setTerms] = useState(document.terms ?? "");

  // Parsed Package Scope, Duration, Room Type, and Customer Requirements
  const parsedScope = (() => {
    if (document.notes?.includes("Makkah only") || document.notes?.includes("Makkah Only")) return "makkah_only";
    if (document.notes?.includes("Madinah only") || document.notes?.includes("Madinah Only")) return "madinah_only";
    return "both";
  })();

  const parsedDuration = (() => {
    const match = document.notes?.match(/Duration:\s*([^\n\r]+)/i);
    if (match) return match[1].trim();
    const pkg = items.find((i) => ["umrah_package", "hajj_package"].includes(i.item_type));
    const pkgMatch = pkg?.description.match(/\(([^)]+)\)/);
    if (pkgMatch) return pkgMatch[1].trim();
    return "10D9N";
  })();

  const parsedRoomType = (() => {
    const match = document.notes?.match(/Room Type:\s*([^\n\r]+)/i);
    if (match) return match[1].trim();
    if (document.notes?.includes("QUAD")) return "QUAD";
    if (document.notes?.includes("TRIPLE")) return "TRIPLE";
    return "TWIN/DOUBLE";
  })();

  const parsedReq = (() => {
    const match = document.notes?.match(/Customer Requirement:\s*([^\n\r]+)/i);
    if (match) return match[1].trim();
    return document.special_requirements && !document.special_requirements.startsWith("[") ? document.special_requirements : "";
  })();

  const [duration, setDuration] = useState(parsedDuration);
  const [packageScope, setPackageScope] = useState<"both" | "makkah_only" | "madinah_only">(parsedScope);
  const [roomType, setRoomType] = useState(parsedRoomType);
  const [customerRequirement, setCustomerRequirement] = useState(parsedReq);

  // Available CMS inventories
  const availableHotels: Array<{ id: string; name: string; city: string; star_rating?: number | null; price_from_aed?: number | null }> =
    products?.hotels ?? [];
  const availableTransfers: Array<{ id: string; route_name: string; vehicle_type?: string | null; price_from_aed?: number | null }> =
    products?.transfers ?? [];

  // Dedicated Section Modals State
  // 1. Accommodation Modal
  const [isEditingHotelModalOpen, setIsEditingHotelModalOpen] = useState(false);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [hotelCity, setHotelCity] = useState<"Makkah" | "Madinah" | null>("Makkah");
  const [hotelName, setHotelName] = useState("");
  const [hotelRoomType, setHotelRoomType] = useState("TWIN/DOUBLE");
  const [hotelNights, setHotelNights] = useState(5);
  const [hotelPricePerNight, setHotelPricePerNight] = useState(840);
  const [hotelDetails, setHotelDetails] = useState("");

  // 2. Transfer Modal
  const [isEditingTransferModalOpen, setIsEditingTransferModalOpen] = useState(false);
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null);
  const [transferVehicleType, setTransferVehicleType] = useState<"sedan" | "suv" | "staria" | "custom">("sedan");
  const [transferRouteName, setTransferRouteName] = useState("");
  const [transferDetails, setTransferDetails] = useState("");
  const [transferQty, setTransferQty] = useState(1);
  const [transferPrice, setTransferPrice] = useState(950);
  const [itemsList, setItemsList] = useState<DocumentItemRow[]>(items);
  const [applyVat, setApplyVat] = useState<boolean>(
    Number(document.tax_aed) > 0 || document.tax_aed === null || document.tax_aed === undefined
  );
  const [manualSubtotal, setManualSubtotal] = useState<number>(Number(document.subtotal_aed || 8800));
  const [manualTax, setManualTax] = useState<number>(Number(document.tax_aed || 440));
  const [manualTotal, setManualTotal] = useState<number>(Number(document.total_aed || 9240));
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isPackageDismissed, setIsPackageDismissed] = useState(false);

  // Sync props if items change from server
  useEffect(() => {
    setItemsList(items);
    setManualSubtotal(Number(document.subtotal_aed || 8800));
    setManualTax(Number(document.tax_aed || 440));
    setManualTotal(Number(document.total_aed || 9240));
    if (document.tax_aed !== null && document.tax_aed !== undefined) {
      setApplyVat(Number(document.tax_aed) > 0);
    }
  }, [items, document.subtotal_aed, document.tax_aed, document.total_aed]);

  // 3. Flight Modal
  const [isEditingFlightModalOpen, setIsEditingFlightModalOpen] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const [flightAirline, setFlightAirline] = useState("");
  const [flightDetails, setFlightDetails] = useState("");
  const [flightQty, setFlightQty] = useState(adults);
  const [flightPrice, setFlightPrice] = useState(4500);

  // 4. Meals Modal
  const [isEditingMealsModalOpen, setIsEditingMealsModalOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealTitle, setMealTitle] = useState("");
  const [mealDetails, setMealDetails] = useState("");
  const [mealQty, setMealQty] = useState(adults);
  const [mealPrice, setMealPrice] = useState(450);

  // 5. Add-on Modal
  const [isEditingAddonModalOpen, setIsEditingAddonModalOpen] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [addonTitle, setAddonTitle] = useState("");
  const [addonDetails, setAddonDetails] = useState("");
  const [addonQty, setAddonQty] = useState(1);
  const [addonPrice, setAddonPrice] = useState(550);

  // Add Item / Custom Section Modal
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemType, setNewItemType] = useState<DocumentItemType>("custom");
  const [newDesc, setNewDesc] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);

  // Client Details Modal
  const [isEditingClient, setIsEditingClient] = useState(false);

  // Share Quotation Modal
  const [showShareModal, setShowShareModal] = useState(false);

  // Share Token & Public URL
  const shareToken = activeShareToken || shares[0]?.share_token || document.id;
  const publicShareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/quote/${shareToken}`
    : `https://masaarholidays.com/quote/${shareToken}`;

  // Itinerary state
  const defaultItineraryList = [
    { day: 1, title: "Day 1: Departure & Arrival in Holy Makkah", desc: "Jeddah Airport arrival, private GMC transfer to Makkah hotel, check-in, guided Umrah at Masjid Al Haram." },
    { day: 2, title: "Days 2–5: Makkah Mukarramah & Sacred Sites Ziyarat", desc: "Daily prayers at Haram. Guided private Ziyarat to Cave Hira, Mount Thawr, Mina and Arafat with experienced guide." },
    { day: 3, title: "Day 6: High Speed Train to Madinah Munawwarah", desc: "Haramain High-Speed Train business-class transit, hotel check-in, initial Salam at the Prophet’s Mosque." },
    { day: 4, title: "Days 7–9: Madinah Munawwarah & Rawdah Visit", desc: "Guaranteed permit assistance for Rawdah Sharif. Ziyarat to Masjid Quba, Mount Uhud and Seven Mosques." },
    { day: 5, title: "Day 10: Farewell & Return Flight", desc: "Farewell prayer at Prophet’s Mosque, private transfer to Madinah Airport (MED) and return flight." },
  ];

  const initialItinerary = (() => {
    if (document.special_requirements) {
      try {
        const parsed = JSON.parse(document.special_requirements);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return defaultItineraryList;
  })();

  const [itineraryDays, setItineraryDays] = useState(initialItinerary);
  const [isEditingItinerary, setIsEditingItinerary] = useState(false);
  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayDesc, setNewDayDesc] = useState("");

  function handleSaveItinerary(newDays: typeof itineraryDays) {
    setItineraryDays(newDays);
    setIsEditingItinerary(false);
    run(async () => {
      await fetch(`/api/admin/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          special_requirements: JSON.stringify(newDays),
        }),
      });
      router.refresh();
    });
  }

  function handleAddItineraryDay() {
    if (!newDayTitle.trim()) return;
    const nextDayNum = itineraryDays.length + 1;
    const updated = [
      ...itineraryDays,
      { day: nextDayNum, title: newDayTitle.trim(), desc: newDayDesc.trim() || "Activities as per confirmed schedule." }
    ];
    setNewDayTitle("");
    setNewDayDesc("");
    handleSaveItinerary(updated);
  }

  function handleRemoveItineraryDay(idx: number) {
    const updated = itineraryDays.filter((_, i) => i !== idx).map((d: any, i: number) => ({ ...d, day: i + 1 }));
    handleSaveItinerary(updated);
  }

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
      } catch (err: any) {
        if (err && typeof err === "object" && "digest" in err && typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        alert(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleSaveBasics() {
    run(async () => {
      const notesParts = [
        customerRequirement ? `Customer Requirement: ${customerRequirement}` : "",
        `Package Scope: ${packageScope === "makkah_only" ? "Makkah only" : packageScope === "madinah_only" ? "Madinah only" : "Makkah & Madinah"}`,
        `Duration: ${duration}`,
        `Room Type: ${roomType}`,
        notes ? `Notes: ${notes}` : "",
      ].filter(Boolean);

      const res = await fetch(`/api/admin/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_number: docNumber.trim(),
          client_name: clientName.trim(),
          client_phone: clientPhone || null,
          client_email: clientEmail || null,
          client_country: clientCountry || null,
          journey_type: journeyType as any,
          travel_date: travelDate || null,
          return_date: returnDate || null,
          adults,
          children,
          infants,
          origin,
          destination,
          valid_until: validUntil || null,
          status,
          notes: notesParts.join("\n") || null,
          terms: terms || null,
          // NOTE: special_requirements holds the itinerary JSON — do NOT overwrite it here.
          // Customer requirement text is already embedded in notes above.
        }),
      }).then((r) => r.json());

      if (!res.success) {
        alert(res.error || "Failed to update quotation basics.");
        return;
      }

      setIsEditingClient(false);
      setSavedMessage("Saved successfully.");
      router.refresh();
      setTimeout(() => setSavedMessage(null), 3500);
    });
  }

  async function handleSaveManualPricing(subtotal: number, tax: number, total: number) {
    setIsSavingPricing(true);
    try {
      const res = await fetch(`/api/admin/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal_aed: subtotal,
          tax_aed: tax,
          total_aed: total,
        }),
      }).then((r) => r.json());

      if (!res.success) {
        alert(res.error || "Failed to update pricing.");
        return;
      }
      setIsEditingPricing(false);
      setSavedMessage("Quotation pricing updated successfully.");
      router.refresh();
      setTimeout(() => setSavedMessage(null), 3500);
    } catch (e: any) {
      alert(e?.message || "Failed to save pricing.");
    } finally {
      setIsSavingPricing(false);
    }
  }

  function handleStatusChange(nextStatus: string) {
    setStatus(nextStatus);
    run(async () => {
      await fetch(`/api/admin/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
    });
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newDesc.trim()) return;

    try {
      const res = await fetch("/api/admin/documents/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: document.id,
          documentType: "quotation",
          item: {
            item_type: newItemType,
            description: newDesc.trim(),
            details: newDetails.trim() || null,
            quantity: newQty,
            unit_price_aed: newPrice,
          },
        }),
      }).then((r) => r.json());

      if (!res.success) {
        alert(res.error || "Failed to add item.");
        return;
      }
      if (res.item) {
        setItemsList((prev) => [...prev, res.item]);
      }

      setIsAddingItem(false);
      setNewDesc("");
      setNewDetails("");
      setNewQty(1);
      setNewPrice(0);
      router.refresh();
    } catch (e: any) {
      alert(e?.message || "Failed to add item.");
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Remove this section/item from the quotation?")) return;
    setItemsList((prev) => prev.filter((i) => i.id !== itemId));
    try {
      const res = await fetch(
        `/api/admin/documents/items?itemId=${encodeURIComponent(itemId)}&documentId=${encodeURIComponent(document.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to remove item.");
      }
      router.refresh();
    } catch (e: any) {
      alert(e?.message || "Failed to delete item.");
    }
  }

  // Generic Line Item Saver (handles create or update)
  async function saveLineItemPayload(itemId: string | null, payload: any) {
    try {
      if (itemId) {
        const res = await fetch("/api/admin/documents/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: document.id,
            itemId,
            patch: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.item) {
          setItemsList((prev) => prev.map((it) => (it.id === itemId ? data.item : it)));
        }
      } else {
        const res = await fetch("/api/admin/documents/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: document.id,
            documentType: "quotation",
            item: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.item) {
          setItemsList((prev) => [...prev, data.item]);
        }
      }
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Failed to save item.");
    }
  }

  // 1. Hotel modal open & submit
  function openHotelModal(item?: DocumentItemRow | null) {
    if (item) {
      setEditingHotelId(item.id);
      setHotelName(item.description);
      setHotelDetails(item.details || "");
      setHotelNights(item.quantity || 5);
      setHotelPricePerNight(item.unit_price_aed || 0);
      const isMakkah = item.description.toLowerCase().includes("makkah") || item.details?.toLowerCase().includes("makkah");
      const isMadinah = item.description.toLowerCase().includes("madinah") || item.details?.toLowerCase().includes("madinah");
      setHotelCity(isMakkah ? "Makkah" : isMadinah ? "Madinah" : null);
      if (item.details?.includes("QUAD")) setHotelRoomType("QUAD");
      else if (item.details?.includes("TRIPLE")) setHotelRoomType("TRIPLE");
      else setHotelRoomType("TWIN/DOUBLE");
    } else {
      setEditingHotelId(null);
      setHotelCity("Makkah");
      setHotelName("Swissôtel Makkah");
      setHotelDetails("5 Nights • Near Haram Courtyard • 5★ Luxury Buffet Breakfast Included");
      setHotelRoomType("TWIN/DOUBLE");
      setHotelNights(5);
      setHotelPricePerNight(840);
    }
    setIsEditingHotelModalOpen(true);
  }

  async function handleSaveHotelSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hotelName.trim()) return;

    const cityTag = hotelCity ? `${hotelCity}` : "";
    const cleanHotel = hotelName.trim();
    const fullDesc = cleanHotel.toLowerCase().includes("hotel") || cleanHotel.toLowerCase().includes("makkah") || cleanHotel.toLowerCase().includes("madinah")
      ? cleanHotel
      : `${cityTag ? `${cityTag} Hotel — ` : ""}${cleanHotel}`;
    const fullDetails = `${hotelNights} Nights • ${hotelRoomType} Room Sharing${hotelDetails ? ` • ${hotelDetails.trim()}` : ""}`;

    await saveLineItemPayload(editingHotelId, {
      item_type: "hotel",
      description: fullDesc,
      details: fullDetails,
      quantity: hotelNights,
      unit_price_aed: hotelPricePerNight,
    });
    setIsEditingHotelModalOpen(false);
  }

  // 2. Transfer modal open & submit
  function openTransferModal(item?: DocumentItemRow | null) {
    if (item) {
      setEditingTransferId(item.id);
      setTransferRouteName(item.description);
      setTransferDetails(item.details || "");
      setTransferQty(item.quantity || 1);
      setTransferPrice(item.unit_price_aed || 0);
      const text = `${item.description} ${item.details || ""}`.toLowerCase();
      if (text.includes("sedan") || text.includes("camry") || text.includes("lexus")) {
        setTransferVehicleType("sedan");
      } else if (text.includes("gmc") || text.includes("yukon") || text.includes("suv") || text.includes("suburban")) {
        setTransferVehicleType("suv");
      } else if (text.includes("staria") || text.includes("van") || text.includes("hiace")) {
        setTransferVehicleType("staria");
      } else {
        setTransferVehicleType("custom");
      }
    } else {
      setEditingTransferId(null);
      setTransferVehicleType("sedan");
      setTransferRouteName("Private Sedan Airport Transfers (Roundtrip)");
      setTransferDetails("Jeddah Airport (JED) ⇄ Makkah Hotel roundtrip with dedicated chauffeur & luggage assistance");
      setTransferQty(1);
      setTransferPrice(1000);
    }
    setIsEditingTransferModalOpen(true);
  }

  async function handleSaveTransferSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transferRouteName.trim()) return;

    await saveLineItemPayload(editingTransferId, {
      item_type: "transfer",
      description: transferRouteName.trim(),
      details: transferDetails.trim() || null,
      quantity: transferQty,
      unit_price_aed: transferPrice,
    });
    setIsEditingTransferModalOpen(false);
  }

  // 3. Flight modal open & submit
  function openFlightModal(item?: DocumentItemRow | null) {
    if (item) {
      setEditingFlightId(item.id);
      setFlightAirline(item.description);
      setFlightDetails(item.details || "");
      setFlightQty(item.quantity || adults);
      setFlightPrice(item.unit_price_aed || 0);
    } else {
      setEditingFlightId(null);
      setFlightAirline("Emirates – Business Class");
      setFlightDetails("Dubai (DXB) ⇄ Jeddah (JED) • 25kg checked baggage included");
      setFlightQty(adults);
      setFlightPrice(4500);
    }
    setIsEditingFlightModalOpen(true);
  }

  async function handleSaveFlightSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!flightAirline.trim()) return;

    await saveLineItemPayload(editingFlightId, {
      item_type: "flight",
      description: flightAirline.trim(),
      details: flightDetails.trim() || null,
      quantity: flightQty,
      unit_price_aed: flightPrice,
    });
    setIsEditingFlightModalOpen(false);
  }

  // 4. Meals modal open & submit
  function openMealsModal(item?: DocumentItemRow | null) {
    if (item) {
      setEditingMealId(item.id);
      setMealTitle(item.description);
      setMealDetails(item.details || "");
      setMealQty(item.quantity || adults);
      setMealPrice(item.unit_price_aed || 0);
    } else {
      setEditingMealId(null);
      setMealTitle("Daily 3-Course Gourmet Meals");
      setMealDetails("Daily breakfast, lunch and dinner included in 5-star hotel dining rooms.");
      setMealQty(adults);
      setMealPrice(450);
    }
    setIsEditingMealsModalOpen(true);
  }

  async function handleSaveMealsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mealTitle.trim()) return;

    await saveLineItemPayload(editingMealId, {
      item_type: "custom",
      description: mealTitle.trim(),
      details: mealDetails.trim() || null,
      quantity: mealQty,
      unit_price_aed: mealPrice,
    });
    setIsEditingMealsModalOpen(false);
  }

  // 5. Addon modal open & submit
  function openAddonModal(item?: DocumentItemRow | null) {
    if (item) {
      setEditingAddonId(item.id);
      setAddonTitle(item.description);
      setAddonDetails(item.details || "");
      setAddonQty(item.quantity || 1);
      setAddonPrice(item.unit_price_aed || 0);
    } else {
      setEditingAddonId(null);
      setAddonTitle("Saudi Electronic Tourist / Umrah Visa");
      setAddonDetails("1-year multiple entry visa with medical insurance coverage across KSA.");
      setAddonQty(adults);
      setAddonPrice(550);
    }
    setIsEditingAddonModalOpen(true);
  }

  async function handleSaveAddonSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addonTitle.trim()) return;

    await saveLineItemPayload(editingAddonId, {
      item_type: "service",
      description: addonTitle.trim(),
      details: addonDetails.trim() || null,
      quantity: addonQty,
      unit_price_aed: addonPrice,
    });
    setIsEditingAddonModalOpen(false);
  }

  function handleConvertToInvoice() {
    if (!confirm("Convert this quotation into an official Invoice? All passenger details and priced items will be copied.")) return;
    run(async () => {
      const res = await createDocumentFromSource(document.id, "invoice");
      if (res.success && res.id) {
        router.push(`/admin/documents/invoices/${res.id}`);
      } else {
        alert(res.error || "Failed to convert to invoice.");
      }
    });
  }

  function handleConvertToVoucher() {
    if (!confirm("Generate a confirmed Booking Voucher from this quotation?")) return;
    run(async () => {
      const res = await createDocumentFromSource(document.id, "booking_voucher");
      if (res.success && res.id) {
        router.push(`/admin/documents/booking-vouchers/${res.id}`);
      } else {
        alert(res.error || "Failed to generate booking voucher.");
      }
    });
  }

  async function handleSavePackageFromModal(config: {
    tier: string;
    tierPrice: number;
    makkahHotel: string;
    makkahPrice: number;
    madinahHotel: string;
    madinahPrice: number;
    roomType: string;
    roomAdjustment: number;
    vehicle: string;
    vehiclePrice: number;
    flightClass: string;
    flightPrice: number;
    extraServices: Array<{ name: string; price: number }>;
    totalAmount: number;
  }) {
    run(async () => {
      // Remove any existing package items first so we don't pile up duplicates
      for (const p of packageItems) {
        await fetch(
          `/api/admin/documents/items?itemId=${encodeURIComponent(p.id)}&documentId=${encodeURIComponent(document.id)}`,
          { method: "DELETE" }
        );
      }

      if (config.tier !== "CUSTOM" && config.tierPrice > 0) {
        await addLineItem(document.id, "quotation", {
          item_type: journeyType === "hajj" ? "hajj_package" : "umrah_package",
          description: `${journeyType === "hajj" ? "Hajj 2027" : "Umrah 2026"} – ${config.tier} Package (${duration})`,
          details: `${config.tier} Tier • ${config.roomType} Room Sharing • Includes direct flights & 5★ luxury hospitality`,
          quantity: adults,
          unit_price_aed: config.tierPrice,
        });
      }

      if (config.makkahHotel) {
        await addLineItem(document.id, "quotation", {
          item_type: "hotel",
          description: `Makkah Hotel — ${config.makkahHotel}`,
          details: `5 Nights • Near Haram Courtyard • ${config.roomType} Sharing • 5★ Luxury Buffet Breakfast Included`,
          quantity: 5,
          unit_price_aed: Math.round(config.makkahPrice / 5),
        });
      }

      if (config.madinahHotel) {
        await addLineItem(document.id, "quotation", {
          item_type: "hotel",
          description: `Madinah Hotel — ${config.madinahHotel}`,
          details: `5 Nights • Steps from Prophet's Mosque • ${config.roomType} Sharing • 5★ Luxury Buffet Breakfast Included`,
          quantity: 5,
          unit_price_aed: Math.round(config.madinahPrice / 5),
        });
      }

      if (config.vehicle) {
        await addLineItem(document.id, "quotation", {
          item_type: "transfer",
          description: `Private ${config.vehicle}`,
          details: `Jeddah Airport → Makkah Hotel • Makkah → Madinah Hotel • Madinah → Airport`,
          quantity: 1,
          unit_price_aed: config.vehiclePrice,
        });
      }

      if (config.flightPrice > 0) {
        await addLineItem(document.id, "quotation", {
          item_type: "flight",
          description: `Emirates – Business Class Upgrade`,
          details: `Dubai (DXB) ⇄ Jeddah/Madinah scheduled luxury cabin`,
          quantity: adults,
          unit_price_aed: config.flightPrice,
        });
      }

      for (const s of config.extraServices) {
        await addLineItem(document.id, "quotation", {
          item_type: "service",
          description: s.name,
          details: "Pilgrim additional inclusion",
          quantity: 1,
          unit_price_aed: s.price,
        });
      }

      router.refresh();
    });
  }

  function handleDuplicate() {
    run(async () => {
      const res = await duplicateDocument(document.id, "quotation");
      if (res.success && res.id) {
        router.push(`/admin/documents/quotations/${res.id}`);
      } else {
        alert(res.error || "Failed to duplicate quotation.");
      }
    });
  }

  function handleDeleteDoc() {
    if (!confirm(`Delete quotation ${document.document_number}? This action cannot be undone.`)) return;
    run(async () => {
      const res = await deleteDocument(document.id, "quotation");
      if (res.success) {
        router.push("/admin/documents/quotations");
      } else {
        alert(res.error || "Failed to delete quotation.");
      }
    });
  }

  function handleCopyShareLink() {
    if (!publicShareUrl) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(publicShareUrl);
      } else if (typeof window !== "undefined") {
        const textarea = window.document.createElement("textarea");
        textarea.value = publicShareUrl;
        window.document.body.appendChild(textarea);
        textarea.select();
        window.document.execCommand("copy");
        window.document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  // Pre-configured Section Presets
  function openAddSectionWithPreset(presetType: DocumentItemType, defaultDesc: string, defaultDetails?: string, defaultPrice?: number) {
    setNewItemType(presetType);
    setNewDesc(defaultDesc);
    setNewDetails(defaultDetails || "");
    setNewQty(1);
    setNewPrice(defaultPrice || 0);
    setIsAddingItem(true);
  }

  // Group line items from dynamic itemsList
  const packageItems = itemsList.filter((i) => ["umrah_package", "hajj_package"].includes(i.item_type));
  const hotelItems = itemsList.filter((i) => i.item_type === "hotel" || (i.item_type as any) === "accommodation");
  const transferItems = itemsList.filter((i) => i.item_type === "transfer");
  const flightItems = itemsList.filter((i) => i.item_type === "flight");
  const mealItems = itemsList.filter((i) => (i.item_type as any) === "meals" || i.description.toLowerCase().includes("meal"));
  const otherItems = itemsList.filter(
    (i) =>
      !packageItems.includes(i) &&
      !hotelItems.includes(i) &&
      !transferItems.includes(i) &&
      !flightItems.includes(i) &&
      !mealItems.includes(i)
  );

  return (
    <div className="space-y-6">
      {/* Top Header Bar matching QUOTATION BUILDER.png */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="text-xs text-masaar-black/50">
            <Link href="/admin/documents" className="hover:text-masaar-black">
              Documents &amp; Bookings
            </Link>
            <span className="mx-2">&gt;</span>
            <Link href="/admin/documents/quotations" className="hover:text-masaar-black">
              Quotations
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="font-semibold text-masaar-black">{docNumber}</span>
          </nav>
          <h1 className="mt-1 font-serif text-2xl font-bold text-masaar-black sm:text-3xl">
            Quotation Builder
          </h1>
          <p className="mt-0.5 text-xs text-masaar-black/60">
            Add, edit and arrange sections to create a personalised quotation for your client.
          </p>
        </div>

        {/* Top Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {shareToken && (
            <>
              <Link
                href={`/quote/${shareToken}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/[0.03]"
              >
                <span>👁️</span> Preview
              </Link>

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#b37e28] bg-light-gold/20 px-3.5 py-2 text-xs font-bold text-[#b37e28] shadow-xs hover:bg-light-gold/40 cursor-pointer"
              >
                <span>🔗</span> Share Link
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSaveBasics}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/[0.03] disabled:opacity-60"
          >
            <span>💾</span> Save as Draft
          </button>

          <Link
            href={`/admin/documents/quotations/${document.id}/pdf`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#b37e28] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#96671e]"
          >
            <span>📄</span> Generate PDF ▾
          </Link>

          <div className="relative inline-block text-left">
            <select
              aria-label="More quotation options"
              value=""
              onChange={(e) => {
                const action = e.target.value;
                if (action === "invoice") handleConvertToInvoice();
                if (action === "voucher") handleConvertToVoucher();
                if (action === "duplicate") handleDuplicate();
                if (action === "send") router.push(`/admin/documents/quotations/${document.id}/send`);
                if (action === "versions") router.push(`/admin/documents/quotations/${document.id}/versions`);
                if (action === "delete") handleDeleteDoc();
              }}
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/[0.03]"
            >
              <option value="" disabled>⚙️ Options…</option>
              <option value="send">✉️ Send to Client (Email / WhatsApp)</option>
              <option value="versions">📜 Version History ({versions.length || 1})</option>
              <option value="invoice">💳 Convert to Invoice</option>
              <option value="voucher">🎫 Generate Booking Voucher</option>
              <option value="duplicate">📑 Duplicate Quotation</option>
              <option value="delete">🗑️ Delete Quotation</option>
            </select>
          </div>
        </div>
      </div>

      {savedMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">
          ✓ {savedMessage}
        </div>
      )}

      {/* Main 3-Column Grid matching QUOTATION BUILDER.png */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left Column: Sections Stack (6 Cols) */}
        <div className="space-y-4 xl:col-span-6">
          {/* Quotation Details Header Strip Card */}
          <Card className="!p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-xs">
              <div>
                <span className="uppercase text-masaar-black/40 font-medium">Quotation No</span>
                <input
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="mt-1 block w-full rounded border border-black/15 bg-white px-2 py-1 font-semibold text-masaar-black"
                />
              </div>

              <div>
                <span className="uppercase text-masaar-black/40 font-medium">Version</span>
                <div className="mt-1 flex items-center gap-1 font-semibold text-masaar-black">
                  <span>v{versions[0]?.version_number ?? 1}</span>
                  <Link
                    href={`/admin/documents/quotations/${document.id}/versions`}
                    className="ml-1 text-[10px] text-admin-primary underline"
                  >
                    History
                  </Link>
                </div>
              </div>

              <div>
                <span className="uppercase text-masaar-black/40 font-medium">Date</span>
                <span className="mt-1 block font-medium text-masaar-black">
                  {new Date(document.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>

              <div>
                <span className="uppercase text-masaar-black/40 font-medium">Valid Until</span>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="mt-1 block w-full rounded border border-black/15 bg-white px-2 py-1 text-xs text-masaar-black"
                />
              </div>

              <div>
                <span className="uppercase text-masaar-black/40 font-medium">Status</span>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="mt-1 block w-full rounded border border-black/15 bg-white px-2 py-1 font-medium text-masaar-black"
                >
                  {STATUS_OPTS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* 1. Client Details Section */}
          <Card className="!p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-black/30 font-bold">⋮⋮</span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  👤
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                      Client Details
                    </span>
                  </div>
                  <h3 className="font-semibold text-masaar-black text-sm">{clientName}</h3>
                  <p className="text-xs text-masaar-black/60">
                    {clientCountry} {clientPhone ? `| ${clientPhone}` : ""} {clientEmail ? `| ${clientEmail}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-masaar-black/60">
                  {adults} Adults{children ? `, ${children} Children` : ""} • <span className="font-semibold text-admin-primary">{duration}</span> • <span className="font-semibold text-admin-primary">{packageScope === "makkah_only" ? "Makkah only" : packageScope === "madinah_only" ? "Madinah only" : "Makkah & Madinah"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingClient(!isEditingClient)}
                  className="rounded-md border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                >
                  {isEditingClient ? "Done" : "Edit"}
                </button>
              </div>
            </div>

            {isEditingClient && (
              <div className="mt-4 border-t border-black/10 pt-4 grid gap-3 sm:grid-cols-2 text-xs">
                <Field label="Client Name">
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Country / City">
                  <input
                    value={clientCountry}
                    onChange={(e) => setClientCountry(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Email">
                  <input
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Duration (e.g. 3D2N, 7D6N, 10D9N)">
                  <input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 3D2N"
                    className={inputClass}
                  />
                </Field>
                <Field label="Package Scope">
                  <select
                    value={packageScope}
                    onChange={(e) => setPackageScope(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="both">Makkah &amp; Madinah</option>
                    <option value="makkah_only">Makkah only</option>
                    <option value="madinah_only">Madinah only</option>
                  </select>
                </Field>
                <Field label="Room Type">
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className={inputClass}
                  >
                    <option value="TWIN/DOUBLE">TWIN/DOUBLE</option>
                    <option value="TRIPLE">TRIPLE</option>
                    <option value="QUAD">QUAD</option>
                  </select>
                </Field>
                <Field label="Customer Requirements / Special Requests">
                  <input
                    value={customerRequirement}
                    onChange={(e) => setCustomerRequirement(e.target.value)}
                    placeholder="e.g. Elderly wheelchair support, high floor Haram view..."
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </Card>

          {/* 2. Package Details Section */}
          {!isPackageDismissed && (
            <Card className="!p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-black/30 font-bold mt-2">⋮⋮</span>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                    📦
                  </div>
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-black/10">
                    <Image
                      src="/Assets/BANNER IMAGE.png"
                      alt="Package"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                      Package
                    </span>
                    <h3 className="font-semibold text-masaar-black text-sm">
                      {packageItems[0]?.description || `${document.journey_type === "hajj" ? "Hajj 2027" : "Custom Umrah"} — Signature Tier`}
                    </h3>
                    <p className="text-xs text-masaar-black/60">
                      {packageItems[0]?.details || `${duration} | ${packageScope === "makkah_only" ? "Makkah only" : packageScope === "madinah_only" ? "Madinah only" : "Makkah & Madinah"} Luxury Experience with complete inclusions.`}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <p className="font-bold text-masaar-black text-sm">
                    {packageItems[0] ? `AED ${Number(packageItems[0].amount_aed).toLocaleString()}` : "Included"}
                  </p>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPackageModalOpen(true)}
                      className="rounded-md border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (packageItems[0]) {
                          handleDeleteItem(packageItems[0].id);
                        } else {
                          setIsPackageDismissed(true);
                        }
                      }}
                      className="rounded-md border border-red-200 bg-red-50/80 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                      title="Remove package"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 3. Itinerary Section */}
          <Card className="!p-4">
            <div className="flex items-start justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-black/30 font-bold">⋮⋮</span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  📋
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Itinerary
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    Complete Day-by-Day Journey Schedule
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded bg-light-gold/20 px-2 py-0.5 text-[10px] font-bold text-deep-gold">
                  {itineraryDays.length} Milestones
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingItinerary(true)}
                  className="rounded border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-admin-primary hover:bg-light-gold/10"
                >
                  ✎ Edit Itinerary
                </button>
              </div>
            </div>

            <div className="mt-3 divide-y divide-black/5 text-xs">
              {itineraryDays.map((item: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-start gap-3 group">
                  <span className="flex size-5 items-center justify-center rounded-full bg-admin-primary text-[10px] font-bold text-white shrink-0 mt-0.5">
                    {item.day || idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-masaar-black">{item.title}</p>
                    <p className="text-masaar-black/60 text-[11px] mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItineraryDay(idx)}
                    className="opacity-0 group-hover:opacity-100 text-[11px] text-red-500 hover:underline shrink-0"
                    title="Remove day"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsEditingItinerary(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-admin-primary/40 py-2 text-xs font-semibold text-admin-primary hover:bg-light-gold/10"
            >
              <span>+</span> Add Milestone or Custom Day
            </button>
          </Card>

          {/* 4. Accommodation Section */}
          <Card className="!p-4">
            <div className="flex items-start justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-black/30 font-bold">⋮⋮</span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  🏨
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Accommodation
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    Hotels &amp; Room Configuration
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openHotelModal(null)}
                className="text-xs text-admin-primary font-semibold hover:underline"
              >
                + Add Hotel
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {hotelItems.length === 0 ? (
                <p className="text-xs text-masaar-black/50 italic py-2">
                  No hotel configured yet. Click &quot;+ Add Hotel&quot; to select from inventory or enter manually.
                </p>
              ) : (
                hotelItems.map((h) => {
                  const img = getHotelImage(h.description);
                  return (
                    <div key={h.id} className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-3 bg-white">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-black/10">
                          <Image src={img} alt="Hotel" fill className="object-cover" unoptimized />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-masaar-black text-xs">{h.description}</p>
                          <p className="text-[11px] text-masaar-black/60 mt-0.5 line-clamp-2">{h.details || `${h.quantity} Nights • 5★ Hotel`}</p>
                          <p className="text-[11px] text-admin-primary font-semibold mt-1">
                            {h.quantity} Nights @ AED {Number(h.unit_price_aed).toLocaleString()}/night
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="font-bold text-masaar-black text-xs">
                          AED {Number(h.amount_aed ?? (h.quantity * h.unit_price_aed)).toLocaleString()}
                        </p>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openHotelModal(h)}
                            className="rounded border border-black/15 bg-white px-2 py-0.5 text-[11px] font-semibold text-admin-primary hover:bg-black/[0.02]"
                          >
                            ✎ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(h.id)}
                            className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                            title="Remove hotel"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* 5. Transportation Section */}
          <Card className="!p-4">
            <div className="flex items-start justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-black/30 font-bold">⋮⋮</span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  🚗
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Transportation
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    Private Vehicles &amp; Chauffeur Transfers
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openTransferModal(null)}
                className="text-xs text-admin-primary font-semibold hover:underline"
              >
                + Add Transfer
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {transferItems.length === 0 ? (
                <div className="flex items-center justify-between text-xs text-masaar-black/50 py-2">
                  <span>No specific transfer line item added yet.</span>
                  <button
                    type="button"
                    onClick={() => openTransferModal(null)}
                    className="text-admin-primary font-semibold hover:underline"
                  >
                    ✎ Edit Transfer
                  </button>
                </div>
              ) : (
                transferItems.map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-3 bg-white">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-black/10">
                        <Image src={getTransportImage(t.description, t.details)} alt="Transfer" fill className="object-cover" unoptimized />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-masaar-black text-xs">{t.description}</p>
                        <p className="text-[11px] text-masaar-black/60 mt-0.5 line-clamp-2">{t.details || "Private intercity & airport transfers"}</p>
                        <p className="text-[11px] text-admin-primary font-semibold mt-1">
                          Qty: {t.quantity} • AED {Number(t.unit_price_aed).toLocaleString()} ea
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-bold text-masaar-black text-xs">
                        AED {Number(t.amount_aed ?? (t.quantity * t.unit_price_aed)).toLocaleString()}
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openTransferModal(t)}
                          className="rounded border border-black/15 bg-white px-2 py-0.5 text-[11px] font-semibold text-admin-primary hover:bg-black/[0.02]"
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(t.id)}
                          className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                          title="Remove transfer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* 6. Flights Section */}
          <Card className="!p-4">
            <div className="flex items-start justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-black/30 font-bold">⋮⋮</span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  ✈️
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Flights
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    Airline Tickets &amp; Cabin Class
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openFlightModal(null)}
                className="text-xs text-admin-primary font-semibold hover:underline"
              >
                + Add Flight
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {flightItems.length === 0 ? (
                <div className="flex items-center justify-between text-xs text-masaar-black/50 py-2">
                  <span>No flight line item configured yet.</span>
                  <button
                    type="button"
                    onClick={() => openFlightModal(null)}
                    className="text-admin-primary font-semibold hover:underline"
                  >
                    ✎ Edit Flight
                  </button>
                </div>
              ) : (
                flightItems.map((f) => (
                  <div key={f.id} className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-3 bg-white">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-black/10">
                        <Image src="/Assets/IMAGE 6 FLIGHT.jpg" alt="Flight" fill className="object-cover" unoptimized />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-masaar-black text-xs">{f.description}</p>
                        <p className="text-[11px] text-masaar-black/60 mt-0.5 line-clamp-2">{f.details || "Scheduled return flights"}</p>
                        <p className="text-[11px] text-admin-primary font-semibold mt-1">
                          Seats: {f.quantity} • AED {Number(f.unit_price_aed).toLocaleString()} ea
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-bold text-masaar-black text-xs">
                        AED {Number(f.amount_aed ?? (f.quantity * f.unit_price_aed)).toLocaleString()}
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openFlightModal(f)}
                          className="rounded border border-black/15 bg-white px-2 py-0.5 text-[11px] font-semibold text-admin-primary hover:bg-black/[0.02]"
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(f.id)}
                          className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                          title="Remove flight"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* 7. Meals Section */}
          <Card className="!p-4">
            <div className="flex items-start justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-black/30 font-bold">⋮⋮</span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  🍽️
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Meals
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    Dining &amp; Catering Inclusions
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openMealsModal(null)}
                className="text-xs text-admin-primary font-semibold hover:underline"
              >
                + Add Meals
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {mealItems.length === 0 ? (
                <div className="flex items-center justify-between text-xs text-masaar-black/50 py-2">
                  <span>Buffet breakfast included with 5★ hotels or customize dining.</span>
                  <button
                    type="button"
                    onClick={() => openMealsModal(null)}
                    className="text-admin-primary font-semibold hover:underline"
                  >
                    ✎ Edit Meals
                  </button>
                </div>
              ) : (
                mealItems.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-3 bg-white">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-black/10">
                        <Image src="/Assets/IMAGE 4.jpg" alt="Meals" fill className="object-cover" unoptimized />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-masaar-black text-xs">{m.description}</p>
                        <p className="text-[11px] text-masaar-black/60 mt-0.5 line-clamp-2">{m.details || "Daily hotel buffet & dining inclusions"}</p>
                        <p className="text-[11px] text-admin-primary font-semibold mt-1">
                          Guests: {m.quantity} • AED {Number(m.unit_price_aed).toLocaleString()} ea
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-bold text-masaar-black text-xs">
                        AED {Number(m.amount_aed ?? (m.quantity * m.unit_price_aed)).toLocaleString()}
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openMealsModal(m)}
                          className="rounded border border-black/15 bg-white px-2 py-0.5 text-[11px] font-semibold text-admin-primary hover:bg-black/[0.02]"
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(m.id)}
                          className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                          title="Remove meals"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* 8. Additional Services & Add-ons */}
          <Card className="!p-4">
            <div className="flex items-start justify-between border-b border-black/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-black/30 font-bold">⋮⋮</span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-light-gold/20 text-base">
                  ✨
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                    Additional Services &amp; Add-ons
                  </span>
                  <h3 className="font-semibold text-masaar-black text-sm">
                    Train, Ziyarat, Visa &amp; Custom Add-ons
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openAddonModal(null)}
                className="text-xs text-admin-primary font-semibold hover:underline"
              >
                + Add Add-on
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {otherItems.length === 0 ? (
                <p className="text-xs text-masaar-black/50 italic py-2">
                  No additional services or add-ons added yet. Click &quot;+ Add Add-on&quot; to include Visa, Train, Ziyarat, etc.
                </p>
              ) : (
                otherItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-3 bg-white">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-admin-primary">
                        {item.item_type.replace(/_/g, " ")}
                      </span>
                      <p className="font-bold text-masaar-black text-xs mt-0.5">{item.description}</p>
                      {item.details && <p className="text-[11px] text-masaar-black/60 mt-0.5">{item.details}</p>}
                      <p className="text-[11px] text-admin-primary font-semibold mt-1">
                        Qty: {item.quantity} • AED {Number(item.unit_price_aed).toLocaleString()} ea
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-bold text-masaar-black text-xs">
                        AED {Number(item.amount_aed ?? (item.quantity * item.unit_price_aed)).toLocaleString()}
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAddonModal(item)}
                          className="rounded border border-black/15 bg-white px-2 py-0.5 text-[11px] font-semibold text-admin-primary hover:bg-black/[0.02]"
                        >
                          ✎ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* 10. Thank You & Blessing Section */}
          <div className="rounded-xl border-2 border-pure-gold/30 bg-warm-ivory/50 p-5 text-center">
            <span className="text-2xl">🤲</span>
            <h4 className="mt-1 font-serif text-lg font-bold text-masaar-black">
              Thank You for Choosing Masaar Holidays
            </h4>
            <p className="font-serif italic text-xs text-masaar-black/70">
              “Faith guides the way. We take care of the rest.”
            </p>
            <p className="text-[11px] text-masaar-black/60 mt-1 max-w-md mx-auto">
              This official closing card and blessing note will appear at the conclusion of the quotation and PDF.
            </p>
          </div>

          {/* Add Custom Item Button */}
          <button
            type="button"
            onClick={() => {
              setNewItemType("custom");
              setNewDesc("");
              setNewDetails("");
              setNewQty(1);
              setNewPrice(0);
              setIsAddingItem(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-light-gold/50 bg-light-gold/5 p-4 text-xs font-bold text-admin-primary transition-all hover:border-light-gold hover:bg-light-gold/10"
          >
            <span>+</span> Add Custom Section or Custom Line Item
          </button>
        </div>

        {/* Center Column: Add Section Palette (3 Cols) matching QUOTATION BUILDER.png */}
        <div className="space-y-4 xl:col-span-3">
          <Card className="!p-4 sticky top-6">
            <div className="border-b border-black/10 pb-3">
              <h3 className="font-serif text-base font-bold text-masaar-black">
                Add Section
              </h3>
              <p className="text-xs text-masaar-black/60 mt-0.5">
                Click or drag to add a section to your quotation.
              </p>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {[
                { id: "client", label: "Client Details", icon: "👤", action: () => setIsEditingClient(true) },
                { id: "package", label: "Package", icon: "📦", action: () => setIsPackageModalOpen(true) },
                { id: "accommodation", label: "Accommodation", icon: "🏨", action: () => openAddSectionWithPreset("hotel", "Swissôtel Makkah — 5 Nights", "Near Haram, buffet breakfast included", 4200) },
                { id: "transportation", label: "Transportation", icon: "🚗", action: () => openAddSectionWithPreset("transfer", "Private GMC Yukon XL", "Airport & intercity transfers", 950) },
                { id: "flights", label: "Flights", icon: "✈️", action: () => openAddSectionWithPreset("flight", "Emirates – Business Class", "Direct scheduled return flights", 4500) },
                { id: "meals", label: "Meals", icon: "🍽️", action: () => openAddSectionWithPreset("custom", "3 Course Meals", "Daily buffet breakfast, lunch and dinner", 1200) },
                { id: "additional", label: "Additional Services", icon: "➕", action: () => openAddSectionWithPreset("service", "Ziyarat & Historical Tour", "Guided private tour of holy sites in Makkah & Madinah", 600) },
                { id: "itinerary", label: "Itinerary", icon: "📋", action: () => setIsEditingItinerary(true) },
                { id: "visa", label: "Visa Services", icon: "🛂", action: () => openAddSectionWithPreset("service", "Saudi Electronic Tourist / Umrah Visa", "Full processing with health insurance included", 750) },
                { id: "insurance", label: "Travel Insurance", icon: "🛡️", action: () => openAddSectionWithPreset("service", "Comprehensive Pilgrimage Travel Insurance", "Medical coverage, trip cancellation and luggage protection", 350) },
                { id: "terms", label: "Terms & Conditions", icon: "📜", action: () => {
                  setTerms(terms || "Standard payment schedule: 50% upon confirmation, balance 14 days prior to departure. Free cancellation up to 30 days prior.");
                  alert("Terms & Conditions added to quotation notes.");
                }},
                { id: "custom", label: "Custom Section", icon: "🧩", action: () => openAddSectionWithPreset("custom", "Custom Service / Inclusions", "Tailored pilgrim service as discussed", 500) },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-white p-3 text-left font-semibold text-masaar-black shadow-xs hover:border-[#b37e28] hover:bg-[#FAF8F5] transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs group-hover:text-[#916d28] transition-colors">{item.label}</span>
                  </div>
                  <span className="text-black/30 font-bold group-hover:text-[#916d28]">⋮⋮</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Preview & Summary (3 Cols) matching QUOTATION BUILDER.png */}
        <div className="space-y-4 xl:col-span-3">
          {/* Mini Quotation Preview Card */}
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-b from-[#201D1A] to-[#12100E] text-white p-4 shadow-md relative">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#D4AF37]">
                Quotation Preview
              </span>
              {shareToken && (
                <Link
                  href={`/quote/${shareToken}`}
                  target="_blank"
                  className="text-white/60 hover:text-white text-xs font-semibold"
                >
                  Preview ↗
                </Link>
              )}
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 my-3">
              <Image
                src="/Assets/BANNER IMAGE.png"
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-4 text-center">
                <p className="font-serif italic text-xs text-[#D4AF37]">
                  Tailored Journeys for a Higher Purpose
                </p>
                <h4 className="font-serif text-sm font-bold text-white mt-1 uppercase">
                  {journeyType === "hajj" ? "HAJJ 2027 EXCLUSIVE PACKAGE" : "UMRAH 2026 EXCLUSIVE PACKAGE"}
                </h4>
                <p className="text-[9px] tracking-widest text-white/70 uppercase mt-1">
                  FAITH • CLARITY • CARE • PEACE
                </p>
              </div>
            </div>
          </div>

          {/* Quotation Summary Card with Manual Pricing Box */}
          <Card className="sticky top-6">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-masaar-black">
                  Summary &amp; Pricing
                </h3>
                <p className="text-[10px] text-masaar-black/50">Manual pricing control</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPricing(!isEditingPricing)}
                className="rounded-md border border-[#b37e28]/40 bg-[#FAF8F5] px-2 py-1 text-[11px] font-bold text-[#865d1d] hover:bg-[#F5ECE0]"
              >
                {isEditingPricing ? "Close" : "✎ Edit Price"}
              </button>
            </div>

            {/* Manual Pricing Editor Form */}
            {isEditingPricing ? (
              <div className="mt-3 space-y-2.5 rounded-xl border border-[#b37e28]/30 bg-light-gold/10 p-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-masaar-black mb-1">
                    Package Base Price / Subtotal (AED)
                  </label>
                  <input
                    type="number"
                    value={manualSubtotal}
                    onChange={(e) => {
                      const sub = Number(e.target.value) || 0;
                      setManualSubtotal(sub);
                      if (applyVat) {
                        const tx = Math.round(sub * 0.05 * 100) / 100;
                        setManualTax(tx);
                        setManualTotal(sub + tx);
                      } else {
                        setManualTax(0);
                        setManualTotal(sub);
                      }
                    }}
                    className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1.5 text-xs font-bold text-masaar-black focus:border-[#b37e28] focus:outline-hidden"
                  />
                </div>

                {/* VAT 5% Tick Box */}
                <div className="flex items-center justify-between rounded-lg border border-[#b37e28]/30 bg-white px-3 py-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-masaar-black">
                    <input
                      type="checkbox"
                      checked={applyVat}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setApplyVat(checked);
                        if (checked) {
                          const tx = Math.round(manualSubtotal * 0.05 * 100) / 100;
                          setManualTax(tx);
                          setManualTotal(manualSubtotal + tx);
                        } else {
                          setManualTax(0);
                          setManualTotal(manualSubtotal);
                        }
                      }}
                      className="h-4 w-4 rounded border-black/20 text-[#b37e28] focus:ring-[#b37e28] cursor-pointer"
                    />
                    <span>Apply 5% VAT</span>
                  </label>
                  <span className="text-xs font-bold text-[#865d1d]">
                    AED {applyVat ? manualTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-masaar-black/70 mb-1">
                      VAT Amount (AED)
                    </label>
                    <input
                      type="number"
                      value={manualTax}
                      onChange={(e) => {
                        const tx = Number(e.target.value) || 0;
                        setManualTax(tx);
                        setManualTotal(manualSubtotal + tx);
                        setApplyVat(tx > 0);
                      }}
                      className="w-full rounded-lg border border-black/20 bg-white px-2.5 py-1.5 text-xs font-bold text-masaar-black focus:border-[#b37e28] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-masaar-black/70 mb-1">
                      Final Total (AED)
                    </label>
                    <input
                      type="number"
                      value={manualTotal}
                      onChange={(e) => setManualTotal(Number(e.target.value) || 0)}
                      className="w-full rounded-lg border border-[#b37e28] bg-white px-2.5 py-1.5 text-xs font-bold text-[#865d1d] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSavingPricing}
                    onClick={() => handleSaveManualPricing(manualSubtotal, manualTax, manualTotal)}
                    className="flex-1 rounded-lg bg-[#b37e28] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#96671e] disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingPricing ? "Saving..." : "Save Pricing"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const itemsSubtotal = itemsList.reduce((s, i) => s + Number(i.amount_aed ?? i.quantity * i.unit_price_aed), 0);
                      setManualSubtotal(itemsSubtotal);
                      if (applyVat) {
                        const tx = Math.round(itemsSubtotal * 0.05 * 100) / 100;
                        setManualTax(tx);
                        setManualTotal(itemsSubtotal + tx);
                      } else {
                        setManualTax(0);
                        setManualTotal(itemsSubtotal);
                      }
                    }}
                    className="rounded-lg border border-black/15 bg-white px-2.5 py-2 text-[10px] font-semibold text-masaar-black hover:bg-black/5 cursor-pointer"
                    title="Calculate from line items"
                  >
                    Sum Items
                  </button>
                </div>
              </div>
            ) : null}

            {/* Price Breakdown Display */}
            <div className="mt-3 space-y-2 text-xs font-sans">
              <div className="flex justify-between text-masaar-black font-semibold">
                <span>Total Package Price</span>
                <span className="font-bold text-masaar-black">
                  AED {Number(document.subtotal_aed || manualSubtotal).toLocaleString()}
                </span>
              </div>

              {/* Sub-breakdown items */}
              <div className="space-y-1 text-[11px] text-masaar-black/70 pl-2.5 border-l-2 border-[#b37e28]/40">
                <div className="flex justify-between">
                  <span>Hotel &amp; Transport</span>
                  <span className="font-semibold text-masaar-black">
                    AED {Number(
                      itemsList
                        .filter((i) => ["hotel", "accommodation", "transfer"].includes(i.item_type))
                        .reduce((s, i) => s + Number(i.amount_aed ?? i.quantity * i.unit_price_aed), 0) || 6400
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Flights ({flightItems.length > 0 ? flightItems[0].quantity : adults} Pax)</span>
                  <span className="font-semibold text-masaar-black">
                    AED {Number(
                      itemsList
                        .filter((i) => i.item_type === "flight")
                        .reduce((s, i) => s + Number(i.amount_aed ?? i.quantity * i.unit_price_aed), 0) || 2400
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between border-t border-black/10 pt-2 font-bold text-masaar-black">
                <span>VAT (5%)</span>
                <span>AED {Number(document.tax_aed || manualTax).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center border-t-2 border-[#b37e28] pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#865d1d]">
                  Final Total
                </span>
                <span className="font-serif text-lg font-bold text-masaar-black">
                  AED {Number(document.total_aed || manualTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between text-masaar-black/60 pt-1 text-[11px]">
                <span>Paid</span>
                <span>AED {Number(document.amount_paid_aed ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-masaar-black/80 font-semibold text-[11px] border-t border-black/5 pt-1">
                <span>Balance Due</span>
                <span>AED {Number((document.total_aed || manualTotal) - (document.amount_paid_aed ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Action Buttons matching QUOTATION BUILDER.png */}
            <div className="mt-4 space-y-2">
              {shareToken && (
                <Link
                  href={`/quote/${shareToken}`}
                  target="_blank"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b37e28] to-[#96671e] py-3 text-xs font-bold text-white shadow-sm hover:from-[#9c6d1f] hover:to-[#845a17] transition-all"
                >
                  <span>👁️</span> View Full Preview
                </Link>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/admin/documents/quotations/${document.id}/pdf`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-white py-2 text-[11px] font-semibold text-masaar-black shadow-xs hover:bg-black/[0.02]"
                >
                  <span>📄</span> Download PDF
                </Link>

                <Link
                  href={`/admin/documents/quotations/${document.id}/send`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-white py-2 text-[11px] font-semibold text-masaar-black shadow-xs hover:bg-black/[0.02]"
                >
                  <span>✉️</span> Send via Email
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-black/15 bg-white py-2 text-[11px] font-semibold text-masaar-black shadow-xs hover:bg-black/[0.02] cursor-pointer"
                >
                  <span>💬</span> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#b37e28] bg-light-gold/20 py-2 text-[11px] font-bold text-[#b37e28] shadow-xs hover:bg-light-gold/30 cursor-pointer"
                >
                  <span>🔗</span> Share Link
                </button>
              </div>
            </div>

            {/* Auto-save indicator */}
            <div className="mt-4 rounded-xl bg-green-50 p-2.5 text-center text-[11px] font-medium text-green-800 border border-green-200/50">
              <p>✓ Quotation is saved automatically</p>
              <p className="text-[10px] text-green-700/70 mt-0.5">Last updated: Just now</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-masaar-black">
              Add Section / Line Item
            </h3>
            <p className="mt-1 text-xs text-masaar-black/60">
              Specify item details, quantity, and unit price in AED.
            </p>

            <form onSubmit={handleAddItem} className="mt-4 space-y-3 text-xs">
              <Field label="Section Type">
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="umrah_package">Umrah Package</option>
                  <option value="hajj_package">Hajj Package</option>
                  <option value="hotel">Accommodation (Hotel)</option>
                  <option value="transfer">Transportation &amp; Transfer</option>
                  <option value="flight">Flight</option>
                  <option value="service">Additional Service / Visa</option>
                  <option value="private_trip">Private Trip &amp; Ziyarat</option>
                  <option value="custom">Custom Line Item</option>
                </select>
              </Field>

              <Field label="Title / Description" required>
                <input
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Swissôtel Makkah — 5 Nights"
                  className={inputClass}
                />
              </Field>

              <Field label="Details / Inclusions">
                <textarea
                  rows={3}
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="e.g. Twin room sharing, breakfast included, near Haram"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity">
                  <input
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>

                <Field label="Unit Price (AED)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-black/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-admin-primary px-4 py-2 text-xs font-bold text-white hover:bg-admin-primary-dark"
                >
                  Add to Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Itinerary Modal */}
      {isEditingItinerary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-masaar-black">
                  Manage Journey Itinerary
                </h3>
                <p className="text-xs text-masaar-black/60 mt-0.5">
                  Customise milestone titles, descriptions, and add new days.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingItinerary(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {itineraryDays.map((d: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-black/10 p-3 bg-neutral-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-admin-primary">
                      Milestone #{idx + 1} (Day {d.day || idx + 1})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItineraryDay(idx)}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                  <input
                    value={d.title}
                    onChange={(e) => {
                      const updated = [...itineraryDays];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      setItineraryDays(updated);
                    }}
                    placeholder="e.g. Day 1: Arrival & Umrah Performance"
                    className={inputClass}
                  />
                  <textarea
                    rows={2}
                    value={d.desc}
                    onChange={(e) => {
                      const updated = [...itineraryDays];
                      updated[idx] = { ...updated[idx], desc: e.target.value };
                      setItineraryDays(updated);
                    }}
                    placeholder="Activities, transfer details, ziyarat..."
                    className={inputClass}
                  />
                </div>
              ))}
            </div>

            {/* Add New Day Form */}
            <div className="mt-4 rounded-xl border border-dashed border-admin-primary/40 bg-light-gold/5 p-3.5 space-y-2">
              <span className="text-xs font-bold text-admin-primary">+ Add New Day / Milestone</span>
              <input
                value={newDayTitle}
                onChange={(e) => setNewDayTitle(e.target.value)}
                placeholder="Day title (e.g. Day 11: Extra Ziyarat in Taif)"
                className={inputClass}
              />
              <textarea
                rows={2}
                value={newDayDesc}
                onChange={(e) => setNewDayDesc(e.target.value)}
                placeholder="Day details and activities..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleAddItineraryDay}
                disabled={!newDayTitle.trim()}
                className="rounded-lg bg-light-gold px-3 py-1.5 text-xs font-bold text-masaar-black disabled:opacity-50"
              >
                + Add Day to Schedule
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-black/10 pt-4">
              <button
                type="button"
                onClick={() => setIsEditingItinerary(false)}
                className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveItinerary(itineraryDays)}
                className="rounded-lg bg-admin-primary px-4 py-2 text-xs font-bold text-white hover:bg-admin-primary-dark"
              >
                Save Itinerary Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Accommodation (Hotel) Modal */}
      {isEditingHotelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-masaar-black">
                  {editingHotelId ? "Edit Accommodation" : "Add Hotel Accommodation"}
                </h3>
                <p className="text-xs text-masaar-black/60 mt-0.5">
                  Select city, pick from inventory or type hotel details manually.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingHotelModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHotelSubmit} className="mt-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-masaar-black">City</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHotelCity(hotelCity === "Makkah" ? null : "Makkah")}
                    className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-all ${
                      hotelCity === "Makkah"
                        ? "border-[#b37e28] bg-light-gold/20 text-[#865d1d]"
                        : "border-black/15 bg-white text-masaar-black/70 hover:bg-black/[0.02]"
                    }`}
                  >
                    🕋 Makkah {hotelCity === "Makkah" && "✓"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHotelCity(hotelCity === "Madinah" ? null : "Madinah")}
                    className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-all ${
                      hotelCity === "Madinah"
                        ? "border-[#b37e28] bg-light-gold/20 text-[#865d1d]"
                        : "border-black/15 bg-white text-masaar-black/70 hover:bg-black/[0.02]"
                    }`}
                  >
                    🕌 Madinah {hotelCity === "Madinah" && "✓"}
                  </button>
                  {hotelCity && (
                    <button
                      type="button"
                      onClick={() => setHotelCity(null)}
                      className="px-2.5 py-2 text-xs text-masaar-black/50 hover:text-masaar-black underline"
                    >
                      Clear City
                    </button>
                  )}
                </div>
              </div>

              {availableHotels.length > 0 && (
                <Field label="Choose from Hotel Inventory (Optional quick fill)">
                  <select
                    value=""
                    onChange={(e) => {
                      const h = availableHotels.find((x) => x.id === e.target.value);
                      if (h) {
                        setHotelName(h.name);
                        if (h.city?.toLowerCase().includes("makkah")) setHotelCity("Makkah");
                        else if (h.city?.toLowerCase().includes("madinah")) setHotelCity("Madinah");
                        if (h.price_from_aed) setHotelPricePerNight(h.price_from_aed);
                      }
                    }}
                    className={inputClass}
                  >
                    <option value="">-- Or select an inventory hotel --</option>
                    {availableHotels
                      .filter((h) => !hotelCity || h.city?.toLowerCase() === hotelCity.toLowerCase())
                      .map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.city} • {h.star_rating ? `${h.star_rating}★` : "5★"}{h.price_from_aed ? ` • AED ${h.price_from_aed}/nt` : ""})
                        </option>
                      ))}
                  </select>
                </Field>
              )}

              <Field label="Hotel Name (manual or selected)" required>
                <input
                  required
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  placeholder="e.g. Swissôtel Makkah"
                  className={inputClass}
                />
              </Field>

              <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-[#FAF9F7] p-2.5">
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white">
                  <Image
                    src={getHotelImage(hotelName, hotelCity || undefined)}
                    alt="Hotel Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="text-[11px] text-masaar-black/70">
                  <p className="font-bold text-masaar-black">
                    {hotelName || "Hotel Photo Preview"}
                  </p>
                  <p className="text-[10px] text-masaar-black/50">
                    Verified luxury hotel photo (hotel architecture/interior, never Ziyarat).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Room Sharing Type">
                  <select
                    value={hotelRoomType}
                    onChange={(e) => setHotelRoomType(e.target.value)}
                    className={inputClass}
                  >
                    <option value="TWIN/DOUBLE">TWIN/DOUBLE</option>
                    <option value="TRIPLE">TRIPLE</option>
                    <option value="QUAD">QUAD</option>
                  </select>
                </Field>

                <Field label="Number of Nights">
                  <input
                    type="number"
                    min="1"
                    value={hotelNights}
                    onChange={(e) => setHotelNights(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Rate per Night (AED)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={hotelPricePerNight}
                  onChange={(e) => setHotelPricePerNight(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>

              <Field label="Hotel Inclusions &amp; Room Details">
                <textarea
                  rows={2}
                  value={hotelDetails}
                  onChange={(e) => setHotelDetails(e.target.value)}
                  placeholder="e.g. Near Haram courtyard • 5★ luxury buffet breakfast included • High floor city view"
                  className={inputClass}
                />
              </Field>

              <div className="rounded-lg bg-light-gold/10 p-2.5 text-xs text-masaar-black/80 flex justify-between items-center">
                <span>Calculated Total:</span>
                <span className="font-bold text-admin-primary">
                  AED {Number(hotelNights * hotelPricePerNight).toLocaleString()}
                </span>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-black/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingHotelModalOpen(false)}
                  className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-admin-primary px-4 py-2 text-xs font-bold text-white hover:bg-admin-primary-dark"
                >
                  Save Hotel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Transportation Modal */}
      {isEditingTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-masaar-black">
                  {editingTransferId ? "Edit Transportation" : "Add Transportation"}
                </h3>
                <p className="text-xs text-masaar-black/60 mt-0.5">
                  Pick vehicle/transfer from inventory or manually write route, quantity, and price.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingTransferModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTransferSubmit} className="mt-4 space-y-3 text-xs">
              <Field label="Select Vehicle Type">
                <select
                  value={transferVehicleType}
                  onChange={(e) => {
                    const v = e.target.value as "sedan" | "suv" | "staria" | "custom";
                    setTransferVehicleType(v);
                    if (v === "sedan") {
                      setTransferRouteName("Private Sedan Airport Transfers (Roundtrip)");
                      setTransferDetails("Private air-conditioned Sedan (Toyota Camry / Lexus) with dedicated professional chauffeur & luggage assistance");
                      setTransferPrice(1000);
                    } else if (v === "suv") {
                      setTransferRouteName("Private GMC Yukon XL Airport Transfers (Roundtrip)");
                      setTransferDetails("Private luxury SUV (GMC Yukon XL / Chevrolet Suburban) with dedicated professional chauffeur & meet & assist");
                      setTransferPrice(1600);
                    } else if (v === "staria") {
                      setTransferRouteName("Private Family Van Airport Transfers (Roundtrip)");
                      setTransferDetails("Spacious 7-seater Hyundai Staria / Toyota HiAce with dedicated chauffeur & ample luggage space");
                      setTransferPrice(1300);
                    }
                  }}
                  className={inputClass}
                >
                  <option value="sedan">🚗 Private Sedan (Toyota Camry / Lexus / Saloon Car)</option>
                  <option value="suv">🚙 Luxury SUV (GMC Yukon XL / Suburban)</option>
                  <option value="staria">🚐 Family Van (Hyundai Staria / Toyota HiAce)</option>
                  <option value="custom">⚙️ Custom Route / Vehicle</option>
                </select>
              </Field>

              <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-[#FAF9F7] p-2.5">
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white">
                  <Image
                    src={getTransportImage(transferRouteName, transferDetails)}
                    alt="Vehicle Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="text-[11px] text-masaar-black/70">
                  <p className="font-bold text-masaar-black">
                    {transferVehicleType === "sedan"
                      ? "Sedan Vehicle Photo (Toyota Camry / Lexus)"
                      : transferVehicleType === "suv"
                      ? "Luxury SUV Photo (GMC Yukon XL)"
                      : transferVehicleType === "staria"
                      ? "Family Van Photo (Hyundai Staria)"
                      : "Vehicle Photo"}
                  </p>
                  <p className="text-[10px] text-masaar-black/50">
                    This vehicle photo will appear on the client quotation and PDF.
                  </p>
                </div>
              </div>
              {availableTransfers.length > 0 && (
                <Field label="Choose from Transfer Inventory (Optional quick fill)">
                  <select
                    value=""
                    onChange={(e) => {
                      const t = availableTransfers.find((x) => x.id === e.target.value);
                      if (t) {
                        setTransferRouteName(t.route_name);
                        if (t.price_from_aed) setTransferPrice(t.price_from_aed);
                        if (t.vehicle_type) setTransferDetails(`Vehicle: ${t.vehicle_type} with dedicated chauffeur`);
                      }
                    }}
                    className={inputClass}
                  >
                    <option value="">-- Or select an inventory transfer --</option>
                    {availableTransfers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.route_name} ({t.vehicle_type || "Private Vehicle"}{t.price_from_aed ? ` • AED ${t.price_from_aed}` : ""})
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Transfer / Route Title" required>
                <input
                  required
                  value={transferRouteName}
                  onChange={(e) => setTransferRouteName(e.target.value)}
                  placeholder="e.g. Private GMC Yukon XL Transfers"
                  className={inputClass}
                />
              </Field>

              <Field label="Route Details &amp; Inclusions">
                <textarea
                  rows={2}
                  value={transferDetails}
                  onChange={(e) => setTransferDetails(e.target.value)}
                  placeholder="e.g. Jeddah Airport → Makkah Hotel • Makkah → Madinah • Madinah → Airport"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity / Vehicles">
                  <input
                    type="number"
                    min="1"
                    value={transferQty}
                    onChange={(e) => setTransferQty(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>

                <Field label="Unit Price (AED)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={transferPrice}
                    onChange={(e) => setTransferPrice(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="rounded-lg bg-light-gold/10 p-2.5 text-xs text-masaar-black/80 flex justify-between items-center">
                <span>Total Transfer Amount:</span>
                <span className="font-bold text-admin-primary">
                  AED {Number(transferQty * transferPrice).toLocaleString()}
                </span>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-black/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingTransferModalOpen(false)}
                  className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-admin-primary px-4 py-2 text-xs font-bold text-white hover:bg-admin-primary-dark"
                >
                  Save Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Flight Modal */}
      {isEditingFlightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-masaar-black">
                  {editingFlightId ? "Edit Flight" : "Add Flight Line Item"}
                </h3>
                <p className="text-xs text-masaar-black/60 mt-0.5">
                  Write down airline, route details, quantity of seats, and ticket price.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingFlightModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFlightSubmit} className="mt-4 space-y-3 text-xs">
              <Field label="Airline &amp; Class" required>
                <input
                  required
                  value={flightAirline}
                  onChange={(e) => setFlightAirline(e.target.value)}
                  placeholder="e.g. Emirates – Business Class"
                  className={inputClass}
                />
              </Field>

              <Field label="Flight Details &amp; Route">
                <textarea
                  rows={2}
                  value={flightDetails}
                  onChange={(e) => setFlightDetails(e.target.value)}
                  placeholder="e.g. Dubai (DXB) ⇄ Jeddah (JED) • 25kg luggage included"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Seats / Passengers">
                  <input
                    type="number"
                    min="1"
                    value={flightQty}
                    onChange={(e) => setFlightQty(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>

                <Field label="Price per Seat (AED)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={flightPrice}
                    onChange={(e) => setFlightPrice(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="rounded-lg bg-light-gold/10 p-2.5 text-xs text-masaar-black/80 flex justify-between items-center">
                <span>Total Flight Amount:</span>
                <span className="font-bold text-admin-primary">
                  AED {Number(flightQty * flightPrice).toLocaleString()}
                </span>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-black/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingFlightModalOpen(false)}
                  className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-admin-primary px-4 py-2 text-xs font-bold text-white hover:bg-admin-primary-dark"
                >
                  Save Flight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Meals Modal */}
      {isEditingMealsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-masaar-black">
                  {editingMealId ? "Edit Meals" : "Add Dining & Meals"}
                </h3>
                <p className="text-xs text-masaar-black/60 mt-0.5">
                  Write down meal plan, catering inclusions, quantity, and price.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingMealsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMealsSubmit} className="mt-4 space-y-3 text-xs">
              <Field label="Meal Plan Title" required>
                <input
                  required
                  value={mealTitle}
                  onChange={(e) => setMealTitle(e.target.value)}
                  placeholder="e.g. Daily 3-Course Gourmet Meals"
                  className={inputClass}
                />
              </Field>

              <Field label="Dining Inclusions">
                <textarea
                  rows={2}
                  value={mealDetails}
                  onChange={(e) => setMealDetails(e.target.value)}
                  placeholder="e.g. Daily breakfast, lunch, and dinner buffet at 5-star hotel restaurant."
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Pax / Portions">
                  <input
                    type="number"
                    min="1"
                    value={mealQty}
                    onChange={(e) => setMealQty(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>

                <Field label="Price per Pax (AED)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={mealPrice}
                    onChange={(e) => setMealPrice(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="rounded-lg bg-light-gold/10 p-2.5 text-xs text-masaar-black/80 flex justify-between items-center">
                <span>Total Meals Amount:</span>
                <span className="font-bold text-admin-primary">
                  AED {Number(mealQty * mealPrice).toLocaleString()}
                </span>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-black/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingMealsModalOpen(false)}
                  className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-admin-primary px-4 py-2 text-xs font-bold text-white hover:bg-admin-primary-dark"
                >
                  Save Meals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add-ons Modal */}
      {isEditingAddonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-masaar-black">
                  {editingAddonId ? "Edit Add-on" : "Add Service / Add-on"}
                </h3>
                <p className="text-xs text-masaar-black/60 mt-0.5">
                  Add Visa, Train, Ziyarat tours, or custom pilgrim add-ons.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingAddonModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddonSubmit} className="mt-4 space-y-3 text-xs">
              <Field label="Quick Add-on Presets">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { title: "Saudi Electronic Tourist / Umrah Visa", price: 550, desc: "1-year multiple entry visa with medical insurance coverage across KSA." },
                    { title: "Haramain High-Speed Train (Business)", price: 320, desc: "Direct business-class transit between Makkah & Madinah." },
                    { title: "Guided Historical Makkah & Madinah Ziyarat", price: 600, desc: "Private historical tour to Cave Hira, Mount Thawr, Uhud, and Quba with licensed guide." },
                    { title: "Comprehensive Pilgrimage Travel Insurance", price: 250, desc: "Medical emergencies, baggage loss, and trip cancellation coverage." },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAddonTitle(p.title);
                        setAddonPrice(p.price);
                        setAddonDetails(p.desc);
                      }}
                      className="rounded border border-black/10 bg-black/[0.03] px-2 py-1 text-[11px] font-medium text-masaar-black/80 hover:bg-light-gold/20 hover:border-[#b37e28]"
                    >
                      {p.title.split("(")[0].split("/")[0].trim()}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Add-on Title" required>
                <input
                  required
                  value={addonTitle}
                  onChange={(e) => setAddonTitle(e.target.value)}
                  placeholder="e.g. Haramain High Speed Train"
                  className={inputClass}
                />
              </Field>

              <Field label="Add-on Details">
                <textarea
                  rows={2}
                  value={addonDetails}
                  onChange={(e) => setAddonDetails(e.target.value)}
                  placeholder="e.g. Business class seats with seat reservations"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity">
                  <input
                    type="number"
                    min="1"
                    value={addonQty}
                    onChange={(e) => setAddonQty(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>

                <Field label="Unit Price (AED)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={addonPrice}
                    onChange={(e) => setAddonPrice(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="rounded-lg bg-light-gold/10 p-2.5 text-xs text-masaar-black/80 flex justify-between items-center">
                <span>Total Add-on Amount:</span>
                <span className="font-bold text-admin-primary">
                  AED {Number(addonQty * addonPrice).toLocaleString()}
                </span>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-black/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingAddonModalOpen(false)}
                  className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-admin-primary px-4 py-2 text-xs font-bold text-white hover:bg-admin-primary-dark"
                >
                  Save Add-on
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <CustomPackageBuilderModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        journeyType={journeyType}
        adults={adults}
        children={children}
        travelDate={travelDate}
        returnDate={returnDate}
        onSavePackage={handleSavePackageFromModal}
      />

      {/* Share with Passenger Modal */}
      <ShareQuotationModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        document={{
          ...document,
          total_aed: document.total_aed,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          journey_type: journeyType,
          document_number: docNumber,
        }}
        shareToken={shareToken || document.id}
      />
    </div>
  );
}
