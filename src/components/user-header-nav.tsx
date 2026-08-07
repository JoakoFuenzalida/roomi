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
      <Link href="/hoy?tab=ranking" className="flex items-center gap-1.5 bg-surface-container-high pl-1 pr-2.5 py-1 rounded-pill border border-outline-variant hover:border-primary transition-colors shadow-sm">
         <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-white shrink-0">
           <Image src="/coins.jpeg" alt="RoomiCoins" width={20} height={20} className="object-cover w-full h-full" />
         </div>
         <span className="text-[13px] font-bold text-on-surface">{points}</span>
      </Link>
      <Link href="/perfil">
        <AvatarInitials name={user.name ?? ""} imageUrl={user.image} size={40} />
      </Link>
    </div>
  );
}
