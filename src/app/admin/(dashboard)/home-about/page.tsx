import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { HomeContentForm } from "./HomeContentForm";
import { AboutContentForm } from "./AboutContentForm";

export const metadata = { title: "Home & About Content | Masaar Admin", robots: { index: false } };

export default async function HomeAboutPage() {
  let homeContent = undefined;
  let aboutContent = undefined;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const [{ data: home }, { data: about }] = await Promise.all([
      supabase.from("home_content").select("*").eq("id", 1).maybeSingle(),
      supabase.from("about_content").select("*").eq("id", 1).maybeSingle(),
    ]);
    homeContent = home ?? undefined;
    aboutContent = about ?? undefined;
  }

  return (
    <div>
      <PageHeader
        title="Home & About Content"
        description="The Home page's bottom CTA quote, and every paragraph/quote on the About page. Other Home page copy (hero, Why Masaar, services, tier cards) is fixed in code, same as most other pages."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Home & About Content" }]}
      />

      <h2 className="mb-3 text-lg font-semibold text-masaar-black">Home Page</h2>
      <HomeContentForm initial={homeContent} />

      <h2 className="mb-3 mt-10 text-lg font-semibold text-masaar-black">About Page</h2>
      <AboutContentForm initial={aboutContent} />
    </div>
  );
}
