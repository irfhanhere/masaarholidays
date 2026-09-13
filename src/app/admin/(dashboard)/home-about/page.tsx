import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata = { title: "Home & About Content | Masaar Admin", robots: { index: false } };

export default function HomeAboutPage() {
  return (
    <ComingSoon
      title="Home & About Content"
      description="Edit the Home and About page sections (Why Masaar, Vision & Mission, Values, Founder's Note, etc.) once final copy is approved."
      inspirationFile="ADMIN-HOME&ABOUT CONTENT.png"
    />
  );
}
