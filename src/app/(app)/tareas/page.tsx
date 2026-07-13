import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { RoomiHeader, RoomiSymbol } from "@/components/roomi-logo";
import { AvatarInitials } from "@/components/avatar-initials";
import { DeleteTaskButton } from "@/components/task-actions";
import { cn } from "@/lib/utils";

const FREQ_LABEL: Record<string, string> = {
  DAILY: "Diaria",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
};

function formatDue(d: Date) {
  const now = new Date();
  const diff = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Venció hace ${Math.abs(diff)} día${Math.abs(diff) === 1 ? "" : "s"}`;
  if (diff === 0) return "Vence hoy";
  if (diff === 1) return "Vence mañana";
  return `Vence en ${diff} días`;
}

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ hogarId?: string }>;
}) {
  const user = await requireUser();
  const { hogarId } = await searchParams;

  const memberships = await db.membership.findMany({
    where: { userId: user.id, leftAt: null },
    include: { household: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  if (memberships.length === 0) {
    return (
      <main className="max-w-md mx-auto px-5 pt-6">
        <header className="flex items-center justify-between mb-6">
          <RoomiHeader />
          <AvatarInitials name={user.name} size={40} />
        </header>
        <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
            <RoomiSymbol size={36} />
          </div>
          <p className="text-sm text-on-surface-variant">
            Necesitas un hogar antes de tener tareas.
          </p>
          <Button
            render={<Link href="/hogar" />}
            nativeButton={false}
            className="w-full h-12 rounded-pill font-bold"
          >
            Ir a hogar
          </Button>
        </div>
      </main>
    );
  }

  const active =
    memberships.find((m) => m.householdId === hogarId) ?? memberships[0];

  const tasks = await db.task.findMany({
    where: { householdId: active.householdId, active: true },
    include: { nextAssignee: { include: { user: true } } },
    orderBy: { nextDueDate: "asc" },
  });

  const isAdmin = active.role === "ADMIN";

  return (
    <main className="max-w-md mx-auto px-5 pt-6 relative min-h-svh">
      <header className="flex items-center justify-between mb-6">
        <RoomiHeader />
        <AvatarInitials name={user.name} size={40} />
      </header>

      <div className="mb-4">
        <h1 className="font-display font-semibold text-[26px] leading-tight">
          Tareas
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          {tasks.length} activa{tasks.length === 1 ? "" : "s"} en {active.household.name}
        </p>
      </div>

      {memberships.length > 1 && (
        <div className="-mx-5 px-5 mb-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {memberships.map((m) => (
              <Link
                key={m.householdId}
                href={`/tareas?hogarId=${m.householdId}`}
                className={cn(
                  "px-4 py-2 rounded-pill text-sm font-semibold border transition-colors whitespace-nowrap",
                  m.householdId === active.householdId
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container border-outline-variant text-on-surface",
                )}
              >
                {m.household.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-6 text-center">
          <p className="text-sm text-on-surface-variant">
            Aún no hay tareas. Crea la primera con el botón.
          </p>
        </div>
      ) : (
        <ul className="space-y-3 pb-24">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-[13px] bg-primary-container text-primary flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="font-semibold text-[16px] leading-tight">
                    {task.title}
                  </h3>
                </div>
                <span className="bg-primary-container text-on-primary-container text-[11px] font-bold px-2.5 py-1 rounded-pill">
                  {task.points} pts
                </span>
              </div>

              {task.nextAssignee && (
                <div className="mt-3 flex items-center gap-2">
                  <AvatarInitials
                    name={task.nextAssignee.user.name}
                    size={26}
                  />
                  <p className="text-sm">
                    Le toca a{" "}
                    <span className="font-semibold">
                      {task.nextAssignee.user.name}
                    </span>
                  </p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="bg-secondary-container text-on-secondary-container text-[11px] font-semibold px-2.5 py-1 rounded-pill">
                    {FREQ_LABEL[task.frequency]}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {formatDue(task.nextDueDate)}
                  </span>
                </div>
                {isAdmin && (
                  <DeleteTaskButton
                    taskId={task.id}
                    householdId={task.householdId}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/tareas/nueva?hogarId=${active.householdId}`}
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-5 z-30 w-14 h-14 rounded-[19px] bg-primary text-on-primary flex items-center justify-center shadow-[0_8px_20px_rgba(255,107,107,0.45)]"
        aria-label="Nueva tarea"
      >
        <Plus size={26} strokeWidth={2.5} />
      </Link>
    </main>
  );
}
