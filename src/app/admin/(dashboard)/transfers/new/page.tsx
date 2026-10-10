import type { Metadata } from "next";
import { TransferForm } from "../TransferForm";

export const metadata: Metadata = {
  title: "Add Transfer | Masaar Admin",
  robots: { index: false },
};

export default function NewTransferPage() {
  return <TransferForm />;
}
