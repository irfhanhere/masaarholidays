import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { TestimonialForm } from "../TestimonialForm";

export const metadata = { title: "Edit Testimonial | Masaar Admin", robots: { index: false } };

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: testimonial } = await supabase.from("testimonials").select("*").eq("id", id).maybeSingle();
  if (!testimonial) notFound();

  return (
    <div>
      <PageHeader
        title={`Edit Testimonial — ${testimonial.customer_name}`}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Testimonials", href: "/admin/testimonials" },
          { label: "Edit" },
        ]}
      />
      <TestimonialForm testimonialId={testimonial.id} initial={testimonial} />
    </div>
  );
}
