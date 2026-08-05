"use client";

import { useState, useTransition } from "react";
import { Palmtree } from "lucide-react";
import { setVacation } from "@/actions/vacation";

type MembershipVacation = {
  id: string;
  householdId: string;
  householdName: string;
  onVacationUntil: Date | null;
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}

export function VacationToggle({
  memberships,
}: {
  memberships: MembershipVacation[];
}) {
  return (
    <ul className="space-y-2">
      {memberships.map((m) => (
        <VacationRow key={m.id} membership={m} />
      ))}
    </ul>
  );
}

function VacationRow({ membership }: { membership: MembershipVacation }) {
  const isActive =
    membership.onVacationUntil &&
    new Date(membership.onVacationUntil) > new Date();

  const [showPicker, setShowPicker] = useState(false);
  const [date, setDate] = useState("");
  const [pending, startTransition] = useTransition();

  function handleActivate() {
    if (!date) return;
    startTransition(async () => {
      await setVacation(membership.id, membership.householdId, date);
      setShowPicker(false);
      setDate("");
    });
  }

  function handleDeactivate() {
    startTransition(() =>
      setVacation(membership.id, membership.householdId, null),
    );
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="rounded-[14px] bg-surface-container-lowest border border-outline-variant px-4 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isActive
                ? "bg-success-container text-success"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            <Palmtree size={18} />
          </div>
          <div>
            <p className="text-[14px] font-semibold">
              {membership.householdName}
            </p>
            {isActive && (
              <p className="text-[12px] text-success font-semibold">
                Hasta {formatDate(membership.onVacationUntil!)}
              </p>
            )}
          </div>
        </div>

        {isActive ? (
          <button
            onClick={handleDeactivate}
            disabled={pending}
            className="px-3 py-1.5 rounded-pill text-[12px] font-bold border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            Desactivar
          </button>
        ) : (
          <button
            onClick={() => setShowPicker(!showPicker)}
            disabled={pending}
            className="px-3 py-1.5 rounded-pill text-[12px] font-bold bg-primary text-on-primary transition-colors disabled:opacity-50"
          >
            Activar
          </button>
        )}
      </div>

      {showPicker && !isActive && (
        <div className="mt-4 p-3 rounded-[12px] bg-surface-container-low border border-outline-variant">
          <label className="block text-[12px] font-semibold text-on-surface-variant mb-2">
            ¿Hasta qué día estarás fuera?
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 h-10 rounded-[10px] border border-outline-variant bg-surface-container-lowest px-3 text-[14px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleActivate}
              disabled={!date || pending}
              className="h-10 px-4 rounded-[10px] bg-primary text-on-primary text-[13px] font-bold disabled:opacity-50 transition-opacity"
            >
              {pending ? "..." : "Confirmar"}
            </button>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2 leading-tight">
            Durante este tiempo, no se te asignarán nuevas tareas ni gastos compartidos.
          </p>
        </div>
      )}
    </div>
  );
}
