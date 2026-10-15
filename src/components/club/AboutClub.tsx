import type { Club } from "@/types/club";

interface AboutClubProps {
  club: Club;
}

export function AboutClub({ club }: AboutClubProps) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
      <h2 className="mb-3 text-xl font-bold">О клубе</h2>
      <p className="mb-5 leading-relaxed text-neutral-300">
        {club.description}
      </p>
      {club.equipment.length > 0 && (
        <>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            В клубе есть
          </h3>
          <div className="flex flex-wrap gap-2">
            {club.equipment.map((item) => (
              <span
                key={item}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300"
              >
                {item}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
