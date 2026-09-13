import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata = { title: "Page SEO | Masaar Admin", robots: { index: false } };

export default function PageSeoPage() {
  return (
    <ComingSoon
      title="Page SEO"
      description="Per-page title/meta description overrides. The current values live in each page's metadata export, matching content-seo-starter-kit.md Section 2 exactly."
      inspirationFile="ADMIN-PAGE SEO EDITOR.png"
    />
  );
}
