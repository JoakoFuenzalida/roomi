import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { joinByCode } from "@/actions/household";
import { Button } from "@/components/ui/button";

export default async function UnirsePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const household = await db.household.findUnique({
    where: { inviteCode: code },
    select: {
      id: true,
      name: true,
      members: {
        where: { leftAt: null },
        select: { id: true, userId: true },
      },
    },
  });
  if (!household) notFound();

  const session = await auth();
  const callbackUrl = `/unirse/${code}`;

  if (!session?.user?.id) {
    return (
      <main className="min-h-svh flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold">Unirte a {household.name}</h1>
          <p className="text-sm text-muted-foreground">
            {household.members.length} persona
            {household.members.length !== 1 && "s"} en el hogar
          </p>
          <div className="space-y-2 pt-4">
            <Button
              render={
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                />
              }
              nativeButton={false}
              className="w-full"
            >
              Ya tengo cuenta
            </Button>
            <Button
              render={
                <Link
                  href={`/registro?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                />
              }
              nativeButton={false}
              variant="outline"
              className="w-full"
            >
              Crear cuenta
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const already = household.members.some((m) => m.userId === session.user.id);
  if (already) redirect("/hogar");

  return (
    <main className="min-h-svh flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">Unirte a {household.name}</h1>
        <p className="text-sm text-muted-foreground">
          {household.members.length} persona
          {household.members.length !== 1 && "s"} ya adentro. Entrarás al final
          de la rotación.
        </p>
        <form action={joinByCode.bind(null, code)} className="space-y-2 pt-4">
          <Button type="submit" className="w-full">
            Unirme
          </Button>
          <Button
            render={<Link href="/hoy" />}
            nativeButton={false}
            variant="outline"
            className="w-full"
          >
            Cancelar
          </Button>
        </form>
      </div>
    </main>
  );
}
