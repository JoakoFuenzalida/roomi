"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddBillItemSheet, PopulateRecurringButton } from "./cuentas-actions";

type Member = {
  id: string;
  userId: string;
  userName: string;
};

export function AddBillItemButton({
  householdId,
  month,
  year,
  members,
}: {
  householdId: string;
  month: number;
  year: number;
  members: Member[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(true)}
          className="flex-1 h-11 rounded-pill border border-primary text-primary font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-primary-container/20 transition-colors"
        >
          <Plus size={16} /> Agregar gasto
        </button>
        <PopulateRecurringButton householdId={householdId} />
      </div>
      <AddBillItemSheet
        householdId={householdId}
        month={month}
        year={year}
        members={members}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
