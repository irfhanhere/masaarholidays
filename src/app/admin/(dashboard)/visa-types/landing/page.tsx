import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { VisaLandingContentForm } from "./VisaLandingContentForm";

export const metadata = { title: "Visa Landing Page Content | Masaar Admin", robots: { index: false } };

export default async function VisaLandingContentPage() {
  const supabase = await createClient();
  const { data: content } = await supabase.from("visa_landing_content").select("*").eq("id", 1).maybeSingle();

  return (
    <div>
      <PageHeader
        title="Visa Landing Page Content"
        description='The Important Information + CTA section shown at the bottom of /visa, below the 6 visa type cards. General copy, not specific to any one visa type.'
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Visa Types", href: "/admin/visa-types" },
          { label: "Landing Page Content" },
        ]}
      />
      <VisaLandingContentForm initial={content ?? undefined} />
    </div>
  );
}
