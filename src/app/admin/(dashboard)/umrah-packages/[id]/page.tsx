import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUmrahPackageByIdAction } from "../actions";
import { UmrahPackageEditorClient } from "../UmrahPackageEditorClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { package: pkg } = await getUmrahPackageByIdAction(id);
  return {
    title: pkg ? `Edit: ${pkg.title} | Masaar Admin` : "Edit Package | Masaar Admin",
    robots: { index: false },
  };
}

export default async function EditUmrahPackagePage({ params }: Props) {
  const { id } = await params;
  const { success, package: pkg } = await getUmrahPackageByIdAction(id);

  if (!success || !pkg) {
    notFound();
  }

  return <UmrahPackageEditorClient initialPackage={pkg} isNew={false} />;
}
