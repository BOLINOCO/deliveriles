import SubscribeButton from "@/components/stripe/subscribe-button";

export default function PremiumBanner() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-black">Passer Premium</p>
          <p className="mt-1 text-sm text-neutral-500">
            10 €/mois pour être prioritaire sur les courses à fort volume et les zones à forte demande.
          </p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white">10 €/mois</span>
      </div>
      <SubscribeButton plan="livreur_premium" label="Activer Premium" />
    </div>
  );
}
