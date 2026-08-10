import Link from "next/link";
import { AvatarInitials } from "./avatar-initials";
import Image from "next/image";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function UserHeaderNav({ householdId }: { householdId?: string }) {
  const user = await requireUser();
  
  // Calculate points for this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);

  const executions = await db.taskExecution.findMany({
    where: { 
      completedById: user.id,
      completedAt: { gte: startOfMonth },
      ...(householdId ? { task: { householdId } } : {})
    },
    select: { pointsEarned: true }
  });

  const points = executions.reduce((acc, curr) => acc + curr.pointsEarned, 0);

  return (
    <div className="flex items-center gap-3 shrink-0">
      <Link href="/hoy?tab=ranking" className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-pill border border-outline-variant hover:border-primary transition-colors shadow-sm">
         <span className="text-[14px] font-extrabold text-on-surface">{points}</span>
         <div className="w-8 h-8 flex items-center justify-center shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.15)]">
           <Image src="/coins.png" alt="RoomiCoins" width={32} height={32} className="object-contain w-full h-full" />
         </div>
      </Link>
      <Link href="/perfil">
        <AvatarInitials name={user.name ?? ""} imageUrl={user.image} size={40} />
      </Link>
    </div>
  );
}
