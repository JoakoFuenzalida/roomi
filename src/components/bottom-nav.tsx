"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, ShoppingBag, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/hoy", label: "Hoy", Icon: Home },
  { href: "/tareas", label: "Tareas", Icon: ListChecks },
  { href: "/compras", label: "Compras", Icon: ShoppingBag },
  { href: "/hogar", label: "Hogar", Icon: Users },
  { href: "/perfil", label: "Perfil", Icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 bg-surface-container-lowest border-t border-outline-variant"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5 h-[62px]">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-primary" : "text-on-surface-variant",
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span
                  className="text-[10.5px] font-semibold"
                  style={{ letterSpacing: 0.1 }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
