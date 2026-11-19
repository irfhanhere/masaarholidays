import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Tamara Return URL Status Handler
 *
 * Receives customer return redirects from Tamara checkout_url.
 * IMPORTANT: Financial status is NEVER updated here; only authoritative webhooks
 * and verified server-side calls transition payment state to 'paid'.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") || "success").toLowerCase();
  const orderId = searchParams.get("orderId") || searchParams.get("order_id") || searchParams.get("payment_id") || "";
  const orderReferenceId = searchParams.get("orderReferenceId") || searchParams.get("ref") || "";
  const serviceType = searchParams.get("type") || "";
  const token = searchParams.get("token") || "";

  const siteOrigin = getSiteOrigin();
  const supabase = createAdminClient();

  // If customer cancelled checkout
  if (status === "cancel" || status === "canceled") {
    if (serviceType === "esim") {
      return NextResponse.redirect(`${siteOrigin}/esim?tamara_cancelled=1`);
    }
    if (serviceType === "transfer") {
      return NextResponse.redirect(`${siteOrigin}/transfers?tamara_cancelled=1`);
    }
    return NextResponse.redirect(`${siteOrigin}/saudi-visa?tamara_cancelled=1`);
  }

  // If customer failed checkout / declined
  if (status === "failure" || status === "declined" || status === "failed") {
    if (serviceType === "esim") {
      return NextResponse.redirect(`${siteOrigin}/esim?tamara_failed=1`);
    }
    if (serviceType === "transfer") {
      return NextResponse.redirect(`${siteOrigin}/transfers?tamara_failed=1`);
    }
    return NextResponse.redirect(`${siteOrigin}/saudi-visa?tamara_failed=1`);
  }

  // Success Return: Locate the underlying order record to redirect customer to confirmation
  if (orderReferenceId.startsWith("MH-SV-") || orderReferenceId.startsWith("MH-VA-")) {
    const { data: visaApp } = await supabase
      .from("visa_applications")
      .select("reference_no, tracking_token")
      .or(`reference_no.eq.${orderReferenceId},tamara_order_id.eq.${orderId}`)
      .maybeSingle();

    if (visaApp) {
      return NextResponse.redirect(
        `${siteOrigin}/saudi-visa/confirmation?ref=${encodeURIComponent(visaApp.reference_no)}&token=${encodeURIComponent(visaApp.tracking_token)}&tamara=1`
      );
    }
  }

  if (orderReferenceId.startsWith("MH-TRF-")) {
    const { data: booking } = await supabase
      .from("transfer_bookings")
      .select("public_token")
      .or(`booking_ref.eq.${orderReferenceId},tamara_order_id.eq.${orderId}`)
      .maybeSingle();

    if (booking) {
      return NextResponse.redirect(
        `${siteOrigin}/transfers/booking/success?token=${encodeURIComponent(booking.public_token)}&tamara=1`
      );
    }
  }

  if (orderReferenceId.startsWith("MH-") && !orderReferenceId.startsWith("MH-SV-") && !orderReferenceId.startsWith("MH-VA-") && !orderReferenceId.startsWith("MH-TRF-")) {
    const { data: esimOrder } = await supabase
      .from("esim_orders")
      .select("public_token")
      .or(`partner_ref.eq.${orderReferenceId},tamara_order_id.eq.${orderId}`)
      .maybeSingle();

    if (esimOrder) {
      return NextResponse.redirect(
        `${siteOrigin}/esim/order/${encodeURIComponent(esimOrder.public_token)}?tamara=1`
      );
    }
  }

  // Fallback token redirect if supplied
  if (token) {
    if (serviceType === "esim") {
      return NextResponse.redirect(`${siteOrigin}/esim/order/${encodeURIComponent(token)}?tamara=1`);
    }
    if (serviceType === "transfer") {
      return NextResponse.redirect(`${siteOrigin}/transfers/booking/success?token=${encodeURIComponent(token)}&tamara=1`);
    }
    return NextResponse.redirect(`${siteOrigin}/saudi-visa/confirmation?token=${encodeURIComponent(token)}&tamara=1`);
  }

  // Default redirect
  return NextResponse.redirect(`${siteOrigin}/?tamara_completed=1`);
}
