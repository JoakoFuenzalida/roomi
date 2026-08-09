"use client";

import Link from "next/link";

import { useActionState, useTransition, useState, useEffect } from "react";
import {
  crearRoom,
  editarRoom,
  eliminarRoom,
  agregarBillItem,
  editarBillItem,
  eliminarBillItem,
  marcarPagadoRoom,
  confirmarPagoRoom,
  marcarPagadoBillItem,
  confirmarPagoBillItem,
  deshacerPagoRoom,
  deshacerPagoBillItem,
  poblarRecurrentes,
  eliminarCobroMensual,
} from "@/actions/cuentas";
import { Button } from "@/components/ui/button";
import { AvatarInitials } from "@/components/avatar-initials";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CurrencyInput } from "@/components/currency-input";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Check,
  Pencil,
  DollarSign,
  Home,
  RefreshCw,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

type Member = {
  id: string;
  userId: string;
  userName: string;
  image?: string | null;
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
  splitMode: "EQUAL" | "CUSTOM";
  excludedUserIds: string[];
  splits?: { userId: string; amount: number }[];
  isRecurring: boolean;
  dayOfMonth: number | null;
};

type ChargeData = {
  id: string;
  userId: string;
  user: { id: string; name: string; image?: string | null };
  roomAmount: number;
  sharedAmount: number;
  totalAmount: number;
  roomPaidAt: Date | null;
  roomConfirmedAt: Date | null;
  roomConfirmedBy: { name: string } | null;
  splits: {
    id: string;
    amount: number;
    paidAt: Date | null;
    confirmedAt: Date | null;
    label: string;
  }[];
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
      <SheetContent side="bottom">
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
            <CurrencyInput
              name="monthlyCost"
              defaultValue={room?.monthlyCost ?? ""}
              placeholder="$170.000"
              required
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
                  <AvatarInitials name={m.userName} imageUrl={m.image} size={20} />
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
                  onClick={() => {
                    if (confirm(`¿Estás seguro que deseas eliminar la pieza "${room.name}"?`)) {
                      startDelete(async () => { await eliminarRoom(room.id, householdId); })
                    }
                  }}
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
  members,
  isAdmin,
}: {
  item: BillItemData;
  householdId: string;
  members: Member[];
  isAdmin: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  const excludedNames = item.excludedUserIds
    .map((uid) => members.find((m) => m.userId === uid)?.userName.split(" ")[0])
    .filter(Boolean);

  return (
    <li className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">{item.label}</span>
          {item.isRecurring && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container font-bold">
              {item.dayOfMonth ? `día ${item.dayOfMonth}` : "fijo"}
            </span>
          )}
        </div>
        {item.splitMode === "CUSTOM" ? (
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Manual: {item.splits?.map(s => members.find(m => m.userId === s.userId)?.userName.split(" ")[0]).filter(Boolean).join(", ")}
          </p>
        ) : excludedNames.length > 0 ? (
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Sin: {excludedNames.join(", ")}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-bold">{formatPrice(item.amount)}</span>
        {isAdmin && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditOpen(true)}
              className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => {
                if (confirm(`¿Estás seguro que deseas eliminar "${item.label}"?`)) {
                  startDelete(async () => { await eliminarBillItem(item.id, householdId); })
                }
              }}
              disabled={deleting}
              className="p-1.5 rounded-full text-error hover:bg-error-container/30 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      
      {isAdmin && (
        <BillItemSheet
          householdId={householdId}
          month={0} // Not used for editing
          year={0}  // Not used for editing
          members={members}
          item={item}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </li>
  );
}

/* ────────────── Add/Edit Bill Item Sheet ────────────── */

const SUGERENCIAS_CUENTAS = ["Luz", "Agua", "Gas", "Internet", "GGCC", "Netflix"];

export function BillItemSheet({
  householdId,
  month,
  year,
  members,
  item,
  open,
  onOpenChange,
}: {
  householdId: string;
  month: number;
  year: number;
  members: Member[];
  item?: BillItemData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!item;
  const action = isEdit
    ? editarBillItem.bind(null, item.id, householdId)
    : agregarBillItem.bind(null, householdId, month, year);

  const [state, formAction, isPending] = useActionState(action, null);
  
  const [label, setLabel] = useState("");
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState<string>("");
  const [splitMode, setSplitMode] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [amountStr, setAmountStr] = useState("");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (item) {
        setLabel(item.label);
        setAmountStr(item.amount.toString());
        setSplitMode(item.splitMode);
        setExcludedIds(item.excludedUserIds);
        setIsRecurring(item.isRecurring);
        setDayOfMonth(item.dayOfMonth ? item.dayOfMonth.toString() : "");
        
        if (item.splits) {
          const splitsObj: Record<string, string> = {};
          item.splits.forEach(s => {
            splitsObj[s.userId] = s.amount.toString();
          });
          setCustomSplits(splitsObj);
        } else {
          setCustomSplits({});
        }
      } else {
        setLabel("");
        setAmountStr("");
        setSplitMode("EQUAL");
        setExcludedIds([]);
        setIsRecurring(false);
        setDayOfMonth("");
        setCustomSplits({});
      }
    }
  }, [open, item]);

  useEffect(() => {
    if (state && "success" in state) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  function toggleExcluded(userId: string) {
    setExcludedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  const totalAmount = parseInt(amountStr) || 0;
  const assignedAmount = members.reduce(
    (acc, m) => acc + (parseInt(customSplits[m.userId]) || 0),
    0
  );
  const remaining = totalAmount - assignedAmount;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar gasto" : "Agregar gasto"}</SheetTitle>
        </SheetHeader>
        <form action={formAction} className="flex flex-col gap-4 p-4">
          <div>
            <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide">
              Concepto
            </label>
            <input
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="GGCC, Luz, Agua, Gas, Gimnasio..."
              required
              className="mt-1 w-full h-12 rounded-[12px] border border-outline-variant bg-surface-container-lowest px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {!isEdit && (
              <div className="flex flex-wrap gap-2 mt-2">
                {SUGERENCIAS_CUENTAS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setLabel(sug)}
                    className="px-2.5 py-1 rounded-[8px] bg-surface-container border border-outline-variant text-[12px] text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide">
              Monto (CLP)
            </label>
            <CurrencyInput
              name="amount"
              defaultValue={amountStr}
              onValueChange={(val) => setAmountStr(val.toString())}
              placeholder="$140.000"
              required
              className="mt-1 w-full h-12 rounded-[12px] border border-outline-variant bg-surface-container-lowest px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <input type="hidden" name="splitMode" value={splitMode} />
            <button
              type="button"
              onClick={() => setSplitMode("EQUAL")}
              className={cn(
                "flex-1 h-10 rounded-[8px] text-[13px] font-bold border transition-colors",
                splitMode === "EQUAL" ? "bg-primary-container text-primary border-primary" : "bg-surface-container-lowest text-on-surface-variant border-outline-variant"
              )}
            >
              Partes iguales
            </button>
            <button
              type="button"
              onClick={() => setSplitMode("CUSTOM")}
              className={cn(
                "flex-1 h-10 rounded-[8px] text-[13px] font-bold border transition-colors",
                splitMode === "CUSTOM" ? "bg-primary-container text-primary border-primary" : "bg-surface-container-lowest text-on-surface-variant border-outline-variant"
              )}
            >
              Asignación manual
            </button>
          </div>

          {splitMode === "EQUAL" && (
            <div>
              <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide mb-2 block">
                Se cobra a
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const included = !excludedIds.includes(m.userId);
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => toggleExcluded(m.userId)}
                      className={cn(
                        "px-3 py-2 rounded-pill text-[13px] font-semibold border transition-colors flex items-center gap-2",
                        included
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-surface-container border-outline-variant text-on-surface line-through opacity-60",
                      )}
                    >
                      <AvatarInitials name={m.userName} imageUrl={m.image} size={20} />
                      {m.userName.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
              {excludedIds.map((id) => (
                <input key={id} type="hidden" name="excludedUserIds" value={id} />
              ))}
            </div>
          )}

          {splitMode === "CUSTOM" && (
            <div className="space-y-3 p-3 bg-surface-container-lowest rounded-[12px] border border-outline-variant">
              <div className="flex items-center justify-between text-[13px] font-semibold">
                <span className="text-on-surface-variant">Total: {formatPrice(totalAmount)}</span>
                <span className={cn(remaining === 0 ? "text-primary" : remaining < 0 ? "text-error" : "text-on-surface-variant")}>
                  {remaining === 0 ? "¡Cuadra perfecto!" : remaining < 0 ? `Sobran ${formatPrice(Math.abs(remaining))}` : `Faltan ${formatPrice(remaining)}`}
                </span>
              </div>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AvatarInitials name={m.userName} imageUrl={m.image} size={24} />
                      <span className="text-[13px] font-semibold">{m.userName.split(" ")[0]}</span>
                    </div>
                      <CurrencyInput
                        name={`customSplit_${m.userId}`}
                        defaultValue={customSplits[m.userId] ?? ""}
                        onValueChange={(val) => setCustomSplits(s => ({ ...s, [m.userId]: val.toString() }))}
                        className="w-full h-9 rounded-[8px] border border-outline-variant bg-surface-container px-3 text-[13px] font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="$0"
                      />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring toggle */}
          <div className="flex items-center gap-3">
            <input
              type="hidden"
              name="isRecurring"
              value={isRecurring ? "true" : "false"}
            />
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative",
                isRecurring ? "bg-primary" : "bg-outline-variant",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  isRecurring ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </button>
            <span className="text-[13px] text-on-surface">
              Monto fijo mensual
            </span>
          </div>

          {isRecurring && (
            <div>
              <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide">
                Día del mes para recordar
              </label>
              <input
                name="dayOfMonth"
                type="number"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                placeholder="1"
                min={1}
                max={31}
                className="mt-1 w-full h-12 rounded-[12px] border border-outline-variant bg-surface-container-lowest px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {state && "error" in state && (
            <p className="text-error text-[13px]">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="h-12 rounded-pill font-bold"
          >
            {isPending ? "..." : isEdit ? "Guardar cambios" : "Agregar"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ────────────── Populate Recurring Button ────────────── */

export function PopulateRecurringButton({
  householdId,
}: {
  householdId: string;
}) {
  const [acting, startAction] = useTransition();

  return (
    <button
      onClick={() =>
        startAction(async () => { await poblarRecurrentes(householdId); })
      }
      disabled={acting}
      className="h-10 px-4 rounded-pill border border-primary text-primary font-semibold text-[13px] flex items-center gap-2 hover:bg-primary-container/20 transition-colors disabled:opacity-50"
    >
      <RefreshCw size={14} className={acting ? "animate-spin" : ""} />
      {acting ? "..." : "Traer fijos"}
    </button>
  );
}

/* ────────────── Charge Card ────────────── */

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
  const [expanded, setExpanded] = useState(false);

  // Computed status for the entire charge card summary
  const totalPendingItems = (charge.roomAmount > 0 && !charge.roomPaidAt ? 1 : 0) + charge.splits.filter(s => !s.paidAt).length;
  const totalItems = (charge.roomAmount > 0 ? 1 : 0) + charge.splits.length;

  let globalStatusLabel: string;
  let globalStatusClass: string;
  
  if (totalPendingItems === 0 && totalItems > 0) {
    const allConfirmed = (charge.roomAmount === 0 || charge.roomConfirmedAt) && charge.splits.every(s => s.confirmedAt);
    if (allConfirmed) {
      globalStatusLabel = "Completado";
      globalStatusClass = "bg-success-container text-on-success-container";
    } else {
      globalStatusLabel = "Revisión";
      globalStatusClass = "bg-warning-container text-on-warning-container";
    }
  } else {
    globalStatusLabel = `${totalPendingItems} pendientes`;
    globalStatusClass = "bg-error-container text-on-error-container";
  }

  const renderPaymentAction = (
    amount: number,
    isPaid: boolean,
    isConfirmed: boolean,
    onPay: () => Promise<any>,
    onConfirm: () => Promise<any>,
    onUndo?: () => Promise<any>,
  ) => {
    if (isConfirmed) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-success flex items-center gap-1">
            <Check size={14} /> Confirmado
          </span>
          {isAdmin && onUndo && (
            <button
              onClick={() => startAction(onUndo)}
              disabled={acting}
              className="p-1 rounded-full hover:bg-error-container text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
              title="Deshacer pago"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      );
    }
    if (isPaid) {
      return (
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              onClick={() => startAction(onConfirm)}
              disabled={acting}
              className="h-7 px-3 rounded-pill bg-success-container text-on-success-container font-bold text-[11px] flex items-center gap-1 hover:bg-success hover:text-on-success transition-colors disabled:opacity-50"
            >
              Confirmar pago
            </button>
          ) : (
            <span className="text-[12px] font-bold text-warning flex items-center gap-1">
              Pagado
            </span>
          )}
          {isAdmin && onUndo && (
            <button
              onClick={() => startAction(onUndo)}
              disabled={acting}
              className="p-1 rounded-full hover:bg-error-container text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
              title="Deshacer pago"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      );
    }
    if (isCurrentUser) {
      return (
        <button
          onClick={() => startAction(onPay)}
          disabled={acting}
          className="h-7 px-3 rounded-pill bg-primary text-on-primary font-bold text-[11px] flex items-center gap-1 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Pagar
        </button>
      );
    }
    return <span className="text-[12px] font-medium text-error">Pendiente</span>;
  };

  const handlePayAll = () => {
    startAction(async () => {
      if (charge.roomAmount > 0 && !charge.roomPaidAt) {
        await marcarPagadoRoom(charge.id, householdId);
      }
      for (const split of charge.splits) {
        if (!split.paidAt) {
          await marcarPagadoBillItem(split.id, householdId);
        }
      }
    });
  };

  return (
    <li className="rounded-[14px] bg-surface-container-lowest border border-outline-variant shadow-[0_2px_10px_rgba(15,23,42,0.05)] overflow-hidden transition-all duration-300">
      <div className="w-full p-4 flex items-center gap-3 hover:bg-surface-container-low transition-colors">
        <div 
          className="flex-1 min-w-0 flex items-center gap-3 cursor-pointer text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <AvatarInitials name={charge.user.name} imageUrl={charge.user.image} size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold truncate">
                {charge.user.name.split(" ")[0]}
              </p>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase",
                  globalStatusClass,
                )}
              >
                {globalStatusLabel}
              </span>
            </div>
            <div className="flex gap-3 mt-1 text-[12px] text-on-surface-variant">
              <span>Pieza: {formatPrice(charge.roomAmount)}</span>
              <span>Servicios: {formatPrice(charge.sharedAmount)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[16px] font-bold shrink-0">
              {formatPrice(charge.totalAmount)}
            </span>
            <ChevronDown 
              size={16} 
              className={cn("text-on-surface-variant transition-transform duration-300", expanded ? "rotate-180" : "")} 
            />
          </div>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("¿Seguro que deseas eliminar este cobro mensual completo? (Esta acción no se puede deshacer)")) {
                startAction(async () => {
                  await eliminarCobroMensual(charge.id, householdId);
                });
              }
            }}
            disabled={acting}
            className="p-2 text-error hover:bg-error/10 rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
            title="Eliminar cobro mensual"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-outline-variant/50 pt-3 space-y-3 bg-surface-container-low/30">
          {charge.roomAmount > 0 && (
            <div className="flex flex-row items-center justify-between py-2 border-b border-outline-variant/50 last:border-0">
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold">Arriendo (Pieza)</span>
                <span className="text-[14px] font-bold text-on-surface-variant">{formatPrice(charge.roomAmount)}</span>
              </div>
              {renderPaymentAction(
                charge.roomAmount,
                !!charge.roomPaidAt,
                !!charge.roomConfirmedAt,
                async () => await marcarPagadoRoom(charge.id, householdId),
                async () => await confirmarPagoRoom(charge.id, householdId),
                async () => await deshacerPagoRoom(charge.id, householdId)
              )}
            </div>
          )}

          {charge.splits.map(split => (
            <div key={split.id} className="flex flex-row items-center justify-between py-2 border-b border-outline-variant/50 last:border-0">
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold">{split.label}</span>
                <span className="text-[14px] font-bold text-on-surface-variant">{formatPrice(split.amount)}</span>
              </div>
              {renderPaymentAction(
                split.amount,
                !!split.paidAt,
                !!split.confirmedAt,
                async () => await marcarPagadoBillItem(split.id, householdId),
                async () => await confirmarPagoBillItem(split.id, householdId),
                async () => await deshacerPagoBillItem(split.id, householdId)
              )}
            </div>
          ))}

          {isCurrentUser && totalPendingItems > 1 && (
            <div className="pt-2">
              <button
                onClick={handlePayAll}
                disabled={acting}
                className="w-full h-10 rounded-pill bg-primary text-on-primary font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <DollarSign size={14} />
                {acting ? "..." : "Pagar todo lo pendiente"}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/* ────────────── Month Navigation ────────────── */

import { useRouter } from "next/navigation";

export function MonthNavigator({
  month,
  year,
  basePath,
}: {
  month: number;
  year: number;
  basePath: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const prev = month === 1 ? { m: 12, y: year - 1 } : { m: month - 1, y: year };
  const next = month === 12 ? { m: 1, y: year + 1 } : { m: month + 1, y: year };

  const handleNav = (m: number, y: number) => {
    startTransition(() => {
      router.push(`${basePath}&mes=${m}&ano=${y}`);
    });
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <Link
        href={`${basePath}&mes=${prev.m}&ano=${prev.y}`}
        prefetch={true}
        onClick={(e) => {
          e.preventDefault();
          handleNav(prev.m, prev.y);
        }}
        className={cn("p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors", isPending && "opacity-50")}
      >
        &larr;
      </Link>
      <h2 className="text-[16px] font-bold flex items-center gap-2">
        {monthNames[month - 1]} {year}
        {isPending && <RefreshCw size={14} className="animate-spin text-primary" />}
      </h2>
      <Link
        href={`${basePath}&mes=${next.m}&ano=${next.y}`}
        prefetch={true}
        onClick={(e) => {
          e.preventDefault();
          handleNav(next.m, next.y);
        }}
        className={cn("p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors", isPending && "opacity-50")}
      >
        &rarr;
      </Link>
    </div>
  );
}
