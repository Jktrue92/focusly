import { RecoveryForm } from "@/components/recovery-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; sent?: string }>;
}) {
  const { message, sent } = await searchParams;
  return <RecoveryForm message={message} sent={sent === "1"} />;
}
