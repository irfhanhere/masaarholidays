import { buildWhatsAppLink } from "@/lib/contact";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";
import { WhatsAppGlyph } from "./WhatsAppButton";

/** The fixed bottom-right WhatsApp bubble present on every approved screen. */
export function WhatsAppFloat() {
  return (
    <a
      href={buildWhatsAppLink(WHATSAPP_TEMPLATES.general)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Masaar Holidays on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsAppGlyph className="size-7" />
    </a>
  );
}
