import Link from "next/link";
import { RoomiSymbol } from "@/components/roomi-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-6 text-center gap-4 bg-background">
      <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
        <RoomiSymbol size={36} />
      </div>
      <h1 className="font-display font-semibold text-[48px] text-primary leading-none">
        404
      </h1>
      <p className="text-sm text-on-surface-variant max-w-xs">
        Esta página no existe o fue movida.
      </p>
      <Button
        render={<Link href="/hoy" />}
        nativeButton={false}
        className="h-12 rounded-pill px-8 font-bold shadow-[0_3px_9px_rgba(255,107,107,0.35)] mt-2"
      >
        Volver al inicio
      </Button>
    </main>
  );
}
