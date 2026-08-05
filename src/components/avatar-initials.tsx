import { cn } from "@/lib/utils";

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function AvatarInitials({
  name,
  imageUrl,
  size = 40,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn("rounded-full object-cover shrink-0 shadow-sm transition-all hover:ring-2 hover:ring-primary/50 hover:opacity-90 active:scale-95 cursor-pointer", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold shrink-0 transition-all hover:ring-2 hover:ring-primary/50 hover:opacity-90 active:scale-95 cursor-pointer shadow-sm",
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
