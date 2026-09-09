export default function StatsBars({
  data,
  unit = "€",
}: {
  data: { label: string; value: number }[];
  unit?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-3 px-1 pb-1 pt-6">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-bold text-black">
            {d.value}
            {unit}
          </span>
          <div className="flex h-32 w-full items-end rounded-lg bg-neutral-100">
            <div
              className="w-full rounded-lg bg-brand-blue transition-all"
              style={{ height: `${Math.max(6, (d.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-[0.68rem] font-semibold text-neutral-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
