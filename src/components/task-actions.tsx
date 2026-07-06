"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import { createTask, completarTarea, deleteTask } from "@/actions/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateTaskForm({ householdId }: { householdId: string }) {
  const [state, formAction, isPending] = useActionState(
    createTask.bind(null, householdId),
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Título de la tarea</Label>
        <Input
          id="title"
          name="title"
          placeholder="Ej: Limpiar el baño"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Frecuencia</Label>
        <select
          id="frequency"
          name="frequency"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          required
          defaultValue="WEEKLY"
        >
          <option value="DAILY">Diaria</option>
          <option value="WEEKLY">Semanal</option>
          <option value="BIWEEKLY">Quincenal</option>
          <option value="MONTHLY">Mensual</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">Puntos</Label>
        <Input
          id="points"
          name="points"
          type="number"
          min="1"
          max="100"
          defaultValue="1"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creando..." : "Crear tarea"}
      </Button>
    </form>
  );
}

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="default"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await completarTarea(taskId);
        });
      }}
    >
      {isPending ? "Completando..." : "Listo"}
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
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (confirm("¿Seguro que quieres eliminar esta tarea?")) {
          startTransition(async () => {
            await deleteTask(taskId, householdId);
          });
        }
      }}
    >
      {isPending ? "..." : "Eliminar"}
    </Button>
  );
}
