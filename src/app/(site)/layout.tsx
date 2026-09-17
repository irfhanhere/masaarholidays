import { CurrencyProvider } from "@/components/site/CurrencyProvider";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { LanguagePrompt } from "@/components/site/LanguagePrompt";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { WhatsAppTemplatesProvider } from "@/components/site/WhatsAppTemplatesProvider";
import { getActiveUmrahDepartureMonths } from "@/lib/data/public";
import { getRequestLocale } from "@/lib/i18n";

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
        <Header umrahDepartureMonths={umrahDepartureMonths} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} />
        <WhatsAppFloat />
        <LanguagePrompt />
      </CurrencyProvider>
    </WhatsAppTemplatesProvider>
  );
}
