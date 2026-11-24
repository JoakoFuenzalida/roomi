import { dueInfo, type DueTone } from "@/lib/dates";
import { cn } from "@/lib/utils";

const TONE: Record<DueTone, string> = {
  overdue: "bg-error-container text-on-error-container",
  today: "bg-warning-container text-on-warning-container",
  soon: "bg-secondary-container text-on-secondary-container",
  later: "bg-surface-container text-on-surface-variant",
};

export function DueChip({ due, today }: { due: Date; today?: Date }) {
  const { tone, label } = dueInfo(due, today);
  return (
    <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-pill whitespace-nowrap", TONE[tone])}>
      {label}
    </span>
  );
}
