import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getVisaApplicationByToken, getVisaApplicationByRef } from "@/lib/data/visa";
import { SaudiVisaConfirmationClient } from "@/components/site/SaudiVisaConfirmationClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Application Received | Saudi Tourist Visa | Masaar Holidays",
  description: "Your Masaar Holidays Saudi Visa application has been received successfully.",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  searchParams: Promise<{
    ref?: string;
    token?: string;
    session_id?: string;
    tabby?: string;
  }>;
}

export default async function SaudiVisaConfirmationPage({ searchParams }: PageProps) {
  const { ref, token } = await searchParams;

  let applicationData = null;

  if (token) {
    applicationData = await getVisaApplicationByToken(token);
  } else if (ref) {
    applicationData = await getVisaApplicationByRef(ref);
  }

  if (!applicationData || !applicationData.application) {
    redirect("/saudi-visa");
  }

  return (
    <SaudiVisaConfirmationClient
      application={applicationData.application}
      applicants={applicationData.applicants}
      payments={applicationData.payments}
    />
  );
}
