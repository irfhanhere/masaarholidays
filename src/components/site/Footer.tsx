import Image from "next/image";
import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { FOOTER_COMPANY_NAV, FOOTER_SERVICES_NAV } from "@/lib/nav";
import { Container } from "./Container";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-masaar-black text-white">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src="/brand/logo-reverse.png"
            alt="Masaar Holidays"
            width={160}
            height={48}
            className="h-11 w-auto"
          />
          {/* TODO: brand line pending final copy — brief uses
              "A Journey of Faith, A Legacy of Service." on inspiration
              screens; confirm before shipping. */}
        </div>

        <FooterColumn title="Our Services" links={FOOTER_SERVICES_NAV} />
        <FooterColumn title="Company" links={FOOTER_COMPANY_NAV} />

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-pure-gold">
            Stay Connected
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>{CONTACT.phoneDisplay}</li>
            <li>{CONTACT.emailGeneral}</li>
          </ul>
          {/* TODO: social icons pending handles from Haseeb */}
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
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-pure-gold">
        {title}
      </h3>
      <ul className="mt-4 space-y-2 text-sm text-white/80">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-light-gold">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
