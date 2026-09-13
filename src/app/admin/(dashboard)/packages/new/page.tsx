import { PageHeader } from "@/components/admin/ui";
import type { PackageType } from "@/lib/types/database";
import { PackageForm } from "../PackageForm";

export const metadata = { title: "Add Package | Masaar Admin", robots: { index: false } };

export default async function NewPackagePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const type: PackageType = (await searchParams).type === "hajj" ? "hajj" : "umrah";

  return (
    <div>
      <PageHeader
        title={`Add ${type === "hajj" ? "Hajj" : "Umrah"} Package`}
        description="Create a new package to display on your website."
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Packages", href: "/admin/packages" },
          { label: "Add Package" },
        ]}
      />
      <PackageForm defaultType={type} />
    </div>
  );
}
