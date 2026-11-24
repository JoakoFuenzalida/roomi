import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { completeTask } from "@/lib/complete-task";
import { broadcastFromServer } from "@/lib/realtime-server";

const bodySchema = z.object({
  taskId: z.string().min(1),
  cycle: z.number().int().min(0),
});

// Lo llama el service worker cuando tocan "Listo" en una notificación.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true },
  });
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let result;
  try {
    result = await completeTask(user, parsed.data.taskId, parsed.data.cycle);
  } catch {
    return NextResponse.json({ error: "No perteneces a este hogar" }, { status: 403 });
  }
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  await broadcastFromServer(result.householdId, result.notice);
  return NextResponse.json({ ok: true, title: result.title });
}
