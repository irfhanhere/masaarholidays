import type { TestimonialRow } from "@/lib/types/database";
import { Container } from "./Container";
import { SectionHeading } from "./SectionHeading";
import { TestimonialCard } from "./TestimonialCard";

/**
 * Continuously auto-scrolling (right-to-left) testimonials strip, pulling
 * only published/consented rows (see lib/data/public.ts#getPublishedTestimonials
 * — status='published' is enforced there, same query every other
 * testimonials surface uses). Hidden entirely when there are none, same
 * "no fake testimonials, ever" rule as the rest of the site.
 *
 * The track renders the list twice back-to-back and CSS-animates exactly
 * one half-width of travel (globals.css's .animate-marquee-scroll), so
 * the loop point is seamless — no JS measurement/timers needed. Pauses
 * on hover via the same class's :hover rule.
 */
export function TestimonialsMarquee({ testimonials }: { testimonials: TestimonialRow[] }) {
  if (testimonials.length === 0) return null;

  const track = [...testimonials, ...testimonials];

  return (
    <section className="overflow-hidden bg-warm-ivory py-16">
      <Container>
        <SectionHeading eyebrow="What Our Guests Say" title="Journeys We've Been Trusted With" />
      </Container>
      <div className="mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <div className="animate-marquee-scroll flex w-max gap-6 px-6">
          {track.map((testimonial, i) => (
            <div key={`${testimonial.id}-${i}`} className="w-80 shrink-0">
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
