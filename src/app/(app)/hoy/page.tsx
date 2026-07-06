import Link from "next/link";
import { db } from "@/lib/db";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CompleteTaskButton } from "@/components/task-actions";

export default async function HoyPage() {
  const session = await auth();
  const userId = session!.user.id;

  const activeMemberships = await db.membership.findMany({
    where: { userId, leftAt: null },
    include: { household: { select: { id: true, name: true } } },
  });

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const pendingTasks = await db.task.findMany({
    where: {
      nextAssigneeMembershipId: { in: activeMemberships.map((m) => m.id) },
      active: true,
      nextDueDate: { lte: endOfToday },
    },
    include: {
      household: { select: { name: true } },
    },
    orderBy: { nextDueDate: "asc" },
  });

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Hola, {session!.user.name}</h1>
        <p className="text-sm text-muted-foreground">{session!.user.email}</p>
      </header>

      {activeMemberships.length === 0 ? (
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
            {activeMemberships.map(({ household }) => (
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Tus tareas para hoy
          </h2>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            render={<Link href="/tareas" />}
            nativeButton={false}
          >
            Ver todas
          </Button>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground text-center">
            No tienes tareas pendientes para hoy. ¡Todo limpio! ✨
          </div>
        ) : (
          <ul className="space-y-2">
            {pendingTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="inline-block px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px]">
                      {task.household.name}
                    </span>
                    {task.points} pts
                  </p>
                </div>
                <CompleteTaskButton taskId={task.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

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
