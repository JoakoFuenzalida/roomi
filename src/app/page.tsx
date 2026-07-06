import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/hoy");

  return (
    <main className="min-h-svh flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Roomi</h1>
        <p className="text-muted-foreground">
          Convivencia entre estudiantes, sin peleas por el aseo.
        </p>
      </div>
      <div className="flex gap-2 w-full max-w-xs">
        <Button
          render={<Link href="/registro" />}
          nativeButton={false}
          className="flex-1"
        >
          Crear cuenta
        </Button>
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          variant="outline"
          className="flex-1"
        >
          Entrar
        </Button>
      </div>
    </main>
  );
}
