"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  PageHeader,
  PrimaryButton,
  Card,
  Field,
  inputClass,
  Badge,
} from "@/components/admin/ui";
import type { PaymentDisplaySettings } from "@/lib/data/payment-display-settings";
import { savePaymentDisplaySettingsAction } from "./actions";

interface Props {
  initialSettings: PaymentDisplaySettings;
}

export function PaymentDisplaySettingsClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState<PaymentDisplaySettings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const update = <K extends keyof PaymentDisplaySettings>(key: K, value: PaymentDisplaySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await savePaymentDisplaySettingsAction(settings);
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
        title="Payment Display Settings"
        description="Configure public-facing payment highlights, promotional messages, and customer WhatsApp enquiry routing."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Website Management" },
          { label: "Payment Display Settings" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <PrimaryButton onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving Settings..." : "Save Payment Display Settings"}
            </PrimaryButton>
          </div>
        }
      />

      {/* Architecture Safety Notice */}
      <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-4 text-xs text-blue-900 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-sm">
          <span>🛡</span>
          <span>Security & Architectural Separation</span>
        </div>
        <p className="leading-relaxed">
          These settings strictly manage customer-facing website promotional copy, payment badge visibility, and WhatsApp assistance guidance. They <strong>do not</strong> activate or deactivate backend checkout gateways, modify Tabby or Tamara API credentials, or alter live webhook subscriptions. Gateway API keys and webhook secrets remain secured in environment variables.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. TABBY PROMOTIONAL SETTINGS */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-masaar-black">1. Tabby Promotional Display</span>
                {!settings.tabby_promo_enabled ? (
                  <Badge tone="amber">Customer UI Disabled</Badge>
                ) : (
                  <Badge tone="green">Promotions Active</Badge>
                )}
              </div>
              <p className="text-xs text-masaar-black/60 mt-0.5">
                Controls customer enquiry notices and promotional badges across Saudi Visa, eSIM, and Worldwide Visa checkouts.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-masaar-black cursor-pointer">
              <input
                type="checkbox"
                checked={settings.tabby_promo_enabled}
                onChange={(e) => update("tabby_promo_enabled", e.target.checked)}
                className="size-4 rounded text-deep-gold"
              />
              <span>Public Promotion Enabled</span>
            </label>
          </div>

          <Field
            label="Customer Enquiry Notice (Shown on Checkout Pages)"
            hint="Displayed to visitors interested in paying with Tabby while online onboarding continues."
            required
          >
            <textarea
              rows={3}
              value={settings.tabby_enquiry_message}
              onChange={(e) => update("tabby_enquiry_message", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="WhatsApp Destination Phone Number (wa.me format, no leading + or spaces)"
            hint="Must be a confirmed Masaar Holidays business WhatsApp contact (e.g. 971557329320)."
            required
          >
            <input
              type="text"
              value={settings.tabby_whatsapp_number}
              onChange={(e) => update("tabby_whatsapp_number", e.target.value.replace(/[^0-9]/g, ""))}
              className={inputClass}
            />
          </Field>
        </Card>

        {/* 2. TAMARA PROMOTIONAL SETTINGS */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-masaar-black">2. Tamara Promotional Display</span>
                {settings.tamara_promo_enabled ? (
                  <Badge tone="green">Highlight Visible</Badge>
                ) : (
                  <Badge tone="gray">Highlight Hidden</Badge>
                )}
              </div>
              <p className="text-xs text-masaar-black/60 mt-0.5">
                Controls the promotional highlight banner on the homepage and badge callouts.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-masaar-black cursor-pointer">
              <input
                type="checkbox"
                checked={settings.tamara_promo_enabled}
                onChange={(e) => update("tamara_promo_enabled", e.target.checked)}
                className="size-4 rounded text-deep-gold"
              />
              <span>Promotional Highlight Visible</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Promotional Heading" required>
              <input
                type="text"
                value={settings.tamara_heading}
                onChange={(e) => update("tamara_heading", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Official Logo Asset Path">
              <input
                type="text"
                value={settings.tamara_logo_url}
                onChange={(e) => update("tamara_logo_url", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Promotional Description" required>
            <textarea
              rows={2}
              value={settings.tamara_description}
              onChange={(e) => update("tamara_description", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Display Priority Order (lower numbers appear higher)">
            <input
              type="number"
              value={settings.tamara_display_order}
              onChange={(e) => update("tamara_display_order", parseInt(e.target.value) || 1)}
              className="w-32 rounded border border-black/15 px-3 py-1.5 text-xs"
            />
          </Field>
        </Card>
      </div>
    </div>
  );
}
