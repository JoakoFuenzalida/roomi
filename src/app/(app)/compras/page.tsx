import { requireUser } from "@/lib/session";
import { RoomiHeader, RoomiSymbol } from "@/components/roomi-logo";
import { AvatarInitials } from "@/components/avatar-initials";

export default async function ComprasPage() {
  const user = await requireUser();
  return (
    <main className="max-w-md mx-auto px-5 pt-6">
      <header className="flex items-center justify-between mb-6">
        <RoomiHeader />
        <AvatarInitials name={user.name} size={40} />
      </header>

      <div className="mb-6">
        <h1 className="font-display font-semibold text-[26px] leading-tight">
          Compras
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Se acabaron los "quién compró qué" en el grupo.
        </p>
      </div>

      <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-8 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
          <RoomiSymbol size={36} />
        </div>
        <div>
          <p className="font-display font-semibold text-lg">Muy pronto</p>
          <p className="text-sm text-on-surface-variant mt-1 max-w-[260px]">
            Estamos terminando de coserlo. Vuelve en unos días.
          </p>
        </div>
      </div>
    </main>
  );
}
