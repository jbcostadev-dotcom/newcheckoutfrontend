import { KitForm } from "@/components/kit-form";

export default async function EditKitPage({
  params,
}: PageProps<"/dashboard/kits/[kitId]">) {
  const { kitId } = await params;
  return <KitForm kitId={kitId} />;
}
