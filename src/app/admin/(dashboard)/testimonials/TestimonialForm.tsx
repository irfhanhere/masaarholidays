"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, GoldButton, SecondaryButton, inputClass } from "@/components/admin/ui";
import type { TestimonialRow } from "@/lib/types/database";
import { saveTestimonial, type TestimonialFormState } from "./actions";

export function TestimonialForm({ testimonialId, initial }: { testimonialId?: string; initial?: TestimonialRow }) {
  const router = useRouter();
  const action = saveTestimonial.bind(null, testimonialId ?? null);
  const [state, formAction, isPending] = useActionState<TestimonialFormState, FormData>(action, { status: "idle" });

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <h2 className="mb-1 font-semibold text-masaar-black">1. Customer Details</h2>
          <p className="mb-4 text-sm text-masaar-black/60">
            Add the basic details of the customer (only what you are comfortable sharing).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer Name" required hint="You can use initials if preferred (e.g. Ahmed K., A. Khan).">
              <input name="customer_name" defaultValue={initial?.customer_name} required className={inputClass} />
            </Field>
            <Field label="Location" hint="Optional — city or country.">
              <input name="location" defaultValue={initial?.location ?? ""} placeholder="e.g. Dubai, UAE" className={inputClass} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold text-masaar-black">2. Testimonial</h2>
          <p className="mb-4 text-sm text-masaar-black/60">Add the customer&apos;s words. Keep it genuine and simple.</p>
          <Field label="Testimonial Text" required>
            <textarea name="testimonial_text" defaultValue={initial?.testimonial_text} required rows={5} className={inputClass} />
          </Field>
          <div className="mt-4">
            <Field label="Rating" required>
              <select name="rating" defaultValue={initial?.rating ?? 5} className={inputClass}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} Star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold text-masaar-black">3. Context</h2>
          <p className="mb-4 text-sm text-masaar-black/60">Help categorise this testimonial so it can be shown in the right places.</p>
          <Field label="Service" required>
            <select name="service" defaultValue={initial?.service ?? "Umrah"} className={inputClass}>
              {["Umrah", "Hajj", "Hotels", "Transfers", "Visa", "General"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-1 font-semibold text-masaar-black">4. Publishing</h2>
          <p className="mb-4 text-sm text-masaar-black/60">Control how this testimonial appears on the website.</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="status" value="draft" defaultChecked={(initial?.status ?? "draft") === "draft"} />
              Draft (not visible on website)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="status" value="published" defaultChecked={initial?.status === "published"} />
              Published (visible on the website)
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_featured" defaultChecked={initial?.is_featured ?? false} />
            Feature this testimonial
          </label>
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold text-masaar-black">5. Attribution / Consent</h2>
          <p className="mb-4 text-sm text-masaar-black/60">Confirm you have permission to publish this testimonial.</p>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="consent_given" defaultChecked={initial?.consent_given ?? false} className="mt-0.5" />
            Customer has given permission for this testimonial to be published.
          </label>
          <div className="mt-3">
            <Field label="Permission Notes" hint="Optional, for internal reference only.">
              <textarea name="consent_notes" defaultValue={initial?.consent_notes ?? ""} rows={2} className={inputClass} />
            </Field>
          </div>
          <div className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
            Only publish testimonials when you have confirmed the customer&apos;s permission — brief
            Part 4 hard rule: no fake testimonials, ever.
          </div>
        </Card>

        {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

        <div className="flex justify-end gap-2">
          <SecondaryButton type="button" onClick={() => router.push("/admin/testimonials")}>
            Cancel
          </SecondaryButton>
          <GoldButton type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save Testimonial"}
          </GoldButton>
        </div>
      </div>
    </form>
  );
}
