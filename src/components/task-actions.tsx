"use client";

import { useActionState, useState, useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { createTask, completarTarea, deleteTask } from "@/actions/task";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FREQUENCIES = [
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

export function CreateTaskForm({ householdId }: { householdId: string }) {
  const [state, formAction, isPending] = useActionState(
    createTask.bind(null, householdId),
    null,
  );
  const [freq, setFreq] = useState<(typeof FREQUENCIES)[number]["value"]>(
    "WEEKLY",
  );
  const [points, setPoints] = useState(1);
  const today = new Date();
  const [dayOfWeek, setDayOfWeek] = useState<number>(today.getDay());
  const [dayOfMonth, setDayOfMonth] = useState<number>(today.getDate());

  const needsWeek = freq === "WEEKLY" || freq === "BIWEEKLY";
  const needsMonth = freq === "MONTHLY";

  return (
    <form action={formAction} className="flex flex-col flex-1">
      <input type="hidden" name="frequency" value={freq} />
      <input type="hidden" name="points" value={points} />
      <input
        type="hidden"
        name="dayOfWeek"
        value={needsWeek ? dayOfWeek : ""}
      />
      <input
        type="hidden"
        name="dayOfMonth"
        value={needsMonth ? dayOfMonth : ""}
      />

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

        {needsWeek && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              ¿Qué día de la semana?
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDayOfWeek(d.value)}
                  aria-label={d.long}
                  className={cn(
                    "aspect-square rounded-full text-sm font-semibold border transition-colors",
                    dayOfWeek === d.value
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container border-outline-variant text-on-surface",
                  )}
                >
                  {d.short}
                </button>
              ))}
            </div>
          </div>
        )}

        {needsMonth && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              ¿Qué día del mes?
            </p>
            <MonthCalendarPicker
              value={dayOfMonth}
              onChange={setDayOfMonth}
            />
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Puntos
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
            <span
              className="font-display font-semibold w-16 text-center"
              style={{ fontSize: 34, lineHeight: 1 }}
            >
              {points}
            </span>
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

        <div className="rounded-[12px] bg-secondary-container text-on-secondary-container p-3 text-sm">
          🔄 Se asigna sola por rotación. Cada roommate toma su turno.
        </div>

        {state?.error && (
          <p className="text-error text-sm font-semibold">{state.error}</p>
        )}
      </div>

      <div className="mt-auto pt-8">
        <Button
          type="submit"
          disabled={isPending}
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
  onChange,
}: {
  value: number;
  onChange: (day: number) => void;
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
          const selected = day === value;
          const isToday = day === todayDate;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(day)}
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

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await completarTarea(taskId);
        });
      }}
      className="h-9 rounded-pill px-4 text-sm font-bold shadow-[0_3px_9px_rgba(255,107,107,0.35)]"
    >
      {isPending ? "..." : "Listo"}
    </Button>
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
          });
        }
      }}
    >
      <Trash2 size={16} />
    </button>
  );
}
