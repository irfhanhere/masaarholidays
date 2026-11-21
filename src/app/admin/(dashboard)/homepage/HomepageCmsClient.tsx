"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  GoldButton,
  Card,
  Field,
  inputClass,
  Badge,
} from "@/components/admin/ui";
import type { HomepageCmsSettings } from "@/lib/data/homepage-cms";
import type { PremiumPackage } from "@/lib/types/premium-package";
import { saveHomepageCmsSettingsAction } from "./actions";

interface Props {
  initialSettings: HomepageCmsSettings;
  packages: PremiumPackage[];
}

export function HomepageCmsClient({ initialSettings, packages }: Props) {
  const [settings, setSettings] = useState<HomepageCmsSettings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const update = <K extends keyof HomepageCmsSettings>(key: K, value: HomepageCmsSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveHomepageCmsSettingsAction(settings);
      if (res.success && res.data) {
        setSettings(res.data);
        showToast(res.message, "success");
      } else {
        showToast(res.message || "Failed to save settings", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-xs font-semibold shadow-lg transition-all ${
            toast.type === "success" ? "bg-emerald-900 text-white" : "bg-red-800 text-white"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠"}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Homepage Content Management"
        description="Control the content, visibility, packages, and messaging for key sections of the homepage."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Website Management" },
          { label: "Homepage Content" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-masaar-black hover:bg-admin-surface transition-colors"
            >
              <span>Preview Homepage</span>
              <span>↗</span>
            </Link>

            <PrimaryButton onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving Changes..." : "Publish Homepage Changes"}
            </PrimaryButton>
          </div>
        }
      />

      <div className="space-y-6">
        {/* A. TAMARA HIGHLIGHT SECTION */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div>
              <h2 className="text-base font-bold text-masaar-black">A. Tamara Payment Highlight Section</h2>
              <p className="text-xs text-masaar-black/60">
                Official Tamara online payment promotion banner appearing below the homepage hero.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-masaar-black cursor-pointer">
              <input
                type="checkbox"
                checked={settings.tamara_enabled}
                onChange={(e) => update("tamara_enabled", e.target.checked)}
                className="size-4 rounded text-deep-gold"
              />
              <span>Section Visible</span>
            </label>
          </div>

          <div className="rounded-md bg-amber-50/70 p-3 text-xs text-amber-900 border border-amber-200/60 space-y-1">
            <span className="font-bold">Compliance Note:</span>
            <p>
              Use only approved, neutral merchant copy. Do not make unsupported claims regarding Sharia compliance, zero interest, or guaranteed credit approvals. This section controls promotional visibility only and does not disable actual checkout gateways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Section Heading" required>
              <input
                type="text"
                value={settings.tamara_heading}
                onChange={(e) => update("tamara_heading", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Background Style">
              <select
                value={settings.tamara_bg_style}
                onChange={(e) => update("tamara_bg_style", e.target.value as any)}
                className={inputClass}
              >
                <option value="default">Default (Warm Ivory Tint)</option>
                <option value="warm-ivory">Warm Ivory (#F7F4ED)</option>
                <option value="white">Pure White (#FFFFFF)</option>
              </select>
            </Field>
          </div>

          <Field label="Section Subtitle / Description" required>
            <textarea
              rows={2}
              value={settings.tamara_subtitle}
              onChange={(e) => update("tamara_subtitle", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Supporting Card Text">
            <input
              type="text"
              value={settings.tamara_supporting_text}
              onChange={(e) => update("tamara_supporting_text", e.target.value)}
              className={inputClass}
            />
          </Field>
        </Card>

        {/* B. FEATURED UMRAH PACKAGE SECTION */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div>
              <h2 className="text-base font-bold text-masaar-black">B. Featured Package Section</h2>
              <p className="text-xs text-masaar-black/60">
                Primary spotlight package showcased in the Featured Umrah Packages section.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-masaar-black cursor-pointer">
              <input
                type="checkbox"
                checked={settings.featured_package_enabled}
                onChange={(e) => update("featured_package_enabled", e.target.checked)}
                className="size-4 rounded text-deep-gold"
              />
              <span>Section Visible</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Section Header Title">
              <input
                type="text"
                value={settings.featured_package_heading}
                onChange={(e) => update("featured_package_heading", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Select Featured Package">
              <select
                value={settings.featured_package_slug}
                onChange={(e) => update("featured_package_slug", e.target.value)}
                className={inputClass}
              >
                {packages.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title} ({p.slug})
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        {/* C. BEST SELLING PACKAGE SECTION */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div>
              <h2 className="text-base font-bold text-masaar-black">C. Best Selling Package Section</h2>
              <p className="text-xs text-masaar-black/60">
                Promotes the official Best Selling Umrah journey with hotel and room pricing breakdowns.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-masaar-black cursor-pointer">
              <input
                type="checkbox"
                checked={settings.best_selling_enabled}
                onChange={(e) => update("best_selling_enabled", e.target.checked)}
                className="size-4 rounded text-deep-gold"
              />
              <span>Section Visible</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Best Selling Section Title">
              <input
                type="text"
                value={settings.best_selling_heading}
                onChange={(e) => update("best_selling_heading", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Select Best Selling Package">
              <select
                value={settings.best_selling_slug}
                onChange={(e) => update("best_selling_slug", e.target.value)}
                className={inputClass}
              >
                {packages.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title} ({p.slug})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Section Subtitle / Description">
            <textarea
              rows={2}
              value={settings.best_selling_description}
              onChange={(e) => update("best_selling_description", e.target.value)}
              className={inputClass}
            />
          </Field>
        </Card>

        {/* D. EXPLORE MORE UMRAH PACKAGES SECTION */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div>
              <h2 className="text-base font-bold text-masaar-black">D. Explore More Umrah Packages Section</h2>
              <p className="text-xs text-masaar-black/60">
                Invitation banner connecting homepage visitors to the comprehensive Umrah package catalog.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-masaar-black cursor-pointer">
              <input
                type="checkbox"
                checked={settings.explore_more_enabled}
                onChange={(e) => update("explore_more_enabled", e.target.checked)}
                className="size-4 rounded text-deep-gold"
              />
              <span>Section Visible</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Section Heading" required>
              <input
                type="text"
                value={settings.explore_more_heading}
                onChange={(e) => update("explore_more_heading", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Button Label" required>
              <input
                type="text"
                value={settings.explore_more_button_label}
                onChange={(e) => update("explore_more_button_label", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Section Description" required>
            <textarea
              rows={2}
              value={settings.explore_more_description}
              onChange={(e) => update("explore_more_description", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Button Destination URL" required hint="Must start with / (e.g. /umrah)">
            <input
              type="text"
              value={settings.explore_more_button_url}
              onChange={(e) => update("explore_more_button_url", e.target.value)}
              className={inputClass}
            />
          </Field>
        </Card>
      </div>
    </div>
  );
}
