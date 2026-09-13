import type { TestimonialRow } from "@/lib/types/database";

export function TestimonialCard({ testimonial }: { testimonial: TestimonialRow }) {
  return (
    <figure className="flex h-full flex-col justify-between rounded-lg border border-black/10 bg-white p-6">
      <blockquote className="text-sm leading-relaxed text-masaar-black/80">
        “{testimonial.testimonial_text}”
      </blockquote>
      <figcaption className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-masaar-black">{testimonial.customer_name}</p>
          {testimonial.location && (
            <p className="text-xs text-masaar-black/50">{testimonial.location}</p>
          )}
        </div>
        <span className="text-xs text-pure-gold">{"★".repeat(testimonial.rating)}</span>
      </figcaption>
    </figure>
  );
}
