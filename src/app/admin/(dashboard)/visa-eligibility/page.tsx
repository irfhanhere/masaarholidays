import type { Metadata } from "next";
import VisaEligibilityManager from "./VisaEligibilityManager";

export const metadata: Metadata = {
  title: "Eligibility & Documents | Masaar Admin",
  robots: { index: false },
};

export default function VisaEligibilityAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xs text-masaar-black/50">
        <a href="/admin" className="hover:text-masaar-black">Home</a>
        <span>/</span>
        <a href="/admin/visa-types" className="hover:text-masaar-black">Visa Services</a>
        <span>/</span>
        <span className="font-semibold text-masaar-black">Eligibility & Documents</span>
      </div>

      <VisaEligibilityManager />
    </div>
  );
}
