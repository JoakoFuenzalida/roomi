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

export function CreateTaskForm({ householdId }: { householdId: string }) {
  const [state, formAction, isPending] = useActionState(
    createTask.bind(null, householdId),
    null,
  );
  const [freq, setFreq] = useState<(typeof FREQUENCIES)[number]["value"]>("WEEKLY");
  const [points, setPoints] = useState(1);

  return (
    <form action={formAction} className="flex flex-col flex-1">
      <input type="hidden" name="frequency" value={freq} />
      <input type="hidden" name="points" value={points} />

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
