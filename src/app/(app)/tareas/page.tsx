import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { RoomiHeader, RoomiSymbol } from "@/components/roomi-logo";
import { AvatarInitials } from "@/components/avatar-initials";
import { UserHeaderNav } from "@/components/user-header-nav";
import { CompleteTaskButton, DeleteTaskButton, SwapButton } from "@/components/task-actions";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { cn } from "@/lib/utils";

const FREQ_LABEL: Record<string, string> = {
  DAILY: "Diaria",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
};

function formatDue(d: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
          <UserHeaderNav />
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

  const activeMembers = await db.membership.findMany({
    where: { householdId: active.householdId, leftAt: null },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { rotationOrder: "asc" },
  });

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const completedTasks = await db.taskExecution.findMany({
    where: {
      task: { householdId: active.householdId },
      completedAt: { gte: last24h },
    },
    include: {
      task: { select: { title: true, household: { select: { name: true } } } },
      completedBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  return (
    <main className="max-w-md mx-auto w-full px-5 pb-6 flex flex-col flex-1">
      <header className="sticky top-0 z-30 bg-background pt-6 pb-4 -mx-5 px-5 flex items-center justify-between mb-2 shrink-0">
        <RoomiHeader />
        <UserHeaderNav householdId={active.householdId} />
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
                  {task.points} RC
                </span>
              </div>

              {task.nextAssignee && (
                <div className="mt-3 flex items-center gap-2">
                  <AvatarInitials
                    name={task.nextAssignee.user.name}
                    imageUrl={task.nextAssignee.user.image}
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
                <div className="flex items-center gap-1">
                  {task.nextAssigneeMembershipId === active.id && (
                    <SwapButton
                      taskId={task.id}
                      householdId={task.householdId}
                      members={activeMembers
                        .filter((m) => m.id !== active.id)
                        .map((m) => ({ id: m.id, userName: m.user.name, userImage: m.user.image }))}
                    />
                  )}
                  {isAdmin && (
                    <DeleteTaskButton
                      taskId={task.id}
                      householdId={task.householdId}
                    />
                  )}
                  <CompleteTaskButton taskId={task.id} householdId={task.householdId} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {completedTasks.length > 0 && (
        <div className="mt-8 mb-2">
          <TasksHistoryCard executions={completedTasks} />
        </div>
      )}

      <RealtimeRefresh householdId={active.householdId} />
      <Link
        href={`/tareas/nueva?hogarId=${active.householdId}`}
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-5 z-30 w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_8px_20px_rgba(255,107,107,0.45)] flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Nueva tarea"
      >
        <Plus size={26} strokeWidth={2.5} />
      </Link>
    </main>
  );
}

type TaskExecutionProp = {
  id: string;
  completedAt: Date;
  task: { title: string; household: { name: string } };
  completedBy: { name: string };
  assignedTo: { name: string } | null;
  pointsEarned: number;
};

function TasksHistoryCard({ executions }: { executions: TaskExecutionProp[] }) {
  return (
    <section className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)] opacity-80 hover:opacity-100 transition-opacity">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="font-display font-semibold text-[16px]">Tareas hechas (24h)</h2>
        </div>
      </header>

      <ul className="divide-y divide-outline-variant -mx-1">
        {executions.map((exec) => {
          const samePerson = !exec.assignedTo || exec.completedBy.name === exec.assignedTo.name;
          
          return (
            <li key={exec.id} className="flex items-center gap-3 px-1 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] truncate line-through text-on-surface-variant">
                  {exec.task.title}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
                  {samePerson ? (
                    <span>Turno: <span className="font-semibold">{exec.completedBy.name}</span></span>
                  ) : (
                    <span>
                      Turno: <span className="font-semibold">{exec.assignedTo?.name}</span>, hecha por: <span className="font-semibold">{exec.completedBy.name}</span>
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-primary">+{exec.pointsEarned} RC</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
