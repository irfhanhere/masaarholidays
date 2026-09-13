import { CONTACT } from "@/lib/contact";
import { Container } from "./Container";

export function TopBar() {
  return (
    <div className="bg-masaar-black text-white">
      <Container className="flex h-9 items-center justify-between text-xs tracking-wide">
        <p className="hidden sm:block">FAITH &nbsp;·&nbsp; CLARITY &nbsp;·&nbsp; CARE &nbsp;·&nbsp; PEACE</p>
        <div className="flex items-center gap-4">
          <a href={`tel:+${CONTACT.whatsappPhoneIntl}`} className="hover:text-light-gold">
            {CONTACT.phoneDisplay}
          </a>
          <span className="hidden text-white/30 sm:inline">|</span>
          <span className="hidden sm:inline">Support via WhatsApp</span>
        </div>
      </Container>
    </div>
  );
}
