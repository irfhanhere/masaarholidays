import { PageHeader } from "@/components/admin/ui";
import { HotelForm } from "../HotelForm";

export const metadata = { title: "Add Hotel | Masaar Admin", robots: { index: false } };

export default function NewHotelPage() {
  return (
    <div>
      <PageHeader
        title="Add Hotel"
        description="Add a new hotel to display on your website."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Hotels", href: "/admin/hotels" }, { label: "Add Hotel" }]}
      />
      <HotelForm />
    </div>
  );
}
