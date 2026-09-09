import LiveMap from "@/components/acheteur/live-map";
import TrackingView from "@/components/acheteur/tracking-view";

export default async function SuiviPage({
  params,
}: {
  params: Promise<{ commandeId: string }>;
}) {
  const { commandeId } = await params;
  const isDemo = commandeId === "demo";

  return (
    <div className="px-4 pb-6">
      <h1 className="mb-1 mt-2 text-xl font-extrabold text-black">Suivi de votre commande</h1>
      <p className="mb-4 text-sm text-neutral-400">Commande #{commandeId}</p>

      {isDemo ? (
        <LiveMap />
      ) : (
        <TrackingView commandeId={commandeId} />
      )}

      {isDemo ? (
        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-bold text-black">Marie, votre livreuse</p>
          <p className="mt-1 text-xs text-neutral-400">Scooter · ⭐ 4.9 · 213 courses</p>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-bold text-black">Votre livreur</p>
          <p className="mt-1 text-xs text-neutral-400">
            Le nom et la position du livreur apparaissent dès l&apos;acceptation de la course.
          </p>
        </div>
      )}
    </div>
  );
}
