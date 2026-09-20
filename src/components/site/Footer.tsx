import Image from "next/image";
import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { localizedPath, type Locale } from "@/lib/locale-constants";
import { FOOTER_COMPANY_NAV, FOOTER_SERVICES_NAV } from "@/lib/nav";
import { Container } from "./Container";
import { FacebookIcon, InstagramIcon, LinkedInIcon } from "./icons";

export function Footer({ locale }: { locale: Locale }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-masaar-black text-white">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src="/brand/logo-reverse.png"
            alt="Masaar Holidays"
            width={200}
            height={60}
            className="h-14 w-auto"
          />
          <p className="mt-3 text-sm text-white/60">
            Faith-led travel, with clarity, care and peace at every step.
          </p>
        </div>

        <FooterColumn title="Our Services" links={FOOTER_SERVICES_NAV} locale={locale} />
        <FooterColumn title="Company" links={FOOTER_COMPANY_NAV} locale={locale} />

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-pure-gold">
            Stay Connected
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>{CONTACT.phoneDisplay}</li>
            <li>{CONTACT.emailGeneral}</li>
          </ul>
          <div className="mt-4 flex items-center gap-2.5">
            <a
              href={CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Masaar Holidays on Instagram"
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-pure-gold hover:text-pure-gold"
            >
              <InstagramIcon className="size-4" />
            </a>
            <a
              href={CONTACT.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Masaar Holidays on Facebook"
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-pure-gold hover:text-pure-gold"
            >
              <FacebookIcon className="size-4" />
            </a>
            <a
              href={CONTACT.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Masaar Holidays on LinkedIn"
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-pure-gold hover:text-pure-gold"
            >
              <LinkedInIcon className="size-4" />
            </a>
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/60 sm:flex-row">
          <p>
            © {year} Masaar Holidays. All rights reserved.
            {/* TODO: registration/protection details — placeholder per brief */}
          </p>
          <p className="tracking-widest">FAITH &nbsp;·&nbsp; CLARITY &nbsp;·&nbsp; CARE &nbsp;·&nbsp; PEACE</p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  locale,
}: {
  title: string;
  links: { label: string; href: string }[];
  locale: Locale;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-pure-gold">
        {title}
      </h3>
      <ul className="mt-4 space-y-2 text-sm text-white/80">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={localizedPath(locale, link.href)} className="hover:text-light-gold">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
