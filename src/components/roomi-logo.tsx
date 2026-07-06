import { cn } from "@/lib/utils";

export function RoomiSymbol({
  className,
  size = 30,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      width={size}
      height={size}
      className={cn("text-primary", className)}
      aria-hidden="true"
    >
      <path
        d="M8 40 8 24 24 9 40 24 40 40"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="15" r="4.6" fill="currentColor" />
      <circle cx="40" cy="15" r="4.6" fill="currentColor" />
      <circle cx="24" cy="22.5" r="5" fill="currentColor" />
      <path d="M15 40v-1a9 9 0 0 1 18 0v1z" fill="currentColor" />
    </svg>
  );
}

export function RoomiWordmark({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("font-display font-bold inline-flex items-baseline", className)}
      style={{ fontSize: size, letterSpacing: "-0.02em", lineHeight: 1 }}
    >
      room
      <span className="relative inline-block">
        i
        <span
          className="absolute rounded-full bg-primary"
          style={{
            left: "50%",
            top: "0.05em",
            transform: "translateX(-50%)",
            width: "0.24em",
            height: "0.24em",
          }}
        />
      </span>
    </span>
  );
}

export function RoomiHeader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <RoomiSymbol size={30} />
      <RoomiWordmark size={20} />
    </div>
  );
}
