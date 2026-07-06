import { cn } from "@/lib/utils";

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function AvatarInitials({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold shrink-0",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.36)),
      }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  );
}
