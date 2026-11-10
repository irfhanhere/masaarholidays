"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge, StatCard } from "@/components/admin/ui";
import type { AdditionalServiceRow, AdditionalServiceFaq } from "@/lib/types/database";
import {
  toggleServiceFeatured,
  setServiceStatus,
  toggleThoughtfulSection,
  toggleEnquiryPopup,
  toggleEnquiryEnabled,
  updateAdditionalService,
} from "./actions";

const AVAILABLE_WHATSAPP_TEMPLATES = [
  { key: "umrah-guide-enquiry", label: "Umrah Guide Enquiry" },
  { key: "makkah-ziyarah-enquiry", label: "Makkah Ziyarah Enquiry" },
  { key: "madinah-ziyarah-enquiry", label: "Madinah Ziyarah Enquiry" },
  { key: "private-tours-enquiry", label: "Private Tours Enquiry" },
  { key: "wheelchair-assistance-enquiry", label: "Wheelchair Assistance Enquiry" },
  { key: "private-transport-enquiry", label: "Private Transport Enquiry" },
  { key: "tour-guide-sightseeing-enquiry", label: "Tour Guide Sightseeing Enquiry" },
  { key: "other-additional-services-enquiry", label: "Other Additional Services Enquiry" },
  { key: "package", label: "General Umrah Package" },
  { key: "general", label: "General Inquiries" },
];

interface Props {
  initialServices: AdditionalServiceRow[];
}

