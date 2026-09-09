import StatsBars from "@/components/vendeur/stats-bars";

const REVENUE_BY_DAY = [
  { label: "Lun", value: 98 },
  { label: "Mar", value: 112 },
  { label: "Mer", value: 87 },
  { label: "Jeu", value: 134 },
  { label: "Ven", value: 156 },
  { label: "Sam", value: 189 },
  { label: "Dim", value: 66 },
];

const TOP_PRODUCTS = [
  { name: "Croissant", sales: 214 },
  { name: "Baguette tradition", sales: 189 },
  { name: "Pain au chocolat", sales: 172 },
  { name: "Café allongé", sales: 98 },
];

export default function StatistiquesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-black">Statistiques</h1>
        <p className="mt-1 text-sm text-neutral-400">7 derniers jours.</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 p-5">
        <p className="text-sm font-extrabold text-black">Chiffre d&apos;affaires par jour</p>
        <StatsBars data={REVENUE_BY_DAY} />
      </div>

      <div className="rounded-2xl border border-neutral-200 p-5">
        <p className="mb-3 text-sm font-extrabold text-black">Produits les plus vendus</p>
        <ul className="flex flex-col gap-2.5">
          {TOP_PRODUCTS.map((p, i) => (
            <li key={p.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2.5 text-black">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-[0.68rem] font-bold text-neutral-500">
                  {i + 1}
                </span>
                {p.name}
              </span>
              <span className="font-bold text-black">{p.sales} ventes</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
