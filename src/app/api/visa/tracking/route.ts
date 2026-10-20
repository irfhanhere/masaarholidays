import { NextRequest, NextResponse } from "next/server";
import { getVisaApplicationByRef } from "@/lib/data/visa";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const email = searchParams.get("email") || undefined;

  if (!ref) {
    return NextResponse.json({ error: "Reference number is required" }, { status: 400 });
  }

  const { application } = await getVisaApplicationByRef(ref, email);

  if (!application) {
    return NextResponse.json(
      { error: "No matching visa application found. Please verify your reference number." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    token: application.tracking_token,
    referenceNo: application.reference_no,
  });
}
