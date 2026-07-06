import { auth, signOut } from "@/lib/auth";
import { RoomiHeader } from "@/components/roomi-logo";
import { AvatarInitials } from "@/components/avatar-initials";
import { Button } from "@/components/ui/button";

export default async function PerfilPage() {
  const session = await auth();
  const name = session!.user.name ?? "";

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

      <section className="rounded-[16px] bg-surface-container-lowest border border-outline-variant p-5 shadow-[0_2px_10px_rgba(15,23,42,0.05)] mb-4">
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
    </main>
  );
}
