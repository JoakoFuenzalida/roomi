import { RoomiHeader } from "@/components/roomi-logo";

export default function MuroLoading() {
  return (
    <main className="max-w-md mx-auto px-5 pt-6 relative min-h-svh">
      <header className="flex items-center justify-between mb-6">
        <RoomiHeader />
        <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse" />
      </header>

      <div className="mb-4">
        <div className="h-8 w-24 bg-surface-container rounded animate-pulse" />
        <div className="h-4 w-32 bg-surface-container rounded mt-2 animate-pulse" />
      </div>

      <div className="space-y-3 mt-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[14px] bg-surface-container-low border border-outline-variant p-4 h-32 animate-pulse"
          />
        ))}
      </div>
    </main>
  );
}
