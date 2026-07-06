import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { DeleteTaskButton } from "@/components/task-actions";

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ hogarId?: string }>;
}) {
  const user = await requireUser();
  const { hogarId } = await searchParams;

  const memberships = await db.membership.findMany({
    where: { userId: user.id, leftAt: null },
    include: { household: true },
    orderBy: { joinedAt: "asc" },
  });

  if (memberships.length === 0) {
    return (
      <main className="max-w-md mx-auto p-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          No perteneces a ningún hogar.
        </p>
        <Button render={<Link href="/hogar" />} nativeButton={false}>
          Ir a Hogar
        </Button>
      </main>
    );
  }

  let activeMembership = memberships.find((m) => m.householdId === hogarId);
  if (!activeMembership) {
    activeMembership = memberships[0];
  }

  const tasks = await db.task.findMany({
    where: { householdId: activeMembership.householdId, active: true },
    include: { nextAssignee: { include: { user: true } } },
    orderBy: { nextDueDate: "asc" },
  });

  const isAdmin = activeMembership.role === "ADMIN";

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold">Tareas</h1>
        
        {memberships.length > 1 && (
          <div className="flex flex-col space-y-1">
            <label htmlFor="hogar-select" className="text-sm font-medium">
              Hogar activo:
            </label>
            <form action="" className="flex gap-2">
              <select
                id="hogar-select"
                name="hogarId"
                defaultValue={activeMembership.householdId}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {memberships.map((m) => (
                  <option key={m.householdId} value={m.householdId}>
                    {m.household.name}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary">Ver</Button>
            </form>
          </div>
        )}
      </header>

      {isAdmin && (
        <Button
          render={
            <Link
              href={`/tareas/nueva?hogarId=${activeMembership.householdId}`}
            />
          }
          nativeButton={false}
          className="w-full"
        >
          Nueva Tarea
        </Button>
      )}

      <section className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay tareas configuradas en este hogar.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-col gap-2 rounded-lg border p-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Frecuencia: {task.frequency} • {task.points} pts
                    </p>
                  </div>
                  {isAdmin && (
                    <DeleteTaskButton
                      taskId={task.id}
                      householdId={task.householdId}
                    />
                  )}
                </div>
                <div className="text-sm bg-muted/50 p-2 rounded-md">
                  <span className="font-medium">Siguiente:</span>{" "}
                  {task.nextAssignee?.user.name ?? "Sin asignar"} • Vence el{" "}
                  {new Date(task.nextDueDate).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
