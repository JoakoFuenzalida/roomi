import Link from "next/link";
import { ChevronLeft, Crown, Users } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { RoomiHeader } from "@/components/roomi-logo";
import { AvatarInitials } from "@/components/avatar-initials";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { VacationToggle } from "@/components/vacation-toggle";

export default async function PerfilPage() {
  const session = await auth();
  const name = session!.user.name ?? "";

  const memberships = await db.membership.findMany({
    where: { userId: session!.user.id, leftAt: null },
    include: {
      household: { select: { id: true, name: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <main className="max-w-md mx-auto px-5 pt-6">
      <header className="flex items-center justify-between mb-6">
        <RoomiHeader />
        <AvatarInitials name={name} size={40} />
      </header>

      <div className="mb-6">
        <h1 className="font-display font-semibold text-[26px] leading-tight">
          Perfil
        </h1>
      </div>

      <section className="rounded-[14px] bg-surface-container-lowest border border-outline-variant p-5 shadow-[0_2px_10px_rgba(15,23,42,0.05)] mb-4">
        <div className="flex items-center gap-4">
          <AvatarInitials name={name} size={56} />
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-[19px] truncate">
              {name}
            </p>
            <p className="text-sm text-on-surface-variant truncate">
              {session!.user.email}
            </p>
          </div>
        </div>
      </section>

      {memberships.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-3">
            Hogares
          </h2>
          <ul className="space-y-2">
            {memberships.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/hogar`}
                  className="flex items-center gap-3 rounded-[14px] bg-surface-container-lowest border border-outline-variant px-4 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-colors hover:bg-surface-container-low"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <span className="flex-1 text-[15px] font-semibold truncate">
                    {m.household.name}
                  </span>
                  {m.role === "ADMIN" && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-warning bg-warning-container px-2 py-0.5 rounded-pill">
                      <Crown size={12} /> Admin
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {memberships.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-3">
            Vacaciones
          </h2>
          <p className="text-[12px] text-on-surface-variant mb-3">
            No te asignarán tareas ni compras mientras estés de vacaciones.
          </p>
          <VacationToggle
            memberships={memberships.map((m) => ({
              id: m.id,
              householdId: m.household.id,
              householdName: m.household.name,
              onVacationUntil: m.onVacationUntil,
            }))}
          />
        </section>
      )}

      <section className="mb-4">
        <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-3">
          Apariencia
        </h2>
        <ThemeToggle />
      </section>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button
          type="submit"
          variant="outline"
          className="w-full h-12 rounded-pill text-error hover:bg-error-container hover:text-on-error-container hover:border-error text-sm font-semibold"
        >
          Cerrar sesión
        </Button>
      </form>

      <div className="pb-24" />
    </main>
  );
}
