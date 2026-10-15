interface SeatsIndicatorProps {
  free: number;
  total: number;
}

export function SeatsIndicator({ free, total }: SeatsIndicatorProps) {
  const ratio = total > 0 ? free / total : 0;

  let dotClass = "bg-emerald-400";
  let textClass = "text-emerald-300";
  let label = `Свободно ${free} из ${total}`;

  if (free === 0) {
    dotClass = "bg-red-500";
    textClass = "text-red-400";
    label = "Мест нет";
  } else if (ratio < 0.25) {
    dotClass = "bg-amber-400";
    textClass = "text-amber-300";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${textClass}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
