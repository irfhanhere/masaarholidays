"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { VisaTypeRow } from "@/lib/types/database";
import { saveVisaType, type VisaTypeFormState } from "./actions";

const FEATURE_ICON_OPTIONS = [
  { value: "document", label: "Document" },
  { value: "headset", label: "Headset / Support" },
  { value: "clock", label: "Clock / Up-to-date" },
  { value: "heart", label: "Heart / Care" },
  { value: "group", label: "Group / People" },
  { value: "shield", label: "Shield / Protection" },
  { value: "passport", label: "Passport" },
  { value: "flight", label: "Flight" },
];

function IconSelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <select name={name} defaultValue={defaultValue ?? "document"} className={inputClass}>
      {FEATURE_ICON_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function VisaTypeForm({ visaTypeId, initial }: { visaTypeId?: string; initial?: VisaTypeRow }) {
  const router = useRouter();
  const action = saveVisaType.bind(null, visaTypeId ?? null);
  const [state, formAction, isPending] = useActionState<VisaTypeFormState, FormData>(action, { status: "idle" });

  const features = initial?.features ?? [];
  const benefits = initial?.benefits ?? [];

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <h2 className="mb-4 font-semibold text-masaar-black">1. Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required hint='e.g. "Umrah Visa", "Golden Visa Assistance".'>
            <input name="name" defaultValue={initial?.name} required className={inputClass} />
          </Field>
          <Field label="Slug" required hint='Sets the page URL, /visa/[slug] — e.g. "umrah", "golden-visa-assistance".'>
            <input name="slug" defaultValue={initial?.slug} required className={inputClass} />
          </Field>
          <Field label="Card Description" hint="One line shown on the /visa landing page card.">
            <input name="description" defaultValue={initial?.description ?? ""} className={inputClass} />
          </Field>
          <Field label="Display Order" hint="Position on the /visa landing page grid — lower shows first.">
            <input type="number" name="display_order" defaultValue={initial?.display_order ?? 0} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Audience Text" hint="Optional short 'who it's for' note.">
            <input name="audience_text" defaultValue={initial?.audience_text ?? ""} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? true} />
            Active (visible on /visa and reachable at /visa/[slug])
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">2. Hero</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Shown at the top of this type&apos;s detail page. Eyebrow is derived automatically from Name.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hero Headline" hint="Falls back to Name if left blank.">
            <input name="hero_headline" defaultValue={initial?.hero_headline ?? ""} className={inputClass} />
          </Field>
          <Field label="Hero Image URL" hint="Falls back to a generic banner if left blank.">
            <input name="hero_image_url" defaultValue={initial?.hero_image_url ?? ""} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Hero Intro" hint="1-2 sentence paragraph under the headline.">
            <textarea name="hero_intro" rows={2} defaultValue={initial?.hero_intro ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">3. Feature Strip</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          The 4 icon + label items shown below the hero. Leave a label blank to skip that slot.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="w-40 shrink-0">
                <IconSelect name="feature_icon" defaultValue={features[i]?.icon_key} />
              </div>
              <input
                name="feature_label"
                defaultValue={features[i]?.label ?? ""}
                placeholder={`Feature ${i + 1} label`}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">4. Benefits</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Optional &quot;Benefits&quot; section shown below the feature strip — title + short description each. Leave a
          title blank to skip that slot. Section is hidden entirely when every slot is empty.
        </p>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr]">
              <input
                name="benefit_title"
                defaultValue={benefits[i]?.title ?? ""}
                placeholder={`Benefit ${i + 1} title`}
                className={inputClass}
              />
              <input
                name="benefit_description"
                defaultValue={benefits[i]?.description ?? ""}
                placeholder={`Benefit ${i + 1} description`}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">5. Documents Required — Intro</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          The document cards themselves are managed below, once this visa type is saved.
        </p>
        <Field label="Intro Line">
          <textarea
            name="documents_intro"
            rows={2}
            defaultValue={initial?.documents_intro ?? ""}
            placeholder="The following documents are typically required. Requirements may vary based on your nationality."
            className={inputClass}
          />
        </Field>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">6. Important Information</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Warning-style callout shown on the detail page. One paragraph per line. Falls back to a
          generic disclaimer if left blank.
        </p>
        <textarea
          name="important_info_text"
          rows={4}
          defaultValue={initial?.important_info_text ?? ""}
          className={inputClass}
        />
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">7. Who May Need This Service?</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Optional bullet list, one item per line. Leave blank to hide this section entirely — only
          visa types with this populated show it.
        </p>
        <textarea
          name="who_needs_this_text"
          rows={4}
          defaultValue={(initial?.who_needs_this ?? []).join("\n")}
          placeholder={"Individuals seeking long-term UAE residency\nInvestors, entrepreneurs and skilled professionals\nFamilies wishing to sponsor dependents"}
          className={inputClass}
        />
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">8. Bottom CTA</h2>
        <Field label="CTA Note" hint='Small note under the Call/WhatsApp buttons, e.g. "Our team is available to assist you during working hours."'>
          <input name="cta_note" defaultValue={initial?.cta_note ?? ""} className={inputClass} />
        </Field>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">9. Page SEO</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Falls back to a generated title/description from this visa type&apos;s name and intro when left blank.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meta Title">
            <input name="meta_title" defaultValue={initial?.meta_title ?? ""} className={inputClass} />
          </Field>
          <Field label="Meta Description">
            <input name="meta_description" defaultValue={initial?.meta_description ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <div className="flex justify-end gap-2">
        <SecondaryButton type="button" onClick={() => router.push("/admin/visa-types")}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </PrimaryButton>
      </div>
    </form>
  );
}
