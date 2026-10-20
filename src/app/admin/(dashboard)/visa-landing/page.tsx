import type { Metadata } from "next";
import VisaLandingEditor from "./VisaLandingEditor";

export const metadata: Metadata = {
  title: "Visa Landing Page Content | Masaar Admin",
  robots: { index: false },
};

export default function VisaLandingAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xs text-masaar-black/50">
        <a href="/admin" className="hover:text-masaar-black">Home</a>
        <span>/</span>
        <a href="/admin/visa-types" className="hover:text-masaar-black">Visa Services</a>
        <span>/</span>
        <span className="font-semibold text-masaar-black">Landing Page Content</span>
      </div>

      <VisaLandingEditor />
    </div>
  );
}
