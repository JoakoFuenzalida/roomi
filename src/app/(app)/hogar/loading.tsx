import { RoomiHeader } from "@/components/roomi-logo";

export default function HogarLoading() {
  return (
    <main className="max-w-md mx-auto w-full px-5 pt-6 relative min-h-svh flex flex-col flex-1">
      <header className="flex items-center justify-between mb-6">
        <RoomiHeader />
        <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse" />
      </header>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-40 bg-surface-container rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface-container rounded mt-2 animate-pulse" />
        </div>
        <div className="w-10 h-10 bg-surface-container rounded-full animate-pulse" />
      </div>

      {/* Members list skeleton */}
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-[14px] bg-surface-container-low border border-outline-variant animate-pulse h-20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container" />
              <div className="space-y-2">
                <div className="h-5 w-24 bg-surface-container rounded" />
                <div className="h-4 w-16 bg-surface-container rounded" />
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container" />
          </div>
        ))}
      </div>
    </main>
  );
}
