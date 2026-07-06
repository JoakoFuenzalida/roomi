import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { RoomiSymbol, RoomiWordmark } from "@/components/roomi-logo";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/hoy");

  return (
    <main className="min-h-svh flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center text-center px-8">
        <div
          className="w-[132px] h-[132px] rounded-[40px] bg-primary-container flex items-center justify-center"
          style={{ boxShadow: "0 12px 30px rgba(255,107,107,0.22)" }}
        >
          <RoomiSymbol size={74} />
        </div>
        <div
          className="font-display font-bold mt-6 inline-flex items-baseline"
          style={{ fontSize: 46, letterSpacing: "-1px", lineHeight: 1 }}
        >
          <RoomiWordmark size={46} />
        </div>
        <p
          className="font-display font-medium mt-3 max-w-[250px]"
          style={{ fontSize: 21, lineHeight: 1.3 }}
        >
          Convivencia que se organiza sola.
        </p>
        <p className="text-on-surface-variant text-sm mt-3 max-w-[250px] leading-relaxed">
          El aseo rota solo entre los roommates. Se acabó pelear por quién lava
          la loza.
        </p>
      </div>

      <div className="px-7 pb-10 flex flex-col gap-3">
        <Button
          render={<Link href="/registro" />}
          nativeButton={false}
          size="lg"
          className="w-full h-14 rounded-pill text-base font-bold shadow-[0_6px_16px_rgba(255,107,107,0.35)]"
        >
          Crear cuenta
        </Button>
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          variant="outline"
          size="lg"
          className="w-full h-14 rounded-pill text-base font-semibold"
        >
          Entrar
        </Button>
        <p className="text-center text-[11px] text-on-surface-variant leading-relaxed mt-1">
          Al continuar aceptas los términos y la
          <br />
          política de privacidad de roomi.
        </p>
      </div>
    </main>
  );
}
