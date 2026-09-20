import Image from "next/image";
import Link from "next/link";
import { Container } from "./Container";

export function UmrahExperienceStrip() {
  return (
    <section className="py-16 bg-[#FAF7F2] border-t border-black/10">
      <Container className="space-y-12">
        {/* Strip Header */}
        <div className="text-center max-w-xl mx-auto">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-masaar-black">
            A Complete Umrah Experience
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-masaar-black/60">
            More than just a trip — thoughtful services for a smoother, more meaningful journey.
          </p>
        </div>

        {/* 5-Item Horizontal Icon Strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {[
            { icon: "📄", title: "Guided Umrah Assistance", desc: "Step-by-step support" },
            { icon: "🕌", title: "Private Trips", desc: "Meaningful experiences" },
            { icon: "🛂", title: "Visa Assistance", desc: "Simple and reliable" },
            { icon: "🚗", title: "Private Transfers", desc: "Comfortable and on time" },
            { icon: "🏨", title: "Verified Hotels", desc: "Stays you can trust" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center justify-center rounded-2xl border border-black/10 bg-white p-5 text-center shadow-2xs transition-all hover:shadow-sm"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-warm-ivory text-xl text-[#A87F12]">
                {item.icon}
              </span>
              <p className="mt-3 text-xs font-bold text-masaar-black">{item.title}</p>
              <p className="mt-0.5 text-[11px] text-masaar-black/55">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Two Promo Cards */}
        <div className="grid gap-6 md:grid-cols-12 items-stretch pt-4">
          {/* Left Promo Card: Dark Private Trips Card */}
          <div className="relative md:col-span-5 rounded-2xl overflow-hidden bg-masaar-black text-white p-8 flex flex-col justify-between shadow-md">
            <div className="absolute inset-0 opacity-40">
              <Image
                src="/trips/PRIVATE-TRIP-MAKKAH-HERO.png"
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

            <div className="relative z-10 space-y-2">
              <h3 className="font-[family-name:var(--font-display)] text-3xl font-bold">Private Trips</h3>
              <p className="text-sm text-white/80">Meaningful places. Private journeys.</p>
            </div>

            <div className="relative z-10 pt-16">
              <Link
                href="/private-trips"
                className="inline-flex items-center gap-2 rounded-xl bg-[#A87F12] px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#936e0f] transition-colors"
              >
                <span>Explore Private Trips →</span>
              </Link>
            </div>
          </div>

          {/* Right Promo Card: Other Services */}
          <div className="md:col-span-7 rounded-2xl border border-black/10 bg-white p-8 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                  Other Services
                </h3>
                <p className="text-xs text-masaar-black/60 mt-0.5">Everything you need for a complete journey.</p>
              </div>

              <Link
                href="/hotels"
                className="text-xs font-bold text-[#A87F12] hover:underline"
              >
                View All Services →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              {[
                { title: "Hajj", icon: "🕋", href: "/hajj" },
                { title: "Hotels", icon: "🏨", href: "/hotels" },
                { title: "Transfers", icon: "🚗", href: "/transfers" },
                { title: "Visa", icon: "🛂", href: "/visa" },
              ].map((serv) => (
                <Link
                  key={serv.title}
                  href={serv.href}
                  className="flex flex-col items-center justify-center rounded-xl border border-black/10 bg-warm-ivory/30 p-4 text-center hover:bg-warm-ivory/70 transition-colors"
                >
                  <span className="text-2xl">{serv.icon}</span>
                  <p className="mt-2 text-xs font-bold text-masaar-black">{serv.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
