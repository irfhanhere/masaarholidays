import type { Metadata } from "next";
import VisaPaymentsClient from "./VisaPaymentsClient";

export const metadata: Metadata = {
  title: "Visa Payments | Masaar Admin",
  robots: { index: false },
};

export default function VisaPaymentsAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xs text-masaar-black/50">
        <a href="/admin" className="hover:text-masaar-black">Home</a>
        <span>/</span>
        <a href="/admin/visa-types" className="hover:text-masaar-black">Visa Services</a>
        <span>/</span>
        <span className="font-semibold text-masaar-black">Payments</span>
      </div>

      <VisaPaymentsClient />
    </div>
  );
}
