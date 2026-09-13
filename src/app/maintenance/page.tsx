import Image from "next/image";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { CONTACT } from "@/lib/contact";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";

// System page — noindex, no main nav. Not yet wired to actually gate the
// rest of the site (that needs a middleware/env flag once there's an
// admin "maintenance mode" toggle) — this is the destination page only.
export const metadata = { robots: { index: false, follow: false } };

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-warm-ivory px-6 text-center">
      <Image src="/brand/logo.png" alt="Masaar Holidays" width={200} height={60} className="h-14 w-auto" />
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-masaar-black sm:text-5xl">
          We&apos;ll Be Back Shortly
        </h1>
        <p className="mt-3 text-masaar-black/60">
          Masaar Holidays is currently updating the website. Please check back soon.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <WhatsAppButton message={WHATSAPP_TEMPLATES.general}>WhatsApp Us</WhatsAppButton>
        <a
          href={`tel:+${CONTACT.whatsappPhoneIntl}`}
          className="rounded-md border border-deep-gold px-5 py-3 text-sm font-semibold text-deep-gold"
        >
          Call Us
        </a>
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-masaar-black/40">
        Faith · Clarity · Care · Peace
      </p>
    </div>
  );
}