export function AdditionalServicesAdminClient({ initialServices }: Props) {
  const [services, setServices] = useState<AdditionalServiceRow[]>(initialServices);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft" | "archived">("all");
  const [editingService, setEditingService] = useState<AdditionalServiceRow | null>(null);

  // Edit form state
  const [editStatus, setEditStatus] = useState<"published" | "draft" | "archived">("draft");
  const [editEnquiryEnabled, setEditEnquiryEnabled] = useState(true);
  const [editShowHomepage, setEditShowHomepage] = useState(false);
  const [editHomeOrder, setEditHomeOrder] = useState<number>(0);
  const [editShowThoughtful, setEditShowThoughtful] = useState(false);
  const [editThoughtfulOrder, setEditThoughtfulOrder] = useState<number>(0);
  const [editShowPopup, setEditShowPopup] = useState(false);
  const [editPopupOrder, setEditPopupOrder] = useState<number>(0);
  const [editAllowMultiple, setEditAllowMultiple] = useState(true);
  const [editTemplateKey, setEditTemplateKey] = useState<string>("other-additional-services-enquiry");
  const [editMetaTitle, setEditMetaTitle] = useState("");
  const [editMetaDesc, setEditMetaDesc] = useState("");
  const [editImageAlt, setEditImageAlt] = useState("");
  const [editFaqs, setEditFaqs] = useState<AdditionalServiceFaq[]>([]);

  // FAQ delete confirmation state
  const [faqToDelete, setFaqToDelete] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Open modal and initialize form
  const openEditModal = (service: AdditionalServiceRow) => {
    setEditingService(service);
    setEditStatus(service.status);
    setEditEnquiryEnabled(service.is_enquiry_enabled ?? true);
    setEditShowHomepage(service.show_on_homepage ?? service.is_featured ?? false);
    setEditHomeOrder(service.homepage_display_order ?? service.display_order ?? 0);
    setEditShowThoughtful(service.show_in_thoughtful_services ?? (service.status === "published"));
    setEditThoughtfulOrder(service.thoughtful_services_order ?? service.display_order ?? 0);
    setEditShowPopup(service.show_in_enquiry_popup ?? (service.status === "published"));
    setEditPopupOrder(service.enquiry_popup_order ?? service.display_order ?? 0);
    setEditAllowMultiple(service.allow_multiple_in_popup ?? true);
    setEditTemplateKey(service.whatsapp_template_key ?? `${service.slug}-enquiry`);
    setEditMetaTitle(service.meta_title ?? "");
    setEditMetaDesc(service.meta_description ?? "");
    setEditImageAlt(service.image_alt ?? "");
    setEditFaqs(
      (service.faqs || []).map((f) => ({
        q: f.q,
        a: f.a,
        published: f.published !== false,
        order: f.order ?? 0,
      }))
    );
    setSaveSuccess(false);
  };

  const closeEditModal = () => {
    setEditingService(null);
    setFaqToDelete(null);
  };

  // Save changes
  const handleSave = () => {
    if (!editingService) return;

    startTransition(async () => {
      const payload = {
        status: editStatus,
        is_enquiry_enabled: editEnquiryEnabled,
        show_on_homepage: editShowHomepage,
        homepage_display_order: Number(editHomeOrder),
        show_in_thoughtful_services: editShowThoughtful,
        thoughtful_services_order: Number(editThoughtfulOrder),
        show_in_enquiry_popup: editShowPopup,
        enquiry_popup_order: Number(editPopupOrder),
        allow_multiple_in_popup: editAllowMultiple,
        whatsapp_template_key: editTemplateKey,
        meta_title: editMetaTitle.trim() || null,
        meta_description: editMetaDesc.trim() || null,
        image_alt: editImageAlt.trim() || null,
        faqs: editFaqs,
      };

      const res = await updateAdditionalService(editingService.id, payload);

      if (res?.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? { ...s, ...payload } : s))
        );
        setSaveSuccess(true);
        setTimeout(() => {
          closeEditModal();
        }, 800);
      }
    });
  };

  // FAQ Helpers
  const addFaqItem = () => {
    setEditFaqs((prev) => [
      ...prev,
      {
        q: "New question here...",
        a: "Clear explanation answering the question...",
        published: true,
        order: prev.length + 1,
      },
    ]);
  };

  const updateFaq = (index: number, field: keyof AdditionalServiceFaq, val: any) => {
    setEditFaqs((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  const moveFaq = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === editFaqs.length - 1) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...editFaqs];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setEditFaqs(updated);
  };

  const confirmDeleteFaq = (index: number) => {
    setEditFaqs((prev) => prev.filter((_, idx) => idx !== index));
    setFaqToDelete(null);
  };

  // Filtered services
  const filteredServices = services.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const publishedCount = services.filter((s) => s.status === "published").length;
  const draftCount = services.filter((s) => s.status === "draft").length;
  const homeCount = services.filter((s) => (s.show_on_homepage || s.is_featured) && s.status === "published").length;
  const popupCount = services.filter((s) => s.show_in_enquiry_popup && s.status === "published").length;

  return (
    <div>
      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard label="Total Services" value={services.length} />
        <StatCard label="Published" value={publishedCount} />
        <StatCard label="Homepage Featured" value={homeCount} />
        <StatCard label="In Enquiry Popup" value={popupCount} />
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "published", "draft", "archived"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                filterStatus === st
                  ? "bg-[#C9A227] text-white"
                  : "bg-black/5 text-masaar-black/70 hover:bg-black/10"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service name, slug, category..."
            className="w-full rounded-lg border border-black/15 bg-warm-ivory/30 px-3 py-1.5 text-xs text-masaar-black focus:border-[#C9A227] focus:outline-none"
          />
        </div>
      </div>

      {/* Services Table */}
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-admin-surface text-xs font-semibold uppercase tracking-wider text-masaar-black/60">
            <tr>
              <th className="px-4 py-3.5">Service</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-center">Placements</th>
              <th className="px-4 py-3.5 text-center">Enquiry</th>
              <th className="px-4 py-3.5 text-center">WhatsApp Template</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filteredServices.map((service) => {
              const isHome = service.show_on_homepage || service.is_featured;
              const isThoughtful = service.show_in_thoughtful_services !== false;
              const isPopup = service.show_in_enquiry_popup !== false;
              const isEnquiry = service.is_enquiry_enabled !== false;

              return (
                <tr key={service.id} className="hover:bg-warm-ivory/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-warm-ivory border border-black/10">
                        <Image
                          src={service.image_url}
                          alt={service.image_alt || service.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-masaar-black text-sm">{service.name}</p>
                        <p className="text-[11px] text-masaar-black/50 font-mono">/{service.slug}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="text-xs text-masaar-black/70">{service.category}</span>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <Badge
                      tone={
                        service.status === "published"
                          ? "green"
                          : service.status === "draft"
                          ? "amber"
                          : "gray"
                      }
                    >
                      {service.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex flex-col gap-1 text-[11px]">
                      <span className={`px-2 py-0.5 rounded ${isHome ? "bg-amber-100 text-amber-800" : "bg-black/5 text-black/40"}`}>
                        Home: {isHome ? "Yes" : "No"}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${isThoughtful ? "bg-blue-100 text-blue-800" : "bg-black/5 text-black/40"}`}>
                        Site-wide: {isThoughtful ? "Yes" : "No"}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${isPopup ? "bg-emerald-100 text-emerald-800" : "bg-black/5 text-black/40"}`}>
                        Popup: {isPopup ? "Yes" : "No"}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isEnquiry ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {isEnquiry ? "Enabled" : "Disabled"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <span className="rounded bg-black/5 px-2 py-1 text-[10px] font-mono text-masaar-black/70">
                      {service.whatsapp_template_key || "default"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(service)}
                        className="rounded-lg bg-[#C9A227] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#A87F12] transition"
                      >
                        Edit Controls
                      </button>
                      <Link
                        href={`/additional-services/${service.slug}`}
                        target="_blank"
                        className="rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-medium text-masaar-black hover:border-black/30"
                      >
                        ↗
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ──────────────── EDIT CONTROLS MODAL ──────────────── */}
      {editingService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl border border-black/10 my-auto max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 bg-[#FAF7F2]">
              <div className="flex items-center gap-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-warm-ivory border border-black/10">
                  <Image
                    src={editingService.image_url}
                    alt={editingService.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-masaar-black">{editingService.name}</h3>
                  <p className="text-xs text-masaar-black/60 font-mono">/{editingService.slug}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="flex size-8 items-center justify-center rounded-full bg-black/5 text-masaar-black/60 hover:bg-black/10"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="space-y-6 overflow-y-auto p-6 text-xs text-masaar-black">
              {saveSuccess && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 font-semibold">
                  ✓ Service display controls saved successfully!
                </div>
              )}

              {/* 1. SERVICE AVAILABILITY */}
              <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-4 space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[#8F6407] text-[11px]">
                  1. Service Availability &amp; Publication
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Publication Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full rounded-lg border border-black/15 bg-white p-2 focus:border-[#C9A227] focus:outline-none"
                    >
                      <option value="published">Published (Visible on site)</option>
                      <option value="draft">Draft (Admin only)</option>
                      <option value="archived">Archived (Inactive)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Enquiry Enabled</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="enquiryEnabled"
                        checked={editEnquiryEnabled}
                        onChange={(e) => setEditEnquiryEnabled(e.target.checked)}
                        className="size-4 rounded text-[#C9A227] focus:ring-[#C9A227]"
                      />
                      <label htmlFor="enquiryEnabled" className="cursor-pointer">
                        Accept customer WhatsApp enquiries
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. WEBSITE PLACEMENTS & DISPLAY ORDERS */}
              <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-4 space-y-4">
                <h4 className="font-bold uppercase tracking-wider text-[#8F6407] text-[11px]">
                  2. Website Placements &amp; Display Controls
                </h4>

                {/* Homepage Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-black/10 pb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showHomepage"
                      checked={editShowHomepage}
                      onChange={(e) => setEditShowHomepage(e.target.checked)}
                      className="size-4 rounded text-[#C9A227] focus:ring-[#C9A227]"
                    />
                    <label htmlFor="showHomepage" className="font-semibold cursor-pointer">
                      Show in Homepage &quot;Enhance Your Umrah&quot;
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] text-masaar-black/70 mb-0.5">
                      Homepage Display Order
                    </label>
                    <input
                      type="number"
                      value={editHomeOrder}
                      onChange={(e) => setEditHomeOrder(Number(e.target.value))}
                      className="w-full rounded-lg border border-black/15 bg-white p-2 focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Site-wide Thoughtful Services Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-black/10 pb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showThoughtful"
                      checked={editShowThoughtful}
                      onChange={(e) => setEditShowThoughtful(e.target.checked)}
                      className="size-4 rounded text-[#C9A227] focus:ring-[#C9A227]"
                    />
                    <label htmlFor="showThoughtful" className="font-semibold cursor-pointer">
                      Show in &quot;Thoughtful Services&quot; site-wide
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] text-masaar-black/70 mb-0.5">
                      Thoughtful Section Display Order
                    </label>
                    <input
                      type="number"
                      value={editThoughtfulOrder}
                      onChange={(e) => setEditThoughtfulOrder(Number(e.target.value))}
                      className="w-full rounded-lg border border-black/15 bg-white p-2 focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Enquiry Popup Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showPopup"
                      checked={editShowPopup}
                      onChange={(e) => setEditShowPopup(e.target.checked)}
                      className="size-4 rounded text-[#C9A227] focus:ring-[#C9A227]"
                    />
                    <label htmlFor="showPopup" className="font-semibold cursor-pointer">
                      Show in Umrah Enquiry Popup
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] text-masaar-black/70 mb-0.5">
                      Popup Display Order
                    </label>
                    <input
                      type="number"
                      value={editPopupOrder}
                      onChange={(e) => setEditPopupOrder(Number(e.target.value))}
                      className="w-full rounded-lg border border-black/15 bg-white p-2 focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowMultiple"
                      checked={editAllowMultiple}
                      onChange={(e) => setEditAllowMultiple(e.target.checked)}
                      className="size-4 rounded text-[#C9A227] focus:ring-[#C9A227]"
                    />
                    <label htmlFor="allowMultiple" className="cursor-pointer text-[11px]">
                      Allow multiple selection
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. WHATSAPP TEMPLATE ASSIGNMENT */}
              <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-4 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[#8F6407] text-[11px]">
                  3. Assigned WhatsApp Enquiry Template
                </h4>
                <p className="text-[11px] text-masaar-black/60">
                  Select the template formatted when a customer enquires about this specific service.
                </p>
                <select
                  value={editTemplateKey}
                  onChange={(e) => setEditTemplateKey(e.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-white p-2 focus:border-[#C9A227] focus:outline-none"
                >
                  {AVAILABLE_WHATSAPP_TEMPLATES.map((tpl) => (
                    <option key={tpl.key} value={tpl.key}>
                      {tpl.label} ({tpl.key})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. SERVICE FAQS MANAGEMENT */}
              <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold uppercase tracking-wider text-[#8F6407] text-[11px]">
                    4. Service FAQs ({editFaqs.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addFaqItem}
                    className="rounded-md bg-[#C9A227] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#A87F12]"
                  >
                    + Add FAQ
                  </button>
                </div>

                <div className="space-y-3">
                  {editFaqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-black/10 bg-white p-3 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-masaar-black/50">#{idx + 1}</span>
                          <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={faq.published !== false}
                              onChange={(e) => updateFaq(idx, "published", e.target.checked)}
                              className="size-3.5 rounded text-[#C9A227]"
                            />
                            <span>Published</span>
                          </label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => moveFaq(idx, "up")}
                            disabled={idx === 0}
                            className="rounded px-1.5 py-0.5 text-xs bg-black/5 disabled:opacity-30"
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFaq(idx, "down")}
                            disabled={idx === editFaqs.length - 1}
                            className="rounded px-1.5 py-0.5 text-xs bg-black/5 disabled:opacity-30"
                            title="Move Down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => setFaqToDelete(idx)}
                            className="rounded px-2 py-0.5 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100"
                            title="Delete FAQ"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-masaar-black/60 mb-1">
                          Question
                        </label>
                        <input
                          type="text"
                          value={faq.q}
                          onChange={(e) => updateFaq(idx, "q", e.target.value)}
                          className="w-full rounded border border-black/15 p-1.5 text-xs focus:border-[#C9A227] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-masaar-black/60 mb-1">
                          Answer
                        </label>
                        <textarea
                          rows={2}
                          value={faq.a}
                          onChange={(e) => updateFaq(idx, "a", e.target.value)}
                          className="w-full rounded border border-black/15 p-1.5 text-xs focus:border-[#C9A227] focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}

                  {editFaqs.length === 0 && (
                    <p className="text-center py-4 text-masaar-black/50 italic">
                      No FAQs yet. Click &quot;+ Add FAQ&quot; above to create one.
                    </p>
                  )}
                </div>
              </div>

              {/* 5. SEO METADATA & ALT TEXT */}
              <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-4 space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[#8F6407] text-[11px]">
                  5. SEO Metadata &amp; Image Alt Text
                </h4>
                <div>
                  <label className="block font-semibold mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={editMetaTitle}
                    onChange={(e) => setEditMetaTitle(e.target.value)}
                    placeholder="e.g. Umrah Guide in Makkah & Madinah | Masaar Holidays"
                    className="w-full rounded-lg border border-black/15 bg-white p-2 focus:border-[#C9A227] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Meta Description</label>
                  <textarea
                    rows={2}
                    value={editMetaDesc}
                    onChange={(e) => setEditMetaDesc(e.target.value)}
                    placeholder="e.g. Get practical Umrah guidance and assistance with Ihram, Tawaf and Sa'i..."
                    className="w-full rounded-lg border border-black/15 bg-white p-2 focus:border-[#C9A227] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Image Alt Text</label>
                  <input
                    type="text"
                    value={editImageAlt}
                    onChange={(e) => setEditImageAlt(e.target.value)}
                    placeholder="e.g. Umrah Guide accompanying pilgrims during Tawaf"
                    className="w-full rounded-lg border border-black/15 bg-white p-2 focus:border-[#C9A227] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-black/10 px-6 py-4 bg-[#FAF7F2]">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="rounded-lg bg-[#C9A227] px-6 py-2 text-xs font-bold text-white shadow hover:bg-[#A87F12] disabled:opacity-50"
              >
                {isPending ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── FAQ DELETE CONFIRMATION MODAL ──────────────── */}
      {faqToDelete !== null && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-masaar-black">Delete FAQ Item?</h4>
            <p className="mt-2 text-xs text-masaar-black/70">
              Are you sure you want to delete this FAQ question? This action will take effect when you save.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFaqToDelete(null)}
                className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold text-masaar-black hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteFaq(faqToDelete)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
              >
                Delete FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

