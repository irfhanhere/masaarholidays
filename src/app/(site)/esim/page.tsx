import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { EsimBrowser } from "@/components/site/EsimBrowser";
import { getEsimPlans } from "@/lib/data/esim";
import { buildStaticPageMetadata } from "@/lib/i18n";
import { isEsimVatEnabled, getEsimVatPct } from "@/lib/vat";
import { isEsimLive } from "@/lib/esim-launch";
import { verifyEsimAccess } from "@/lib/esim-launch-server";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const meta = await buildStaticPageMetadata({
    path: "/esim",
    fallbackTitle: "Saudi Arabia eSIM for Umrah and Hajj travellers | Masaar Holidays",
    fallbackDescription:
      "Saudi Arabia eSIM for Umrah and Hajj travellers. High-speed prepaid mobile data, hotspot sharing, and WhatsApp activation. Install on Wi-Fi before you fly.",
  });

  // When launch mode is off or preview, do not index eSIM pages in search engines
  if (!isEsimLive()) {
    return {
      ...meta,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return meta;
}

export default async function EsimPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; validity?: string; data?: string; preview?: string }>;
}) {
  const { country, validity, data, preview } = await searchParams;

  // Block access with 404 when mode is off / preview unless preview key or cookie matches
  const hasAccess = await verifyEsimAccess({ previewParam: preview });
  if (!hasAccess) {
    notFound();
  }

  const plans = await getEsimPlans();
  const vatEnabled = isEsimVatEnabled();
  const vatPct = getEsimVatPct();

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
        <EsimBrowser
          plans={plans}
          initialCountry={country ?? "SA"}
          initialValidity={validity}
          initialData={data}
          vatEnabled={vatEnabled}
          vatPct={vatPct}
        />
      </Suspense>
    </>
  );
}
