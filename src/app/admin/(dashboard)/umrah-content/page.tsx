import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DEFAULT_UMRAH_CONTENT } from "@/lib/data/public";
import { UmrahContentForm } from "./UmrahContentForm";
import type { UmrahContentRow } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Umrah Page Content | Masaar Admin",
  robots: { index: false },
};

export default async function UmrahContentAdminPage() {
  let umrahContent: UmrahContentRow = DEFAULT_UMRAH_CONTENT;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("umrah_content")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (data) {
      umrahContent = data;
    }
  }

  return (
    <div>
      <PageHeader
        title="Umrah Page Content"
        description="Manage the Guided Umrah Assistance section copy, ritual features, duration, and feature badges shown on the /umrah page."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Umrah Page Content" },
        ]}
      />

      <UmrahContentForm initial={umrahContent} />
    </div>
  );
}
