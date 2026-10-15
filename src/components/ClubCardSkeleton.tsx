export function ClubCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="aspect-video bg-neutral-800" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-5 w-2/3 rounded bg-neutral-800" />
        <div className="h-4 w-1/2 rounded bg-neutral-800" />
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded bg-neutral-800" />
          <div className="h-5 w-12 rounded bg-neutral-800" />
        </div>
        <div className="mt-2 flex justify-between border-t border-neutral-800 pt-3">
          <div className="h-5 w-28 rounded bg-neutral-800" />
          <div className="h-6 w-24 rounded bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}
