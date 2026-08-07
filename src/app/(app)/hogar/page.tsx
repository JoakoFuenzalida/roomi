import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { leaveHousehold } from "@/actions/household";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import Link from "next/link";
import { UserHeaderNav } from "@/components/user-header-nav";
import { AvatarInitials } from "@/components/avatar-initials";
import { RoomiHeader } from "@/components/roomi-logo";
import {
  CreateHouseholdForm,
  JoinHouseholdForm,
} from "@/components/household-forms";
import { LeaveHouseholdButton } from "@/components/leave-household-button";
import { QRInviteButton } from "@/components/qr-invite";

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
              user: { select: { name: true, image: true } },
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

  const [active, ...others] = memberships;

  return (
    <main className="max-w-md mx-auto w-full px-5 pb-6 flex flex-col flex-1">
      <header className="sticky top-0 z-30 bg-background pt-6 pb-4 -mx-5 px-5 flex items-center justify-between mb-2 shrink-0">
        <RoomiHeader />
        <UserHeaderNav />
      </header>

      <div className="mb-6">
        <h1 className="font-display font-semibold text-[26px] leading-tight">
          Tu hogar
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Crea uno o únete a uno existente.
        </p>
      </div>

      {active ? (
        <ActiveHouseholdCard
          household={active.household}
          role={active.role}
          origin={origin}
        />
      ) : (
        <div className="rounded-[16px] bg-surface-container-low border border-outline-variant p-6 text-center">
          <p className="text-sm text-on-surface-variant">
            Aún no perteneces a ningún hogar.
          </p>
        </div>
      )}

      {others.length > 0 && (
        <section className="mt-6 space-y-2">
          <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">
            Otros hogares
          </h2>
          <ul className="space-y-2">
            {others.map(({ household }) => (
              <li
                key={household.id}
                className="flex items-center gap-3 rounded-[14px] bg-surface-container-lowest border border-outline-variant p-3"
              >
                <div className="w-10 h-10 rounded-[13px] bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">
                  {household.name
                    .split(" ")
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase() ?? "")
                    .join("")}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[15px]">{household.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {household.members.length} miembro
                    {household.members.length !== 1 && "s"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 space-y-3">
        <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">
          Crear un hogar nuevo
        </h2>
        <CreateHouseholdForm />
      </section>

      <section className="mt-8 space-y-3 pb-6">
        <h2 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">
          Unirme con código
        </h2>
        <JoinHouseholdForm />
      </section>
    </main>
  );
}

type ActiveHousehold = {
  id: string;
  name: string;
  inviteCode: string;
  members: {
    id: string;
    role: "ADMIN" | "MEMBER";
    rotationOrder: number;
    user: { name: string; image?: string | null };
  }[];
};

function ActiveHouseholdCard({
  household,
  role,
  origin,
}: {
  household: ActiveHousehold;
  role: "ADMIN" | "MEMBER";
  origin: string;
}) {
  const inviteUrl = `${origin}/unirse/${household.inviteCode}`;
  const displayInvite = inviteUrl.replace(/^https?:\/\//, "");

  return (
    <section className="rounded-[16px] bg-surface-container-lowest border border-outline-variant p-5 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-display font-semibold text-[19px]">
          {household.name}
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wide bg-success-container text-on-success-container px-2 py-0.5 rounded-pill">
          Activo
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <div className="flex -space-x-[9px]">
          {household.members.slice(0, 4).map((m) => (
            <div
              key={m.id}
              className="ring-2 ring-surface-container-lowest rounded-full"
            >
              <AvatarInitials name={m.user.name} imageUrl={m.user.image} size={32} />
            </div>
          ))}
        </div>
        <p className="text-sm text-on-surface-variant">
          {household.members.length} miembro
          {household.members.length !== 1 && "s"} ·{" "}
          {role === "ADMIN" ? "Eres admin" : "Miembro"}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-2">
          Link de invitación
        </p>
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 min-w-0 flex items-center gap-2 rounded-pill bg-surface-container border border-outline-variant p-1 pl-4">
            <span
              className="flex-1 min-w-0 text-[13px] font-semibold text-on-surface-variant truncate block"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              {displayInvite}
            </span>
            <CopyButton value={inviteUrl} />
          </div>
          <QRInviteButton inviteUrl={inviteUrl} />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-2">
          Orden de rotación
        </p>
        <ul className="space-y-2">
          {household.members.map((m, i) => (
            <li key={m.id} className="flex items-center gap-3">
              <span className="w-5 text-on-surface-variant text-sm font-semibold text-center">
                {m.rotationOrder}
              </span>
              <AvatarInitials name={m.user.name} imageUrl={m.user.image} size={30} />
              <span className="flex-1 text-sm font-medium">
                {m.user.name}
                {m.role === "ADMIN" && (
                  <span className="text-on-surface-variant text-xs ml-1">
                    (admin)
                  </span>
                )}
              </span>
              {i === 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-primary-container text-on-primary-container px-2 py-0.5 rounded-pill">
                  Le toca
                </span>
              )}
              {i === 1 && (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-pill">
                  Sigue
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <LeaveHouseholdButton
          onLeave={async () => {
            "use server";
            await leaveHousehold(household.id);
          }}
        />
      </div>
    </section>
  );
}
