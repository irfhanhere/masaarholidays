"use client";

import { useActionState } from "react";
import { Card, Field, PrimaryButton, inputClass } from "@/components/admin/ui";
import type { AboutContentRow, AboutIconItem } from "@/lib/types/database";
import { saveAboutContent, type AboutContentFormState } from "./actions";

const ICON_OPTIONS = [
  "document",
  "heart",
  "group",
  "headset",
  "dome",
  "giving-hand",
  "family",
  "kaaba",
  "handshake",
  "eye",
  "mountain-flag",
];

function IconItemsEditor({
  prefix,
  count,
  items,
  labelPrefix,
}: {
  prefix: string;
  count: number;
  items: AboutIconItem[];
  labelPrefix: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-md border border-black/10 p-3">
          <p className="mb-2 text-xs font-semibold text-masaar-black/60">
            {labelPrefix} {i + 1}
          </p>
          <div className="flex gap-2">
            <select name={`${prefix}_icon_${i}`} defaultValue={items[i]?.icon_key ?? "document"} className={`w-32 shrink-0 ${inputClass}`}>
              {ICON_OPTIONS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
            <input name={`${prefix}_label_${i}`} defaultValue={items[i]?.label ?? ""} placeholder="Label" className={inputClass} />
          </div>
          <textarea
            name={`${prefix}_description_${i}`}
            defaultValue={items[i]?.description ?? ""}
            placeholder="One-line description"
            rows={2}
            className={`mt-2 ${inputClass}`}
          />
        </div>
      ))}
    </div>
  );
}

export function AboutContentForm({ initial }: { initial?: AboutContentRow }) {
  const [state, formAction, isPending] = useActionState<AboutContentFormState, FormData>(saveAboutContent, {
    status: "idle",
  });

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Hero</h2>
        <Field label="Subline">
          <textarea name="hero_subline" rows={2} defaultValue={initial?.hero_subline ?? ""} className={inputClass} />
        </Field>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Our Purpose</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Body Text" hint="Paragraphs separated by a blank line." className="sm:col-span-2">
            <textarea name="purpose_text" rows={4} defaultValue={initial?.purpose_text ?? ""} className={inputClass} />
          </Field>
          <Field label="Pull Quote">
            <textarea name="purpose_quote" rows={2} defaultValue={initial?.purpose_quote ?? ""} className={inputClass} />
          </Field>
          <Field label="Image URL">
            <input name="purpose_image_url" defaultValue={initial?.purpose_image_url ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Founding Story</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Sits between Our Purpose and Vision &amp; Mission. Third-person institutional voice only — no
          first-person language, no named individual.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading" hint='Falls back to "A Promise Kept" if left blank.'>
            <input name="founding_story_heading" defaultValue={initial?.founding_story_heading ?? ""} className={inputClass} />
          </Field>
          <Field label="Image URL">
            <input name="founding_story_image_url" defaultValue={initial?.founding_story_image_url ?? ""} className={inputClass} />
          </Field>
          <Field label="Body Text" hint="Paragraphs separated by a blank line." className="sm:col-span-2">
            <textarea name="founding_story_text" rows={6} defaultValue={initial?.founding_story_text ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Vision &amp; Mission</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Our Vision">
            <textarea name="vision_text" rows={4} defaultValue={initial?.vision_text ?? ""} className={inputClass} />
          </Field>
          <Field label="Our Mission">
            <textarea name="mission_text" rows={4} defaultValue={initial?.mission_text ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Our Values</h2>
        <p className="mb-3 text-sm text-masaar-black/60">The 6-item &quot;Guided by What Matters&quot; grid.</p>
        <IconItemsEditor prefix="core_value" count={6} items={initial?.core_values ?? []} labelPrefix="Value" />
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Sadaqah Jariyah</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Body Text">
            <textarea name="sadaqah_text" rows={4} defaultValue={initial?.sadaqah_text ?? ""} className={inputClass} />
          </Field>
          <Field label="Image URL">
            <input name="sadaqah_image_url" defaultValue={initial?.sadaqah_image_url ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Our Approach</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Body Text">
            <textarea name="approach_text" rows={4} defaultValue={initial?.approach_text ?? ""} className={inputClass} />
          </Field>
          <Field label="Pull Quote">
            <textarea name="approach_quote" rows={4} defaultValue={initial?.approach_quote ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Who We Serve &amp; What Makes Us Different</h2>
        <Field label="Who We Serve — Body Text">
          <textarea name="who_we_serve_text" rows={3} defaultValue={initial?.who_we_serve_text ?? ""} className={inputClass} />
        </Field>
        <p className="mb-3 mt-4 text-sm text-masaar-black/60">The 4-item &quot;What Makes Masaar Different&quot; grid.</p>
        <IconItemsEditor prefix="differentiator" count={4} items={initial?.differentiators ?? []} labelPrefix="Item" />
      </Card>

      <Card className="border-amber-300 bg-amber-50/40">
        <h2 className="mb-1 font-semibold text-masaar-black">Commitment / Founder Section</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Standing rule: never name or imply a specific individual anywhere in this section — first-person
          &quot;we&quot; voice only, signed as a team, not a person.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" hint='e.g. "Our Commitment" — never "A Note from the Founder"'>
            <input name="founder_eyebrow" defaultValue={initial?.founder_eyebrow ?? ""} className={inputClass} />
          </Field>
          <Field label="Image URL">
            <input name="founder_image_url" defaultValue={initial?.founder_image_url ?? ""} className={inputClass} />
          </Field>
          <Field label="Body Text" hint="Paragraphs separated by a blank line." className="sm:col-span-2">
            <textarea name="founder_text" rows={5} defaultValue={initial?.founder_text ?? ""} className={inputClass} />
          </Field>
          <Field label="Pull Quote">
            <textarea name="founder_quote" rows={2} defaultValue={initial?.founder_quote ?? ""} className={inputClass} />
          </Field>
          <Field label="Sign-off" hint='e.g. "With sincere regards,\nThe Masaar Holidays Team" — never a personal name.'>
            <textarea name="founder_signoff" rows={2} defaultValue={initial?.founder_signoff ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <div className="flex justify-end">
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save About Content"}
        </PrimaryButton>
      </div>
    </form>
  );
}
