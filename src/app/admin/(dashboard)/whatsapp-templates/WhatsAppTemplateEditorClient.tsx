"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { WhatsAppTemplateRow } from "@/lib/types/database";
import { createTemplate, updateTemplate, duplicateTemplate } from "./actions";

interface Props {
  templates: WhatsAppTemplateRow[];
  activeKey: string;
  publishedServices?: { id: string; name: string; slug: string; category: string }[];
}

const VARIABLE_CHIPS = [
  "service_name",
  "service_url",
  "package_name",
  "city",
  "service_option",
  "duration",
  "travel_date",
  "customer_name",
  "phone",
  "hotel_name",
  "total_price",
  "package_ref",
  "url_ref",
];

const SAMPLE_VALUES: Record<string, string> = {
  service_name: "Umrah Guide",
  service_url: "https://www.masaarholidays.com/additional-services/umrah-guide",
  package_name: "Masaar Premium Umrah Package",
  city: "Makkah / Madinah / Both",
  service_option: "Private arrangement",
  duration: "3 Hours",
  package_ref: "\n\nPackage: Masaar Premium Umrah Package",
  url_ref: "\nReference: https://www.masaarholidays.com/additional-services/umrah-guide",
  customer_name: "Haseeb Ahmed",
  phone: "+971 55 732 9320",
  travel_date: "15 Nov 2026",
  hotel_name: "Makkah Towers / Swissôtel",
  total_price: "AED 7,500",
};

