"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { WhatsAppTemplateRow } from "@/lib/types/database";
import { createTemplate, updateTemplate } from "./actions";

interface Props {
  templates: WhatsAppTemplateRow[];
  activeKey: string;
}

const VARIABLE_CHIPS = [
  "package_name",
  "journey_type",
  "duration",
  "occupancy",
  "hotel_name",
  "hotel_category",
  "departure_month",
  "private_trips",
  "total_price",
  "customer_name",
  "phone",
  "travel_date",
];

const SAMPLE_VALUES: Record<string, string> = {
  package_name: "Essential",
  journey_type: "Makkah Only",
  duration: "2 Nights / 3 Days",
  occupancy: "Double",
  hotel_name: "VOCO Makkah",
  hotel_category: "Premium",
  departure_month: "November 2026",
  private_trips: "Makkah Ziyarat",
  total_price: "AED 3,500",
  customer_name: "Haseeb",
  phone: "+971 55 227 6299",
  travel_date: "15 Nov 2026",
};

export function WhatsAppTemplateEditorClient({ templates, activeKey }: Props) {
  const activeTemplate = templates.find((t) => t.key === activeKey) || templates[0];
  const [selectedKey, setSelectedKey] = useState(activeTemplate?.key || "packageEnquiry");
  const currentTemplate = templates.find((t) => t.key === selectedKey) || activeTemplate;

  const [label, setLabel] = useState(currentTemplate?.label || "Package Enquiry");
  const [templateText, setTemplateText] = useState(
    currentTemplate?.template_text ||
      "Assalamu Alaikum,\n\nI would like to enquire about the {{package_name}} package.\n\nJourney: {{journey_type}}\nDuration: {{duration}}\nOccupancy: {{occupancy}}\nHotel: {{hotel_name}}\nTravel Month: {{departure_month}}\nPrivate Trips: {{private_trips}}\n\nCould you please share more details, including availability and the total cost?\n\nJazakAllah Khair."
  );
  const [isActive, setIsActive] = useState(currentTemplate?.is_active ?? true);
  const [placeholders, setPlaceholders] = useState<string[]>(currentTemplate?.placeholders ?? []);
  const [placeholderDraft, setPlaceholderDraft] = useState("");
  const [displayOrder, setDisplayOrder] = useState(currentTemplate?.display_order ?? 0);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  function selectTemplate(tmpl: WhatsAppTemplateRow) {
    setSelectedKey(tmpl.key);
    setLabel(tmpl.label);
    setTemplateText(tmpl.template_text);
    setIsActive(tmpl.is_active);
    setPlaceholders(tmpl.placeholders ?? []);
    setDisplayOrder(tmpl.display_order);
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
          <h1 className="text-2xl font-bold text-masaar-black mt-1">WhatsApp Templates</h1>
          <p className="text-xs text-masaar-black/60">
            Create and manage WhatsApp message templates with dynamic variables.
          </p>
        </div>

        <PrimaryButton type="button" onClick={() => setIsCreating((v) => !v)}>
          {isCreating ? "Cancel" : "+ Create New Template"}
        </PrimaryButton>
      </div>

      {isCreating && (
        <form
          action={createTemplate}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-deep-gold/40 bg-warm-ivory/40 p-4"
        >
          <Field label="New Template Name *" required>
            <input
              type="text"
              name="label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Extra Nights Enquiry"
              className={inputClass}
              autoFocus
            />
          </Field>
          <PrimaryButton type="submit" disabled={!newLabel.trim()}>
            Create
          </PrimaryButton>
        </form>
      )}

      {/* 3-Column Layout (Matching ADMIN - WHATSAPP TEMPLATES.png) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: All Templates (3 cols) */}
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4 lg:col-span-3">
          <h3 className="font-bold text-sm text-masaar-black uppercase tracking-wider text-masaar-black/50">
            All Templates
          </h3>
          <div className="space-y-2">
            {templates.map((tmpl) => {
              const isSelected = tmpl.key === selectedKey;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => selectTemplate(tmpl)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-deep-gold bg-warm-ivory/60 ring-1 ring-deep-gold/30"
                      : "border-black/10 bg-white hover:border-black/20"
                  }`}
                >
                  <span className="text-lg">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-masaar-black truncate">{tmpl.label}</p>
                    <p className="text-[10px] text-masaar-black/50 truncate mt-0.5">{tmpl.template_text}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Edit Template Form (5 cols) */}
        <div className="rounded-xl border border-black/10 bg-white p-6 shadow-2xs space-y-5 lg:col-span-5">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <div>
              <h3 className="font-bold text-base text-masaar-black">Edit Template</h3>
              <p className="text-[11px] text-masaar-black/50">Use variables to automatically insert package details.</p>
            </div>
          </div>

          <form action={updateTemplate.bind(null, currentTemplate?.id || "")} className="space-y-4">
            <Field label="Template Name *" required>
              <input
                type="text"
                name="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Template Category *">
              <select className={inputClass} defaultValue="Package">
                <option value="Package">Package</option>
                <option value="Hotel">Hotel</option>
                <option value="Private Trip">Private Trip</option>
                <option value="General">General</option>
                <option value="Visa">Visa</option>
              </select>
            </Field>

            <Field label="Message Template *">
              <textarea
                id="template_text_input"
                name="template_text"
                rows={9}
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                className={inputClass}
              />
              <p className="text-right text-[10px] text-masaar-black/40 pt-1">
                {templateText.length}/1000
              </p>
            </Field>

            {/* Available Variables Section with Clickable Chips */}
            <div className="space-y-2 rounded-xl border border-black/10 bg-warm-ivory/20 p-4">
              <p className="font-bold text-xs text-masaar-black">Available Variables</p>
              <p className="text-[10px] text-masaar-black/50">Click on a variable to insert it into your message.</p>

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

            {/* Placeholders — addable/removable/reorderable, saved as a real column separate from the {{variable}} chips above */}
            <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4">
              <p className="font-bold text-xs text-masaar-black">Placeholders</p>
              <p className="text-[10px] text-masaar-black/50">
                Documents which variables this template supports — shown to whoever edits it later, independent of what the message text currently uses.
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
                  placeholder="e.g. package_name"
                  className={`${inputClass} text-xs`}
                />
                <SecondaryButton type="button" onClick={addPlaceholder}>Add</SecondaryButton>
              </div>
            </div>

            <Field label="Display Order" hint="Lower numbers appear first in the template list on the left.">
              <input
                type="number"
                name="display_order"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className={`${inputClass} max-w-32`}
              />
            </Field>

            <div className="flex items-center justify-between border-t border-black/10 pt-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-masaar-black cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-black/20 text-deep-gold"
                />
                Active Template
              </label>

              <PrimaryButton id="save_whatsapp_template_btn" type="submit">
                Save Template
              </PrimaryButton>
            </div>
          </form>
        </div>

        {/* Right Column: Live WhatsApp Message Preview Phone Mockup (4 cols) */}
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xs space-y-4 lg:col-span-4">
          <div className="flex items-center gap-2 text-deep-gold">
            <span className="text-lg">💬</span>
            <div>
              <h4 className="font-bold text-base text-masaar-black">Message Preview</h4>
              <p className="text-[11px] text-masaar-black/50">This is how the message will look with actual data.</p>
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
                  <p className="text-[9px] text-emerald-200">Business Account</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <span>📹</span>
                <span>📞</span>
              </div>
            </div>

            {/* Chat Body with Wallpaper Pattern & Live Bubble */}
            <div className="min-h-[300px] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] bg-emerald-950 p-4">
              <div className="rounded-xl bg-emerald-100 p-3.5 shadow-md space-y-2 text-xs text-emerald-950 font-sans leading-relaxed border-l-4 border-emerald-600">
                <div className="whitespace-pre-wrap">
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
              <button
                type="button"
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-center text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all"
              >
                💬 Send Test Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
