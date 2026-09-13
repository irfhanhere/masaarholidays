import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata = { title: "Legal & Cookies | Masaar Admin", robots: { index: false } };

export default function LegalPage() {
  return (
    <ComingSoon
      title="Legal & Cookies"
      description="Edit Privacy Policy, Terms & Conditions, Accessibility and Cookie preferences copy — all pending legal review."
      inspirationFile="ADMIN-PRIVACY-POLICY.png"
    />
  );
}
