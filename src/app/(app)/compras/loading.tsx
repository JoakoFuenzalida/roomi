import { RoomiHeader } from "@/components/roomi-logo";

export default function ComprasLoading() {
  return (
    <main className="max-w-md mx-auto w-full px-5 pt-6 relative min-h-svh flex flex-col flex-1">
      <header className="flex items-center justify-between mb-6">
        <RoomiHeader />
        <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse" />
      </header>

      <div className="mb-4">
        <div className="h-8 w-32 bg-surface-container rounded animate-pulse" />
        <div className="h-4 w-40 bg-surface-container rounded mt-2 animate-pulse" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-10 flex-1 bg-surface-container rounded-pill animate-pulse" />
        <div className="h-10 flex-1 bg-surface-container rounded-pill animate-pulse" />
      </div>

      <div className="space-y-3 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-[14px] border border-outline-variant bg-surface-container-low h-16 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-surface-container" />
              <div className="h-5 w-32 bg-surface-container rounded" />
            </div>
            <div className="h-8 w-16 bg-surface-container rounded-pill" />
          </div>
        ))}
      </div>
    </main>
  );
}
