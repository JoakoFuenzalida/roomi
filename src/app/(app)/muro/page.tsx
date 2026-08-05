import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getNotices } from "@/actions/notices";
import { RoomiHeader, RoomiSymbol } from "@/components/roomi-logo";
import { AvatarInitials } from "@/components/avatar-initials";
import { Button } from "@/components/ui/button";
import { NoticeCard, NewNoticeSheet } from "@/components/muro-actions";
import { cn } from "@/lib/utils";

export default async function MuroPage({
  searchParams,
}: {
  searchParams: Promise<{ hogarId?: string }>;
}) {
  const user = await requireUser();
  const { hogarId } = await searchParams;

  const memberships = await db.membership.findMany({
    where: { userId: user.id, leftAt: null },
    include: { household: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  if (memberships.length === 0) {
    return (
      <main className="max-w-md mx-auto px-5 pt-6">
        <header className="flex items-center justify-between mb-6">
          <RoomiHeader />
          <Link href="/perfil">
            <AvatarInitials name={user.name} size={40} />
          </Link>
        </header>
        <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
            <RoomiSymbol size={36} />
          </div>
          <p className="text-sm text-on-surface-variant">
            Necesitas un hogar para ver el muro.
          </p>
          <Button
            render={<Link href="/hogar" />}
            nativeButton={false}
            className="w-full h-12 rounded-pill font-bold"
          >
            Ir a hogar
          </Button>
        </div>
      </main>
    );
  }

  const active =
    memberships.find((m) => m.householdId === hogarId) ?? memberships[0];

  const isAdmin = active.role === "ADMIN";
  const notices = await getNotices(active.householdId);

  return (
    <main className="max-w-md mx-auto px-5 pt-6 relative min-h-svh">
      <header className="flex items-center justify-between mb-6">
        <RoomiHeader />
        <Link href="/perfil">
          <AvatarInitials name={user.name} size={40} />
        </Link>
      </header>

      <div className="mb-4">
        <h1 className="font-display font-semibold text-[26px] leading-tight">
          Muro
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          {active.household.name}
        </p>
      </div>

      {memberships.length > 1 && (
        <div className="-mx-5 px-5 mb-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {memberships.map((m) => (
              <Link
                key={m.householdId}
                href={`/muro?hogarId=${m.householdId}`}
                className={cn(
                  "px-4 py-2 rounded-pill text-sm font-semibold border transition-colors whitespace-nowrap",
                  m.householdId === active.householdId
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container border-outline-variant text-on-surface",
                )}
              >
                {m.household.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {notices.length === 0 ? (
        <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-6 flex flex-col items-center text-center gap-4 mt-4">
          <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center">
            <RoomiSymbol size={30} />
          </div>
          <div>
            <p className="font-display font-semibold text-[18px]">
              Sin avisos
            </p>
            <p className="text-sm text-on-surface-variant mt-1">
              Publica algo para tu hogar.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              householdId={active.householdId}
              currentUserId={user.id}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      <NewNoticeSheet householdId={active.householdId} />

      <div className="pb-24" />
    </main>
  );
}