export function WhatsAppTemplateEditorClient({ templates, activeKey, publishedServices = [] }: Props) {
  const activeTemplate = templates.find((t) => t.key === activeKey) || templates[0];
  const [selectedKey, setSelectedKey] = useState(activeTemplate?.key || "umrahGuideEnquiry");
  const currentTemplate = templates.find((t) => t.key === selectedKey) || activeTemplate;

  const [label, setLabel] = useState(currentTemplate?.label || "Umrah Guide Enquiry");
  const [templateText, setTemplateText] = useState(
    currentTemplate?.template_text ||
      "Assalamu Alaikum, Masaar Holidays.\n\nI would like to enquire about arranging an Umrah Guide.\n\nName:\nTravel date:\nNumber of pilgrims:\nPreferred city: {{city}}\nPreferred language:\nService requirements: {{service_option}}\n\nPlease share the available arrangements and details.{{package_ref}}{{url_ref}}"
  );
  const [isActive, setIsActive] = useState(currentTemplate?.is_active ?? true);
  const [placeholders, setPlaceholders] = useState<string[]>(currentTemplate?.placeholders ?? []);
  const [placeholderDraft, setPlaceholderDraft] = useState("");
  const [displayOrder, setDisplayOrder] = useState(currentTemplate?.display_order ?? 0);
  const [assignedServiceSlug, setAssignedServiceSlug] = useState(currentTemplate?.assigned_service_slug || "");
  const [defaultCtaText, setDefaultCtaText] = useState(currentTemplate?.default_cta_text || "Enquire on WhatsApp");

  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAssignedService, setNewAssignedService] = useState("");
  const [newCtaText, setNewCtaText] = useState("Enquire on WhatsApp");
  const [isDuplicating, setIsDuplicating] = useState(false);

  function selectTemplate(tmpl: WhatsAppTemplateRow) {
    setSelectedKey(tmpl.key);
    setLabel(tmpl.label);
    setTemplateText(tmpl.template_text);
    setIsActive(tmpl.is_active);
    setPlaceholders(tmpl.placeholders ?? []);
    setDisplayOrder(tmpl.display_order);
    setAssignedServiceSlug(tmpl.assigned_service_slug || "");
    setDefaultCtaText(tmpl.default_cta_text || "Enquire on WhatsApp");
  }

  function addPlaceholder() {
    const p = placeholderDraft.trim();
    if (p && !placeholders.includes(p)) setPlaceholders([...placeholders, p]);
    setPlaceholderDraft("");
  }

  function removePlaceholder(index: number) {
    setPlaceholders(placeholders.filter((_, i) => i !== index));
  }

  function movePlaceholder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= placeholders.length) return;
    const next = [...placeholders];
    [next[index], next[target]] = [next[target], next[index]];
    setPlaceholders(next);
  }

  function insertVariable(varName: string) {
    const varTag = `{{${varName}}}`;
    setTemplateText((prev) => `${prev} ${varTag}`);
  }

  // Generate interpolated preview string for WhatsApp Phone Mockup
  function renderInterpolatedPreview(rawText: string) {
    let result = rawText;
    Object.entries(SAMPLE_VALUES).forEach(([key, val]) => {
      result = result.replaceAll(`{{${key}}}`, val);
    });
    return result;
  }

  async function handleDuplicate() {
    if (!currentTemplate?.id) return;
    setIsDuplicating(true);
    try {
      await duplicateTemplate(currentTemplate.id);
    } catch (err) {
      console.error("Duplicate failed:", err);
    } finally {
      setIsDuplicating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-masaar-black/50">
            <Link href="/admin" className="hover:underline">Settings</Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-masaar-black">WhatsApp Templates</span>
          </div>
          <h1 className="text-2xl font-bold text-masaar-black mt-1">WhatsApp Templates &amp; Enquiry Routing</h1>
          <p className="text-xs text-masaar-black/60">
            Manage service-specific enquiry templates, assigned services, CTA wording, and dynamic message tags.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <PrimaryButton type="button" onClick={() => setIsCreating((v) => !v)}>
            {isCreating ? "Cancel" : "+ Create New Template"}
          </PrimaryButton>
        </div>
      </div>

      {isCreating && (
        <form
          action={createTemplate}
          className="rounded-xl border border-dashed border-deep-gold/40 bg-warm-ivory/40 p-5 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-masaar-black">Create New WhatsApp Template</h3>
            <span className="text-[10px] text-masaar-black/50">Generates unique key automatically</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Template Name *" required>
              <input
                type="text"
                name="label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Special Needs Wheelchair Enquiry"
                className={inputClass}
                autoFocus
              />
            </Field>

            <Field label="Assign to Service (Optional)">
              <select
                name="assigned_service_slug"
                value={newAssignedService}
                onChange={(e) => setNewAssignedService(e.target.value)}
                className={inputClass}
              >
                <option value="">-- General / No Specific Service --</option>
                {publishedServices.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Default CTA Button Text">
              <input
                type="text"
                name="default_cta_text"
                value={newCtaText}
                onChange={(e) => setNewCtaText(e.target.value)}
                placeholder="Enquire on WhatsApp"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
            <SecondaryButton type="button" onClick={() => setIsCreating(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={!newLabel.trim()}>
              Save &amp; Create Template
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* 3-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: All Templates (3 cols) */}
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-masaar-black/60">
              Templates ({templates.length})
            </h3>
            <span className="text-[10px] text-masaar-black/40">Select to edit</span>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {templates.map((tmpl) => {
              const isSelected = tmpl.key === selectedKey;
              const assignedService = publishedServices.find((s) => s.slug === tmpl.assigned_service_slug);

              return (
                <button
                  key={tmpl.id || tmpl.key}
                  type="button"
                  onClick={() => selectTemplate(tmpl)}
                  className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-deep-gold bg-warm-ivory/60 ring-1 ring-deep-gold/30 shadow-xs"
                      : "border-black/10 bg-white hover:border-black/20"
                  }`}
                >
                  <span className="text-base mt-0.5">💬</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-xs text-masaar-black truncate">{tmpl.label}</p>
                      {!tmpl.is_active && (
                        <span className="rounded bg-neutral-200 px-1 py-0.2 text-[8px] font-bold text-neutral-600 uppercase shrink-0">
                          Off
                        </span>
                      )}
                    </div>
                    {assignedService ? (
                      <span className="inline-block mt-1 rounded bg-amber-100/80 px-1.5 py-0.5 text-[9px] font-medium text-amber-900 border border-amber-300/40 truncate max-w-full">
                        📌 {assignedService.name}
                      </span>
                    ) : tmpl.assigned_service_slug ? (
                      <span className="inline-block mt-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-mono text-neutral-700">
                        slug: {tmpl.assigned_service_slug}
                      </span>
                    ) : (
                      <span className="inline-block mt-1 text-[9px] text-masaar-black/40">General</span>
                    )}
                    <p className="text-[10px] text-masaar-black/50 truncate mt-1">{tmpl.template_text}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Edit Template Form (5 cols) */}
        <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-5 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              <div>
                <h3 className="font-bold text-base text-masaar-black">Edit Template</h3>
                <p className="text-[11px] text-masaar-black/50 font-mono">key: {currentTemplate?.key}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isDuplicating || !currentTemplate?.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-masaar-black hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Duplicate this template into a new editable copy"
            >
              <span>📋</span>
              <span>{isDuplicating ? "Duplicating..." : "Duplicate"}</span>
            </button>
          </div>

          <form action={updateTemplate.bind(null, currentTemplate?.id || "")} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Template Title *" required>
                <input
                  type="text"
                  name="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Default CTA Button Text" hint="Text shown on website WhatsApp buttons">
                <input
                  type="text"
                  name="default_cta_text"
                  value={defaultCtaText}
                  onChange={(e) => setDefaultCtaText(e.target.value)}
                  placeholder="Enquire on WhatsApp"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Assign to Published Service" hint="When visitors click WhatsApp on this service, this template will be used automatically">
              <select
                name="assigned_service_slug"
                value={assignedServiceSlug}
                onChange={(e) => setAssignedServiceSlug(e.target.value)}
                className={inputClass}
              >
                <option value="">-- No specific service assigned (General) --</option>
                {publishedServices.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name} ({s.category}) — /{s.slug}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Message Template Body *" required>
              <textarea
                id="template_text_input"
                name="template_text"
                rows={10}
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                className={`${inputClass} font-sans text-xs leading-relaxed`}
              />
              <p className="text-right text-[10px] text-masaar-black/40 pt-1">
                {templateText.length} characters
              </p>
            </Field>

            {/* Available Variables Section with Clickable Chips */}
            <div className="space-y-2 rounded-xl border border-black/10 bg-warm-ivory/20 p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-xs text-masaar-black">Available Dynamic Fields</p>
                <span className="text-[10px] text-masaar-black/50">Click to append tag</span>
              </div>
              <p className="text-[10px] text-masaar-black/60">
                Variables are automatically populated from the user context or catalogue selection.
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {VARIABLE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    id={`chip_${chip}`}
                    onClick={() => insertVariable(chip)}
                    className="rounded bg-warm-ivory px-2 py-1 text-[11px] font-mono text-amber-900 border border-amber-300/50 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    {`{{${chip}}}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Placeholders documentation */}
            <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4">
              <p className="font-bold text-xs text-masaar-black">Documented Placeholders</p>
              <p className="text-[10px] text-masaar-black/50">
                Lists which variables this template supports.
              </p>
              <input type="hidden" name="placeholders" value={placeholders.join(",")} />
              <div className="space-y-1.5">
                {placeholders.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="flex flex-col text-[9px] leading-none text-masaar-black/30">
                      <button type="button" onClick={() => movePlaceholder(i, -1)} disabled={i === 0} className="hover:text-masaar-black disabled:opacity-30">▲</button>
                      <button type="button" onClick={() => movePlaceholder(i, 1)} disabled={i === placeholders.length - 1} className="hover:text-masaar-black disabled:opacity-30">▼</button>
                    </span>
                    <span className="flex-1 truncate rounded bg-warm-ivory px-2 py-1 text-[11px] font-mono text-masaar-black/80">{p}</span>
                    <button
                      type="button"
                      onClick={() => removePlaceholder(i)}
                      className="flex size-6 shrink-0 items-center justify-center rounded text-masaar-black/40 hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={placeholderDraft}
                  onChange={(e) => setPlaceholderDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPlaceholder();
                    }
                  }}
                  placeholder="e.g. service_name"
                  className={`${inputClass} text-xs`}
                />
                <SecondaryButton type="button" onClick={addPlaceholder}>Add</SecondaryButton>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <Field label="Display Order" hint="Ordering index in template list">
                <input
                  type="number"
                  name="display_order"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className={`${inputClass} max-w-32`}
                />
              </Field>

              <label className="flex items-center gap-2 text-xs font-semibold text-masaar-black cursor-pointer pt-4">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-black/20 text-deep-gold size-4"
                />
                <span>Active Template (Enabled)</span>
              </label>
            </div>

            <div className="flex items-center justify-end border-t border-black/10 pt-4">
              <PrimaryButton id="save_whatsapp_template_btn" type="submit">
                Save Changes
              </PrimaryButton>
            </div>
          </form>
        </div>

        {/* Right Column: Live WhatsApp Message Preview Phone Mockup (4 cols) */}
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4 lg:col-span-4">
          <div className="flex items-center justify-between text-deep-gold">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <div>
                <h4 className="font-bold text-base text-masaar-black">Live Preview</h4>
                <p className="text-[11px] text-masaar-black/50">Simulated WhatsApp message on customer device</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Phone Mockup Container */}
          <div className="overflow-hidden rounded-2xl border-4 border-black/20 bg-emerald-950/90 shadow-lg">
            {/* Header Bar */}
            <div className="flex items-center justify-between bg-emerald-900 px-4 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-800 font-bold text-white text-xs">
                  MH
                </div>
                <div>
                  <p className="font-bold text-xs">Masaar Holidays</p>
                  <p className="text-[9px] text-emerald-200">Official Business Account</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <span>📹</span>
                <span>📞</span>
              </div>
            </div>

            {/* Chat Body with Wallpaper Pattern & Live Bubble */}
            <div className="min-h-[360px] max-h-[500px] overflow-y-auto bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] bg-emerald-950 p-4">
              <div className="rounded-xl bg-emerald-100 p-3.5 shadow-md space-y-2 text-xs text-emerald-950 font-sans leading-relaxed border-l-4 border-emerald-600">
                <div className="whitespace-pre-wrap font-sans text-xs text-emerald-950">
                  {renderInterpolatedPreview(templateText)}
                </div>
                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-700 pt-1">
                  <span>10:24 AM</span>
                  <span className="font-bold">✓✓</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-emerald-900 p-3">
              <a
                href={`https://wa.me/971557329320?text=${encodeURIComponent(renderInterpolatedPreview(templateText))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-center text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all"
              >
                <span>💬</span>
                <span>Test Open in WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="rounded-lg bg-warm-ivory/50 p-3 text-[11px] text-masaar-black/70 border border-black/5">
            <span className="font-bold text-masaar-black block mb-0.5">ℹ️ Editable by Customer:</span>
            WhatsApp pre-fills the message in the customer's chat box, allowing them to fill out their Name, Travel Date, and any specific notes before tapping send.
          </div>
        </div>
      </div>
    </div>
  );
}
