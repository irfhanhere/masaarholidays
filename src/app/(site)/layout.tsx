import dynamic from "next/dynamic";
import { OrganizationSchema } from "@/components/site/Breadcrumbs";
import { CurrencyProvider } from "@/components/site/CurrencyProvider";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { WhatsAppTemplatesProvider } from "@/components/site/WhatsAppTemplatesProvider";
import { getActiveUmrahDepartureMonths } from "@/lib/data/public";
import { getRequestLocale } from "@/lib/i18n";

const WhatsAppFloat = dynamic(() => import("@/components/site/WhatsAppFloat").then((m) => m.WhatsAppFloat), { ssr: false });
const DirectCallFloat = dynamic(() => import("@/components/site/DirectCallFloat").then((m) => m.DirectCallFloat), { ssr: false });
const ScrollToTopButton = dynamic(() => import("@/components/site/ScrollToTopButton").then((m) => m.ScrollToTopButton), { ssr: false });
const LanguagePrompt = dynamic(() => import("@/components/site/LanguagePrompt").then((m) => m.LanguagePrompt), { ssr: false });

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [locale, departureMonths] = await Promise.all([
    getRequestLocale(),
    getActiveUmrahDepartureMonths(),
  ]);
  const umrahDepartureMonths = departureMonths.map((m) => ({
    label: m.display_label,
    href: `/umrah/departures/${m.slug}`,
  }));

  return (
    <WhatsAppTemplatesProvider>
      <CurrencyProvider>
        <OrganizationSchema />
        <Header umrahDepartureMonths={umrahDepartureMonths} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} />
        <WhatsAppFloat />
        <DirectCallFloat />
        <ScrollToTopButton />
        <LanguagePrompt />
      </CurrencyProvider>
    </WhatsAppTemplatesProvider>
  );
}
