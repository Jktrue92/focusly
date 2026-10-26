import { redirect } from "next/navigation";
import { RecoveryForm } from "@/components/recovery-form";
import { createClient, isConfigured } from "@/lib/supabase/server";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  if (!isConfigured()) redirect("/forgot-password");
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    redirect(
      "/forgot-password?message=Open+a+valid+reset+link+from+your+email+to+continue.",
    );
  const { message } = await searchParams;
  return <RecoveryForm reset message={message} />;
}
