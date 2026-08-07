import Link from "next/link";
import { AvatarInitials } from "./avatar-initials";
import Image from "next/image";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function UserHeaderNav() {
  const user = await requireUser();
  
  // Calculate points for this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);

  const executions = await db.taskExecution.findMany({
    where: { 
      completedById: user.id,
      completedAt: { gte: startOfMonth }
    },
    select: { pointsEarned: true }
  });

  const points = executions.reduce((acc, curr) => acc + curr.pointsEarned, 0);

  return (
    <div className="flex items-center gap-3 shrink-0">
      <Link href="/hoy?tab=ranking" className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-pill border border-outline-variant hover:border-primary transition-colors shadow-sm">
         <span className="text-[14px] font-extrabold text-on-surface">{points}</span>
         <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-white shrink-0 ring-1 ring-primary/20 shadow-[0_0_0_2px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.12)]">
           <Image src="/coins.png" alt="RoomiCoins" width={24} height={24} className="object-cover w-full h-full" />
         </div>
      </Link>
      <Link href="/perfil">
        <AvatarInitials name={user.name ?? ""} imageUrl={user.image} size={40} />
      </Link>
    </div>
  );
}
