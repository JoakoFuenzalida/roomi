import { RoomiHeader } from "@/components/roomi-logo";

export default function TareasLoading() {
  return (
    <main className="max-w-md mx-auto px-5 pt-6 relative min-h-svh">
      <header className="flex items-center justify-between mb-6">
        <RoomiHeader />
        <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse" />
      </header>

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="h-8 w-24 bg-surface-container rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface-container rounded mt-2 animate-pulse" />
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse" />
      </div>

      <div className="space-y-3 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[14px] bg-surface-container-low border border-outline-variant p-4 flex gap-4 h-24 animate-pulse"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-5 w-3/4 bg-surface-container rounded" />
              <div className="h-4 w-1/2 bg-surface-container rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
