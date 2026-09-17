import { PageHeader } from "@/components/admin/ui";
import { DepartureMonthForm } from "../DepartureMonthForm";

export const metadata = { title: "Add Departure Month | Masaar Admin", robots: { index: false } };

export default function NewDepartureMonthPage() {
  return (
    <div>
      <PageHeader
        title="Add Departure Month"
        description="Create a new Umrah departure month landing page."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Umrah Departures", href: "/admin/umrah-departures" },
          { label: "Add Month" },
        ]}
      />
      <DepartureMonthForm />
    </div>
  );
}
