import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getBalances, getPendingSettlements } from "@/actions/settlement";
import { Button } from "@/components/ui/button";
import { AvatarInitials } from "@/components/avatar-initials";
import { RoomiHeader, RoomiSymbol } from "@/components/roomi-logo";
import { UserHeaderNav } from "@/components/user-header-nav";
import {
  ComprasFAB,
  ShoppingItemCard,
  AccountsSection,
  DebtPayButton,
  ConfirmSettlementButton,
  ReportErrorButton,
} from "@/components/shopping-actions";
import { cn } from "@/lib/utils";

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

function timeAgo(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  return `Hace ${days} día${days === 1 ? "" : "s"}`;
}

export default async function ComprasPage({
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
            Necesitas un hogar para usar compras.
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

  const activeMembers = await db.membership.findMany({
    where: { householdId: active.householdId, leftAt: null },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { rotationOrder: "asc" },
  });

  const membersList = activeMembers.map((m) => ({
    id: m.id,
    userId: m.user.id,
    userName: m.user.name,
  }));

  const toBuy = await db.shoppingItem.findMany({
    where: {
      householdId: active.householdId,
      active: true,
      OR: [
        { frequency: null, checkedAt: null },
        { frequency: { not: null } },
      ],
    },
    include: {
      createdBy: { select: { name: true } },
      nextBuyer: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const recentExpenses = await db.expense.findMany({
    where: { householdId: active.householdId },
    include: {
      payer: { select: { name: true } },
    },
    orderBy: { paidAt: "desc" },
    take: 10,
  });

  const debts = await getBalances(active.householdId);
  const pendingSettlements = await getPendingSettlements(active.householdId);

  return (
    <main className="max-w-md mx-auto w-full px-5 pb-6 flex flex-col flex-1">
      <header className="sticky top-0 z-30 bg-background pt-6 pb-4 -mx-5 px-5 flex items-center justify-between mb-2 shrink-0">
        <RoomiHeader />
        <UserHeaderNav />
      </header>

      <div className="mb-4">
        <h1 className="font-display font-semibold text-[26px] leading-tight">
          Compras
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          {active.household.name}
        </p>
      </div>

      {memberships.length > 1 && (
        <div className="-mx-5 px-5 mb-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {memberships.map((m) => (
              <Link
                key={m.householdId}
                href={`/compras?hogarId=${m.householdId}`}
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

      {/* ── Por comprar ── */}
      <section className="mb-6">
        <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-3">
          Por comprar
        </h2>

        {toBuy.length === 0 ? (
          <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Lista vacía. Agrega un item con el botón.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {toBuy.map((item) => (
              <ShoppingItemCard
                key={item.id}
                item={{
                  id: item.id,
                  title: item.title,
                  quantity: item.quantity,
                  frequency: item.frequency,
                  nextBuyerName: item.nextBuyer?.user.name ?? null,
                }}
                householdId={active.householdId}
                members={membersList}
              />
            ))}
          </ul>
        )}
      </section>

      {/* ── Últimas compras ── */}
      {recentExpenses.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-3">
            Últimas compras
          </h2>
          <div className="rounded-[14px] bg-surface-container-lowest border border-outline-variant shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
            <ul className="divide-y divide-outline-variant">
              {recentExpenses.map((exp) => (
                <li
                  key={exp.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarInitials name={exp.payer.name} size={32} />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold truncate">
                        {exp.title}
                      </p>
                      <p className="text-[12px] text-on-surface-variant">
                        {exp.payer.name.split(" ")[0]} &middot;{" "}
                        {timeAgo(exp.paidAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-on-surface shrink-0">
                    {formatPrice(exp.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Estado de cuentas ── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">
            Estado de cuentas
          </h2>
          <AccountsSection
            householdId={active.householdId}
            members={membersList}
            currentUserId={user.id}
          />
        </div>

        {pendingSettlements.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] font-semibold text-warning uppercase tracking-wide mb-2">
              Pendientes de confirmación
            </p>
            <ul className="space-y-2">
              {pendingSettlements.map((s) => {
                const isCreditor = s.toUserId === user.id;
                return (
                  <li
                    key={s.id}
                    className="rounded-[12px] bg-warning-container/30 border border-warning-container p-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock size={14} className="text-warning shrink-0" />
                      <p className="text-[13px]">
                        <span className="font-semibold">
                          {s.fromUser.name.split(" ")[0]}
                        </span>{" "}
                        le pagó{" "}
                        <span className="font-bold">
                          {formatPrice(s.amount)}
                        </span>{" "}
                        a{" "}
                        <span className="font-semibold">
                          {s.toUser.name.split(" ")[0]}
                        </span>
                      </p>
                    </div>
                    {isCreditor && (
                      <div className="flex gap-2 mt-2">
                        <ConfirmSettlementButton
                          settlementId={s.id}
                          householdId={active.householdId}
                        />
                        <ReportErrorButton
                          settlementId={s.id}
                          householdId={active.householdId}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {debts.length === 0 ? (
          <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-6 text-center">
            <p className="text-sm text-on-surface-variant">
              No hay deudas pendientes. Todo al día.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {debts.map((d) => {
              const isDebtor = d.fromUserId === user.id;
              const isCreditor = d.toUserId === user.id;
              return (
                <li
                  key={`${d.fromUserId}-${d.toUserId}`}
                  className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-center gap-3">
                    <AvatarInitials name={d.fromUserName} size={32} />
                    <ArrowRight
                      size={14}
                      className="text-on-surface-variant shrink-0"
                    />
                    <AvatarInitials name={d.toUserName} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px]">
                        <span className="font-semibold">
                          {d.fromUserName.split(" ")[0]}
                        </span>{" "}
                        le debe a{" "}
                        <span className="font-semibold">
                          {d.toUserName.split(" ")[0]}
                        </span>
                      </p>
                      <p className="text-[16px] font-bold mt-0.5">
                        {formatPrice(d.amount)}
                      </p>
                    </div>
                    {isDebtor && (
                      <DebtPayButton
                        householdId={active.householdId}
                        members={membersList}
                        currentUserId={d.fromUserId}
                      />
                    )}
                    {isCreditor && (
                      <span className="px-3 py-1.5 rounded-pill bg-success-container text-on-success-container text-[12px] font-bold">
                        Te deben
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="pb-24" />
      <ComprasFAB householdId={active.householdId} />
    </main>
  );
}
