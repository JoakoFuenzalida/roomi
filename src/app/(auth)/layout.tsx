export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
