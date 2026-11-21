import type { Metadata } from "next";
import { getPaymentDisplaySettings } from "@/lib/data/payment-display-settings";
import { PaymentDisplaySettingsClient } from "./PaymentDisplaySettingsClient";

export const metadata: Metadata = {
  title: "Payment Display Settings | Masaar Admin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function PaymentDisplaySettingsPage() {
  const settings = await getPaymentDisplaySettings();

  return <PaymentDisplaySettingsClient initialSettings={settings} />;
}
