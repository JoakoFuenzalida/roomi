import Link from "next/link";
import { db } from "@/lib/db";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HoyPage() {
  const session = await auth();
  const userId = session!.user.id;

  const memberships = await db.membership.findMany({
    where: { userId, leftAt: null },
    select: { household: { select: { id: true, name: true } } },
  });

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Hola, {session!.user.name}</h1>
        <p className="text-sm text-muted-foreground">{session!.user.email}</p>
      </header>

      {memberships.length === 0 ? (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Todavía no tienes hogar. Crea uno o únete con un código.
          </p>
          <Button
            render={<Link href="/hogar" />}
            nativeButton={false}
            className="w-full"
          >
            Ir a hogar
          </Button>
        </div>
      ) : (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Tus hogares
          </h2>
          <ul className="space-y-1">
            {memberships.map(({ household }) => (
              <li key={household.id}>
                <Link
                  href="/hogar"
                  className="block rounded-lg border p-3 hover:bg-muted"
                >
                  {household.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Aquí van tus tareas del día. Todavía no hay nada.
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button type="submit" variant="outline" className="w-full">
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}
