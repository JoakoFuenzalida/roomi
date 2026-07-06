import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RoomiSymbol } from "@/components/roomi-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh flex flex-col bg-background">
      <header className="flex items-center justify-between px-5 pt-5">
        <Link
          href="/"
          className="w-[38px] h-[38px] rounded-[12px] bg-surface-container-low flex items-center justify-center text-on-surface hover:bg-surface-container"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </Link>
        <RoomiSymbol size={28} />
      </header>
      <div className="flex-1 flex flex-col px-6 pt-6 pb-10">{children}</div>
    </main>
  );
}
