/**
 * Responsive, branded email templates for Masaar Holidays.
 *
 * Identity Guidelines:
 * - Masaar Black: #0A0A08
 * - Pure Gold: #C9A227
 * - Deep Gold: #997A15
 * - Warm Ivory: #F7F4ED
 * - White: #FFFFFF
 *
 * All customer inputs are HTML-escaped to prevent injection.
 */

function escapeHtml(str: string | number | null | undefined): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function baseLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F4ED; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0A0A08; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F4ED; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 4px 16px rgba(10, 10, 8, 0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0A0A08; padding: 32px 28px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #C9A227; text-transform: uppercase;">MASAAR HOLIDAYS</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <span style="font-size: 11px; letter-spacing: 1.5px; color: #FFFFFF; opacity: 0.75; text-transform: uppercase;">Premium Travel &amp; Concierge Services</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold Accent Strip -->
          <tr>
            <td height="4" style="background-color: #C9A227; line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAFAF7; padding: 24px 32px; border-top: 1px solid #EFECE4; text-align: center;">
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #0A0A08;">Masaar Holidays Travel &amp; Tourism LLC</p>
              <p style="margin: 4px 0 0; font-size: 11px; color: #666660;">Dubai &amp; Sharjah, United Arab Emirates</p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #666660;">
                Support: <a href="mailto:care@masaarholidays.com" style="color: #997A15; text-decoration: none; font-weight: 600;">care@masaarholidays.com</a> &nbsp;|&nbsp;
                WhatsApp: <a href="https://wa.me/971501234567" style="color: #997A15; text-decoration: none; font-weight: 600;">+971 50 123 4567</a>
              </p>
              <p style="margin: 14px 0 0; font-size: 10px; color: #999990;">
                &copy; ${new Date().getFullYear()} Masaar Holidays. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Payment Confirmation Email (Customer)
 */
export function renderPaymentConfirmationEmail(params: {
  customerName: string;
  serviceName: string;
  referenceNo: string;
  amountPaid: number | string;
  currency: string;
  paymentDate?: string;
  paymentMethod?: string;
  trackingUrl?: string;
  nextSteps?: string;
}): { subject: string; html: string } {
  const safeName = escapeHtml(params.customerName || "Valued Customer");
  const safeRef = escapeHtml(params.referenceNo);
  const safeService = escapeHtml(params.serviceName);
  const safeAmount = typeof params.amountPaid === "number" ? params.amountPaid.toFixed(2) : escapeHtml(params.amountPaid);
  const safeCurrency = escapeHtml(params.currency.toUpperCase());
  const safeDate = escapeHtml(params.paymentDate || new Date().toLocaleDateString("en-US", { dateStyle: "long" }));
  const safeMethod = escapeHtml(params.paymentMethod || "Credit / Debit Card (Stripe)");

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0A0A08;">Payment Confirmed</h1>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #333330;">
      Assalamu Alaikum <strong>${safeName}</strong>,
    </p>
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #333330;">
      Thank you for your payment. We have successfully received your payment for <strong>${safeService}</strong>.
    </p>

    <!-- Payment Receipt Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F4ED; border: 1px solid #E5E0D5; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #333330;">
            <tr>
              <td style="padding-bottom: 8px; color: #666660;">Reference:</td>
              <td align="right" style="padding-bottom: 8px; font-weight: 700; color: #0A0A08;">${safeRef}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; color: #666660;">Service:</td>
              <td align="right" style="padding-bottom: 8px; font-weight: 600;">${safeService}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; color: #666660;">Payment Date:</td>
              <td align="right" style="padding-bottom: 8px;">${safeDate}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; color: #666660;">Payment Method:</td>
              <td align="right" style="padding-bottom: 8px;">${safeMethod}</td>
            </tr>
            <tr style="border-top: 1px solid #D5CEBE;">
              <td style="padding-top: 10px; font-size: 14px; font-weight: 700; color: #0A0A08;">Total Paid:</td>
              <td align="right" style="padding-top: 10px; font-size: 16px; font-weight: 700; color: #997A15;">${safeCurrency} ${safeAmount}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Next Steps Notice -->
    <div style="background-color: #FFFFFF; border-left: 4px solid #C9A227; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.5; color: #333330;">
      <p style="margin: 0; font-weight: 700; color: #0A0A08;">Next Steps:</p>
      <p style="margin: 4px 0 0; color: #555550;">
        ${escapeHtml(
          params.nextSteps ||
            "Our team is now processing your request. Please note that payment confirmation confirms application submission, while visa issuance and government decisions remain subject to official destination authority approval."
        )}
      </p>
    </div>

    ${
      params.trackingUrl
        ? `
    <div style="text-align: center; margin-top: 28px;">
      <a href="${escapeHtml(params.trackingUrl)}" style="display: inline-block; background-color: #C9A227; color: #0A0A08; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 6px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">View Order Status &rarr;</a>
    </div>`
        : ""
    }
  `;

  return {
    subject: `Payment Confirmed: ${params.serviceName} (${params.referenceNo}) — Masaar Holidays`,
    html: baseLayout("Payment Confirmed", content),
  };
}

/**
 * 2. Visa Application Received Email (Customer)
 */
export function renderVisaApplicationReceivedEmail(params: {
  customerName: string;
  referenceNo: string;
  visaType?: string;
  productTitle?: string;
  duration?: string;
  applicantNames?: string[];
  trackingUrl: string;
  reviewTimeline?: string;
}): { subject: string; html: string } {
  const safeName = escapeHtml(params.customerName);
  const safeRef = escapeHtml(params.referenceNo);
  const safeVisa = escapeHtml(params.visaType || params.productTitle || "Tourist Visa");
  const safeDuration = escapeHtml(params.duration || "Standard");
  const safeTimeline = escapeHtml(params.reviewTimeline || "3 to 5 working days");
  const names = Array.isArray(params.applicantNames) && params.applicantNames.length > 0
    ? params.applicantNames
    : [params.customerName || "Applicant 1"];
  const applicantsHtml = names.map((n) => `<li>${escapeHtml(n)}</li>`).join("");

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0A0A08;">Visa Application Received</h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #333330;">
      Assalamu Alaikum <strong>${safeName}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #333330;">
      Your visa application for <strong>${safeVisa} (${safeDuration})</strong> has been received by our processing specialists under reference: <strong>${safeRef}</strong>.
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F4ED; border: 1px solid #E5E0D5; border-radius: 8px; margin-bottom: 24px; padding: 18px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #997A15; letter-spacing: 0.5px;">Applicants Included:</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #0A0A08; line-height: 1.6;">
            ${applicantsHtml}
          </ul>
          <p style="margin: 14px 0 0; font-size: 12px; color: #666660;">
            Estimated Processing Time: <strong>${safeTimeline}</strong>
          </p>
        </td>
      </tr>
    </table>

    <!-- Important Distinction Disclaimer -->
    <div style="background-color: #FFFFFF; border: 1px solid #E5E0D5; border-left: 4px solid #C9A227; padding: 16px; margin-bottom: 24px; font-size: 12px; line-height: 1.5; color: #444440;">
      <p style="margin: 0; font-weight: 700; color: #0A0A08;">Important Information:</p>
      <p style="margin: 4px 0 0;">
        Our team reviews every document for compliance prior to official submission. Visa approval, processing delays, and issuance are at the sole discretion of destination immigration authorities.
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${escapeHtml(params.trackingUrl)}" style="display: inline-block; background-color: #C9A227; color: #0A0A08; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 6px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Track Your Application &rarr;</a>
    </div>
  `;

  return {
    subject: `Visa Application Received: ${params.referenceNo} (${params.visaType}) — Masaar Holidays`,
    html: baseLayout("Visa Application Received", content),
  };
}

/**
 * 3. Transport Booking Confirmation Email (Customer)
 */
export function renderTransportBookingConfirmedEmail(params: {
  customerName: string;
  bookingRef: string;
  routeName: string;
  vehicleName: string;
  travelDate: string;
  pickupTime: string;
  passengers: number;
  pickupLocation: string;
  dropoffLocation: string;
  amountPaid: string | number;
  currency: string;
  flightNumber?: string | null;
  voucherUrl?: string;
}): { subject: string; html: string } {
  const safeName = escapeHtml(params.customerName);
  const safeRef = escapeHtml(params.bookingRef);
  const safeRoute = escapeHtml(params.routeName);
  const safeVehicle = escapeHtml(params.vehicleName);
  const safeDate = escapeHtml(params.travelDate);
  const safeTime = escapeHtml(params.pickupTime);
  const safePickup = escapeHtml(params.pickupLocation);
  const safeDropoff = escapeHtml(params.dropoffLocation);
  const safeAmount = escapeHtml(params.amountPaid);
  const safeCurrency = escapeHtml(params.currency.toUpperCase());

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0A0A08;">Private Transfer Confirmed</h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #333330;">
      Assalamu Alaikum <strong>${safeName}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #333330;">
      Your private chauffeur transfer has been confirmed under Booking Reference: <strong>${safeRef}</strong>.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F4ED; border: 1px solid #E5E0D5; border-radius: 8px; margin-bottom: 24px; padding: 20px;">
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #333330;">
            <tr>
              <td style="padding-bottom: 8px; color: #666660; width: 40%;">Route:</td>
              <td align="right" style="padding-bottom: 8px; font-weight: 700; color: #0A0A08;">${safeRoute}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; color: #666660;">Vehicle:</td>
              <td align="right" style="padding-bottom: 8px; font-weight: 600;">${safeVehicle}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; color: #666660;">Date &amp; Time:</td>
              <td align="right" style="padding-bottom: 8px; font-weight: 600;">${safeDate} at ${safeTime}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; color: #666660;">Passengers:</td>
              <td align="right" style="padding-bottom: 8px;">${params.passengers}</td>
            </tr>
            ${
              params.flightNumber
                ? `
            <tr>
              <td style="padding-bottom: 8px; color: #666660;">Flight Number:</td>
              <td align="right" style="padding-bottom: 8px; font-weight: 600;">${escapeHtml(params.flightNumber)}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding-bottom: 8px; color: #666660;">Pickup:</td>
              <td align="right" style="padding-bottom: 8px;">${safePickup}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; color: #666660;">Drop-off:</td>
              <td align="right" style="padding-bottom: 8px;">${safeDropoff}</td>
            </tr>
            <tr style="border-top: 1px solid #D5CEBE;">
              <td style="padding-top: 10px; font-weight: 700;">Total Paid:</td>
              <td align="right" style="padding-top: 10px; font-weight: 700; color: #997A15;">${safeCurrency} ${safeAmount}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="background-color: #FFFFFF; border-left: 4px solid #C9A227; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.5; color: #444440;">
      <p style="margin: 0; font-weight: 700; color: #0A0A08;">Chauffeur Coordination:</p>
      <p style="margin: 4px 0 0;">
        Your driver details and vehicle number plate will be dispatched via WhatsApp/SMS prior to your scheduled pickup time.
      </p>
    </div>

    ${
      params.voucherUrl
        ? `
    <div style="text-align: center; margin-top: 24px;">
      <a href="${escapeHtml(params.voucherUrl)}" style="display: inline-block; background-color: #C9A227; color: #0A0A08; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 6px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">View Booking Voucher &rarr;</a>
    </div>`
        : ""
    }
  `;

  return {
    subject: `Transfer Booking Confirmed: ${params.bookingRef} (${params.routeName}) — Masaar Holidays`,
    html: baseLayout("Transfer Booking Confirmed", content),
  };
}

/**
 * 4. eSIM Order Confirmation Email (Customer)
 */
export function renderEsimOrderConfirmedEmail(params: {
  customerName: string;
  orderRef: string;
  planName: string;
  dataGb: number;
  validityDays: number;
  qrCodeUrl?: string;
  lpaString?: string;
  instructionsUrl?: string;
}): { subject: string; html: string } {
  const safeName = escapeHtml(params.customerName);
  const safeRef = escapeHtml(params.orderRef);
  const safePlan = escapeHtml(params.planName);

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0A0A08;">Your Travel eSIM is Ready</h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #333330;">
      Assalamu Alaikum <strong>${safeName}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #333330;">
      Thank you for your order. Your travel eSIM for <strong>${safePlan}</strong> (${params.dataGb} GB · ${params.validityDays} Days) has been provisioned under reference: <strong>${safeRef}</strong>.
    </p>

    ${
      params.qrCodeUrl
        ? `
    <div style="text-align: center; background-color: #FFFFFF; border: 1px solid #E5E0D5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #997A15;">Scan QR Code to Install:</p>
      <img src="${escapeHtml(params.qrCodeUrl)}" alt="eSIM QR Code" width="200" height="200" style="display: block; margin: 0 auto; max-width: 100%; border: 1px solid #EAEAEA; border-radius: 6px;">
      <p style="margin: 12px 0 0; font-size: 11px; color: #666660;">Go to Settings &gt; Cellular / Mobile Data &gt; Add eSIM / Data Plan</p>
    </div>`
        : ""
    }

    ${
      params.lpaString
        ? `
    <div style="background-color: #F7F4ED; border: 1px solid #E5E0D5; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #666660;">Manual Activation Code (LPA):</p>
      <code style="display: block; background: #FFFFFF; border: 1px solid #DDD; padding: 8px; font-size: 11px; word-break: break-all; color: #0A0A08;">${escapeHtml(params.lpaString)}</code>
    </div>`
        : ""
    }

    <p style="margin: 0 0 20px; font-size: 13px; line-height: 1.5; color: #555550;">
      Note: We recommend installing your eSIM before departure or via Wi-Fi at your destination airport.
    </p>

    ${
      params.instructionsUrl
        ? `
    <div style="text-align: center; margin-top: 24px;">
      <a href="${escapeHtml(params.instructionsUrl)}" style="display: inline-block; background-color: #C9A227; color: #0A0A08; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 6px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">View Activation Guide &rarr;</a>
    </div>`
        : ""
    }
  `;

  return {
    subject: `Your Travel eSIM: ${params.planName} (${params.orderRef}) — Masaar Holidays`,
    html: baseLayout("Your Travel eSIM is Ready", content),
  };
}

/**
 * 5. Additional Information / Document Request Email (Customer)
 */
export function renderDocumentRequestEmail(params: {
  customerName: string;
  referenceNo: string;
  requestedDocs: string[];
  secureUploadUrl: string;
  notes?: string;
}): { subject: string; html: string } {
  const safeName = escapeHtml(params.customerName);
  const safeRef = escapeHtml(params.referenceNo);
  const docList = params.requestedDocs.map((d) => `<li>${escapeHtml(d)}</li>`).join("");

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0A0A08;">Action Required: Document Update Needed</h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #333330;">
      Assalamu Alaikum <strong>${safeName}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #333330;">
      Our visa processing specialist reviewed application <strong>${safeRef}</strong> and requires the following document(s) or clarification before filing with destination authorities:
    </p>

    <div style="background-color: #F7F4ED; border: 1px solid #E5E0D5; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #997A15;">Requested Items:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #0A0A08; line-height: 1.6;">
        ${docList}
      </ul>
      ${
        params.notes
          ? `
      <p style="margin: 12px 0 0; font-size: 12px; color: #555550; border-top: 1px dashed #D5CEBE; pt: 8px;">
        <strong>Specialist Note:</strong> ${escapeHtml(params.notes)}
      </p>`
          : ""
      }
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${escapeHtml(params.secureUploadUrl)}" style="display: inline-block; background-color: #C9A227; color: #0A0A08; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 6px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Upload Documents Securely &rarr;</a>
    </div>
  `;

  return {
    subject: `Action Required: Documents Needed for Application ${params.referenceNo} — Masaar Holidays`,
    html: baseLayout("Document Update Needed", content),
  };
}

/**
 * 6. Application or Booking Status Update Email (Customer)
 */
export function renderStatusUpdateEmail(params: {
  customerName: string;
  serviceName: string;
  referenceNo: string;
  newStatus: string;
  statusNote?: string;
  trackingUrl: string;
}): { subject: string; html: string } {
  const safeName = escapeHtml(params.customerName);
  const safeRef = escapeHtml(params.referenceNo);
  const safeService = escapeHtml(params.serviceName);
  const safeStatus = escapeHtml(params.newStatus);

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0A0A08;">Application Status Update</h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #333330;">
      Assalamu Alaikum <strong>${safeName}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #333330;">
      The status of your <strong>${safeService}</strong> (${safeRef}) has been updated to:
    </p>

    <div style="background-color: #F7F4ED; border: 1px solid #E5E0D5; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #0A0A08; color: #C9A227; font-weight: 700; font-size: 14px; padding: 6px 18px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
        ${safeStatus}
      </span>
      ${
        params.statusNote
          ? `
      <p style="margin: 12px 0 0; font-size: 13px; color: #555550;">
        ${escapeHtml(params.statusNote)}
      </p>`
          : ""
      }
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${escapeHtml(params.trackingUrl)}" style="display: inline-block; background-color: #C9A227; color: #0A0A08; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 6px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">View Live Progress &rarr;</a>
    </div>
  `;

  return {
    subject: `Status Update: ${params.referenceNo} is now ${params.newStatus} — Masaar Holidays`,
    html: baseLayout("Status Update", content),
  };
}

/**
 * 7. Refund Confirmed Email (Customer)
 */
export function renderRefundConfirmedEmail(params: {
  customerName: string;
  serviceName: string;
  referenceNo: string;
  refundAmount: string | number;
  currency: string;
  reason?: string;
}): { subject: string; html: string } {
  const safeName = escapeHtml(params.customerName);
  const safeRef = escapeHtml(params.referenceNo);
  const safeService = escapeHtml(params.serviceName);
  const safeAmount = typeof params.refundAmount === "number" ? params.refundAmount.toFixed(2) : escapeHtml(params.refundAmount);
  const safeCurrency = escapeHtml(params.currency.toUpperCase());

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0A0A08;">Refund Processed</h1>
    <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #333330;">
      Assalamu Alaikum <strong>${safeName}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #333330;">
      A refund has been confirmed for your booking / order <strong>${safeRef}</strong> (${safeService}).
    </p>

    <div style="background-color: #F7F4ED; border: 1px solid #E5E0D5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #333330;">
        <tr>
          <td style="color: #666660; padding-bottom: 6px;">Refund Amount:</td>
          <td align="right" style="font-size: 16px; font-weight: 700; color: #0A0A08; padding-bottom: 6px;">${safeCurrency} ${safeAmount}</td>
        </tr>
        ${
          params.reason
            ? `
        <tr>
          <td style="color: #666660;">Reason / Details:</td>
          <td align="right">${escapeHtml(params.reason)}</td>
        </tr>`
            : ""
        }
      </table>
    </div>

    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #666660;">
      The refunded amount will credit back to your original payment method within 5 to 10 standard banking business days.
    </p>
  `;

  return {
    subject: `Refund Processed: ${params.referenceNo} — Masaar Holidays`,
    html: baseLayout("Refund Processed", content),
  };
}

/**
 * 8. Internal Operations Alert Email (Staff)
 */
export function renderInternalOpsAlertEmail(params: {
  eventType: string;
  referenceNo: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceType: string;
  amount?: string | number;
  currency?: string;
  adminUrl: string;
  extraDetails?: Record<string, string>;
}): { subject: string; html: string } {
  const safeEvent = escapeHtml(params.eventType);
  const safeRef = escapeHtml(params.referenceNo);
  const safeName = escapeHtml(params.customerName);
  const safeEmail = escapeHtml(params.customerEmail);
  const safePhone = escapeHtml(params.customerPhone || "N/A");

  const extraRows = params.extraDetails
    ? Object.entries(params.extraDetails)
        .map(
          ([k, v]) =>
            `<tr><td style="color: #666660; padding-bottom: 4px;">${escapeHtml(k)}:</td><td align="right" style="padding-bottom: 4px; font-weight: 600;">${escapeHtml(v)}</td></tr>`
        )
        .join("")
    : "";

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #0A0A08;">[Operations Alert] ${safeEvent}</h1>
    <p style="margin: 0 0 18px; font-size: 13px; color: #444440;">
      A new verified event has been recorded in the Masaar Holidays system requiring operational awareness:
    </p>

    <div style="background-color: #F7F4ED; border: 1px solid #E5E0D5; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #333330;">
        <tr>
          <td style="color: #666660; padding-bottom: 6px;">Reference:</td>
          <td align="right" style="font-weight: 700; color: #0A0A08; padding-bottom: 6px;">${safeRef}</td>
        </tr>
        <tr>
          <td style="color: #666660; padding-bottom: 6px;">Customer:</td>
          <td align="right" style="font-weight: 600; padding-bottom: 6px;">${safeName}</td>
        </tr>
        <tr>
          <td style="color: #666660; padding-bottom: 6px;">Email:</td>
          <td align="right" style="padding-bottom: 6px;">${safeEmail}</td>
        </tr>
        <tr>
          <td style="color: #666660; padding-bottom: 6px;">Phone:</td>
          <td align="right" style="padding-bottom: 6px;">${safePhone}</td>
        </tr>
        ${
          params.amount != null
            ? `
        <tr>
          <td style="color: #666660; padding-bottom: 6px;">Amount:</td>
          <td align="right" style="font-weight: 700; color: #997A15; padding-bottom: 6px;">${escapeHtml(params.currency || "USD")} ${escapeHtml(params.amount)}</td>
        </tr>`
            : ""
        }
        ${extraRows}
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${escapeHtml(params.adminUrl)}" style="display: inline-block; background-color: #0A0A08; color: #C9A227; font-weight: 700; font-size: 12px; padding: 10px 24px; border-radius: 6px; text-decoration: none; text-transform: uppercase;">Open Admin Record &rarr;</a>
    </div>
  `;

  return {
    subject: `[ALERT] ${params.eventType}: ${params.referenceNo} (${params.customerName})`,
    html: baseLayout(`Alert: ${params.eventType}`, content),
  };
}

export {
  renderTransportBookingConfirmedEmail as renderTransportConfirmationEmail,
  renderEsimOrderConfirmedEmail as renderEsimOrderConfirmationEmail,
  renderRefundConfirmedEmail as renderRefundConfirmationEmail,
};
