import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-svh bg-background pb-[calc(62px+env(safe-area-inset-bottom))]">
      {children}
      <BottomNav />
    </div>
  );
}
