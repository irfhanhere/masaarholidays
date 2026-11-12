import { CONTACT } from "@/lib/contact";
import { Container } from "./Container";

export function TopBar() {
  return (
    <div className="bg-masaar-black text-white">
      <Container className="flex h-9 items-center justify-between text-xs tracking-wide">
        <p className="hidden sm:block">FAITH &nbsp;·&nbsp; CLARITY &nbsp;·&nbsp; CARE &nbsp;·&nbsp; PEACE</p>
        <div className="flex items-center gap-3 text-[11px] sm:gap-4 sm:text-xs">
          <a
            href={`tel:${CONTACT.landlineTel}`}
            className="flex items-center gap-1 font-semibold text-pure-gold hover:text-light-gold"
            title="Masaar Office Landline"
          >
            <span aria-hidden="true">☎</span>
            <span>{CONTACT.landlineDisplay}</span>
          </a>
          <span className="text-white/30">|</span>
          <a
            href={`tel:+${CONTACT.whatsappPhoneIntl}`}
            className="hover:text-light-gold"
            title="Direct Mobile & WhatsApp"
          >
            {CONTACT.phoneDisplay}
          </a>
          <span className="hidden text-white/30 md:inline">|</span>
          <span className="hidden md:inline">Support via WhatsApp</span>
        </div>
      </Container>
    </div>
  );
}
