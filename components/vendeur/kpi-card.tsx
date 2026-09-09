export default function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-black">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
