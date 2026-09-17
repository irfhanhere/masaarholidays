import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { DepartureMonthForm } from "../DepartureMonthForm";

export const metadata = { title: "Edit Departure Month | Masaar Admin", robots: { index: false } };

export default async function EditDepartureMonthPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: month } = await supabase.from("umrah_departure_months").select("*").eq("id", id).maybeSingle();
  if (!month) notFound();

  return (
    <div>
      <PageHeader
        title={`Edit ${month.display_label}`}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Umrah Departures", href: "/admin/umrah-departures" },
          { label: "Edit" },
        ]}
      />
      <DepartureMonthForm monthId={month.id} initial={month} />
    </div>
  );
}
