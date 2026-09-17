import type { Metadata } from "next";
import { PrivateTripForm } from "../PrivateTripForm";

export const metadata: Metadata = {
  title: "Add Private Trip | Masaar Admin",
  robots: { index: false },
};

export default function NewPrivateTripPage() {
  return <PrivateTripForm />;
}
