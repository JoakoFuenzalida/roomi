import Link from "next/link";
import { redirect } from "next/navigation";
import { X } from "lucide-react";
import { requireUser, assertMemberOf } from "@/lib/session";
import { CreateTaskForm } from "@/components/task-actions";

export default async function NuevaTareaPage({
  searchParams,
}: {
  searchParams: Promise<{ hogarId?: string }>;
}) {
  const user = await requireUser();
  const { hogarId } = await searchParams;

  if (!hogarId) redirect("/tareas");

  // Cualquier miembro del hogar puede crear tareas
  await assertMemberOf(user.id, hogarId);

  return (
    <main className="max-w-md mx-auto px-5 pt-5 pb-6 flex flex-col min-h-svh">
      <header className="flex items-center justify-between relative mb-6">
        <Link
          href={`/tareas?hogarId=${hogarId}`}
          className="w-[38px] h-[38px] rounded-[12px] bg-surface-container-low flex items-center justify-center text-on-surface hover:bg-surface-container"
          aria-label="Cerrar"
        >
          <X size={18} />
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-display font-semibold text-[19px]">
          Nueva tarea
        </h1>
        <div className="w-[38px]" />
      </header>

      <CreateTaskForm householdId={hogarId} />
    </main>
  );
}
