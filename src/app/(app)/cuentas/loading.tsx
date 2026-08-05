import { RoomiHeader } from "@/components/roomi-logo";

export default function CuentasLoading() {
  return (
    <main className="max-w-md mx-auto px-5 pt-6 relative min-h-svh">
      <header className="flex items-center justify-between mb-6">
        <RoomiHeader />
        <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse" />
      </header>

      <div className="mb-4">
        <div className="h-8 w-32 bg-surface-container rounded animate-pulse" />
        <div className="h-4 w-48 bg-surface-container rounded mt-2 animate-pulse" />
      </div>

      <div className="space-y-4 mt-6">
        {/* Banner skeleton */}
        <div className="rounded-[14px] bg-surface-container-low border border-outline-variant p-5 h-28 animate-pulse" />
        
        {/* Items skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[14px] border border-outline-variant bg-surface-container-low p-4 flex justify-between items-center h-20 animate-pulse"
            >
              <div className="space-y-2 w-1/2">
                <div className="h-5 w-full bg-surface-container rounded" />
                <div className="h-4 w-2/3 bg-surface-container rounded" />
              </div>
              <div className="h-6 w-20 bg-surface-container rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
