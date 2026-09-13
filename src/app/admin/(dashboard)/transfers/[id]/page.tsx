import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { TransferForm } from "../TransferForm";

export const metadata = { title: "Edit Transfer | Masaar Admin", robots: { index: false } };

export default async function EditTransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: transfer } = await supabase.from("transfers").select("*").eq("id", id).maybeSingle();
  if (!transfer) notFound();

  return (
    <div>
      <PageHeader
        title={`Edit ${transfer.route_name}`}
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Transfers", href: "/admin/transfers" }, { label: "Edit" }]}
      />
      <TransferForm transferId={transfer.id} initial={transfer} />
    </div>
  );
}
