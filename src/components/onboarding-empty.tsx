"use client";

import { useState } from "react";
import { Home, Ticket, Sparkles, Users, ShoppingBag, Receipt } from "lucide-react";
import { CreateHouseholdForm, JoinHouseholdForm } from "./household-forms";
import { cn } from "@/lib/utils";

export function OnboardingEmpty({ firstName }: { firstName: string }) {
  const [tab, setTab] = useState<"crear" | "unirse">("crear");

  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-[24px] bg-primary-container flex items-center justify-center mb-4 shadow-[0_8px_20px_rgba(255,107,107,0.2)]">
          <Home size={40} className="text-primary" strokeWidth={2.2} />
        </div>
        <h1 className="font-display font-bold text-[24px] leading-tight">
          ¡Bienvenido{firstName ? `, ${firstName}` : ""}! 👋
        </h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-[300px] mx-auto">
          Para partir necesitas un <strong>hogar</strong>: el grupo con quien compartes convivencia.
        </p>
      </div>

      <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-4">
        <div className="grid grid-cols-3 gap-3">
          <Feature icon={<Sparkles size={20} />} label="Tareas rotan solas" />
          <Feature icon={<ShoppingBag size={20} />} label="Compras compartidas" />
          <Feature icon={<Receipt size={20} />} label="Gastos y cuentas" />
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-surface-container-high rounded-[14px]">
        <button
          onClick={() => setTab("crear")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors",
            tab === "crear"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant",
          )}
        >
          <Home size={16} /> Crear hogar
        </button>
        <button
          onClick={() => setTab("unirse")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors",
            tab === "unirse"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant",
          )}
        >
          <Ticket size={16} /> Unirme
        </button>
      </div>

      <div className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-5 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
        {tab === "crear" ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-primary" />
              <p className="text-[13px] font-semibold">Serás el admin del hogar</p>
            </div>
            <p className="text-[12px] text-on-surface-variant mb-4">
              Dale un nombre. Podrás invitar a tus roomis con un código o QR.
            </p>
            <CreateHouseholdForm />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Ticket size={16} className="text-primary" />
              <p className="text-[13px] font-semibold">¿Tienes un código o link?</p>
            </div>
            <p className="text-[12px] text-on-surface-variant mb-4">
              Pídele a un roomi que te comparta el código de invitación de su hogar.
            </p>
            <JoinHouseholdForm />
          </>
        )}
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="w-10 h-10 rounded-full bg-primary-container/60 text-primary flex items-center justify-center">
        {icon}
      </div>
      <p className="text-[11px] font-semibold text-on-surface leading-tight">{label}</p>
    </div>
  );
}
