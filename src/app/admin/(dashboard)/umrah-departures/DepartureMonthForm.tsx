"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { UmrahDepartureMonthRow } from "@/lib/types/database";
import { saveDepartureMonth, type DepartureMonthFormState } from "./actions";

export function DepartureMonthForm({
  monthId,
  initial,
}: {
  monthId?: string;
  initial?: UmrahDepartureMonthRow;
}) {
  const router = useRouter();
  const action = saveDepartureMonth.bind(null, monthId ?? null);
  const [state, formAction, isPending] = useActionState<DepartureMonthFormState, FormData>(action, {
    status: "idle",
  });

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <h2 className="mb-4 font-semibold text-masaar-black">1. Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display Label" required hint='e.g. "January" or, once a real departure is confirmed, "January 2027".'>
            <input name="display_label" defaultValue={initial?.display_label} required className={inputClass} />
          </Field>
          <Field label="Slug" required hint='e.g. "january-2027" — sets the page URL, /umrah/departures/[slug]. Set this directly; no year is assumed for you.'>
            <input name="slug" defaultValue={initial?.slug} required className={inputClass} />
          </Field>
          <Field label="Nav / Sort Order" hint="Controls this month's position in the header dropdown — lower shows first.">
            <input type="number" name="sort_order" defaultValue={initial?.sort_order ?? 0} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={initial?.is_active ?? false} />
            Active (visible on the site — shows in the Umrah nav dropdown and the sitemap, and the page stops 404ing)
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">2. Hero</h2>
        <p className="mb-3 text-sm text-masaar-black/60">Shown at the top of this month&apos;s departure page.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hero Headline" hint='Falls back to "Umrah Packages — {Display Label}" if left blank.'>
            <input name="hero_headline" defaultValue={initial?.hero_headline ?? ""} className={inputClass} />
          </Field>
          <Field label="Hero Image URL" hint="Falls back to the standard Umrah banner if left blank.">
            <input name="hero_image_url" defaultValue={initial?.hero_image_url ?? ""} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Hero Subtext" hint='Short seasonal blurb, e.g. "Comfortable autumn temperatures — ideal for elderly pilgrims and families."'>
            <textarea name="hero_subtext" rows={2} defaultValue={initial?.hero_subtext ?? ""} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">3. Info Strip</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          The two cards shown below the hero. Leave either blank to hide that card.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Best For">
            <textarea
              name="best_for_note"
              rows={3}
              defaultValue={initial?.best_for_note ?? ""}
              placeholder="e.g. Ideal for elderly pilgrims and families travelling with children."
              className={inputClass}
            />
          </Field>
          <Field label="Booking Advice">
            <textarea
              name="booking_advice_note"
              rows={3}
              defaultValue={initial?.booking_advice_note ?? ""}
              placeholder="e.g. Book at least 6 weeks ahead — this is one of our most requested months."
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">4. Page SEO</h2>
        <p className="mb-3 text-sm text-masaar-black/60">
          Falls back to a generated title/description from this month&apos;s label when left blank.
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
        <SecondaryButton type="button" onClick={() => router.push("/admin/umrah-departures")}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </PrimaryButton>
      </div>
    </form>
  );
}
