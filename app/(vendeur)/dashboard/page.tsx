import Link from "next/link";
import { PRODUCTS, CURRENT_VENDOR_SHOP_ID, SHOPS } from "@/lib/mock-data";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";
import KpiCard from "@/components/vendeur/kpi-card";
import SubscribeButton from "@/components/stripe/subscribe-button";

export const dynamic = "force-dynamic";

const DEMO_RECENT_ORDERS = [
  { id: "CMD-1042", items: "2 croissants, 1 café allongé", total: "5,60 €", status: "En préparation" },
  { id: "CMD-1041", items: "1 baguette tradition", total: "1,20 €", status: "Livrée" },
  { id: "CMD-1040", items: "4 pains au chocolat", total: "6,00 €", status: "Livrée" },
];

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();

  // ---------- Fallback démo (Supabase non configuré / non connecté) ----------
  if (!configured) {
    const products = PRODUCTS.filter((p) => p.shopId === CURRENT_VENDOR_SHOP_ID);
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const shop = SHOPS.find((s) => s.id === CURRENT_VENDOR_SHOP_ID)!;

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-extrabold text-black">Bonjour, {shop.name}</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Mode démo — données simulées. Renseignez Supabase dans .env.local pour vos vraies données.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-brand-green-soft p-5">

          <div>
            <p className="text-sm font-extrabold text-black">Abonnement Vendeur actif</p>
            <p className="mt-0.5 text-xs text-neutral-500">25 €/mois — 0% de commission sur vos ventes</p>
          </div>
          <span className="rounded-full bg-brand-green px-3 py-1 text-xs font-bold text-white">Actif</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="CA ce mois-ci" value="842,30 €" hint="+12% vs mois dernier" />
          <KpiCard label="Commandes en cours" value="3" />
          <KpiCard label="Note moyenne" value={`${shop.rating} / 5`} />
          <KpiCard label="Produits en rupture" value={String(outOfStock)} hint={outOfStock > 0 ? "À réapprovisionner" : "Tout est en stock"} />
        </div>

        <div className="rounded-2xl border border-neutral-200">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <p className="text-sm font-extrabold text-black">Commandes récentes</p>
            <Link href="/stocks" className="text-xs font-bold text-brand-blue hover:underline">
              Gérer mes stocks
            </Link>
          </div>
          <ul className="divide-y divide-neutral-100">
            {DEMO_RECENT_ORDERS.map((order) => (
              <li key={order.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-bold text-black">{order.id}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{order.items}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-black">{order.total}</p>
                  <p className={`mt-0.5 text-xs font-semibold ${order.status === "Livrée" ? "text-brand-green" : "text-neutral-400"}`}>
                    {order.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ---------- Version connectée ----------
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-lg font-extrabold text-black">Connectez-vous</h1>          <Link href="/connexion" className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white">
          Se connecter
        </Link>
      </div>
    );
  }

  const { data: shop } = await supabase!
    .from("shops")
    .select("id, name, rating, products ( stock )")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: subscription } = await supabase!
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("profile_id", user.id)
    .eq("type", "vendeur")
    .maybeSingle();

  const subscriptionActive = subscription?.status === "active";

  const { data: recentOrders } = await supabase!
    .from("orders")
    .select("id, status, total, created_at, order_items ( quantity, product_name )")
    .eq("shop_id", shop?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(5);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: monthOrders } = await supabase!
    .from("orders")
    .select("subtotal")
    .eq("shop_id", shop?.id ?? "")
    .gte("created_at", monthStart.toISOString())
    .neq("status", "cancelled");

  const monthRevenue = (monthOrders ?? []).reduce((sum, o) => sum + Number(o.subtotal), 0);
  const outOfStock = (shop?.products ?? []).filter((p) => Number(p.stock) === 0).length;
  const inProgress = (recentOrders ?? []).filter(
    (o) => o.status === "pending" || o.status === "preparing" || o.status === "ready"
  ).length;

  const statusLabel: Record<string, string> = {
    pending: "En attente",
    preparing: "En préparation",
    ready: "Prête",
    delivering: "En livraison",
    delivered: "Livrée",
    cancelled: "Annulée",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-black">Bonjour, {shop?.name ?? "vendeur"}</h1>
        <p className="mt-1 text-sm text-neutral-400">Voici comment se porte votre boutique aujourd&apos;hui.</p>
      </div>

      <div
        className={`flex items-center justify-between rounded-2xl border border-neutral-200 p-5 ${
          subscriptionActive ? "bg-brand-green-soft" : "bg-neutral-50"
        }`}
      >
        <div>
          <p className="text-sm font-extrabold text-black">
            {subscriptionActive ? "Abonnement Vendeur actif" : "Aucun abonnement actif"}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {subscriptionActive
              ? "25 €/mois — 0% de commission sur vos ventes"
              : "Activez l'abonnement Vendeur (25 €/mois) pour ouvrir votre boutique."}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
            subscriptionActive ? "bg-brand-green" : "bg-neutral-400"
          }`}
        >
          {subscriptionActive ? "Actif" : "Inactif"}
        </span>
      </div>

      {!subscriptionActive && (
        <SubscribeButton plan="vendeur" label="Activer l'abonnement Vendeur (25 €/mois)" />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="CA ce mois-ci"
          value={`${monthRevenue.toFixed(2).replace(".", ",")} €`}
          hint={`${monthOrders?.length ?? 0} commandes`}
        />
        <KpiCard label="Commandes en cours" value={String(inProgress)} />
        <KpiCard label="Note moyenne" value={`${shop ? Number(shop.rating).toFixed(1) : "—"} / 5`} />
        <KpiCard
          label="Produits en rupture"
          value={String(outOfStock)}
          hint={outOfStock > 0 ? "À réapprovisionner" : "Tout est en stock"}
        />
      </div>

      <div className="rounded-2xl border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <p className="text-sm font-extrabold text-black">Commandes récentes</p>
          <Link href="/stocks" className="text-xs font-bold text-brand-blue hover:underline">
            Gérer mes stocks
          </Link>
        </div>
        <ul className="divide-y divide-neutral-100">
          {(recentOrders ?? []).length === 0 ? (
            <li className="px-5 py-6 text-center text-sm text-neutral-400">
              Aucune commande pour le moment.
            </li>
          ) : (
            (recentOrders ?? []).map((order) => (
              <li key={order.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-black">#{order.id.slice(0, 8)}</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">
                    {order.order_items?.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-black">{Number(order.total).toFixed(2)} €</p>
                  <p
                    className={`mt-0.5 text-xs font-semibold ${
                      order.status === "delivered" ? "text-brand-green" : "text-neutral-400"
                    }`}
                  >
                    {statusLabel[order.status] ?? order.status}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
