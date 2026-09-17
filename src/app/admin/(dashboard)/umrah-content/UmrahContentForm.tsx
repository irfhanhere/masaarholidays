"use client";

import { useActionState, useState } from "react";
import { Card, Field, PrimaryButton, inputClass } from "@/components/admin/ui";
import type { UmrahContentRow } from "@/lib/types/database";
import { saveUmrahContent, type UmrahContentFormState } from "./actions";

export function UmrahContentForm({ initial }: { initial?: UmrahContentRow }) {
  const [state, formAction, isPending] = useActionState<UmrahContentFormState, FormData>(
    saveUmrahContent,
    { status: "idle" }
  );

  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const features = initial?.guided_assistance_features || [
    { title: "Sunnah-Guided", description: "Step-by-step guidance strictly according to Sunnah" },
    { title: "Side-by-Side Support", description: "Accompanies you through Tawaf, Sa'ai, and prayers" },
    { title: "Recitation Support", description: "Helps lead and recite supplications (duas) throughout" },
  ];

  const badgesText = (
    initial?.guided_assistance_badges || [
      "Personal & Dedicated Guide",
      "Authentic Sunnah Guidance",
      "End-to-End Ritual Companion (3-4 Hours)",
    ]
  ).join("\n");

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "success" && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 border border-green-200">
          ✓ {state.message}
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-200">
          ✕ {state.message}
        </div>
      )}

      {/* 1. Visibility & Header Card */}
      <Card>
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <div>
            <h2 className="font-semibold text-masaar-black">Guided Umrah Assistance Section</h2>
            <p className="text-xs text-masaar-black/60 mt-0.5">
              Controls the ritual guidance section rendered on the /umrah page directly above &quot;Every Package Includes&quot;.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-masaar-black cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-black/20 text-deep-gold focus:ring-deep-gold"
            />
            Show on Website
          </label>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow Kicker" hint='e.g. "RITUAL GUIDANCE"'>
            <input
              name="guided_assistance_eyebrow"
              defaultValue={initial?.guided_assistance_eyebrow ?? "RITUAL GUIDANCE"}
              className={inputClass}
            />
          </Field>

          <Field label="Section Heading" hint='e.g. "Guided Umrah Assistance"'>
            <input
              name="guided_assistance_heading"
              defaultValue={initial?.guided_assistance_heading ?? "Guided Umrah Assistance"}
              required
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Duration Line / Badge" hint='e.g. "~3-4 hours (full ritual coverage)"'>
            <input
              name="guided_assistance_duration"
              defaultValue={initial?.guided_assistance_duration ?? "~3-4 hours (full ritual coverage)"}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Supporting Description Paragraph">
            <textarea
              name="guided_assistance_description"
              rows={3}
              defaultValue={
                initial?.guided_assistance_description ??
                "Step-by-step spiritual and practical accompaniment through your Umrah rituals, ensuring peace of mind and strict adherence to the Sunnah."
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      {/* 2. Feature Badges / Pills */}
      <Card>
        <h2 className="font-semibold text-masaar-black">Feature Badges / Pills</h2>
        <p className="text-xs text-masaar-black/60 mt-0.5 mb-4">
          Enter one feature badge per line (e.g. &quot;Personal &amp; Dedicated Guide&quot;).
        </p>
        <Field label="Badges (one per line)">
          <textarea
            name="badges"
            rows={4}
            defaultValue={badgesText}
            placeholder="Personal & Dedicated Guide&#10;Authentic Sunnah Guidance&#10;End-to-End Ritual Companion (3-4 Hours)"
            className={inputClass}
          />
        </Field>
      </Card>

      {/* 3. Three Feature Lines / Cards */}
      <Card>
        <h2 className="font-semibold text-masaar-black">Three Feature Lines / Cards</h2>
        <p className="text-xs text-masaar-black/60 mt-0.5 mb-6">
          The 3 core ritual guidance features displayed on the /umrah page.
        </p>

        <div className="space-y-6">
          {/* Feature 1 */}
          <div className="rounded-lg border border-black/10 bg-admin-surface/30 p-4">
            <p className="text-xs font-bold text-deep-gold uppercase tracking-wider mb-3">Feature 1</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-masaar-black/80">Title</label>
                <input
                  name="feature_1_title"
                  defaultValue={features[0]?.title ?? "Sunnah-Guided"}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-masaar-black/80">Description</label>
                <input
                  name="feature_1_description"
                  defaultValue={features[0]?.description ?? "Step-by-step guidance strictly according to Sunnah"}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="rounded-lg border border-black/10 bg-admin-surface/30 p-4">
            <p className="text-xs font-bold text-deep-gold uppercase tracking-wider mb-3">Feature 2</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-masaar-black/80">Title</label>
                <input
                  name="feature_2_title"
                  defaultValue={features[1]?.title ?? "Side-by-Side Support"}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-masaar-black/80">Description</label>
                <input
                  name="feature_2_description"
                  defaultValue={features[1]?.description ?? "Accompanies you through Tawaf, Sa'ai, and prayers"}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="rounded-lg border border-black/10 bg-admin-surface/30 p-4">
            <p className="text-xs font-bold text-deep-gold uppercase tracking-wider mb-3">Feature 3</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-masaar-black/80">Title</label>
                <input
                  name="feature_3_title"
                  defaultValue={features[2]?.title ?? "Recitation Support"}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-masaar-black/80">Description</label>
                <input
                  name="feature_3_description"
                  defaultValue={features[2]?.description ?? "Helps lead and recite supplications (duas) throughout"}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save Umrah Content"}
        </PrimaryButton>
      </div>
    </form>
  );
}
