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
import { RemoveMemberButton } from "@/components/remove-member-button";
import { removeMember, resetRoomiCoins } from "@/actions/household";
import { QRInviteButton } from "@/components/qr-invite";
import { HouseholdCoverUpload } from "@/components/household-cover-upload";
import { ResetRankingButton } from "@/components/reset-ranking-button";

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
          coverImage: true,
          members: {
            where: { leftAt: null },
            orderBy: { rotationOrder: "asc" },
            select: {
              id: true,
              role: true,
              rotationOrder: true,
              user: { select: { id: true, name: true, image: true } },
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
          currentUserId={user.id}
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
  coverImage?: string | null;
  members: {
    id: string;
    role: "ADMIN" | "MEMBER";
    rotationOrder: number;
    user: { id: string; name: string; image?: string | null };
  }[];
};

function ActiveHouseholdCard({
  household,
  role,
  origin,
  currentUserId,
}: {
  household: ActiveHousehold;
  role: "ADMIN" | "MEMBER";
  origin: string;
  currentUserId: string;
}) {
  const inviteUrl = `${origin}/unirse/${household.inviteCode}`;
  const displayInvite = inviteUrl.replace(/^https?:\/\//, "");

  return (
    <section className="rounded-[16px] bg-surface-container-lowest border border-outline-variant shadow-[0_2px_10px_rgba(15,23,42,0.05)] overflow-hidden">
      {/* Cover Image Section */}
      <div className="relative h-36 w-full group overflow-hidden bg-secondary-container">
        {household.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={household.coverImage} 
            alt={`Portada de ${household.name}`} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-primary/60 to-tertiary/40" />
        )}
        
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" />
        
        {/* Upload Button */}
        {role === "ADMIN" && (
          <HouseholdCoverUpload householdId={household.id} />
        )}

        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between z-10">
          <div>
            <h2 className="font-display font-bold text-[22px] text-white drop-shadow-md">
              {household.name}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wide bg-success text-on-success px-2 py-0.5 rounded-pill shadow-sm mt-1 inline-block">
              Activo
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-4">
        <div className="flex items-center gap-3">
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
          Miembros del hogar
        </p>
        <ul className="space-y-3">
          {household.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <AvatarInitials name={m.user.name} imageUrl={m.user.image} size={32} />
              <span className="flex-1 text-sm font-medium">
                {m.user.name}
                {m.role === "ADMIN" && (
                  <span className="text-on-surface-variant text-xs ml-1">
                    (admin)
                  </span>
                )}
              </span>
              {role === "ADMIN" && m.user.id !== currentUserId && (
                <RemoveMemberButton 
                  memberName={m.user.name}
                  onRemove={async () => {
                    "use server";
                    await removeMember(household.id, m.user.id);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {role === "ADMIN" && (
          <ResetRankingButton
            onReset={async () => {
              "use server";
              await resetRoomiCoins(household.id);
            }}
          />
        )}
        
        <LeaveHouseholdButton
            onLeave={async () => {
              "use server";
              await leaveHousehold(household.id);
            }}
          />
        </div>
      </div>
    </section>
  );
}
