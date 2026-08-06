import Link from "next/link";
import { Sparkles, ShoppingCart, Wallet, Receipt, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { CompleteTaskButton } from "@/components/task-actions";
import { RoomiHeader, RoomiSymbol } from "@/components/roomi-logo";
import { AvatarInitials } from "@/components/avatar-initials";
import { getBalances } from "@/actions/settlement";
import { cn } from "@/lib/utils";
import { ChatClient } from "@/components/chat";

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function HoyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tab = typeof params.tab === "string" ? params.tab : "muro";

  const user = await requireUser();
  const userId = user.id;
  const userName = user.name ?? "";

  const activeMemberships = await db.membership.findMany({
    where: { userId, leftAt: null },
    include: { household: { select: { id: true, name: true } } },
  });

  const householdIds = activeMemberships.map((m) => m.household.id);
  const mainHouseholdId = householdIds[0]; // For chat, we use the first active household for now, or maybe we can select it

  // 1. Tareas pendientes de hoy
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

  // 2. Cuentas (Mensuales) por pagar por el usuario
  const pendingBills = await db.monthlyCharge.findMany({
    where: {
      userId,
      paidAt: null,
      monthlyBill: { householdId: { in: householdIds } },
    },
    include: {
      monthlyBill: {
        include: { household: { select: { name: true } } },
      },
    },
    orderBy: { monthlyBill: { createdAt: "desc" } },
    take: 3,
  });

  // 3. Compras pendientes (Lista general)
  const shoppingToBuy = await db.shoppingItem.findMany({
    where: {
      householdId: { in: householdIds },
      active: true,
      OR: [
        { frequency: null, checkedAt: null },
        { frequency: { not: null } },
      ],
    },
    include: { household: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // 4. Deudas directas (Compras/Gastos)
  const allDebtsPromises = activeMemberships.map(async (m) => {
    const balances = await getBalances(m.householdId);
    return balances
      .filter((b) => b.fromUserId === userId)
      .map((b) => ({ ...b, householdName: m.household.name, householdId: m.household.id }));
  });
  const myDebtsArrays = await Promise.all(allDebtsPromises);
  const myDebts = myDebtsArrays.flat();

  const firstName = userName.split(" ")[0] ?? "";
  const totalPendingItems = pendingTasks.length + pendingBills.length + myDebts.length;

  // CHAT DATA
  let chatMessages: any[] = [];
  if (tab === "chat" && mainHouseholdId) {
    chatMessages = await db.notice.findMany({
      where: { householdId: mainHouseholdId },
      include: {
        author: { select: { name: true, image: true } },
        reactions: true,
      },
      orderBy: { createdAt: "asc" },
      take: 100, // Load last 100 messages
    });
  }

  return (
    <main className="max-w-md mx-auto px-5 pt-6 relative min-h-svh pb-[80px] flex flex-col">
      <header className="flex items-center justify-between mb-4">
        <RoomiHeader />
        <Link href="/perfil">
          <AvatarInitials name={user.name} imageUrl={user.image} size={40} />
        </Link>
      </header>

      {/* Tabs */}
      {activeMemberships.length > 0 && (
        <div className="flex bg-surface-container-high rounded-[14px] p-1 mb-6 shrink-0">
          <Link
            href="/hoy?tab=muro"
            className={cn(
              "flex-1 text-center py-2.5 rounded-[10px] font-semibold text-[14px] transition-colors",
              tab === "muro" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Muro
          </Link>
          <Link
            href="/hoy?tab=chat"
            className={cn(
              "flex-1 text-center py-2.5 rounded-[10px] font-semibold text-[14px] transition-colors",
              tab === "chat" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Chat en vivo
          </Link>
        </div>
      )}

      {activeMemberships.length === 0 ? (
        <EmptyHogar />
      ) : tab === "chat" && mainHouseholdId ? (
        <ChatClient
          householdId={mainHouseholdId}
          currentUserId={userId}
          initialMessages={chatMessages}
        />
      ) : (
        <div className="flex-1 overflow-y-auto pb-4">
          <div className="mb-6">
            <h1 className="font-display font-semibold text-[26px] leading-tight">
              Buenas, {firstName} 👋
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {totalPendingItems === 0
                ? "No tienes pendientes hoy. ¡Aprovecha el día!"
                : `Tienes pendientes por resolver.`}
            </p>
          </div>

          <div className="space-y-4">
            {/* TAREAS */}
            <TasksCard tasks={pendingTasks} />

            {/* DEUDAS COMPRAS */}
            {myDebts.length > 0 && (
              <DebtsCard debts={myDebts} />
            )}

            {/* CUENTAS PENDIENTES */}
            {pendingBills.length > 0 && (
              <BillsCard bills={pendingBills} />
            )}

            {/* COMPRAS GENERALES */}
            {shoppingToBuy.length > 0 && (
              <ShoppingCard items={shoppingToBuy} />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function EmptyHogar() {
  return (
    <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-6 flex flex-col items-center text-center gap-4 mt-10">
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

// ===================== WIDGETS ===================== //

type PendingTask = {
  id: string;
  title: string;
  points: number;
  nextDueDate: Date;
  household: { name: string };
};

function TasksCard({ tasks }: { tasks: PendingTask[] }) {
  if (tasks.length === 0) return null;

  return (
    <section className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="font-display font-semibold text-[16px]">Tus tareas de hoy</h2>
        </div>
        <span className="bg-primary-container text-on-primary-container text-[11px] font-bold px-[9px] py-[3px] rounded-pill">
          {tasks.length}
        </span>
      </header>

      <ul className="divide-y divide-outline-variant -mx-1">
        {tasks.map((task) => {
          const overdue = task.nextDueDate < new Date();
          return (
            <li key={task.id} className="flex items-center gap-3 px-1 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] truncate">{task.title}</p>
                <p className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="bg-secondary-container text-on-secondary-container text-[10px] font-semibold px-2 py-0.5 rounded-pill">
                    {task.household.name}
                  </span>
                  <span>{task.points} pts</span>
                  {overdue && <span className="text-error font-bold">· Atrasada</span>}
                </p>
              </div>
              <CompleteTaskButton taskId={task.id} />
            </li>
          );
        })}
      </ul>
      <Link href="/tareas" className="block text-center text-primary text-[13px] font-semibold mt-1 py-1">
        Ver módulo de tareas →
      </Link>
    </section>
  );
}

type DebtProp = {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  householdName: string;
  householdId: string;
};

function DebtsCard({ debts }: { debts: DebtProp[] }) {
  return (
    <section className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-error" />
          <h2 className="font-display font-semibold text-[16px]">Le debes plata a</h2>
        </div>
      </header>
      <ul className="space-y-2">
        {debts.map((d) => (
          <li key={`${d.fromUserId}-${d.toUserId}`} className="flex items-center justify-between p-3 rounded-[12px] bg-error-container/20 border border-error-container/40">
            <div>
              <p className="text-[14px] font-semibold">{d.toUserName}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">En {d.householdName}</p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-bold text-error">{formatPrice(d.amount)}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link href="/compras" className="block text-center text-primary text-[13px] font-semibold mt-3 py-1">
        Ir a pagar →
      </Link>
    </section>
  );
}

type BillProp = {
  id: string;
  totalAmount: number;
  monthlyBill: {
    month: number;
    year: number;
    household: { name: string };
  };
};

function BillsCard({ bills }: { bills: BillProp[] }) {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  
  return (
    <section className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Receipt size={18} className="text-warning" />
          <h2 className="font-display font-semibold text-[16px]">Cuentas por pagar</h2>
        </div>
      </header>
      <ul className="space-y-2">
        {bills.map((b) => (
          <li key={b.id} className="flex items-center justify-between p-3 rounded-[12px] bg-warning-container/20 border border-warning-container/40">
            <div>
              <p className="text-[14px] font-semibold">Cuentas {meses[b.monthlyBill.month - 1]} {b.monthlyBill.year}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">En {b.monthlyBill.household.name}</p>
            </div>
            <p className="text-[15px] font-bold">{formatPrice(b.totalAmount)}</p>
          </li>
        ))}
      </ul>
      <Link href="/cuentas" className="block text-center text-primary text-[13px] font-semibold mt-3 py-1">
        Ir a cuentas →
      </Link>
    </section>
  );
}

type ShoppingProp = {
  id: string;
  title: string;
  household: { name: string };
};

function ShoppingCard({ items }: { items: ShoppingProp[] }) {
  return (
    <section className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-success" />
          <h2 className="font-display font-semibold text-[16px]">Falta comprar</h2>
        </div>
      </header>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 px-1 py-1">
            <ArrowRight size={14} className="text-on-surface-variant" />
            <p className="text-[14px] font-semibold">{item.title}</p>
            <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-pill ml-auto">
              {item.household.name}
            </span>
          </li>
        ))}
      </ul>
      <Link href="/compras" className="block text-center text-primary text-[13px] font-semibold mt-3 py-1">
        Ver lista de compras →
      </Link>
    </section>
  );
}
