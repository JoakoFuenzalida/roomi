import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { leaveHousehold } from "@/actions/household";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import {
  CreateHouseholdForm,
  JoinHouseholdForm,
} from "@/components/household-forms";

export default async function HogarPage() {
  const user = await requireUser();

  const memberships = await db.membership.findMany({
    where: { userId: user.id, leftAt: null },
    orderBy: { joinedAt: "asc" },
    include: {
      household: {
        select: {
          id: true,
          name: true,
          inviteCode: true,
          members: {
            where: { leftAt: null },
            orderBy: { rotationOrder: "asc" },
            select: {
              id: true,
              role: true,
              rotationOrder: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
  });

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Tu hogar</h1>
        <p className="text-sm text-muted-foreground">
          Crea uno o únete a uno existente.
        </p>
      </header>

      {memberships.length === 0 ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Aún no perteneces a ningún hogar.
        </div>
      ) : (
        <div className="space-y-4">
          {memberships.map(({ household, role }) => (
            <section
              key={household.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{household.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {role === "ADMIN" ? "Admin" : "Miembro"} ·{" "}
                    {household.members.length} persona
                    {household.members.length !== 1 && "s"}
                  </p>
                </div>
              </div>

              <ul className="text-sm space-y-1">
                {household.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <span className="text-muted-foreground w-5">
                      {m.rotationOrder}.
                    </span>
                    <span>{m.user.name}</span>
                    {m.role === "ADMIN" && (
                      <span className="text-xs text-muted-foreground">
                        (admin)
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Link de invitación:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted rounded px-2 py-1 truncate">
                    {origin}/unirse/{household.inviteCode}
                  </code>
                  <CopyButton
                    value={`${origin}/unirse/${household.inviteCode}`}
                  />
                </div>
              </div>

              <form
                action={async () => {
                  "use server";
                  await leaveHousehold(household.id);
                }}
              >
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  Salir del hogar
                </Button>
              </form>
            </section>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Crear un hogar nuevo
        </h2>
        <CreateHouseholdForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Unirme con código
        </h2>
        <JoinHouseholdForm />
      </section>
    </main>
  );
}
