"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Minus, Plus, Trash2 } from "lucide-react";
import { createTask, completarTarea, deleteTask, swapTurno } from "@/actions/task";
import { AvatarInitials } from "./avatar-initials";
import { TaskParticipantsOrder } from "./task-participants-order";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { broadcastUpdate, broadcastNotice } from "./realtime-refresh";
import Image from "next/image";

const FREQUENCIES = [
  { value: "ONCE", label: "Una vez" },
  { value: "DAILY", label: "Diaria" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
] as const;

// JS Date: 0=Dom, 1=Lun, ..., 6=Sáb. Chilean order: L M M J V S D.
const WEEKDAYS: { value: number; short: string; long: string }[] = [
  { value: 1, short: "L", long: "Lunes" },
  { value: 2, short: "M", long: "Martes" },
  { value: 3, short: "M", long: "Miércoles" },
  { value: 4, short: "J", long: "Jueves" },
  { value: 5, short: "V", long: "Viernes" },
  { value: 6, short: "S", long: "Sábado" },
  { value: 0, short: "D", long: "Domingo" },
];

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function CreateTaskForm({ 
  householdId,
  members 
}: { 
  householdId: string;
  members: { id: string; name: string; image: string | null }[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createTask.bind(null, householdId),
    null,
  );

  useEffect(() => {
    if (state && "success" in state) {
      broadcastUpdate(householdId);
      router.push(`/tareas?hogarId=${householdId}`);
    }
  }, [state, householdId, router]);

  const [freq, setFreq] = useState<(typeof FREQUENCIES)[number]["value"]>(
    "ONCE",
  );
  const [points, setPoints] = useState(1);
  const today = new Date();
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([today.getDay()]);
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>([today.getDate()]);
  const [onceDate, setOnceDate] = useState<string>(today.toISOString().split("T")[0]);
  const [participants, setParticipants] = useState<string[]>(members.map(m => m.id));

  const needsWeek = freq === "WEEKLY" || freq === "BIWEEKLY";
  const needsMonth = freq === "MONTHLY";
  const needsOnceDate = freq === "ONCE";

  return (
    <form action={formAction} className="flex flex-col flex-1">
      <input type="hidden" name="frequency" value={freq} />
      <input type="hidden" name="points" value={points} />
      {needsWeek &&
        daysOfWeek.map((d) => (
          <input key={d} type="hidden" name="daysOfWeek" value={d} />
        ))}
      {needsMonth &&
        daysOfMonth.map((d) => (
          <input key={`month-${d}`} type="hidden" name="daysOfMonth" value={d} />
        ))}
      {needsOnceDate && (
        <input type="hidden" name="onceDate" value={onceDate} />
      )}
      {participants.map((id, index) => (
        <input key={`p-${id}`} type="hidden" name="participantIds" value={id} />
      ))}

      <div className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide"
          >
            Título
          </label>
          <input
            id="title"
            name="title"
            required
            autoCapitalize="sentences"
            placeholder="Ej: Limpiar el baño"
            className="w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Frecuencia
          </p>
          <div className="flex gap-2 flex-wrap">
            {FREQUENCIES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFreq(f.value)}
                className={cn(
                  "px-4 py-2 rounded-pill text-sm font-semibold border transition-colors",
                  freq === f.value
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container border-outline-variant text-on-surface",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {needsOnceDate && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              ¿Cuándo se hará?
            </p>
            <input
              type="date"
              value={onceDate}
              onChange={(e) => setOnceDate(e.target.value)}
              className="w-full rounded-[12px] border-[1.5px] border-outline px-[14px] py-[13px] bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        {needsWeek && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              ¿Qué día{daysOfWeek.length > 1 ? "s" : ""} de la semana?
            </p>
            <p className="text-[11px] text-on-surface-variant">
              Toca varios si es más de una vez por semana.
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((d) => {
                const selected = daysOfWeek.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDaysOfWeek((s) => toggle(s, d.value))}
                    aria-label={d.long}
                    aria-pressed={selected}
                    className={cn(
                      "aspect-square rounded-full text-sm font-semibold border transition-colors",
                      selected
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container border-outline-variant text-on-surface",
                    )}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {needsMonth && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              ¿Qué día{daysOfMonth.length > 1 ? "s" : ""} del mes?
            </p>
            <p className="text-[11px] text-on-surface-variant">
              Toca varios si es más de una vez por mes.
            </p>
            <MonthCalendarPicker
              value={daysOfMonth}
              onToggle={(day) => setDaysOfMonth((s) => toggle(s, day))}
            />
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            ¿Quiénes participan?
          </p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const selected = participants.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setParticipants(s => toggle(s, m.id))}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-pill border transition-colors",
                    selected
                      ? "bg-primary-container border-primary text-primary"
                      : "bg-surface-container border-outline-variant text-on-surface-variant opacity-60 hover:opacity-100"
                  )}
                >
                  <AvatarInitials name={m.name} imageUrl={m.image} size={20} />
                  <span className="text-[13px] font-semibold">{m.name}</span>
                </button>
              );
            })}
          </div>
          {participants.length === 0 && (
            <p className="text-error text-xs">Debes seleccionar al menos un participante.</p>
          )}

          {freq !== "ONCE" && participants.length > 0 && (
            <TaskParticipantsOrder 
              members={members}
              selectedIds={participants}
              onChange={setParticipants}
            />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            RoomiCoins
          </p>
          <div className="flex items-center gap-4 justify-center py-2">
            <button
              type="button"
              onClick={() => setPoints((p) => Math.max(1, p - 1))}
              disabled={points <= 1}
              className="w-12 h-12 rounded-full border-[1.5px] border-outline flex items-center justify-center disabled:opacity-30 hover:bg-surface-container"
            >
              <Minus size={20} />
            </button>
            <div className="flex items-center gap-1 justify-center w-24">
              <span
                className="font-display font-semibold text-center"
                style={{ fontSize: 34, lineHeight: 1 }}
              >
                {points}
              </span>
              <div className="w-8 h-8 flex items-center justify-center shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.15)]">
                <Image src="/coins.png" alt="RC" width={32} height={32} className="object-contain w-full h-full" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPoints((p) => Math.min(10, p + 1))}
              disabled={points >= 10}
              className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-30 shadow-[0_3px_9px_rgba(255,107,107,0.35)]"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>



        {state?.error && (
          <p className="text-error text-sm font-semibold">{state.error}</p>
        )}
      </div>

      <div className="mt-auto pt-8">
        <Button
          type="submit"
          disabled={isPending || participants.length === 0}
          className="w-full h-14 rounded-pill text-base font-bold shadow-[0_6px_16px_rgba(255,107,107,0.35)]"
        >
          {isPending ? "Creando..." : "Crear tarea"}
        </Button>
      </div>
    </form>
  );
}

