"use client";

import { useActionState, useTransition, useState, useEffect } from "react";
import {
  crearRoom,
  editarRoom,
  eliminarRoom,
  crearBoleta,
  agregarBillItem,
  eliminarBillItem,
  publicarBoleta,
  marcarPagadoCuenta,
  confirmarPagoCuenta,
} from "@/actions/cuentas";
import { Button } from "@/components/ui/button";
import { AvatarInitials } from "@/components/avatar-initials";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Check,
  Pencil,
  Send,
  DollarSign,
  Home,
} from "lucide-react";

type Member = {
  id: string;
  userId: string;
  userName: string;
};

type RoomData = {
  id: string;
  name: string;
  monthlyCost: number;
  membership: { id: string; user: { id: string; name: string } } | null;
};

type BillItemData = {
  id: string;
  label: string;
  amount: number;
};

type ChargeData = {
  id: string;
  userId: string;
  user: { id: string; name: string };
  roomAmount: number;
  sharedAmount: number;
  totalAmount: number;
  paidAt: Date | null;
  confirmedAt: Date | null;
  confirmedBy: { name: string } | null;
};

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

/* ────────────── Add/Edit Room Sheet ────────────── */

export function RoomSheet({
  householdId,
  members,
  room,
  open,
  onOpenChange,
}: {
  householdId: string;
  members: Member[];
  room?: RoomData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!room;
  const action = isEdit
    ? editarRoom.bind(null, room.id, householdId)
    : crearRoom.bind(null, householdId);

  const [state, formAction, isPending] = useActionState(action, null);
  const [selectedMembership, setSelectedMembership] = useState(
    room?.membership?.id ?? "",
  );

  useEffect(() => {
    if (state && "success" in state) onOpenChange(false);
  }, [state, onOpenChange]);

  useEffect(() => {
    if (open && room?.membership?.id) {
      setSelectedMembership(room.membership.id);
    } else if (!open) {
      setSelectedMembership("");
    }
  }, [open, room]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar pieza" : "Nueva pieza"}</SheetTitle>
        </SheetHeader>
        <form action={formAction} className="flex flex-col gap-4 p-4">
          <div>
            <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide">
              Nombre
            </label>
            <input
              name="name"
              defaultValue={room?.name ?? ""}
              placeholder="Pieza 1, Pieza matrimonial..."
              required
              className="mt-1 w-full h-12 rounded-[12px] border border-outline-variant bg-surface-container-lowest px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide">
              Arriendo mensual (CLP)
            </label>
            <input
              name="monthlyCost"
              type="number"
              defaultValue={room?.monthlyCost ?? ""}
              placeholder="170000"
              required
              min={0}
              className="mt-1 w-full h-12 rounded-[12px] border border-outline-variant bg-surface-container-lowest px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide mb-2 block">
              Ocupante
            </label>
            <input type="hidden" name="membershipId" value={selectedMembership} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedMembership("")}
                className={cn(
                  "px-3 py-2 rounded-pill text-[13px] font-semibold border transition-colors",
                  !selectedMembership
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container border-outline-variant text-on-surface",
                )}
              >
                Sin asignar
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMembership(m.id)}
                  className={cn(
                    "px-3 py-2 rounded-pill text-[13px] font-semibold border transition-colors flex items-center gap-2",
                    selectedMembership === m.id
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container border-outline-variant text-on-surface",
                  )}
                >
                  <AvatarInitials name={m.userName} size={20} />
                  {m.userName.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {state && "error" in state && (
            <p className="text-error text-[13px]">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="h-12 rounded-pill font-bold"
          >
            {isPending ? "..." : isEdit ? "Guardar" : "Crear pieza"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ────────────── Room Card ────────────── */

export function RoomCard({
  room,
  householdId,
  members,
  isAdmin,
}: {
  room: RoomData;
  householdId: string;
  members: Member[];
  isAdmin: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  return (
    <>
      <li className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
              <Home size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold truncate">{room.name}</p>
              <p className="text-[12px] text-on-surface-variant">
                {room.membership
                  ? room.membership.user.name.split(" ")[0]
                  : "Sin asignar"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold">{formatPrice(room.monthlyCost)}</span>
            {isAdmin && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() =>
                    startDelete(() => eliminarRoom(room.id, householdId))
                  }
                  disabled={deleting}
                  className="p-2 rounded-full text-error hover:bg-error-container/30"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </li>
      {isAdmin && (
        <RoomSheet
          householdId={householdId}
          members={members}
          room={room}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}

/* ────────────── Add Room Button ────────────── */

export function AddRoomButton({
  householdId,
  members,
}: {
  householdId: string;
  members: Member[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-[14px] border-2 border-dashed border-outline-variant p-4 flex items-center justify-center gap-2 text-on-surface-variant text-[13px] font-semibold hover:bg-surface-container-low transition-colors"
      >
        <Plus size={16} /> Agregar pieza
      </button>
      <RoomSheet
        householdId={householdId}
        members={members}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

/* ────────────── Bill Item Row ────────────── */

export function BillItemRow({
  item,
  householdId,
  isDraft,
}: {
  item: BillItemData;
  householdId: string;
  isDraft: boolean;
}) {
  const [deleting, startDelete] = useTransition();

  return (
    <li className="flex items-center justify-between px-4 py-3">
      <span className="text-[14px]">{item.label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-bold">{formatPrice(item.amount)}</span>
        {isDraft && (
          <button
            onClick={() =>
              startDelete(() => eliminarBillItem(item.id, householdId))
            }
            disabled={deleting}
            className="p-1.5 rounded-full text-error hover:bg-error-container/30"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </li>
  );
}

/* ────────────── Add Bill Item Sheet ────────────── */

export function AddBillItemSheet({
  billId,
  householdId,
  open,
  onOpenChange,
}: {
  billId: string;
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    agregarBillItem.bind(null, billId, householdId),
    null,
  );

  useEffect(() => {
    if (state && "success" in state) onOpenChange(false);
  }, [state, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Agregar gasto</SheetTitle>
        </SheetHeader>
        <form action={formAction} className="flex flex-col gap-4 p-4">
          <div>
            <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide">
              Concepto
            </label>
            <input
              name="label"
              placeholder="GGCC, Luz, Agua, Gas..."
              required
              className="mt-1 w-full h-12 rounded-[12px] border border-outline-variant bg-surface-container-lowest px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide">
              Monto (CLP)
            </label>
            <input
              name="amount"
              type="number"
              placeholder="140000"
              required
              min={0}
              className="mt-1 w-full h-12 rounded-[12px] border border-outline-variant bg-surface-container-lowest px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {state && "error" in state && (
            <p className="text-error text-[13px]">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="h-12 rounded-pill font-bold"
          >
            {isPending ? "..." : "Agregar"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ────────────── Create Bill + Publish ────────────── */

export function CreateBillButton({
  householdId,
  month,
  year,
}: {
  householdId: string;
  month: number;
  year: number;
}) {
  const [creating, startCreate] = useTransition();

  return (
    <button
      onClick={() => startCreate(async () => { await crearBoleta(householdId, month, year); })}
      disabled={creating}
      className="w-full rounded-[14px] border-2 border-dashed border-primary/40 p-6 flex flex-col items-center justify-center gap-2 text-primary font-semibold hover:bg-primary-container/20 transition-colors"
    >
      <Plus size={24} />
      <span className="text-[14px]">
        {creating ? "Creando..." : "Crear boleta del mes"}
      </span>
    </button>
  );
}

export function PublishBillButton({
  billId,
  householdId,
}: {
  billId: string;
  householdId: string;
}) {
  const [publishing, startPublish] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={() =>
          startPublish(async () => {
            const result = await publicarBoleta(billId, householdId);
            if (result && "error" in result) setError(result.error ?? null);
            else setError(null);
          })
        }
        disabled={publishing}
        className="w-full h-12 rounded-pill bg-primary text-on-primary font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send size={16} />
        {publishing ? "Publicando..." : "Publicar y notificar"}
      </button>
      {error && <p className="text-error text-[13px] mt-2 text-center">{error}</p>}
    </div>
  );
}

/* ────────────── Draft Bill Actions ────────────── */

export function DraftBillActions({
  billId,
  householdId,
  items,
}: {
  billId: string;
  householdId: string;
  items: BillItemData[];
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="rounded-[14px] bg-surface-container-lowest border border-outline-variant shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
        {items.length > 0 ? (
          <ul className="divide-y divide-outline-variant">
            {items.map((item) => (
              <BillItemRow
                key={item.id}
                item={item}
                householdId={householdId}
                isDraft
              />
            ))}
            <li className="flex items-center justify-between px-4 py-3 bg-surface-container-low rounded-b-[14px]">
              <span className="text-[14px] font-bold">Total servicios</span>
              <span className="text-[15px] font-bold text-primary">
                {formatPrice(items.reduce((s, i) => s + i.amount, 0))}
              </span>
            </li>
          </ul>
        ) : (
          <div className="p-6 text-center text-[13px] text-on-surface-variant">
            Agrega los gastos del mes (GGCC, luz, agua, gas...)
          </div>
        )}
      </div>

      <button
        onClick={() => setAddOpen(true)}
        className="w-full h-11 rounded-pill border border-primary text-primary font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-primary-container/20 transition-colors"
      >
        <Plus size={16} /> Agregar gasto
      </button>

      {items.length > 0 && (
        <PublishBillButton billId={billId} householdId={householdId} />
      )}

      <AddBillItemSheet
        billId={billId}
        householdId={householdId}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  );
}

/* ────────────── Charge Card (published bill) ────────────── */

export function ChargeCard({
  charge,
  householdId,
  isAdmin,
  isCurrentUser,
}: {
  charge: ChargeData;
  householdId: string;
  isAdmin: boolean;
  isCurrentUser: boolean;
}) {
  const [acting, startAction] = useTransition();

  const isPaid = !!charge.paidAt;
  const isConfirmed = !!charge.confirmedAt;

  let statusLabel: string;
  let statusClass: string;
  if (isConfirmed) {
    statusLabel = "Confirmado";
    statusClass = "bg-success-container text-on-success-container";
  } else if (isPaid) {
    statusLabel = "Pagado";
    statusClass = "bg-warning-container text-on-warning-container";
  } else {
    statusLabel = "Pendiente";
    statusClass = "bg-error-container text-on-error-container";
  }

  return (
    <li className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <AvatarInitials name={charge.user.name} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold truncate">
              {charge.user.name.split(" ")[0]}
            </p>
            <span
              className={cn(
                "px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase",
                statusClass,
              )}
            >
              {statusLabel}
            </span>
          </div>
          <div className="flex gap-3 mt-1 text-[12px] text-on-surface-variant">
            <span>Pieza: {formatPrice(charge.roomAmount)}</span>
            <span>Servicios: {formatPrice(charge.sharedAmount)}</span>
          </div>
        </div>
        <span className="text-[16px] font-bold shrink-0">
          {formatPrice(charge.totalAmount)}
        </span>
      </div>

      {!isConfirmed && (
        <div className="flex gap-2 mt-3">
          {!isPaid && isCurrentUser && (
            <button
              onClick={() =>
                startAction(async () => {
                  await marcarPagadoCuenta(charge.id, householdId);
                })
              }
              disabled={acting}
              className="flex-1 h-10 rounded-pill bg-primary text-on-primary font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <DollarSign size={14} />
              {acting ? "..." : "Marcar pagado"}
            </button>
          )}
          {isPaid && isAdmin && (
            <button
              onClick={() =>
                startAction(async () => {
                  await confirmarPagoCuenta(charge.id, householdId);
                })
              }
              disabled={acting}
              className="flex-1 h-10 rounded-pill bg-success-container text-on-success-container font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check size={14} />
              {acting ? "..." : "Confirmar pago"}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/* ────────────── Month Navigation ────────────── */

export function MonthNavigator({
  month,
  year,
  basePath,
}: {
  month: number;
  year: number;
  basePath: string;
}) {
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const prev = month === 1 ? { m: 12, y: year - 1 } : { m: month - 1, y: year };
  const next = month === 12 ? { m: 1, y: year + 1 } : { m: month + 1, y: year };

  return (
    <div className="flex items-center justify-between mb-4">
      <a
        href={`${basePath}&mes=${prev.m}&ano=${prev.y}`}
        className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant"
      >
        &larr;
      </a>
      <h2 className="text-[16px] font-bold">
        {monthNames[month - 1]} {year}
      </h2>
      <a
        href={`${basePath}&mes=${next.m}&ano=${next.y}`}
        className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant"
      >
        &rarr;
      </a>
    </div>
  );
}
