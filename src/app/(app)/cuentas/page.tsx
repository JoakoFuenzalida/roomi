import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getMonthlyBill, getRooms } from "@/actions/cuentas";
import { Button } from "@/components/ui/button";
import { RoomiHeader, RoomiSymbol } from "@/components/roomi-logo";
import { AvatarInitials } from "@/components/avatar-initials";
import {
  RoomCard,
  AddRoomButton,
  BillItemRow,
  ChargeCard,
  MonthNavigator,
} from "@/components/cuentas-actions";
import { AddBillItemButton } from "@/components/cuentas-add-bill-button";
import { cn } from "@/lib/utils";

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

export default async function CuentasPage({
  searchParams,
}: {
  searchParams: Promise<{ hogarId?: string; mes?: string; ano?: string }>;
}) {
  const user = await requireUser();
  const { hogarId, mes, ano } = await searchParams;

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
          <Link href="/perfil">
            <AvatarInitials name={user.name} size={40} />
          </Link>
        </header>
        <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
            <RoomiSymbol size={36} />
          </div>
          <p className="text-sm text-on-surface-variant">
            Necesitas un hogar para usar cuentas.
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

  const isAdmin = active.role === "ADMIN";

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

  const rooms = await getRooms(active.householdId);

  const now = new Date();
  const month = mes ? Number(mes) : now.getMonth() + 1;
  const year = ano ? Number(ano) : now.getFullYear();

  const bill = await getMonthlyBill(active.householdId, month, year);

  const basePath = `/cuentas?hogarId=${active.householdId}`;

  const rentTotal = rooms.reduce((s, r) => s + r.monthlyCost, 0);
  const items = bill?.items ?? [];
  const charges = bill?.charges ?? [];
  const servicesTotal = items.reduce((s, i) => s + i.amount, 0);

  return (
    <main className="max-w-md mx-auto px-5 pt-6 relative min-h-svh">
      <header className="flex items-center justify-between mb-6">
        <RoomiHeader />
        <Link href="/perfil">
          <AvatarInitials name={user.name} size={40} />
        </Link>
      </header>

      <div className="mb-4">
        <h1 className="font-display font-semibold text-[26px] leading-tight">
          Cuentas
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
                href={`/cuentas?hogarId=${m.householdId}`}
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

      {/* ── Piezas ── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">
            Piezas
          </h2>
          {rooms.length > 0 && (
            <span className="text-[12px] text-on-surface-variant">
              Total arriendo: <span className="font-bold">{formatPrice(rentTotal)}</span>
            </span>
          )}
        </div>

        {rooms.length === 0 && !isAdmin ? (
          <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-6 text-center">
            <p className="text-sm text-on-surface-variant">
              El admin aún no configura las piezas.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                householdId={active.householdId}
                members={membersList}
                isAdmin={isAdmin}
              />
            ))}
          </ul>
        )}

        {isAdmin && (
          <div className="mt-2">
            <AddRoomButton
              householdId={active.householdId}
              members={membersList}
            />
          </div>
        )}
      </section>

      {/* ── Gastos del mes ── */}
      <section className="mb-6">
        <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-3">
          Gastos del mes
        </h2>

        <MonthNavigator month={month} year={year} basePath={basePath} />

        <div className="space-y-3">
          {/* Items list */}
          <div className="rounded-[14px] bg-surface-container-lowest border border-outline-variant shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
            {items.length > 0 ? (
              <ul className="divide-y divide-outline-variant">
                {items.map((item) => (
                  <BillItemRow
                    key={item.id}
                    item={item}
                    householdId={active.householdId}
                    members={membersList}
                    isAdmin={isAdmin}
                  />
                ))}
                <li className="flex items-center justify-between px-4 py-3 bg-surface-container-low rounded-b-[14px]">
                  <span className="text-[14px] font-bold">Total servicios</span>
                  <span className="text-[15px] font-bold text-primary">
                    {formatPrice(servicesTotal)}
                  </span>
                </li>
              </ul>
            ) : (
              <div className="p-6 text-center text-[13px] text-on-surface-variant">
                No hay gastos registrados este mes.
              </div>
            )}
          </div>

          {/* Admin: add item + populate recurring */}
          {isAdmin && (
            <AddBillItemButton
              householdId={active.householdId}
              month={month}
              year={year}
              members={membersList}
            />
          )}

          {/* Charges per person */}
          {charges.length > 0 && (
            <>
              <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide pt-2">
                Cobros por persona
              </h3>
              <ul className="space-y-2">
                {charges.map((charge) => (
                  <ChargeCard
                    key={charge.id}
                    charge={charge}
                    householdId={active.householdId}
                    isAdmin={isAdmin}
                    isCurrentUser={charge.userId === user.id}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <div className="pb-24" />
    </main>
  );
}
