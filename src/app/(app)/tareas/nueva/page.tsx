import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, assertMemberOf } from "@/lib/session";
import { CreateTaskForm } from "@/components/task-actions";
import { Button } from "@/components/ui/button";

export default async function NuevaTareaPage({
  searchParams,
}: {
  searchParams: Promise<{ hogarId?: string }>;
}) {
  const user = await requireUser();
  const { hogarId } = await searchParams;

  if (!hogarId) {
    redirect("/tareas");
  }

  const membership = await assertMemberOf(user.id, hogarId);

  if (membership.role !== "ADMIN") {
    return (
      <main className="max-w-md mx-auto p-6 space-y-6">
        <p className="text-sm text-destructive font-medium">
          No tienes permisos para crear tareas en este hogar.
        </p>
        <Button render={<Link href="/tareas" />} nativeButton={false}>
          Volver
        </Button>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <header className="space-y-1 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/tareas?hogarId=${hogarId}`} />}
          nativeButton={false}
        >
          ←
        </Button>
        <h1 className="text-2xl font-bold">Nueva Tarea</h1>
      </header>

      <CreateTaskForm householdId={hogarId} />
    </main>
  );
}
