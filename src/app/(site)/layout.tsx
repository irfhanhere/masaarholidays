import { OrganizationSchema } from "@/components/site/Breadcrumbs";
import { CurrencyProvider } from "@/components/site/CurrencyProvider";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SiteFloatingWidgets } from "@/components/site/SiteFloatingWidgets";
import { WhatsAppTemplatesProvider } from "@/components/site/WhatsAppTemplatesProvider";
import {
  getActiveUmrahDepartureMonths,
  getCachedCurrencyRates,
  getCachedWhatsAppConfig,
} from "@/lib/data/public";
import { getRequestLocale } from "@/lib/i18n";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [locale, departureMonths, whatsAppConfig, currencyRates] = await Promise.all([
    getRequestLocale(),
    getActiveUmrahDepartureMonths(),
    getCachedWhatsAppConfig(),
    getCachedCurrencyRates(),
  ]);
  const umrahDepartureMonths = departureMonths.map((m) => ({
    label: m.display_label,
    href: `/umrah/departures/${m.slug}`,
  }));

  return (
    <WhatsAppTemplatesProvider
      initialTemplates={whatsAppConfig.templates}
      initialPhoneNumber={whatsAppConfig.phoneNumber}
    >
      <CurrencyProvider initialRates={currencyRates}>
        <OrganizationSchema />
        <Header umrahDepartureMonths={umrahDepartureMonths} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} />
        <SiteFloatingWidgets />
      </CurrencyProvider>
    </WhatsAppTemplatesProvider>
  );
}
