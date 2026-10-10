import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { EsimBrowser } from "@/components/site/EsimBrowser";
import { getEsimPlans } from "@/lib/data/esim";
import { buildStaticPageMetadata } from "@/lib/i18n";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata({
    path: "/esim",
    fallbackTitle: "Prepaid Travel eSIM for Saudi Arabia, UAE & More | Masaar Holidays",
    fallbackDescription:
      "Prepaid travel eSIM for Saudi Arabia, UAE and more. High-speed 4G/5G data coverage for Umrah pilgrims and international travelers. Order on WhatsApp, install before you fly.",
  });
}

export default async function EsimPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country } = await searchParams;
  const plans = await getEsimPlans();

  return (
    <>
      <Breadcrumbs items={[{ label: "eSIM" }]} />
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center bg-[#FAF7F2]">
            <div className="size-8 animate-spin rounded-full border-2 border-[#C9A227] border-t-transparent" />
          </div>
        }
      >
        <EsimBrowser plans={plans} initialCountry={country ?? "SA"} />
      </Suspense>
    </>
  );
}
