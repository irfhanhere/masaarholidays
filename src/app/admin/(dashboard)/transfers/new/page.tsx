import { PageHeader } from "@/components/admin/ui";
import { TransferForm } from "../TransferForm";

export const metadata = { title: "Add Transfer | Masaar Admin", robots: { index: false } };

export default function NewTransferPage() {
  return (
    <div>
      <PageHeader
        title="Add Transfer"
        description="Create a new transfer route to display on your website."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Transfers", href: "/admin/transfers" }, { label: "Add Transfer" }]}
      />
      <TransferForm />
    </div>
  );
}
