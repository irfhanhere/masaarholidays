import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVisaApplicationByToken } from "@/lib/data/visa";
import { VisaTrackingView } from "@/components/site/VisaTrackingView";
import { buildPageMetadata } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const { application } = await getVisaApplicationByToken(token);

  const refTitle = application ? `Application ${application.reference_no}` : "Visa Application";

  return buildPageMetadata({
    path: `/visa/application/${token}`,
    title: `${refTitle} Status & Tracking | Masaar Holidays`,
    description: "Track your Masaar Holidays visa application progress in real time.",
  });
}

export default async function VisaApplicationTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { application, applicants, documents, payments } = await getVisaApplicationByToken(token);

  if (!application) {
    notFound();
  }

  return (
    <VisaTrackingView
      application={application}
      applicants={applicants}
      documents={documents}
      payments={payments}
    />
  );
}
