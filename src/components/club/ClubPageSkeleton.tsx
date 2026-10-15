export function ClubPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-24 rounded bg-neutral-800" />
      <div className="h-60 rounded-3xl bg-neutral-900 sm:h-80" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="h-96 rounded-2xl bg-neutral-900" />
          <div className="h-40 rounded-2xl bg-neutral-900" />
        </div>
        <div className="h-72 rounded-2xl bg-neutral-900" />
      </div>
    </div>
  );
}
