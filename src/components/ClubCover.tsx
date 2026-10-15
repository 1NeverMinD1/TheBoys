interface ClubCoverProps {
  name: string;
  photo: string | null;
  className?: string;
}

const gradients = [
  "from-violet-600 to-fuchsia-600",
  "from-sky-600 to-indigo-600",
  "from-emerald-600 to-teal-600",
  "from-rose-600 to-orange-500",
  "from-amber-500 to-red-600",
];

function pickGradient(name: string): string {
  const hash = Array.from(name).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  return gradients[hash % gradients.length];
}

export function ClubCover({ name, photo, className = "" }: ClubCoverProps) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${pickGradient(name)} ${className}`}
    >
      <span className="text-5xl font-black text-white/80">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