function MonthCalendarPicker({
  value,
  onToggle,
}: {
  value: number[];
  onToggle: (day: number) => void;
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthLabel = today.toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });

  const firstOfMonth = new Date(year, month, 1);
  // Chilean grid: Monday=0, Sunday=6
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = today.getDate();

  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-4">
      <p className="font-display font-semibold text-[15px] capitalize text-center mb-3">
        {monthLabel}
      </p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div
            key={i}
            className="text-[11px] font-bold text-on-surface-variant text-center uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day == null) return <div key={i} className="aspect-square" />;
          const selected = value.includes(day);
          const isToday = day === todayDate;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggle(day)}
              aria-pressed={selected}
              className={cn(
                "aspect-square rounded-full text-sm font-medium transition-colors flex items-center justify-center",
                selected
                  ? "bg-primary text-on-primary font-bold"
                  : isToday
                    ? "bg-primary-container text-on-primary-container"
                    : "hover:bg-surface-container text-on-surface",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CompleteTaskButton({ taskId, householdId }: { taskId: string; householdId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await completarTarea(taskId);
          broadcastUpdate(householdId);
          if (res?.notice) {
            broadcastNotice(householdId, res.notice);
          }
        });
      }}
      className="h-9 rounded-pill px-4 text-sm font-bold shadow-[0_3px_9px_rgba(255,107,107,0.35)]"
    >
      {isPending ? "..." : "Listo"}
    </Button>
  );
}

type SwapMember = { id: string; userName: string };

export function SwapButton({
  taskId,
  householdId,
  members,
}: {
  taskId: string;
  householdId: string;
  members: { id: string; userName: string; userImage?: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (members.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary-container/40 flex items-center justify-center transition-colors"
        aria-label="Intercambiar turno"
      >
        <ArrowLeftRight size={16} />
      </button>

      {open && (
        <div className="absolute right-0 bottom-10 z-20 bg-surface-container-lowest border border-outline-variant rounded-[12px] shadow-lg p-2 min-w-[160px]">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide px-2 pb-1">
            Pasar turno a
          </p>
          {members.map((m) => (
            <button
              key={m.id}
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await swapTurno(taskId, m.id);
                  broadcastUpdate(householdId);
                  setOpen(false);
                });
              }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-[8px] hover:bg-surface-container transition-colors text-left disabled:opacity-50"
            >
              <AvatarInitials name={m.userName} imageUrl={m.userImage} size={24} />
              <span className="text-[13px] font-semibold truncate">
                {m.userName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DeleteTaskButton({
  taskId,
  householdId,
}: {
  taskId: string;
  householdId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="w-8 h-8 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/60 flex items-center justify-center transition-colors"
      aria-label="Eliminar tarea"
      onClick={() => {
        if (confirm("¿Eliminar esta tarea?")) {
          startTransition(async () => {
            await deleteTask(taskId, householdId);
            broadcastUpdate(householdId);
          });
        }
      }}
    >
      <Trash2 size={16} />
    </button>
  );
}
