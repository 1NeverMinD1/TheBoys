import { Link } from "react-router";
import { useClubs } from "@/hooks/useClubs";
import { formatPrice } from "@/lib/club";
import { ClubCard } from "@/components/ClubCard";
import { ClubCardSkeleton } from "@/components/ClubCardSkeleton";

const steps = [
  {
    title: "Найди клуб",
    text: "Смотри все клубы города списком или на карте и выбирай ближайший.",
  },
  {
    title: "Сравни",
    text: "Тарифы, зоны, видеокарты, мониторы и периферия в одном месте.",
  },
  {
    title: "Забронируй",
    text: "Выбери место на схеме зала и оплати онлайн без звонков.",
  },
];

export function HomePage() {
  const { data: clubs, isLoading } = useClubs();

  const topClubs = clubs
    ? [...clubs].sort((a, b) => b.rating - a.rating).slice(0, 3)
    : [];
  const freeSeats = clubs?.reduce((sum, club) => sum + club.seatsFree, 0);
  const minPrice =
    clubs && clubs.length > 0
      ? Math.min(...clubs.map((club) => club.minPricePerHour))
      : null;

  const stats = [
    { label: "клубов в каталоге", value: clubs ? String(clubs.length) : "—" },
    {
      label: "свободных мест сейчас",
      value: freeSeats !== undefined ? String(freeSeats) : "—",
    },
    {
      label: "минимальная цена за час",
      value: minPrice !== null ? formatPrice(minPrice) : "—",
    },
  ];

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-violet-950 via-neutral-900 to-neutral-950 px-6 py-14 sm:px-12 sm:py-20">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="relative max-w-2xl">
          <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl">
            Все компьютерные клубы города в одном месте
          </h1>
          <p className="mb-8 text-lg text-neutral-300">
            Сравнивай цены, железо и свободные места, а потом бронируй ПК онлайн
            за пару кликов.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/clubs"
              className="rounded-xl bg-violet-600 px-6 py-3 font-semibold transition hover:bg-violet-500"
            >
              Смотреть клубы
            </Link>
            <Link
              to="/map"
              className="rounded-xl border border-neutral-700 px-6 py-3 font-semibold transition hover:border-violet-500 hover:text-violet-300"
            >
              Открыть карту
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
          >
            <p
              className={`text-3xl font-bold ${isLoading ? "animate-pulse text-neutral-600" : ""}`}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-neutral-400">{stat.label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold">Как это работает</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
            >
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/20 font-bold text-violet-300">
                {index + 1}
              </span>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-neutral-400">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">Популярные клубы</h2>
          <Link
            to="/clubs"
            className="text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Все клубы →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 3 }, (_, index) => (
              <ClubCardSkeleton key={index} />
            ))}
          {topClubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      </section>
    </div>
  );
}
