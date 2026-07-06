import Link from "next/link";
import { Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CompleteTaskButton } from "@/components/task-actions";
import { RoomiHeader, RoomiSymbol } from "@/components/roomi-logo";
import { AvatarInitials } from "@/components/avatar-initials";

export default async function HoyPage() {
  const session = await auth();
  const userId = session!.user.id;
  const userName = session!.user.name ?? "";

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
    include: { household: { select: { name: true } } },
    orderBy: { nextDueDate: "asc" },
    take: 5,
  });

  const firstName = userName.split(" ")[0] ?? "";

  return (
    <main className="max-w-md mx-auto px-5 pt-6">
      <header className="flex items-center justify-between mb-6">
        <RoomiHeader />
        <AvatarInitials name={userName} size={40} />
      </header>

      <div className="mb-6">
        <h1 className="font-display font-semibold text-[26px] leading-tight">
          Buenas, {firstName} 👋
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          {activeMemberships.length === 0
            ? "Aún no tienes hogar. Únete o crea uno."
            : pendingTasks.length === 0
              ? "Nada urgente hoy. Aprovecha."
              : `Te tocan ${pendingTasks.length} tarea${pendingTasks.length === 1 ? "" : "s"} hoy.`}
        </p>
      </div>

      {activeMemberships.length === 0 ? (
        <EmptyHogar />
      ) : (
        <TasksCard tasks={pendingTasks} />
      )}
    </main>
  );
}

function EmptyHogar() {
  return (
    <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-6 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
        <RoomiSymbol size={36} />
      </div>
      <div>
        <p className="font-display font-semibold text-lg">Todavía sin hogar</p>
        <p className="text-sm text-on-surface-variant mt-1">
          Crea uno o únete con un código para partir.
        </p>
      </div>
      <Button
        render={<Link href="/hogar" />}
        nativeButton={false}
        className="w-full h-12 rounded-pill font-bold shadow-[0_3px_9px_rgba(255,107,107,0.35)]"
      >
        Ir a hogar
      </Button>
    </div>
  );
}

type PendingTask = {
  id: string;
  title: string;
  points: number;
  nextDueDate: Date;
  household: { name: string };
};

function TasksCard({ tasks }: { tasks: PendingTask[] }) {
  return (
    <section className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <header className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-[16px]">
          Tus tareas para hoy
        </h2>
        <span className="bg-primary-container text-on-primary-container text-[11px] font-bold px-[9px] py-[3px] rounded-pill">
          {tasks.length}
        </span>
      </header>

      {tasks.length === 0 ? (
        <EmptyTasks />
      ) : (
        <ul className="divide-y divide-outline-variant -mx-1">
          {tasks.map((task) => {
            const overdue = task.nextDueDate < new Date();
            return (
              <li
                key={task.id}
                className="flex items-center gap-3 px-1 py-3"
              >
                <div className="w-10 h-10 rounded-[13px] bg-primary-container text-primary flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="bg-secondary-container text-on-secondary-container text-[10px] font-semibold px-2 py-0.5 rounded-pill">
                      {task.household.name}
                    </span>
                    <span>{task.points} pts</span>
                    {overdue && (
                      <span className="text-error font-bold">
                        · Venció ayer
                      </span>
                    )}
                  </p>
                </div>
                <CompleteTaskButton taskId={task.id} />
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/tareas"
        className="block text-center text-primary text-sm font-semibold mt-2 py-1"
      >
        Ver todas →
      </Link>
    </section>
  );
}

function EmptyTasks() {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-6">
      <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center">
        <RoomiSymbol size={30} />
      </div>
      <div>
        <p className="font-display font-semibold text-[22px]">
          Todo limpio ✨
        </p>
        <p className="text-sm text-on-surface-variant mt-1 max-w-[240px]">
          No te toca nada más hoy. Anda a echarte no más 🛋️
        </p>
      </div>
    </div>
  );
}
