"use client";

import { useActionState, useTransition, useState, useEffect } from "react";
import { agregarItem, marcarComprado, eliminarItem } from "@/actions/shopping";
import { marcarPagado, confirmarPago, reportarErrorPago } from "@/actions/settlement";
import { broadcastUpdate, broadcastNotice } from "./realtime-refresh";
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
  ShoppingCart,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

/* ────────────── types ────────────── */

type Member = {
  id: string;
  userId: string;
  userName: string;
  image?: string | null;
};

/* ────────────── Add Item Sheet ────────────── */

export function AddItemSheet({
  householdId,
  open,
  onOpenChange,
}: {
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    agregarItem.bind(null, householdId),
    null,
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [freq, setFreq] = useState("WEEKLY");
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState<number[]>([]);

  useEffect(() => {
    if (state && "success" in state) {
      broadcastUpdate(householdId);
      onOpenChange(false);
    }
  }, [state, onOpenChange, householdId]);

  function handleOpenChange(o: boolean) {
    onOpenChange(o);
    if (!o) {
      setIsRecurring(false);
      setFreq("WEEKLY");
      setSelectedDaysOfWeek([]);
      setSelectedDaysOfMonth([]);
    }
  }

  const freqOptions = [
    { value: "DAILY", label: "Diaria" },
    { value: "WEEKLY", label: "Semanal" },
    { value: "BIWEEKLY", label: "Quincenal" },
    { value: "MONTHLY", label: "Mensual" },
  ];

  const dayLabels = ["D", "L", "M", "Mi", "J", "V", "S"];

  function toggleDay(d: number) {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function toggleDayOfMonth(d: number) {
    setSelectedDaysOfMonth((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-[20px] px-5 pb-[calc(16px+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mt-3 mb-1 h-[5px] w-10 rounded-full bg-outline-variant" />
        <SheetHeader className="px-0">
          <SheetTitle className="font-display text-[19px] font-semibold text-on-surface">
            Agregar item
          </SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="isRecurring" value={isRecurring ? "true" : ""} />
          <input type="hidden" name="frequency" value={freq} />
          {selectedDaysOfWeek.map((d) => (
            <input key={d} type="hidden" name="daysOfWeek" value={d} />
          ))}
          {selectedDaysOfMonth.map((d) => (
            <input key={d} type="hidden" name="daysOfMonth" value={d} />
          ))}

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              ¿Qué hay que comprar?
            </label>
            <input
              name="title"
              autoCapitalize="sentences"
              placeholder="Ej: Detergente, Leche..."
              className="mt-1.5 w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Cantidad (opcional)
            </label>
            <input
              name="quantity"
              autoCapitalize="sentences"
              placeholder="Ej: 2 litros, 1 paquete"
              className="mt-1.5 w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative",
                isRecurring ? "bg-primary" : "bg-outline-variant",
              )}
              onClick={() => setIsRecurring(!isRecurring)}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  isRecurring ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw size={14} className="text-on-surface-variant" />
              <span className="text-sm font-semibold text-on-surface">Recurrente</span>
            </div>
          </label>

          {isRecurring && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 flex-wrap">
                {freqOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFreq(opt.value)}
                    className={cn(
                      "px-3.5 py-2 rounded-pill text-[13px] font-semibold border transition-colors",
                      freq === opt.value
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container border-outline-variant text-on-surface",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {(freq === "WEEKLY" || freq === "BIWEEKLY") && (
                <div className="flex gap-1.5">
                  {dayLabels.map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={cn(
                        "w-10 h-10 rounded-full text-[13px] font-semibold border transition-colors",
                        selectedDaysOfWeek.includes(i)
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-surface-container border-outline-variant text-on-surface",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {freq === "MONTHLY" && (
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDayOfMonth(d)}
                      className={cn(
                        "w-10 h-10 rounded-full text-[13px] font-semibold border transition-colors",
                        selectedDaysOfMonth.includes(d)
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-surface-container border-outline-variant text-on-surface",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {state?.error && (
            <p className="text-error text-sm font-semibold">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-14 rounded-pill text-base font-bold shadow-[0_6px_16px_rgba(255,107,107,0.35)] mt-2"
          >
            {isPending ? "Agregando..." : "Agregar"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ────────────── Mark as Bought Sheet ────────────── */

export function MarkBoughtSheet({
  itemId,
  itemTitle,
  householdId,
  members,
  open,
  onOpenChange,
}: {
  itemId: string;
  itemTitle: string;
  householdId: string;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    marcarComprado.bind(null, itemId, householdId),
    null,
  );
  const [excluded, setExcluded] = useState<string[]>([]);

  useEffect(() => {
    if (state && "success" in state) {
      broadcastUpdate(householdId);
      if ((state as any).notice) {
        broadcastNotice(householdId, (state as any).notice);
      }
      onOpenChange(false);
    }
  }, [state, onOpenChange, householdId]);

  function handleOpenChange(o: boolean) {
    onOpenChange(o);
    if (!o) setExcluded([]);
  }

  const included = members.filter((m) => !excluded.includes(m.userId));

  function toggleMember(userId: string) {
    if (included.length <= 1 && !excluded.includes(userId)) return;
    setExcluded((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-[20px] px-5 pb-[calc(16px+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mt-3 mb-1 h-[5px] w-10 rounded-full bg-outline-variant" />
        <SheetHeader className="px-0">
          <SheetTitle className="font-display text-[19px] font-semibold text-on-surface">
            Marcar como comprado
          </SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {excluded.map((uid) => (
            <input key={uid} type="hidden" name="excludedUserIds" value={uid} />
          ))}

          <div className="rounded-[12px] bg-surface-container px-[14px] py-[13px] text-on-surface font-semibold">
            {itemTitle}
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              ¿Cuánto costó?
            </label>
            <div className="relative mt-1.5">
              <CurrencyInput
                name="amount"
                placeholder="$0"
                className="w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Dividir entre
            </label>
            <div className="flex gap-2 flex-wrap mt-2">
              {members.map((m) => {
                const isIncluded = !excluded.includes(m.userId);
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => toggleMember(m.userId)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-pill border transition-colors",
                      isIncluded
                        ? "bg-primary-container border-primary text-on-primary-container"
                        : "bg-surface-container border-outline-variant text-on-surface-variant line-through opacity-60",
                    )}
                  >
                    <AvatarInitials name={m.userName} imageUrl={m.image} size={24} />
                    <span className="text-[13px] font-semibold">
                      {m.userName.split(" ")[0]}
                    </span>
                    {isIncluded && <Check size={14} />}
                  </button>
                );
              })}
            </div>
            {included.length > 0 && (
              <p className="text-[12px] text-on-surface-variant mt-1.5">
                Se divide entre {included.length} persona{included.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {state?.error && (
            <p className="text-error text-sm font-semibold">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-14 rounded-pill text-base font-bold shadow-[0_6px_16px_rgba(255,107,107,0.35)] mt-2"
          >
            {isPending ? "Guardando..." : "Listo, comprado"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ────────────── Delete Item Button ────────────── */

export function DeleteItemButton({
  itemId,
  householdId,
}: {
  itemId: string;
  householdId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("¿Estás seguro que deseas eliminar esta compra?")) {
          startTransition(async () => {
            await eliminarItem(itemId, householdId);
            broadcastUpdate(householdId);
          });
        }
      }}
      className="p-2 rounded-[10px] text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
    >
      <Trash2 size={16} />
    </button>
  );
}

/* ────────────── Mark Paid Sheet ────────────── */

type MyDebt = { toUserId: string; amount: number; pendingAmount: number; };

export function MarkPaidSheet({
  householdId,
  members,
  currentUserId,
  myDebts = [],
  preselectedToUserId,
  open,
  onOpenChange,
}: {
  householdId: string;
  members: Member[];
  currentUserId: string;
  myDebts?: MyDebt[];
  preselectedToUserId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    marcarPagado.bind(null, householdId),
    null,
  );
  const [method, setMethod] = useState<string | undefined>();
  const [toUserId, setToUserId] = useState<string>("");
  const [amountStr, setAmountStr] = useState<string>("");

  useEffect(() => {
    if (state && "success" in state) {
      broadcastUpdate(householdId);
      if ((state as any).notice) {
        broadcastNotice(householdId, (state as any).notice);
      }
      onOpenChange(false);
    }
  }, [state, onOpenChange, householdId]);

  useEffect(() => {
    if (open) {
      const initial = preselectedToUserId ?? "";
      setToUserId(initial);
      const initialDebt = myDebts.find((d) => d.toUserId === initial)?.amount ?? 0;
      setAmountStr(initialDebt > 0 ? String(initialDebt) : "");
    }
  }, [open, preselectedToUserId, myDebts]);

  function handleOpenChange(o: boolean) {
    onOpenChange(o);
    if (!o) {
      setMethod(undefined);
      setToUserId("");
      setAmountStr("");
    }
  }

  function handleSelectUser(uid: string) {
    setToUserId(uid);
    const debt = myDebts.find((d) => d.toUserId === uid)?.amount ?? 0;
    setAmountStr(debt > 0 ? String(debt) : "");
  }

  const otherMembers = members.filter((m) => m.userId !== currentUserId);
  const methods = ["Transferencia", "Efectivo", "Otro"];

  const debtToSelected = toUserId
    ? myDebts.find((d) => d.toUserId === toUserId)?.amount ?? 0
    : 0;
  const payAmount = parseInt(amountStr) || 0;
  const remainingAfter = debtToSelected - payAmount;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-[20px] px-5 pb-[calc(16px+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mt-3 mb-1 h-[5px] w-10 rounded-full bg-outline-variant" />
        <SheetHeader className="px-0">
          <SheetTitle className="font-display text-[19px] font-semibold text-on-surface">
            Registrar pago
          </SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {method && <input type="hidden" name="method" value={method} />}
          <input type="hidden" name="toUserId" value={toUserId} />

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              ¿A quién le pagaste?
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {otherMembers.map((m) => {
                const debt = myDebts.find((d) => d.toUserId === m.userId)?.amount ?? 0;
                const selected = toUserId === m.userId;
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => handleSelectUser(m.userId)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-pill border transition-colors",
                      selected
                        ? "bg-primary-container border-primary text-on-primary-container"
                        : "bg-surface-container border-outline-variant text-on-surface",
                    )}
                  >
                    <AvatarInitials name={m.userName} imageUrl={m.image} size={22} />
                    <span className="text-[13px] font-semibold">
                      {m.userName.split(" ")[0]}
                    </span>
                    {debt > 0 && (
                      <span className={cn(
                        "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                        selected
                          ? "bg-primary text-on-primary"
                          : "bg-error-container text-on-error-container",
                      )}>
                        ${debt.toLocaleString("es-CL")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Monto a pagar
              </label>
              {toUserId && debtToSelected > 0 && (
                <span className="text-[11px] text-on-surface-variant">
                  Debes: <span className="font-bold text-on-surface">${debtToSelected.toLocaleString("es-CL")}</span>
                </span>
              )}
            </div>
            <div className="relative mt-1.5">
              <CurrencyInput
                name="amount"
                value={amountStr}
                onValueChange={(val) => setAmountStr(val.toString())}
                placeholder="$0"
                className="w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
              />
            </div>
            {toUserId && debtToSelected > 0 && payAmount > 0 && (
              <p className={cn(
                "text-[12px] font-semibold mt-1.5",
                remainingAfter === 0
                  ? "text-success"
                  : remainingAfter > 0
                    ? "text-warning"
                    : "text-primary",
              )}>
                {remainingAfter === 0
                  ? "✓ Quedas al día"
                  : remainingAfter > 0
                    ? `Aún debes: $${remainingAfter.toLocaleString("es-CL")}`
                    : `Pagas $${Math.abs(remainingAfter).toLocaleString("es-CL")} de más (crédito a favor)`}
              </p>
            )}
            {toUserId && debtToSelected === 0 && (
              <p className="text-[12px] text-on-surface-variant mt-1.5">
                No tienes deuda con esta persona.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              ¿Cómo pagaste? (opcional)
            </label>
            <div className="flex gap-2 mt-2">
              {methods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(method === m ? undefined : m)}
                  className={cn(
                    "px-3.5 py-2 rounded-pill text-[13px] font-semibold border transition-colors",
                    method === m
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container border-outline-variant text-on-surface",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Nota (opcional)
            </label>
            <input
              name="note"
              autoCapitalize="sentences"
              placeholder="Ej: transferencia banco estado"
              className="mt-1.5 w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
            />
          </div>

          {state?.error && (
            <p className="text-error text-sm font-semibold">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-14 rounded-pill text-base font-bold shadow-[0_6px_16px_rgba(255,107,107,0.35)] mt-2"
          >
            {isPending ? "Registrando..." : "Marqué como pagado"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ────────────── Confirm / Report Settlement Buttons ────────────── */

export function ConfirmSettlementButton({
  settlementId,
  householdId,
}: {
  settlementId: string;
  householdId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await confirmarPago(settlementId, householdId);
          broadcastUpdate(householdId);
        })
      }
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12px] font-bold border transition-colors",
        "bg-success-container text-on-success-container border-success-container hover:opacity-90",
      )}
    >
      <Check size={14} />
      {pending ? "..." : "Confirmar"}
    </button>
  );
}

export function ReportErrorButton({
  settlementId,
  householdId,
}: {
  settlementId: string;
  householdId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await reportarErrorPago(settlementId, householdId);
          broadcastUpdate(householdId);
        })
      }
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12px] font-bold border transition-colors",
        "text-error border-error-container hover:bg-error-container",
      )}
    >
      <AlertCircle size={14} />
      {pending ? "..." : "Reportar error"}
    </button>
  );
}

/* ────────────── Shopping Item Card (client, handles sheet state) ────────────── */

export function ShoppingItemCard({
  item,
  householdId,
  members,
}: {
  item: {
    id: string;
    title: string;
    quantity: string | null;
    frequency: string | null;
    nextBuyerName: string | null;
    nextBuyerImage?: string | null;
  };
  householdId: string;
  members: Member[];
}) {
  const [boughtOpen, setBoughtOpen] = useState(false);

  return (
    <li className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[13px] bg-primary-container text-primary flex items-center justify-center shrink-0">
          <ShoppingCart size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] leading-tight truncate">
            {item.title}
          </h3>
          {item.quantity && (
            <p className="text-[13px] text-on-surface-variant">
              {item.quantity}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {item.frequency && (
              <span className="flex items-center gap-1 bg-secondary-container text-on-secondary-container text-[11px] font-semibold px-2 py-0.5 rounded-pill">
                <RefreshCw size={10} />
                Recurrente
              </span>
            )}
            {item.nextBuyerName && (
              <span className="flex items-center gap-1.5 text-[12px] text-on-surface-variant">
                Le toca a
                <div className="flex items-center gap-1">
                  <AvatarInitials name={item.nextBuyerName} imageUrl={item.nextBuyerImage} size={16} />
                  <span className="font-semibold text-on-surface">
                    {item.nextBuyerName.split(" ")[0]}
                  </span>
                </div>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <DeleteItemButton itemId={item.id} householdId={householdId} />
          <button
            onClick={() => setBoughtOpen(true)}
            className="p-2 rounded-[10px] bg-primary text-on-primary hover:opacity-90 transition-opacity"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
      <MarkBoughtSheet
        itemId={item.id}
        itemTitle={item.title}
        householdId={householdId}
        members={members}
        open={boughtOpen}
        onOpenChange={setBoughtOpen}
      />
    </li>
  );
}

/* ────────────── FAB (extended) ────────────── */

export function ComprasFAB({ householdId }: { householdId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-5 z-30 w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_8px_20px_rgba(255,107,107,0.45)] flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Agregar ítem"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
      <AddItemSheet
        householdId={householdId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

/* ────────────── Compras accounts section (client, handles sheet state) ────────────── */

export function AccountsSection({
  householdId,
  members,
  currentUserId,
  myDebts,
}: {
  householdId: string;
  members: Member[];
  currentUserId: string;
  myDebts: MyDebt[];
}) {
  const [payOpen, setPayOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setPayOpen(true)}
        className="text-primary text-[12px] font-bold"
      >
        + Registrar pago
      </button>
      <MarkPaidSheet
        householdId={householdId}
        members={members}
        currentUserId={currentUserId}
        myDebts={myDebts}
        open={payOpen}
        onOpenChange={setPayOpen}
      />
    </>
  );
}

export function DebtPayButton({
  householdId,
  members,
  currentUserId,
  myDebts,
  toUserId,
}: {
  householdId: string;
  members: Member[];
  currentUserId: string;
  myDebts: MyDebt[];
  toUserId: string;
}) {
  const [payOpen, setPayOpen] = useState(false);
  const debt = myDebts.find((d) => d.toUserId === toUserId);
  const isPending = debt ? debt.pendingAmount >= debt.amount : false;

  return (
    <>
      <button
        onClick={() => setPayOpen(true)}
        disabled={isPending}
        className={cn(
          "px-3 py-1.5 rounded-pill text-[12px] font-bold transition-colors disabled:opacity-70",
          isPending ? "bg-warning-container text-on-warning-container" : "bg-primary text-on-primary"
        )}
      >
        {isPending ? "Esperando conf." : "Pagar"}
      </button>
      <MarkPaidSheet
        householdId={householdId}
        members={members}
        currentUserId={currentUserId}
        myDebts={myDebts}
        preselectedToUserId={toUserId}
        open={payOpen}
        onOpenChange={setPayOpen}
      />
    </>
  );
}
