import { PageHeader } from "@/components/admin/ui";
import { TestimonialForm } from "../TestimonialForm";

export const metadata = { title: "Add Testimonial | Masaar Admin", robots: { index: false } };

export default function NewTestimonialPage() {
  return (
    <div>
      <PageHeader
        title="Add Testimonial"
        description="Share a genuine customer experience to be displayed on the Masaar Holidays website."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Testimonials", href: "/admin/testimonials" },
          { label: "Add Testimonial" },
        ]}
      />
      <TestimonialForm />
    </div>
  );
}
