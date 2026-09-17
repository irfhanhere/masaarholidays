import { PageHeader } from "@/components/admin/ui";
import { VisaTypeForm } from "../VisaTypeForm";

export const metadata = { title: "Add Visa Type | Masaar Admin", robots: { index: false } };

export default function NewVisaTypePage() {
  return (
    <div>
      <PageHeader
        title="Add Visa Type"
        description="Create a new visa detail page under /visa/[slug]."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Visa Types", href: "/admin/visa-types" },
          { label: "Add Visa Type" },
        ]}
      />
      <VisaTypeForm />
    </div>
  );
}
